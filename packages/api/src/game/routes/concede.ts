import { canTransition } from '@sequence/game-logic';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { rooms } from '../../shared/realtime/rooms.ts';
import { gamePlayerProcedure } from '../../trpc.ts';
import { appendEvents } from '../state-mapping.ts';

/**
 * `game.concede(gameId)` — any participant may concede (FR11).
 *
 * The conceding player's team takes the recorded loss and the game ends
 * immediately: status → `finished`, `end_reason = 'concede'`. In a 2-team game
 * the winner is the other team; in a 3-team FFA there is no single winner
 * (`winner_team` stays null — the conceding team simply loses). Broadcasts.
 */
export const concedeRoute = gamePlayerProcedure
  .input(z.object({ gameId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    const concedingTeam = ctx.seat.team;

    const appended = await ctx.db.transaction(async (tx) => {
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

      await tx
        .update(games)
        .set({
          status: 'finished',
          endReason: 'concede',
          winnerTeam,
          finishedAt: new Date(),
        })
        .where(eq(games.id, input.gameId));

      const events: { type: string; team?: number }[] = [
        { type: 'GameConceded', team: concedingTeam },
      ];
      if (winnerTeam) events.push({ type: 'GameWon', team: winnerTeam });
      return appendEvents(tx, input.gameId, events);
    });

    for (const ev of appended) {
      rooms.publish(input.gameId, {
        seq: ev.seq,
        type: ev.type,
        payload: ev.payload as unknown as Record<string, unknown>,
      });
    }

    return { status: 'finished' as const, concedingTeam };
  });
