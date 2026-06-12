import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { fromNodeHeaders } from 'better-auth/node';

import type { Database } from './db/client.ts';
import type { Auth } from './user/auth.ts';

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
}

export interface CreateContextDeps {
  db: Database;
  auth: Auth;
}

/**
 * Build the per-request context factory bound to a db + auth instance.
 *
 * Session resolution: the Better Auth session cookie rides the same cookie jar
 * the WS upgrade uses. Guest resolution (cookie → game-scoped identity) is
 * wired in p03-t07/t08; until then `guest` is always null.
 */
export function createContextFactory({ db, auth }: CreateContextDeps) {
  return async function createContext({
    req,
  }: CreateFastifyContextOptions): Promise<Context> {
    const headers = fromNodeHeaders(req.headers);
    const session = await auth.api.getSession({ headers });

    const user: SessionUser | null = session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        }
      : null;

    return { user, guest: null, db, auth, headers };
  };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const mergeRouters = t.mergeRouters;

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
