# `@sequence/mobile`

Expo SDK 57 iOS client for Sequence Online. The app consumes the existing
server-authoritative tRPC API, shares redacted game-view state with the web
client, and uses shared design tokens for light/dark theming. Game rules,
persistence, auth, redaction, timers, and realtime behavior remain owned by
`@sequence/api`.

Use this file as the package quick reference. Repo-wide workflow details live in
[`../../docs/development.md`](../../docs/development.md), environment behavior in
[`../../docs/configuration.md`](../../docs/configuration.md), and operator-only
TestFlight work in
[`../../docs/mobile-operator-runbook.md`](../../docs/mobile-operator-runbook.md).

## Commands

```bash
pnpm --filter @sequence/mobile start
pnpm --filter @sequence/mobile ios
pnpm --filter @sequence/mobile test
pnpm --filter @sequence/mobile typecheck
pnpm --filter @sequence/mobile lint
pnpm --filter @sequence/mobile format
```

`ios` runs a local Expo dev build. Generated native output (`ios/`, `android/`)
and Expo local state (`.expo/`) are intentionally ignored build artifacts.

## Local Simulator Loop

For API-backed screens, start the API in a separate terminal:

```bash
pnpm --filter @sequence/api dev
```

Start Metro with the local Expo MCP server enabled:

```bash
EXPO_UNSTABLE_MCP_SERVER=1 pnpm --filter @sequence/mobile exec expo start --dev-client --host lan --port 8081
```

Build or launch the iOS development client:

```bash
pnpm --filter @sequence/mobile ios
```

The installed dev client uses bundle identifier `com.tkstang.sequenceonline` and
scheme `sequence`. If Expo CLI cannot activate Simulator through macOS
automation, use the `simctl launch --initialUrl` fallback documented in
[`AGENTS.md`](AGENTS.md#agent-loop).

## API Configuration

The mobile app reads `extra.apiUrl` and `extra.wsUrl` from Expo config. Defaults
are local development endpoints:

- `apiUrl`: `http://localhost:3001`
- `wsUrl`: `ws://localhost:3001`

Override them for a dev session with:

```bash
EXPO_PUBLIC_API_URL=https://sequence-api-production-8687.up.railway.app \
EXPO_PUBLIC_WS_URL=wss://sequence-api-production-8687.up.railway.app \
pnpm --filter @sequence/mobile start
```

For local API work, create `packages/api/.env` from the root `.env.example` and
run `pnpm --filter @sequence/api dev` in a separate terminal.

Production config fails closed for insecure URLs: with `NODE_ENV=production`,
`EXPO_PUBLIC_API_URL` must be `https://...` and `EXPO_PUBLIC_WS_URL` must be
`wss://...`.

## Shared Packages

- `@sequence/client-state` - redacted `GameSnapshotView`, stream reducers,
  route-screen selection, fixtures, and rule-violation messages shared with web.
- `@sequence/design-tokens` - shared light/dark palette and dimensions used by
  mobile theme code and generated web StyleX files.
- `@sequence/game-logic` - framework-free board metadata and rule types.

Do not import API server runtime, database code, DOM-only APIs, or Next.js code
into the mobile runtime.

## Testing

Mobile tests use Jest with `jest-expo` and live under
`apps/mobile/src/**/*.test.{ts,tsx}`. Keep tests outside `src/app`; Expo Router
can bundle route-local test files into Metro/export output.

Focused gates:

```bash
pnpm --filter @sequence/mobile test
pnpm --filter @sequence/mobile typecheck
pnpm --filter @sequence/mobile lint
pnpm --filter @sequence/mobile format
```

## Development Notes

- Route files live under `src/app` and are owned by Expo Router.
- Tests must stay outside the route tree, for example under `src/test` or a
  feature-local non-route folder, so Metro does not bundle test-only modules.
- Imports follow the repo convention: explicit `.ts` / `.tsx` extensions for
  relative imports and `import type` for type-only imports.
- Metro consumes `@sequence/game-logic`, `@sequence/client-state`,
  `@sequence/design-tokens`, and the type-only `AppRouter` contract from
  `@sequence/api` without a resolver shim.
- Dev-only routes and Expo/Argent tooling are excluded from release behavior;
  release audits live in the OAT implementation record.
