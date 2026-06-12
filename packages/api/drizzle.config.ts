import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit config (generate / migrate / push).
 *
 * The connection string is read from the environment at invocation time:
 *   - `drizzle-kit generate` needs no DB (emits SQL from the schema).
 *   - `drizzle-kit migrate` / `push` use `DATABASE_URL` — point this at the
 *     Neon *test* branch (`DATABASE_URL_TEST`) for local/CI verification, never
 *     the production branch.
 */
export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  // Keep generated SQL readable and reviewable.
  verbose: true,
  strict: true,
});
