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
    // they must not run concurrently against the same data. `fileParallelism`
    // alone is NOT honored under the root **workspace** runner, which schedules
    // files across workers; pinning the api project to a single fork makes the
    // serialization real (the per-file advisory lock then never starves) so the
    // root `pnpm test` gate is green, not just the per-project run. game-logic /
    // web keep their own (parallel) pools.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    fileParallelism: false,
    // Neon round-trips + drizzle push can exceed the default timeout; the
    // full-game e2e is a long single test, so allow generous hook headroom.
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
