import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { fromNodeHeaders } from 'better-auth/node';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import type { Database } from './db/client.ts';
import { gamePlayers, games } from './db/schema/index.ts';
import type { Auth } from './user/auth.ts';
import { hashToken, verifyGuestToken } from './user/guest-tokens.ts';

/** Cookie name carrying a guest's game-scoped token. */
export const GUEST_COOKIE_NAME = 'sequence_guest';

/** A resolved Better Auth user (subset we rely on). */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/** A resolved guest identity, scoped to a single game. */
export interface GuestIdentity {
  gameId: string;
  seat: number;
}

/**
 * tRPC request context. One of `user` / `guest` may be set (or neither, for an
 * anonymous caller). `db` and `auth` are threaded so procedures and middleware
 * (e.g. `gamePlayerProcedure`, p03-t08) can query without re-instantiating.
 */
export interface Context {
  user: SessionUser | null;
  guest: GuestIdentity | null;
  db: Database;
  auth: Auth;
  /** Raw request headers — needed for guest-cookie resolution downstream. */
  headers: Headers;
  /**
   * The resolved client IP for this request (`request.ip`). With `trustProxy`
   * enabled on the Fastify factory this is the real client address parsed from
   * the trusted edge's `X-Forwarded-For`; with `trustProxy` off it is the
   * direct socket address (an attacker cannot spoof it via a raw XFF header).
   * Rate limiters MUST key on this, not on a hand-parsed `x-forwarded-for`.
   */
  ip: string;
  /** HMAC secret for verifying guest tokens (the app's `BETTER_AUTH_SECRET`). */
  guestSecret: string;
  /** Serialized attributes for guest-token cookies. */
  guestCookieAttributes: string;
  /**
   * Append a `Set-Cookie` header on the HTTP response (used by `join` to issue
   * the game-scoped guest cookie). A no-op on the WS transport (no reply
   * object), which is fine — cookies are only ever set on HTTP mutations.
   */
  setCookie: (value: string) => void;
}

export interface CreateContextDeps {
  db: Database;
  auth: Auth;
  /** Defaults to `env.BETTER_AUTH_SECRET`. */
  guestSecret: string;
  /** Serialized attributes for guest-token cookies. */
  guestCookieAttributes: string;
}

const SESSION_CACHE_TTL_MS = 10_000;

interface CachedSessionUser {
  expiresAt: number;
  user: SessionUser;
}

const sessionUserCache = new Map<string, CachedSessionUser>();

export function clearSessionUserCache(): void {
  sessionUserCache.clear();
}

async function resolveSessionUser(
  auth: Auth,
  headers: Headers,
): Promise<SessionUser | null> {
  const cookie = headers.get('cookie');
  if (!cookie) return null;

  const cached = sessionUserCache.get(cookie);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.user;
  if (cached) sessionUserCache.delete(cookie);

  const session = await auth.api.getSession({ headers });
  const user: SessionUser | null = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      }
    : null;
  if (user) {
    sessionUserCache.set(cookie, {
      user,
      expiresAt: now + SESSION_CACHE_TTL_MS,
    });
  }
  return user;
}

/**
 * Build the per-request context factory bound to a db + auth instance.
 *
 * Session resolution: the Better Auth session cookie rides the same cookie jar
 * the WS upgrade uses. Guest resolution (cookie → game-scoped identity) is
 * wired in p03-t07/t08; until then `guest` is always null.
 */
export function createContextFactory({
  db,
  auth,
  guestSecret,
  guestCookieAttributes,
}: CreateContextDeps) {
  return async function createContext({
    req,
    res,
  }: CreateFastifyContextOptions): Promise<Context> {
    const headers = fromNodeHeaders(req.headers);
    const user = await resolveSessionUser(auth, headers);

    const ip = resolveClientIp(req);

    // `res` is a FastifyReply on the HTTP transport and absent on WS. Append
    // (don't overwrite) so a Set-Cookie coexists with Better Auth's own.
    const setCookie = (value: string): void => {
      if (!res || typeof res.header !== 'function') return;
      const existing = res.getHeader?.('set-cookie');
      if (existing === undefined) {
        res.header('set-cookie', value);
      } else if (Array.isArray(existing)) {
        res.header('set-cookie', [...existing, value]);
      } else {
        res.header('set-cookie', [String(existing), value]);
      }
    };

    return {
      user,
      guest: null,
      db,
      auth,
      headers,
      ip,
      guestSecret,
      guestCookieAttributes,
      setCookie,
    };
  };
}

/**
 * Resolve the per-request client IP across BOTH transports (I3).
 *
 * On the HTTP path the fastify adapter hands tRPC a `FastifyRequest`, whose
 * `.ip` is Fastify's resolved client address (honors `trustProxy`, not
 * spoofable via raw XFF when proxy is untrusted). On the **WS** path the
 * adapter passes the bare Node `IncomingMessage` from the upgrade — it has no
 * `.ip`, so without a fallback every WS caller collapses to one shared
 * rate-limit bucket (one client could lock out all guest joins). We:
 *   1. read `req.ip` when present (HTTP, and WS upgrades stamped by the
 *      `onRequest` hook in server.ts, which copies the resolved ip onto
 *      `req.raw.ip`);
 *   2. fall back to the socket's `remoteAddress` for any un-stamped upgrade.
 * The limiter keys on this — never on a hand-parsed `x-forwarded-for`.
 */
