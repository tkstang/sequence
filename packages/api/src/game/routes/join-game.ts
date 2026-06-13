import type { Team } from '@sequence/game-logic';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import type { RateLimiter } from '../../shared/rate-limit-middleware.ts';
import { rooms } from '../../shared/realtime/rooms.ts';
import { GUEST_COOKIE_NAME, publicProcedure } from '../../trpc.ts';
import { hashToken, issueGuestToken } from '../../user/guest-tokens.ts';
import { publishAppendedEvents } from '../publish-events.ts';
import { appendEvents } from '../state-mapping.ts';

/** Result of a join: the seat the caller now occupies + whether they're a guest. */
export interface JoinResult {
  gameId: string;
  seat: number;
  team: number;
  isGuest: boolean;
}

/**
 * `game.join(inviteCode, guestName?)` — PUBLIC, rate-limited.
 *
 *  - Authed user → occupies the next open seat (idempotent: re-joining returns
 *    the existing seat).
 *  - Anonymous + `guestName` → issues a signed, game-scoped token, stores its
 *    hash on the seat, and sets the httpOnly guest cookie.
 *
 * Rejected with CONFLICT when the game is full or already started (status is not
 * `lobby`). Anonymous callers without a `guestName` get BAD_REQUEST. Local games
 * cannot be joined (FR10 / FR16) — they are created complete.
 */
export function buildJoinRoute(limiter: RateLimiter) {
  return publicProcedure
    .use(limiter.middleware)
    .input(
      z.object({
        inviteCode: z.string().min(1),
        guestName: z.string().min(1).max(40).optional(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<JoinResult> => {
      const result = await ctx.db.transaction(async (tx) => {
        const [game] = await tx
          .select()
          .from(games)
          .where(eq(games.inviteCode, input.inviteCode))
          .limit(1);

        if (!game) throw new TRPCError({ code: 'NOT_FOUND' });
        if (game.local) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'local games cannot be joined',
          });
        }
        if (game.status !== 'lobby') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'game already started',
          });
        }

        const seated = await tx
          .select()
          .from(gamePlayers)
          .where(eq(gamePlayers.gameId, game.id))
          .orderBy(gamePlayers.seat);

        // Idempotent re-join for a registered user already in the game.
        if (ctx.user) {
          const existing = seated.find((p) => p.userId === ctx.user!.id);
          if (existing) {
            return {
              gameId: game.id,
              seat: existing.seat,
              team: existing.team,
              isGuest: false,
              appended: [],
            };
          }
        }

        if (seated.length >= game.playerCount) {
          throw new TRPCError({ code: 'CONFLICT', message: 'game is full' });
        }

        // Next open seat = lowest index not yet taken.
        const taken = new Set(seated.map((p) => p.seat));
        let seat = 0;
        while (taken.has(seat)) seat += 1;
        // Default team assignment alternates; the lobby (t04) lets players
        // self-sort afterwards. Team is 1-based and alternates by seat parity.
        const team = (seat % 2) + 1;

        if (ctx.user) {
          await tx.insert(gamePlayers).values({
            gameId: game.id,
            seat,
            team,
            userId: ctx.user.id,
          });
          const appended = await appendEvents(tx, game.id, [
            {
              type: 'PlayerJoined',
              seat,
              team: team as Team,
              name: ctx.user.name,
              isGuest: false,
            },
          ]);
          return { gameId: game.id, seat, team, isGuest: false, appended };
        }

        // Anonymous → guest path requires a name.
        if (!input.guestName) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'guestName is required to join as a guest',
          });
        }

        const token = issueGuestToken(game.id, seat, ctx.guestSecret);
        await tx.insert(gamePlayers).values({
          gameId: game.id,
          seat,
          team,
          guestName: input.guestName,
          guestTokenHash: hashToken(token),
        });
        const appended = await appendEvents(tx, game.id, [
          {
            type: 'PlayerJoined',
            seat,
            team: team as Team,
            name: input.guestName,
            isGuest: true,
          },
        ]);

        return { gameId: game.id, seat, team, isGuest: true, appended, token };
      });

      const guestToken = 'token' in result ? result.token : undefined;
      if (typeof guestToken === 'string') {
        // httpOnly, game-scoped cookie. Same attributes as Better Auth session
        // cookies so guest WS upgrades work in cross-site production deploys.
        ctx.setCookie(
          `${GUEST_COOKIE_NAME}=${encodeURIComponent(guestToken)}; ${ctx.guestCookieAttributes}`,
        );
      }
      publishAppendedEvents(rooms, result.gameId, result.appended);
      return {
        gameId: result.gameId,
        seat: result.seat,
        team: result.team,
        isGuest: result.isGuest,
      };
    });
}
