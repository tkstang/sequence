import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { type Database, createDb } from '../db/client.ts';
import * as schema from '../db/schema/index.ts';
import { type Env, getEnv } from '../env.ts';

/**
 * Build social-provider config, gated on env presence. A provider only
 * registers when both its client id and secret are set — so a fresh deploy
 * without OAuth credentials simply offers email+password.
 */
function socialProviders(env: Env): Record<string, unknown> {
  const providers: Record<string, unknown> = {};
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    };
  }
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }
  return providers;
}

/**
 * Construct a Better Auth instance over the given Drizzle database.
 *
 * Self-hosted on our Fastify server (not Neon Auth) so session cookies live on
 * our origin — required for same-cookie-jar WS upgrade auth. Cookies are
 * httpOnly + sameSite=lax; `secure` is enabled outside development.
 *
 * @param db - Drizzle database (production or a test branch).
 * @param env - validated environment.
 */
export function createAuth(db: Database, env: Env = getEnv()) {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.WEB_ORIGIN],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: socialProviders(env),
    advanced: {
      defaultCookieAttributes: {
        httpOnly: true,
        // NOTE (p07 obligation, review I1): `SameSite=Lax` does not ride
        // cross-site Vercel(web)->Railway(api) requests, so credentialed tRPC
        // calls and the WS upgrade arrive anonymous in prod. The cross-site
        // cookie strategy (SameSite=None;Secure, or a shared registrable
        // domain) is decided in p07-t02/t03 where the deploy domains are known;
        // local dev is same-site (localhost:3000<->3001) and unaffected.
        sameSite: 'lax',
        secure: env.NODE_ENV !== 'development',
      },
    },
  });
}

/** The concrete Better Auth instance type, inferred from {@link createAuth}. */
export type Auth = ReturnType<typeof createAuth>;

let cached: Auth | undefined;

/**
 * Lazily build and memoize the app-wide auth instance against the production
 * database. Tests build their own via {@link createAuth} with a test db.
 */
export function getAuth(): Auth {
  if (!cached) {
    const env = getEnv();
    const { db } = createDb(env.DATABASE_URL);
    cached = createAuth(db, env);
  }
  return cached;
}
