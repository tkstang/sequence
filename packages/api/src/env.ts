import { z } from 'zod';

/**
 * Environment schema for the API service.
 *
 * Validated once at boot; a missing required secret should fail fast and loud
 * rather than surface as a confusing runtime error deep in a request.
 */
export const envSchema = z.object({
  // Neon direct connection string (postgres.js). Required.
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Neon test-branch connection string. Optional in prod; required by the
  // integration harness (which skips cleanly when it is absent).
  DATABASE_URL_TEST: z.string().min(1).optional(),
  // Better Auth signing secret. Required. Also signs game-scoped guest tokens,
  // so a >=32-char floor fails fast on a weak/placeholder secret.
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  // Public base URL Better Auth issues cookies/links against.
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3001'),
  // Allowed CORS origin (the web app), credentialed.
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  // HTTP listen port.
  PORT: z.coerce.number().int().positive().default(3001),
  // Node environment.
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  // Trust the edge proxy's `X-Forwarded-For` when resolving `request.ip`.
  // Prefer a numeric hop count on Railway (`TRUST_PROXY=1`) so a client cannot
  // spoof the leftmost XFF value if the edge appends instead of overwrites.
  // `true` remains available for verified shared-domain/proxy topologies.
  TRUST_PROXY: z
    .string()
    .regex(/^(true|false|0|[1-9]\d*)$/)
    .transform((v) => {
      if (v === 'true') return true;
      if (v === 'false' || v === '0') return false;
      return Number(v);
    })
    .optional(),
  // Cookie mode for Better Auth sessions and guest tokens. Production defaults
  // to SameSite=None; Secure for cross-site Vercel -> Railway credentialed
  // requests. Set `lax` only when web and API share one registrable site.
  AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'none']).optional(),
  AUTH_COOKIE_SECURE: z
    .enum(['true', 'false', '1', '0'])
    .transform((v) => v === 'true' || v === '1')
    .optional(),
  // Optional social OAuth providers — presence gates registration.
  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate an environment record.
 *
 * @param source - raw environment (defaults to `process.env`).
 * @throws ZodError when required variables are missing or malformed.
 */
export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}

let cached: Env | undefined;

/**
 * Lazily parse and memoize `process.env`. Use in app code; tests should call
 * {@link parseEnv} directly with an explicit record to stay isolated.
 */
export function getEnv(): Env {
  cached ??= parseEnv();
  return cached;
}
