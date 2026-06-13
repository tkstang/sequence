import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { type Database, createDb } from '../db/client.ts';
import * as schema from '../db/schema/index.ts';
import { type Env, getEnv } from '../env.ts';
import { resolveAuthCookieAttributes } from './cookie-attributes.ts';

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
 * our origin — required for same-cookie-jar WS upgrade auth.
 *
 * @param db - Drizzle database (production or a test branch).
 * @param env - validated environment.
 */
export function createAuth(db: Database, env: Env = getEnv()) {
  const cookieAttributes = resolveAuthCookieAttributes(env);

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
        httpOnly: cookieAttributes.httpOnly,
        sameSite: cookieAttributes.sameSite,
        secure: cookieAttributes.secure,
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
