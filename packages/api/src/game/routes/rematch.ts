import { createGame } from '@sequence/game-logic';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { gamePlayerProcedure } from '../../trpc.ts';
import { generateInviteCode } from '../invite-codes.ts';
import { createServerRng } from '../server-rng.ts';
import { persistGameState } from '../state-mapping.ts';

/**
 * `game.rematch(gameId)` — one-tap rematch from a finished game (FR12).
 *
 * Creates a NEW game with the same roster + settings, linked via `rematch_of`,
 * with the **first player rotated** (seats shift by one so a different team/seat
 * leads). The new game starts in `lobby` with the prior roster pre-seated so
 * present players need no new invite; the creator starts it when ready.
 */
export const rematchRoute = gamePlayerProcedure
  .input(z.object({ gameId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    return ctx.db.transaction(async (tx) => {
      const [prev] = await tx
        .select()
        .from(games)
        .where(eq(games.id, input.gameId))
        .limit(1);
      if (!prev) throw new TRPCError({ code: 'NOT_FOUND' });
      if (prev.status !== 'finished') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'can only rematch a finished game',
        });
      }

      const prevPlayers = await tx
        .select()
        .from(gamePlayers)
        .where(eq(gamePlayers.gameId, input.gameId))
        .orderBy(gamePlayers.seat);

      const inviteCode = generateInviteCode(createServerRng());
      const [created] = await tx
        .insert(games)
        .values({
          inviteCode,
          createdBy: prev.createdBy,
          rematchOf: prev.id,
          local: prev.local,
          playerCount: prev.playerCount,
          mode: prev.mode,
          timerSeconds: prev.timerSeconds,
          status: prev.local ? 'active' : 'lobby',
        })
        .returning({ id: games.id });
      const newId = created!.id;

      // Rotate the first player: seat i in the new game is occupied by the
      // player who held seat (i+1) mod N in the previous game. This keeps teams
      // intact (alternation preserved) while a different player leads.
      const n = prevPlayers.length;
      const rotated = prevPlayers.map((_, newSeat) => {
        const source = prevPlayers[(newSeat + 1) % n]!;
        return {
          gameId: newId,
          seat: newSeat,
          team: ((newSeat % 2) + 1) as 1 | 2,
          userId: source.userId,
          guestName: source.guestName,
          // Guest tokens are seat-bound to the OLD game; a guest re-joins the new
          // game fresh (a new token issued on join). Drop the stale hash.
          guestTokenHash: null,
          isCreator: source.userId === prev.createdBy,
        };
      });
      await tx.insert(gamePlayers).values(rotated);

      // Local rematch (FR16) skips the lobby: deal + go active immediately, just
      // like create-game's local path.
      if (prev.local) {
        const state = createGame(
          {
            playerCount: 2,
            mode: prev.mode,
            timerSeconds: prev.timerSeconds,
            local: true,
          },
          rotated.map((r) => ({ seat: r.seat, team: r.team })),
          createServerRng(),
        );
        await persistGameState(tx, newId, state, 0);
      }

      return {
        gameId: newId,
        inviteCode,
        rematchOf: prev.id,
        status: prev.local ? ('active' as const) : ('lobby' as const),
      };
    });
  });
