# Testing

This document explains the test layers and the infrastructure behind them. For
the exact commands, see `development.md`. For the environment variables that gate
DB-backed tests, see `configuration.md`. For system boundaries, see
`architecture.md`.

Sequence Online tests in four layers, each living next to the code it covers:

| Layer | Where | Runner | Needs a DB? |
| --- | --- | --- | --- |
| `@sequence/game-logic` unit tests | `packages/game-logic/src/*.test.ts` | Vitest | No |
| `@sequence/api` integration tests | `packages/api/src/**/*.test.ts`, `*.e2e.test.ts` | Vitest | Yes (test branch) |
| `@sequence/web` component/route tests | `apps/web/src/**/*.test.{ts,tsx}` | Vitest (jsdom) | No |
| Playwright e2e | `apps/web/e2e/*.spec.ts` | Playwright | Yes (test branch) |

The first three layers run under one Vitest workspace
(`vitest.workspace.ts:5`), which globs `packages/*` and `apps/*` and lets each
package own its config. The root `pnpm test` drives that workspace through a thin
harness; Playwright is a separate runner invoked with `pnpm --filter
@sequence/web e2e`.

## `@sequence/game-logic` unit tests

The pure engine is the easy layer: no DB, no I/O, deterministic. Tests live
beside their modules under `packages/game-logic/src/` (deck, sequence detection,
state machine, win conditions, apply-move, jack rules, simulation, and more) and
import the functions directly. Determinism comes from a seeded RNG
(`createSeededRng`), so shuffles and full-game simulations are reproducible
rather than flaky.

The package has no Vitest config of its own; the workspace glob picks it up and
its `test` script is `vitest run --passWithNoTests`
(`packages/game-logic/package.json`). These tests are fast and run on every
`pnpm test`, with or without a database.

## `@sequence/api` integration tests

The API layer runs its route procedures against a **real Postgres test branch**,
not a mock. The shared harness (`packages/api/src/test/harness.ts:133`) boots the
production `appRouter` (merged with a tiny `_test` helper router) in-process on a
Fastify server bound to an ephemeral port, mounts Better Auth through the same
Web-Request bridge as production, and drives tRPC over real HTTP with cookies. It
exposes `signUp`, `call`/`mutate`/`query`, a server-side `caller` for
subscriptions, and a `reset()` that truncates all game and auth tables between
tests.

### How `DATABASE_URL_TEST` gates the suite

`testEnv()` reads `DATABASE_URL_TEST` and repoints `DATABASE_URL` at the test
branch, throwing if it is absent (`packages/api/src/test/harness.ts:121`). Each
integration file guards itself:

```ts
const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;
```

So when `DATABASE_URL_TEST` is unset, those `describe` blocks are skipped rather
than failing — non-DB environments (and the root gate without Neon creds) stay
green. Around 17 files use this pattern, including the route suites under
`packages/api/src/game/routes/` and the full-game integration test
(`packages/api/src/test/full-game.e2e.test.ts`). Plain unit tests in the same
package (env parsing, server config, rate-limit middleware, etc.) do not gate on
the DB and always run.

### Schema setup and the DB lock

Schema is reconciled once per run by the Vitest global setup
(`packages/api/src/test/global-setup.ts:14`), which runs `drizzle-kit push
--force` against the test branch — idempotent, applying any drift — and skips
cleanly when `DATABASE_URL_TEST` is absent. Per-test isolation is then just the
harness `reset()` truncate.

Because every integration file truncates the same shared tables, they must not
interleave. Two mechanisms enforce serialization:

- The api Vitest project pins itself to a single fork
  (`pool: 'forks'`, `singleFork: true`, `fileParallelism: false`) so the
  workspace runner can't schedule its files across workers
  (`packages/api/vitest.config.ts:25`).
- A Postgres session-level **advisory lock**, acquired for the lifetime of each
  harness and released on `close()`, makes files run one-at-a-time at the DB
  level regardless of scheduling (`packages/api/src/test/db-lock.ts:29`).

