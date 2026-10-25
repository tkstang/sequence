import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'vitest/config';

// Load gitignored env so integration tests see DATABASE_URL_TEST /
// BETTER_AUTH_SECRET. Root `.env` is the shared location when present; the
// package-local `.env` is a fallback for local API/dev worktrees. Resolve both
// explicitly because the workspace runner's cwd is the monorepo root.
loadEnv({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
loadEnv({ path: fileURLToPath(new URL('.env', import.meta.url)) });

export default defineConfig({
  test: {
    // Reconcile the test-branch schema once per run (no-op without a test DB).
    globalSetup: ['./src/test/global-setup.ts'],
    // Integration tests share one Neon branch and truncate between tests, so
    // they must not run concurrently against the same data. Pinning the api
    // project to one worker serializes its files under the root `projects`
    // runner too (the per-file advisory lock then never starves), so the root
    // `pnpm test` gate is green, not just the per-project run. Isolation stays
    // on (Vitest 4's `singleFork` equivalent would also set `isolate: false`),
    // so each file still gets a fresh module graph. game-logic / web keep
    // their own (parallel) pools.
    pool: 'forks',
    maxWorkers: 1,
    fileParallelism: false,
    // Neon round-trips + drizzle push can exceed the default timeout; the
    // full-game e2e is a long single test, so allow generous hook headroom.
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
