import { createGame } from '@sequence/game-logic';
import type { PlayerCount, PlayerSeed, Team } from '@sequence/game-logic';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { gamePlayerProcedure } from '../../trpc.ts';
import { notifyTurnStart } from '../move-engine.ts';
import { createServerRng } from '../server-rng.ts';
import { appendEvents, persistGameState } from '../state-mapping.ts';
import { callerIsCreator } from './set-team.ts';

/**
 * `game.start(gameId)` — creator-only.
 *
 * Requires a full lobby with valid teams (4p: 2v2; 6p: 3v3 or 2x3 per the
 * seeds; 3p: FFA), delegates dealing + alternating turn order to game-logic's
 * `createGame` with a server RNG, flips status to `active`, and emits
 * `GameStarted`. Settings are immutable after this point (the lobby routes all
 * reject a non-`lobby` status). Invalid team layouts surface as BAD_REQUEST
 * (game-logic throws — the rules engine is the single source of truth on team
 * legality, so we don't duplicate the rules here).
 */
export const startGameRoute = gamePlayerProcedure
  .input(z.object({ gameId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.transaction(async (tx) => {
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

      if (players.length !== game.playerCount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `lobby not full: ${players.length}/${game.playerCount}`,
        });
      }

      const seeds: PlayerSeed[] = players.map((p) => ({
        seat: p.seat,
        team: p.team as Team,
      }));

      let state;
      try {
        state = createGame(
          {
            playerCount: game.playerCount as PlayerCount,
            mode: game.mode,
            timerSeconds: game.timerSeconds,
            local: game.local,
          },
          seeds,
          createServerRng(),
        );
      } catch (err) {
        // game-logic throws on illegal/uneven/non-alternating teams.
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: err instanceof Error ? err.message : 'invalid team setup',
        });
      }

      const newVersion = await persistGameState(
        tx,
        input.gameId,
        state,
        game.version,
      );

      await appendEvents(tx, input.gameId, [
        { type: 'GameStarted', currentSeat: state.currentSeat },
      ]);

      // Arm the first turn's timer (no-op for untimed games / in tests with no
      // timer hook wired). The hook is module-level on the move engine.
      notifyTurnStart({
        gameId: input.gameId,
        timerSeconds: game.timerSeconds,
        version: newVersion,
      });

      return { status: 'active' as const, currentSeat: state.currentSeat };
    });
  });
