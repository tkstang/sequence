import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createDb, type Database } from '../db/client.ts';
import { type Env, parseEnv } from '../env.ts';
import { buildServer } from '../server.ts';
import { acquireDbLock, type DbLock } from '../test/db-lock.ts';
import { createAuth } from './auth.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

/** Reduce a Set-Cookie header into a Cookie request header. */
function cookieHeader(setCookie: string | null): string {
  if (!setCookie) return '';
  return setCookie
    .split(/,(?=[^ ;]+=)/)
    .map((c) => c.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

describeIntegration('auth integration', () => {
  let app: FastifyInstance;
  let db: Database;
  let client: ReturnType<typeof createDb>['sql'];
  let env: Env;
  let baseUrl: string;
  let lock: DbLock;

  beforeAll(async () => {
    const base = parseEnv();
    env = parseEnv({
      ...process.env,
      DATABASE_URL: base.DATABASE_URL_TEST,
      NODE_ENV: 'test',
    } as NodeJS.ProcessEnv);
    // Serialize against the sibling integration file sharing this branch.
    lock = await acquireDbLock(env.DATABASE_URL);
    ({ db, sql: client } = createDb(env.DATABASE_URL));
    const auth = createAuth(db, env);
    // Low burst ceiling so the rate-limit test runs fast.
    app = await buildServer({
      env,
      db,
      auth,
      logger: false,
      authRateLimitMax: 5,
    });
    await app.listen({ port: 0, host: '127.0.0.1' });
    const addr = app.server.address();
    if (!addr || typeof addr === 'string') throw new Error('bind failed');
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await app.close();
    await client.end();
    await lock.release();
  });

  beforeEach(async () => {
    await db.execute(sql`
      truncate table "session", "account", "verification", "user"
      restart identity cascade
    `);
  });

  async function signUp(email: string): Promise<string> {
    const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'supersecret123', name: 'User' }),
    });
    expect(res.status).toBe(200);
    return cookieHeader(res.headers.get('set-cookie'));
  }

  async function callMe(cookie: string): Promise<number> {
    const res = await fetch(`${baseUrl}/trpc/health.me`, {
      headers: cookie ? { cookie } : {},
    });
    return res.status;
  }

  it('signup → session validates an authed procedure', async () => {
    const cookie = await signUp('flow@example.com');
    expect(await callMe(cookie)).toBe(200);
  });

  it('rejects the authed procedure without a session (UNAUTHORIZED)', async () => {
    const res = await fetch(`${baseUrl}/trpc/health.me`);
    expect(res.status).toBe(401);
  });

  it('login issues a working session; logout invalidates it', async () => {
    await signUp('login@example.com');

    const login = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'login@example.com',
        password: 'supersecret123',
      }),
    });
    expect(login.status).toBe(200);
    const cookie = cookieHeader(login.headers.get('set-cookie'));
    expect(await callMe(cookie)).toBe(200);

    const logout = await fetch(`${baseUrl}/api/auth/sign-out`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: '{}',
    });
    expect(logout.status).toBe(200);

    // The session is now revoked server-side; the authed probe must fail.
    expect(await callMe(cookie)).toBe(401);
  });

  it('rate-limits the auth endpoints with 429 after a burst', async () => {
    // authRateLimitMax = 5; the 6th request inside the window should 429.
    let sawTooMany = false;
    for (let i = 0; i < 8; i += 1) {
      const res = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'x@y.z', password: 'wrongpassword' }),
      });
      if (res.status === 429) {
        sawTooMany = true;
        break;
      }
    }
    expect(sawTooMany).toBe(true);
  });
});
