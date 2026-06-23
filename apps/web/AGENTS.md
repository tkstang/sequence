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

## Styling

- The UI is styled with **StyleX** (`stylex.create` + `stylex.props`) — no
  Tailwind. Design tokens and light/dark themes live in `src/styles/`
  (`tokens.stylex.ts`, `themes.stylex.ts`); dark mode is handled in
  `components/theme/`. Pull values from the tokens and add new colors to both
  themes.
- Vitest aliases `@stylexjs/stylex` to a no-op stub (`src/test/stylex-mock.ts`),
  so component tests render without real styles — verify visuals in `/dev`.
- StyleX compiles via `babel.config.js` + `postcss.config.mjs`; this is why
  `package.json` does not set `"type": "module"`. See `docs/styling.md`.

## Dev playground

- `/dev` is a dev-only component playground (section stories, viewport switcher,
  per-component Expand) with a chrome-less `/dev-frame/[section]` iframe target,
  under `src/app/dev/` and `src/app/dev-frame/`. Development-only; don't link it
  from the shipped app. See `docs/development.md`.

## References

- `apps/web/README.md` — routes, responsibilities, testing
- `docs/architecture.md` — web boundary, tRPC split transport, UI state shape
- `docs/styling.md` — StyleX tokens, themes, dark mode, and build pipeline
- `docs/development.md` — Playwright setup, the `/dev` playground, and UI iteration
