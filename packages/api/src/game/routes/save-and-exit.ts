import { canTransition } from '@sequence/game-logic';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { gamePlayerProcedure } from '../../trpc.ts';
import {
  appendEvents,
  persistLifecycleTransition,
  VersionConflictError,
} from '../state-mapping.ts';

const SAVED_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

/**
 * `game.saveAndExit(gameId)` — suspend an active game for later resume (FR10).
 *
 * Status → `saved`, `expires_at = +1 week`. Non-local games with any guest seat
 * are rejected: resuming requires a login-only roster (guests are ephemeral per
 * FR10). LOCAL games CAN save — the creator's account owns persistence (FR16).
 */
export const saveAndExitRoute = gamePlayerProcedure
  .input(z.object({ gameId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    try {
      return await ctx.db.transaction(async (tx) => {
        const [game] = await tx
          .select()
          .from(games)
          .where(eq(games.id, input.gameId))
          .limit(1);
        if (!game) throw new TRPCError({ code: 'NOT_FOUND' });
        if (!canTransition(game.status, 'saved')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `cannot save from ${game.status}`,
          });
        }

        // Login-only roster check (skipped for local games, FR16).
        if (!game.local) {
          const roster = await tx
            .select({ guestTokenHash: gamePlayers.guestTokenHash })
            .from(gamePlayers)
            .where(eq(gamePlayers.gameId, input.gameId));
          if (roster.some((r) => r.guestTokenHash !== null)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'cannot save a game with guest players (login required)',
            });
          }
        }

        // Version-guarded so a concurrent move can't revert the save (and the
        // save can't clobber a move) — same optimistic-concurrency protocol.
        await persistLifecycleTransition(tx, input.gameId, game.version, {
          status: 'saved',
          expiresAt: new Date(Date.now() + SAVED_EXPIRY_MS),
        });

        await appendEvents(tx, input.gameId, [{ type: 'GameSaved' }]);

        return { status: 'saved' as const };
      });
    } catch (err) {
      if (err instanceof VersionConflictError) {
        throw new TRPCError({ code: 'CONFLICT', message: 'stale version' });
      }
      throw err;
    }
  });
