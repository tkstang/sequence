import { canTransition } from '@sequence/game-logic';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { rooms } from '../../shared/realtime/rooms.ts';
import { gamePlayerProcedure } from '../../trpc.ts';
import { publishAppendedEvents } from '../publish-events.ts';
import {
  appendEvents,
  type AppendedEvent,
  persistLifecycleTransition,
  VersionConflictError,
} from '../state-mapping.ts';

/**
 * `game.concede(gameId)` — any participant may concede (FR11).
 *
 * The conceding player's team takes the recorded loss and the game ends
 * immediately: status → `finished`, `end_reason = 'concede'`. In a 2-team game
 * the winner is the other team; in a 3-team FFA there is no single winner
 * (`winner_team` stays null — the conceding team simply loses). Broadcasts.
 */
export const concedeRoute = gamePlayerProcedure
  .input(
    z.object({
      gameId: z.string().uuid(),
      version: z.number().int().nonnegative(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const concedingTeam = ctx.seat.team;

    let committed: { version: number; appended: AppendedEvent[] };
    try {
      committed = await ctx.db.transaction(async (tx) => {
        const [game] = await tx
          .select()
          .from(games)
          .where(eq(games.id, input.gameId))
          .limit(1);
        if (!game) throw new TRPCError({ code: 'NOT_FOUND' });
        if (!canTransition(game.status, 'finished')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `cannot concede from ${game.status}`,
          });
        }

        // The distinct teams in the game; a single other team wins (2-team only).
        const teamRows = await tx
          .select({ team: gamePlayers.team })
          .from(gamePlayers)
          .where(eq(gamePlayers.gameId, input.gameId));
        const teams = [...new Set(teamRows.map((r) => r.team))];
        const others = teams.filter((t) => t !== concedingTeam);
        const winnerTeam = others.length === 1 ? others[0]! : null;

        // Version-guarded: a concurrently-committed move bumped the version and
        // makes this transition lose cleanly as CONFLICT (and vice-versa), so a
        // concede can never be silently reverted by a racing move.
        const version = await persistLifecycleTransition(
          tx,
          input.gameId,
          input.version,
          {
            status: 'finished',
            endReason: 'concede',
            winnerTeam,
            finishedAt: new Date(),
          },
        );

        const events: { type: string; team?: number }[] = [
          { type: 'GameConceded', team: concedingTeam },
        ];
        if (winnerTeam) events.push({ type: 'GameWon', team: winnerTeam });
        const appended = await appendEvents(tx, input.gameId, events);
        return { version, appended };
      });
    } catch (err) {
      if (err instanceof VersionConflictError) {
        throw new TRPCError({ code: 'CONFLICT', message: 'stale version' });
      }
      throw err;
    }

    publishAppendedEvents(
      rooms,
      input.gameId,
      committed.appended,
      committed.version,
    );

    return { status: 'finished' as const, concedingTeam };
  });
