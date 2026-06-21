# @sequence/web

Next.js App Router client for Sequence Online. Inherits the root `AGENTS.md`;
this file adds only the web-specific delta.

## Commands

- `pnpm --filter @sequence/web dev` — dev server (start the API first)
- `pnpm --filter @sequence/web test` — Vitest component/unit tests
- `pnpm --filter @sequence/web e2e` — Playwright E2E (needs `DATABASE_URL_TEST`)
- `pnpm --filter @sequence/web build` / `pnpm --filter @sequence/web typecheck`

## Tests — three setups, picked by location + suffix

- **Component tests** — `src/**/*.test.tsx`, Vitest under **jsdom** with
  `vitest.setup.ts` (Testing Library matchers + `cleanup`). Automatic JSX
  runtime, so components don't need `import React`.
- **Logic/unit tests** — `src/**/*.test.ts`, Vitest (no DOM).
- **E2E** — `e2e/*.spec.ts` only, Playwright (`testDir: ./e2e`; the Vitest
  `include` deliberately excludes `e2e/`). Gated on `DATABASE_URL_TEST`; runs
  desktop Chromium and a 375px mobile profile.

A new end-to-end test MUST be `e2e/<flow>.spec.ts`: a `*.test.ts` placed in
`e2e/` is ignored by Playwright, and an e2e-style test under `src/` runs through
Vitest/jsdom (no browser) and fails.

## Conventions

- Import `AppRouter` from `@sequence/api` as a **type only** (`import type`).
  Never import API runtime values — no server code ships in the browser bundle.
- Leaf game UI components (`GameBoard`, `CardHand`, `PlayerRail`, `LobbyTeams`,
  `GameOver`, `HandoffScreen`) are prop-driven from the single `GameSnapshotView`
  shape; keep them usable from tests and future fixtures.
- The `@/` alias maps to `apps/web/src` (mirrors `tsconfig.json`).

## References

- `apps/web/README.md` — routes, responsibilities, testing
- `docs/architecture.md` — web boundary, tRPC split transport, UI state shape
- `docs/development.md` — Playwright setup and UI iteration
