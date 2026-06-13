import type { Team } from '@sequence/game-logic';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { rooms } from '../../shared/realtime/rooms.ts';
import { gamePlayerProcedure } from '../../trpc.ts';
import { publishAppendedEvents } from '../publish-events.ts';
import { createServerRng } from '../server-rng.ts';
import { appendEvents } from '../state-mapping.ts';
import { callerIsCreator } from './set-team.ts';

/**
 * Legal distinct-team counts per player count (mirrors game-logic create-game).
 * 6p may be 3v3 (2 teams) or 2x3 (3 teams) — randomize defaults to the lower
 * team count (3v3) for 6p; the creator can still hand-sort to 2x3 via setTeam.
 */
const TEAM_COUNT: Readonly<Record<number, number>> = {
  2: 2,
  3: 3,
  4: 2,
  6: 2,
};

/**
 * `game.randomizeTeams(gameId)` — creator-only lobby tiebreaker.
 *
 * Shuffles seated players into balanced teams and assigns seats in alternating
 * team order (so turn order alternates teams, as `createGame` requires). Only
 * effective once the lobby is full; emits a `TeamChanged` per seat.
 */
export const randomizeTeamsRoute = gamePlayerProcedure
  .input(z.object({ gameId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    const result = await ctx.db.transaction(async (tx) => {
      const [game] = await tx
        .select()
        .from(games)
        .where(eq(games.id, input.gameId))
        .limit(1);
      if (!game) throw new TRPCError({ code: 'NOT_FOUND' });
      if (game.status !== 'lobby') {
        throw new TRPCError({ code: 'CONFLICT', message: 'already started' });
      }
      if (!(await callerIsCreator(tx, input.gameId, ctx.seat.seat))) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const players = await tx
        .select()
        .from(gamePlayers)
        .where(eq(gamePlayers.gameId, input.gameId))
        .orderBy(gamePlayers.seat);

      const teamCount = TEAM_COUNT[game.playerCount] ?? 2;
      const rng = createServerRng();

      // Teams must alternate by seat (no two consecutive seats share a team) so
      // turn order alternates teams, which `createGame` (start-game, t05)
      // validates. Assign `team = (seat % teamCount) + 1` to guarantee that
      // even/alternating layout, then randomly rotate the team labels — the
      // tiebreaker element — keeping the layout legal. Players keep their seats
      // (guest tokens are seat-bound), so randomize only re-colors teams.
      const rotation = Math.floor(rng.next() * teamCount);

      const events = [];
      for (const player of players) {
        const team = (((player.seat + rotation) % teamCount) + 1) as Team;
        await tx
          .update(gamePlayers)
          .set({ team })
          .where(eq(gamePlayers.id, player.id));
        events.push({
          type: 'TeamChanged' as const,
          seat: player.seat,
          team,
        });
      }

      const appended = await appendEvents(tx, input.gameId, events);
      return { ok: true as const, appended };
    });
    publishAppendedEvents(rooms, input.gameId, result.appended);
    return { ok: result.ok };
  });
