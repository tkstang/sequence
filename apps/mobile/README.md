# `@sequence/mobile`

Expo SDK 57 iOS client for Sequence Online. The app consumes the existing
server-authoritative tRPC API and shared game-logic package; game rules,
persistence, auth, redaction, timers, and realtime behavior remain owned by
`@sequence/api`.

This workspace is early in the mobile MVP build. Full mobile documentation lands
in the hardening phase; for now, use this file as the package quick reference
and see [`../../docs/development.md`](../../docs/development.md) for repo-wide
local workflows.

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

## Development Notes

- Route files live under `src/app` and are owned by Expo Router.
- Tests must stay outside the route tree, for example under `src/test` or a
  feature-local non-route folder, so Metro does not bundle test-only modules.
- Imports follow the repo convention: explicit `.ts` / `.tsx` extensions for
  relative imports and `import type` for type-only imports.
- Metro has already proven it can consume `@sequence/game-logic` runtime exports
  and the type-only `AppRouter` contract from `@sequence/api` without a resolver
  shim; the temporary spike route was removed after that proof.