The api config also loads the gitignored root `.env` so workers see
`DATABASE_URL_TEST` and `BETTER_AUTH_SECRET`, and raises timeouts to absorb Neon
round-trips and `drizzle-kit push`.

## `@sequence/web` component/route tests

Web tests run under Vitest in a jsdom environment with Testing Library matchers
(`apps/web/vitest.config.ts`). They cover components and route views — the game
board, card hand, player rail, lobby, dashboard, login/auth forms, the
drag/tap input controllers, and game-state helpers — and need no database. The
config sets `environment: 'jsdom'`, `globals: true`, a setup file, the automatic
JSX runtime, and the `@` path alias mirroring `tsconfig.json`. The workspace glob
picks it up and `pnpm --filter @sequence/web test` runs it standalone.

## Playwright e2e

The browser-level e2e specs live in `apps/web/e2e/` (full game, pass-and-play,
reconnect, rematch) and run with `pnpm --filter @sequence/web e2e`. The config
(`apps/web/playwright.config.ts`) loads the root `.env` and gates everything on
`DATABASE_URL_TEST`.

The matrix is one worker (`workers: 1`, `fullyParallel: false`) across two
projects:

- `desktop-chromium` — Desktop Chrome at `1280x900`
  (`apps/web/playwright.config.ts:28`).
- `mobile-375` — a Pixel 5 profile at `375x812`
  (`apps/web/playwright.config.ts:35`).

The `webServer` block is conditional on `hasTestDb`
(`apps/web/playwright.config.ts:43`). When `DATABASE_URL_TEST` is present,
Playwright starts two servers:

- API on `http://127.0.0.1:3001` (run with `NODE_ENV=test`, the test branch as
  both `DATABASE_URL` and `DATABASE_URL_TEST`, and the fixed auth secret
  `sequence-playwright-test-secret-000000`).
- web on `http://127.0.0.1:3000` (pointed at the local API/WS via
  `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL`).

Both reuse an existing server outside CI. When `DATABASE_URL_TEST` is missing,
`webServer` is `undefined` — no servers start — and each spec additionally calls
`test.skip(!hasTestDb, ...)`, so the suite is skipped rather than failed. The
specs seed and inspect game state through the same test-branch DB connection
(`apps/web/e2e/helpers.ts`), which also requires `DATABASE_URL_TEST`.

The fixed test auth secret keeps Better Auth deterministic across the started API
and any direct DB seeding the specs perform.

## How `DATABASE_URL_TEST` gates everything DB-backed

`DATABASE_URL_TEST` is the single switch for the two DB-backed layers. When it is
**absent**:

- the api integration `describe` blocks skip, and `drizzle-kit push` global
  setup no-ops;
- the Playwright `webServer` is not defined, so the API and web servers never
  start, and the specs skip.

When it is **present**, both layers run against that branch. Point it at a
disposable Neon test branch — the global setup pushes the live schema onto it and
the harness/e2e helpers truncate and seed it freely, so a throwaway branch keeps
that destructive churn off any shared or production database. Never point
`DATABASE_URL_TEST` at production. See `configuration.md` for the variable and
`development.md` for the workflow.

## The root `pnpm test` harness

`pnpm test` runs `scripts/run-tests.mjs` (`scripts/run-tests.mjs`), which:

1. Checks whether any `packages/*` or `apps/*` directory has a `package.json`. If
   none exist (the empty-monorepo state), it prints a skip message and exits `0`.
2. Otherwise spawns `pnpm exec vitest run --passWithNoTests`, driving the
   workspace, and exits with Vitest's status.

`--passWithNoTests` means a project with no test files (or one whose only tests
are DB-gated `describe.skip` blocks) does not fail the run. So `pnpm test` is
green without Neon creds: the game-logic and web layers run fully, the api
integration blocks skip, and the global setup no-ops. The harness drives the
Vitest workspace only — Playwright is **not** part of `pnpm test` and must be run
explicitly.
