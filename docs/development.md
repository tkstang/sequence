# Development

This document covers local workflows for Sequence Online. For system
boundaries, see `docs/architecture.md`.

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

The mobile app also defaults to the local API through Expo config:

- `EXPO_PUBLIC_API_URL` defaults to `http://localhost:3001`
- `EXPO_PUBLIC_WS_URL` defaults to `ws://localhost:3001`

Set those variables in the shell only when starting Expo against a non-default
API, such as the production Railway API for a production-like simulator pass.

## Run the Web App Locally

Terminal 1:

```bash
pnpm --filter @sequence/api dev
```

Terminal 2:

```bash
pnpm --filter @sequence/web dev
```

Open `http://localhost:3000`.

## Run the Mobile App Locally

Terminal 1, when API-backed screens are needed:

```bash
pnpm --filter @sequence/api dev
```

Terminal 2, start Metro for the Expo dev client:

```bash
EXPO_UNSTABLE_MCP_SERVER=1 pnpm --filter @sequence/mobile exec expo start --dev-client --host lan --port 8081
```

Terminal 3, build or launch the iOS dev client:

```bash
pnpm --filter @sequence/mobile ios
```

Use the installed development client on the iOS Simulator. If Expo CLI cannot
activate Simulator through macOS automation, launch directly with `simctl` and
an Expo dev-client URL as documented in
[`../apps/mobile/AGENTS.md`](../apps/mobile/AGENTS.md#agent-loop).

Generated native folders (`apps/mobile/ios`, `apps/mobile/android`), `.expo`,
and `expo-env.d.ts` are local build artifacts and stay untracked.

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
pnpm --filter @sequence/mobile test
pnpm --filter @sequence/client-state test
pnpm --filter @sequence/design-tokens test
```

Mobile source also has focused static gates:

```bash
pnpm --filter @sequence/mobile typecheck
pnpm --filter @sequence/mobile lint
pnpm --filter @sequence/mobile format
```

`pnpm test` runs the workspace test harness in `scripts/run-tests.mjs`: first
the Vitest workspace, then `@sequence/mobile` Jest.

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

## Mobile UI Development

The mobile UI uses Expo Router, React Native primitives, React Strict DOM token
variables, Reanimated/Gesture Handler for drag interactions, and
`@sequence/design-tokens` for shared palette values. Game screens consume
`@sequence/client-state` for the same redacted `GameSnapshotView` projection as
the web app.

Route files live under `apps/mobile/src/app`. Keep tests outside that route
tree, for example under `apps/mobile/src/test`, `apps/mobile/src/game`, or a
feature-local non-route folder. Expo Router can bundle route-local `*.test.*`
files into Metro/export output.

For simulator and agent tooling details, use
[`../apps/mobile/AGENTS.md`](../apps/mobile/AGENTS.md). For operator-only
Apple, EAS, TestFlight, physical-device, and production-smoke work, use
[`mobile-operator-runbook.md`](mobile-operator-runbook.md).

## Web UI Development

The web UI is styled with StyleX (tokens + light/dark themes); see
[`styling.md`](styling.md) for the model and build pipeline.

### Dev UI playground

`/dev` is a dev-only component playground (do not link to it from the shipped
app). Each section page renders production-faithful previews ("stories") of UI
components from reusable `GameSnapshotView` fixtures. It provides:

- a **viewport switcher** (Fit / Mobile / Mobile L / Tablet / Desktop) that
  renders a story inside an iframe at the real device width — so media queries
  respond correctly — auto-grown to content height and scaled to fit the panel,
  with a Rotate (width/height swap) control;
- a per-component **Expand** control that maximizes one preview into an in-app
  overlay (covering the layout, not OS fullscreen) for close inspection;
- a chrome-less `/dev-frame/[section]` render target used as the iframe source.

It is implemented under `apps/web/src/app/dev/` (with the `_playground/`
helpers) and `apps/web/src/app/dev-frame/`, gated to development and not part of
the shipped app surface.

**Production exclusion.** Each `/dev` and `/dev-frame` page guards on
`process.env.NODE_ENV === 'production'` and calls `notFound()` *before* rendering
any playground content, and the `/dev` layout uses a dev-only `generateMetadata`.
So in a production build `/dev`, `/dev/board`, and `/dev-frame/board` return a
generic 404 with no playground markup, chunks, or title — the page-level guard is
what keeps the playground out of the production payload (a layout-only guard
still serializes the page into the 404 response). Keep the guard at the page
level when adding `/dev` routes. Verify with `next start` + a `curl` of `/dev*`.

The board currently renders full playing-card SVG assets from
`apps/web/public/cards` with `object-fit: contain`. A symbolic/physical-board
rendering exploration is tracked separately as backlog item `bl-821f`.

When making visual changes:

1. Iterate on individual components in the `/dev` playground, or use the local
   app to view the full game surface.
2. Check both desktop and 375px mobile widths (the playground viewport switcher
   makes this quick).
3. Keep the board, hand, and player rail visible together.
4. Run focused web tests and Playwright when the change affects flows.

## API Smoke Collection

The Bruno collection in `bruno/` exercises local auth and tRPC HTTP routes
without the browser UI. See `bruno/README.md`.
