import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'vitest/config';

// Load the package-local .env (gitignored) so integration tests see
// DATABASE_URL_TEST / BETTER_AUTH_SECRET. Absent in CI without Neon creds —
// integration describes skip cleanly in that case.
loadEnv();

export default defineConfig({
  test: {
    // Reconcile the test-branch schema once per run (no-op without a test DB).
    globalSetup: ['./src/test/global-setup.ts'],
    // Integration tests share one Neon branch and truncate between tests, so
    // they must not run concurrently against the same data.
    fileParallelism: false,
    // Neon round-trips + drizzle push can exceed the default timeout.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
