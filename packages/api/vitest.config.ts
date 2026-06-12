import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'vitest/config';

// Load the gitignored env so integration tests see DATABASE_URL_TEST /
// BETTER_AUTH_SECRET. The secrets live in the monorepo **root** `.env` (the
// worktree-init script copies it there), so resolve that path explicitly rather
// than relying on the worker cwd. A package-local `.env` still wins if present.
// Absent in CI without Neon creds — integration describes skip cleanly then.
loadEnv();
loadEnv({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

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
