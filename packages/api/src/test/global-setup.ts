import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * Vitest global setup for the API integration suite.
 *
 * Reconciles the Neon **test** branch schema with the current Drizzle schema
 * via `drizzle-kit push` exactly once per run (idempotent; applies any drift).
 * Per-test isolation is then just a `truncate` in the harness `reset()`.
 *
 * Skips cleanly when `DATABASE_URL_TEST` is absent so non-DB environments
 * (and the root `pnpm test` gate without Neon creds) stay green.
 */
export default function setup(): void {
  const testDb = process.env.DATABASE_URL_TEST;
  if (!testDb) {
    // No test branch configured — integration describes are skipped by the
    // suites themselves; nothing to push.
    return;
  }

  const apiRoot = fileURLToPath(new URL('../..', import.meta.url));
  execFileSync('pnpm', ['exec', 'drizzle-kit', 'push', '--force'], {
    cwd: apiRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testDb },
  });
}
