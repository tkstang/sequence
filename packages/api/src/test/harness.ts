import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { sql } from 'drizzle-orm';
import Fastify, { type FastifyInstance } from 'fastify';

import { createDb, type Database } from '../db/client.ts';
import { type Env, parseEnv } from '../env.ts';
import { sendWebResponse, toWebRequest } from '../server.ts';
import {
  createContextFactory,
  gamePlayerProcedure,
  GUEST_COOKIE_NAME,
  router,
} from '../trpc.ts';
import { createAuth } from '../user/auth.ts';
import { acquireDbLock } from './db-lock.ts';

/**
 * Integration-test harness.
 *
 * Boots the API in-process against the Neon **test** branch
 * (`DATABASE_URL_TEST`), exposes the real router plus a `_test.whoSeat`
 * procedure (which runs the production `gamePlayerProcedure`), and provides
 * authed / guest client factories that drive tRPC over real HTTP with cookies.
 *
 * Schema is reconciled once via `drizzle-kit push` by the suite setup; this
 * harness truncates all game/auth data on `reset()` so each test starts clean.
 */

/**
 * A test-only router: the public app surface is composed in app-router.ts, but
 * the middleware test needs a procedure that exercises `gamePlayerProcedure`
 * and returns the resolved seat. Keeping it here avoids leaking test routes
 * into the production router.
 */
const testRouter = router({
  _test: router({
    whoSeat: gamePlayerProcedure.query(({ ctx }) => ctx.seat),
  }),
});

export type TestRouter = typeof testRouter;

export interface Harness {
  app: FastifyInstance;
  db: Database;
  env: Env;
  baseUrl: string;
  /** Truncate all data (auth + game tables). */
  reset(): Promise<void>;
  /** Sign up a user via Better Auth and return their session cookie + id. */
  signUp(input: {
    email: string;
    password: string;
    name: string;
  }): Promise<{ cookie: string; userId: string }>;
  /** Call `_test.whoSeat` for a game with the given cookie header (or none). */
  whoSeat(
    gameId: string,
    cookie?: string,
  ): Promise<{ ok: true; seat: unknown } | { ok: false; code: string }>;
  /** Build the guest cookie header for a raw token. */
  guestCookie(token: string): string;
  close(): Promise<void>;
}

/** Resolve the test environment, pointing `DATABASE_URL` at the test branch. */
export function testEnv(): Env {
  const base = parseEnv();
  if (!base.DATABASE_URL_TEST) {
    throw new Error('DATABASE_URL_TEST is required to run integration tests');
  }
  return parseEnv({
    ...process.env,
    DATABASE_URL: base.DATABASE_URL_TEST,
    NODE_ENV: 'test',
  } as NodeJS.ProcessEnv);
}

export async function createHarness(): Promise<Harness> {
  const env = testEnv();
  // Serialize against sibling integration files sharing this branch.
  const lock = await acquireDbLock(env.DATABASE_URL);
  const { db, sql: client } = createDb(env.DATABASE_URL);
  const auth = createAuth(db, env);

  const app = Fastify({ logger: false });
  app.get('/health', async () => ({ status: 'ok' }));

  // Mount Better Auth via the exact same Web-Request bridge as the production
  // server (reused, not re-implemented, so the two cannot drift — m2).
  app.all('/api/auth/*', async (request, reply) => {
    const res = await auth.handler(toWebRequest(request, env));
    return sendWebResponse(reply, res);
  });

  await app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: testRouter,
      createContext: createContextFactory({
        db,
        auth,
        guestSecret: env.BETTER_AUTH_SECRET,
      }),
    },
  });

  await app.listen({ port: 0, host: '127.0.0.1' });
  const address = app.server.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to bind test server');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const harness: Harness = {
    app,
    db,
    env,
    baseUrl,
    async reset() {
      // Order-independent thanks to CASCADE; RESTART IDENTITY for determinism.
      await db.execute(sql`
        truncate table
          "game_events", "game_players", "games",
          "session", "account", "verification", "user"
        restart identity cascade
      `);
    },
    async signUp({ email, password, name }) {
      const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        throw new Error(`sign-up failed: ${res.status} ${await res.text()}`);
      }
      const setCookie = res.headers.get('set-cookie') ?? '';
      // Reduce Set-Cookie to a Cookie header (name=value pairs only).
      const cookie = setCookie
        .split(/,(?=[^ ;]+=)/)
        .map((c) => c.split(';')[0]?.trim())
        .filter(Boolean)
        .join('; ');
      const data = (await res.json()) as { user: { id: string } };
      return { cookie, userId: data.user.id };
    },
    async whoSeat(gameId, cookie) {
      const input = encodeURIComponent(JSON.stringify({ gameId }));
      const res = await fetch(`${baseUrl}/trpc/_test.whoSeat?input=${input}`, {
        headers: cookie ? { cookie } : {},
      });
      const json = (await res.json()) as
        | { result: { data: unknown } }
        | { error: { data?: { code?: string } } };
      if (res.ok && 'result' in json) {
        return { ok: true, seat: json.result.data };
      }
      const code =
        'error' in json ? (json.error.data?.code ?? 'UNKNOWN') : 'UNKNOWN';
      return { ok: false, code };
    },
    guestCookie(token) {
      return `${GUEST_COOKIE_NAME}=${encodeURIComponent(token)}`;
    },
    async close() {
      await app.close();
      await client.end();
      await lock.release();
    },
  };

  return harness;
}
