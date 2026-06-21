# Development

This document covers local workflows for Sequence Online. For system boundaries,
see `docs/architecture.md`.

## Install

```bash
pnpm install
```

The root `prepare` script installs local git hooks. In CI or Docker build
archives, use `pnpm install --ignore-scripts` or set `GIT_HOOKS=0`.

## Environment Files

The committed `.env.example` is the source of truth for variable names. See
`configuration.md` for the full variable reference (scopes, defaults, and
validation).

For local API development, copy it to `packages/api/.env`:

```bash
cp .env.example packages/api/.env
```

This package-local path matters because `pnpm --filter @sequence/api dev` runs
from `packages/api`, and the script uses `node --env-file=.env`.

The web app defaults to the local API and usually does not need an env file:

- `NEXT_PUBLIC_API_URL` defaults to `http://localhost:3001`
- `NEXT_PUBLIC_WS_URL` defaults to `ws://localhost:3001`

Use `apps/web/.env.local` only when pointing the web app at another API.

## Run Locally

Terminal 1:

```bash
pnpm --filter @sequence/api dev
```

Terminal 2:

```bash
pnpm --filter @sequence/web dev
```

Open `http://localhost:3000`.

## Test Gates

Full repo gates:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

Focused package gates:

```bash
pnpm --filter @sequence/game-logic test
pnpm --filter @sequence/api test
pnpm --filter @sequence/web test
pnpm --filter @sequence/web e2e
```

`pnpm test` runs the workspace test harness in `scripts/run-tests.mjs`.

## Playwright

The web Playwright config loads the root `.env` and checks for
`DATABASE_URL_TEST`.

When `DATABASE_URL_TEST` is present, Playwright starts:

- API on `http://127.0.0.1:3001`
- web on `http://127.0.0.1:3000`

The config uses one worker and two projects:

- desktop Chromium at `1280x900`
- mobile Chromium using a Pixel 5 profile with `375x812`

If `DATABASE_URL_TEST` is missing, the suite does not start those servers.

## Database Workflow

Schema lives under `packages/api/src/db/schema`. Migrations live under
`packages/api/drizzle`.

Generate SQL:

```bash
pnpm --filter @sequence/api exec drizzle-kit generate
```

Apply migrations:

```bash
pnpm --filter @sequence/api exec drizzle-kit migrate
```

Only point `DATABASE_URL` at production when doing an intentional production
deploy or migration. Local testing should use a test branch or disposable
database.

## UI Development

Current UI iteration uses the real app and tests. There is no `/dev` playground
yet. The backlog item `bl-d319` tracks a future dev-only component playground
backed by reusable `GameSnapshotView` fixtures.

The board currently renders full playing-card SVG assets from
`apps/web/public/cards` with `object-fit: contain`. A symbolic/physical-board
rendering exploration is tracked separately as backlog item `bl-821f`.

When making visual changes:

1. Use the local app to view the full game surface.
2. Check both desktop and 375px mobile widths.
3. Keep the board, hand, and player rail visible together.
4. Run focused web tests and Playwright when the change affects flows.

## API Smoke Collection

The Bruno collection in `bruno/` exercises local auth and tRPC HTTP routes
without the browser UI. See `bruno/README.md`.
