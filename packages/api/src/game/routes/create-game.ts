import { createGame } from '@sequence/game-logic';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { authedProcedure } from '../../trpc.ts';
import { generateInviteCode } from '../invite-codes.ts';
import { createServerRng } from '../server-rng.ts';
import { persistGameState } from '../state-mapping.ts';

/**
 * Validate the per-turn timer (FR2): off (`null`) OR a positive step —
 * 30-second increments up to 3 minutes (30..180), then 1-minute increments
 * beyond (240, 300, ...). Anything else is rejected at the zod boundary.
 */
function isValidTimer(seconds: number | null): boolean {
  if (seconds === null) return true;
  if (!Number.isInteger(seconds) || seconds <= 0) return false;
  if (seconds <= 180) return seconds % 30 === 0;
  return seconds % 60 === 0;
}

const settingsSchema = z
  .object({
    playerCount: z.union([
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(6),
    ]),
    mode: z.enum(['tap', 'drag']),
    timerSeconds: z.number().nullable().default(null).refine(isValidTimer, {
      message: 'timer must be off, a 30s step up to 180, or a 60s step beyond',
    }),
    /** FR16: local pass-and-play. Requires playerCount 2 + opponentName. */
    local: z.boolean().default(false),
    opponentName: z.string().min(1).max(40).optional(),
  })
  .refine((s) => !s.local || s.playerCount === 2, {
    message: 'local games must have playerCount 2',
    path: ['playerCount'],
  })
  .refine((s) => !s.local || Boolean(s.opponentName), {
    message: 'local games require opponentName',
    path: ['opponentName'],
  });

export type CreateGameInput = z.infer<typeof settingsSchema>;

/**
 * `game.create` — a logged-in user creates a game.
 *
 *  - Normal game: status `lobby`, creator seated at seat 0, awaiting joins.
 *  - Local game (FR16): skips the lobby — both seats are created, hands are
 *    dealt via `createGame`, and the game goes straight to `active`. Seat 1 is a
 *    named guest with no user/token (the creator's session covers it).
 *
 * Returns the new game id + invite code.
 */
export const createGameRoute = authedProcedure
  .input(settingsSchema)
  .mutation(async ({ ctx, input }) => {
    const rng = createServerRng();
    const inviteCode = generateInviteCode(rng);

    const result = await ctx.db.transaction(async (tx) => {
      const [game] = await tx
        .insert(games)
        .values({
          inviteCode,
          createdBy: ctx.user.id,
          local: input.local,
          playerCount: input.playerCount,
          mode: input.mode,
          timerSeconds: input.timerSeconds,
          status: input.local ? 'active' : 'lobby',
        })
        .returning({ id: games.id });

      const gameId = game!.id;

      if (input.local) {
        // Local: both seats up front (creator + named opponent), dealt + active.
        await tx.insert(gamePlayers).values([
          {
            gameId,
            seat: 0,
            team: 1,
            userId: ctx.user.id,
            isCreator: true,
            connected: true,
          },
          {
            gameId,
            seat: 1,
            team: 2,
            guestName: input.opponentName!,
          },
        ]);

        const state = createGame(
          {
            playerCount: 2,
            mode: input.mode,
            timerSeconds: input.timerSeconds,
            local: true,
          },
          [
            { seat: 0, team: 1 },
            { seat: 1, team: 2 },
          ],
          rng,
        );
        await persistGameState(tx, gameId, state, 0);
      } else {
        // Normal: only the creator is seated; teams/joins happen in the lobby.
        await tx.insert(gamePlayers).values({
          gameId,
          seat: 0,
          team: 1,
          userId: ctx.user.id,
          isCreator: true,
          connected: true,
        });
      }

      return { gameId };
    });

    // Re-read the canonical row for status (post-persist for local games).
    const [row] = await ctx.db
      .select({ status: games.status, inviteCode: games.inviteCode })
      .from(games)
      .where(eq(games.id, result.gameId));

    if (!row) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }

    return {
      gameId: result.gameId,
      inviteCode: row.inviteCode,
      status: row.status,
      local: input.local,
    };
  });
