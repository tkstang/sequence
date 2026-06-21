import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { user } from '../../db/schema/auth.ts';
import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import type { RateLimiter } from '../../shared/rate-limit-middleware.ts';
import { publicProcedure } from '../../trpc.ts';

/** Public join-page preview: roster + settings + status. Never any hands. */
export interface GamePreview {
  gameId: string;
  inviteCode: string;
  status: string;
  playerCount: number;
  mode: string;
  timerSeconds: number | null;
  local: boolean;
  players: {
    seat: number;
    team: number;
    name: string;
    isCreator: boolean;
    isGuest: boolean;
  }[];
}

/**
 * `game.preview(inviteCode)` — PUBLIC, rate-limited.
 *
 * Returns enough to render the invite landing (players, settings, status) and
 * nothing private: no hands, no deck, no tokens. NOT_FOUND when the code is
 * unknown. Rate limiting (the p03-t09 limiter) throttles invite-code
 * enumeration on this public endpoint.
 */
export function buildPreviewRoute(limiter: RateLimiter) {
  return publicProcedure
    .use(limiter.middleware)
    .input(z.object({ inviteCode: z.string().min(1) }))
    .query(async ({ ctx, input }): Promise<GamePreview> => {
      const [game] = await ctx.db
        .select()
        .from(games)
        .where(eq(games.inviteCode, input.inviteCode))
        .limit(1);

      if (!game) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Left-join the user table for registered players' display names; guests
      // carry their own name. No emails — names only.
      const players = await ctx.db
        .select({
          seat: gamePlayers.seat,
          team: gamePlayers.team,
          userId: gamePlayers.userId,
          guestName: gamePlayers.guestName,
          isCreator: gamePlayers.isCreator,
          userName: user.name,
        })
        .from(gamePlayers)
        .leftJoin(user, eq(gamePlayers.userId, user.id))
        .where(eq(gamePlayers.gameId, game.id))
        .orderBy(gamePlayers.seat);

      return {
        gameId: game.id,
        inviteCode: game.inviteCode,
        status: game.status,
        playerCount: game.playerCount,
        mode: game.mode,
        timerSeconds: game.timerSeconds,
        local: game.local,
        players: players.map((p) => ({
          seat: p.seat,
          team: p.team,
          name: p.guestName ?? p.userName ?? 'Player',
          isCreator: p.isCreator,
          isGuest: p.userId === null,
        })),
      };
    });
}