export function resolveClientIp(req: {
  ip?: string;
  raw?: { ip?: string; socket?: { remoteAddress?: string } };
  socket?: { remoteAddress?: string };
}): string {
  return (
    req.ip ??
    req.raw?.ip ??
    req.socket?.remoteAddress ??
    req.raw?.socket?.remoteAddress ??
    'unknown'
  );
}

/**
 * A typed rule violation a route may attach to a BAD_REQUEST so clients render
 * feedback from codes (design §Error contract), never string matching. The move
 * engine throws `RuleViolationError` whose `.violation` lands here via the
 * error formatter below.
 */
interface RuleViolationCarrier {
  violation?: { code?: string };
}

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    // Surface a game-logic rule violation in `error.data.ruleViolation` so the
    // client error contract is code-based. The cause is the engine's
    // RuleViolationError (structural check — no import cycle into the engine).
    const cause = error.cause as RuleViolationCarrier | undefined;
    const violation = cause?.violation;
    if (violation && typeof violation.code === 'string') {
      return {
        ...shape,
        data: { ...shape.data, ruleViolation: violation },
      };
    }
    return shape;
  },
});

export const router = t.router;
export const mergeRouters = t.mergeRouters;
/** Server-side caller factory — used by the integration harness to drive
 * subscriptions in-process (no WS client dep until p05). */
export const createCallerFactory = t.createCallerFactory;

/** Any caller — no identity required. */
export const publicProcedure = t.procedure;

/**
 * Requires a logged-in user. Rejects with UNAUTHORIZED when no session is
 * present. Narrows `ctx.user` to non-null for downstream resolvers.
 */
export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/** Read a single cookie value from a `Cookie` header. */
export function readCookie(headers: Headers, name: string): string | null {
  const cookie = headers.get('cookie');
  if (!cookie) return null;
  for (const part of cookie.split(';')) {
    const sep = part.indexOf('=');
    if (sep === -1) continue;
    if (part.slice(0, sep).trim() === name) {
      const raw = part.slice(sep + 1).trim();
      // A tampered cookie can carry an invalid percent-escape (e.g. `%`), which
      // throws URIError. At the authz boundary that must read as "not a
      // participant" (FORBIDDEN), not a 500 — fall back to the raw value.
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return null;
}

/**
 * The seat resolved for the caller in a specific game, attached to ctx by
 * {@link gamePlayerProcedure}.
 */
export interface GameSeat {
  gameId: string;
  /** The seat the caller controls. For a local game the creator controls all
   * seats; `seat` is then the game's current seat (or the lowest seat). */
  seat: number;
  team: number;
  isLocal: boolean;
}

/**
 * Resolve the caller to a seat in `input.gameId`, or throw FORBIDDEN.
 *
 * Resolution order, per design §API authorization chain:
 *  - Session user → their `game_players` row in this game.
 *  - Local game → the creator's session covers every seat (privacy is the
 *    client-side handoff screen).
 *  - Guest cookie → verify the game-scoped token, then match the stored hash.
 */
export const gamePlayerProcedure = t.procedure
  .input(z.object({ gameId: z.string().uuid() }))
  .use(async ({ ctx, input, next }) => {
    const seat = await resolveSeat(ctx, input.gameId);
    if (!seat) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    return next({ ctx: { ...ctx, seat } });
  });

async function resolveSeat(
  ctx: Context,
  gameId: string,
): Promise<GameSeat | null> {
  const [game] = await ctx.db
    .select({
      id: games.id,
      local: games.local,
      createdBy: games.createdBy,
      currentSeat: games.currentSeat,
    })
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1);

  if (!game) return null;

  const seats = await ctx.db
    .select({
      seat: gamePlayers.seat,
      team: gamePlayers.team,
      userId: gamePlayers.userId,
      guestTokenHash: gamePlayers.guestTokenHash,
    })
    .from(gamePlayers)
    .where(eq(gamePlayers.gameId, gameId))
    // Ascending seat order so the local-game `seats[0]` fallback below is the
    // lowest seat (as documented), not arbitrary DB-row order.
    .orderBy(gamePlayers.seat);

  // Local game: the creator's session controls every seat.
  if (game.local && ctx.user && ctx.user.id === game.createdBy) {
    const target = seats.find((s) => s.seat === game.currentSeat) ?? seats[0];
    if (!target) return null;
    return { gameId, seat: target.seat, team: target.team, isLocal: true };
  }

  // Registered user occupying a seat.
  if (ctx.user) {
    const mine = seats.find((s) => s.userId === ctx.user?.id);
    if (mine) {
      return { gameId, seat: mine.seat, team: mine.team, isLocal: false };
    }
  }

  // Guest: verify the game-scoped cookie, then match the stored hash.
  const rawToken = readCookie(ctx.headers, GUEST_COOKIE_NAME);
  if (rawToken) {
    const identity = verifyGuestToken(rawToken, gameId, ctx.guestSecret);
    if (identity) {
      const hash = hashToken(rawToken);
      const seat = seats.find(
        (s) => s.seat === identity.seat && s.guestTokenHash === hash,
      );
      if (seat) {
        return { gameId, seat: seat.seat, team: seat.team, isLocal: false };
      }
    }
  }

  return null;
}
