---
id: BL-260621-migrate-to-absolute-path-alias
title: Migrate to absolute path-alias imports (drop relative paths and file
  extensions)
status: open
priority: medium
scope: task
scope_estimate: M
labels:
  - dx
  - build
  - api
  - game-logic
  - tech-debt
assignee: null
created: 2026-06-21T17:51:08.000Z
updated: 2026-06-21T17:51:08.000Z
associated_issues: []
legacy_id: bl-3fcf
---

## Description

Move the codebase to **absolute path-alias imports** and drop relative paths and
file extensions, e.g. `import { games } from '@db/schema/games'` instead of
`import { games } from '../../db/schema/games.ts'`.

**Why it is not a simple find-and-replace.** Relative imports currently carry
explicit `.ts`/`.tsx` extensions — 332/332 relative imports in `packages/api` +
`packages/game-logic` (0 without), plus 83 relative + 44 `@/`-alias imports in
`apps/web`. The extensions are **load-bearing**: the API runs `.ts` files
directly via `node --experimental-transform-types` (the `dev` and `start`
scripts, and the production `Dockerfile` `CMD`), and native Node ESM resolves
literal file paths — it does no extension guessing and does **not** understand
tsconfig `paths` aliases. So both the extensions and the absence of `@` aliases
at runtime are consequences of the deliberate zero-dependency, no-build,
native-Node runtime. `tsc-alias` specifically rewrites *emitted* JS, so it
presupposes adopting a build step the API does not have today (typecheck
currently uses `tsgo --noEmit`).

**Decision required (the real fork)** — absolute `@`-aliases do not resolve under
native Node, so this requires choosing a runtime/build model:

1. **(Recommended) Swap the API + game-logic execution to `tsx`** (`dev`,
   `start`, and `Dockerfile`). `tsx` resolves tsconfig `paths`, so `@db/*` works
   and extensions become optional. No build step; adds esbuild/`tsx` as a
   production dependency.
2. **Build step + `tsc-alias`.** Write `@db/*`, emit JS (add a real `tsc`/tsgo
   emit), let `tsc-alias` rewrite aliases → relative in the emitted JS, run
   `node dist/server.js`. Keeps prod free of a TS runtime dep but adds a full
   build pipeline.
3. **Node-native subpath imports (`#db/*`).** Use the package.json `imports` map
   per package — zero new deps, no build, fully native, but the sigil must be
   `#`, not `@`.

Trade axis: option 1 adds a runtime dependency, option 2 adds a build step,
option 3 keeps the native runtime but uses `#` instead of `@`.

**Until this lands**, agents must follow the current convention (explicit
`.ts`/`.tsx` extensions on relative imports; `verbatimModuleSyntax` also requires
`import type` for type-only imports). That convention is documented in the root
`AGENTS.md` so this stays a deliberate, tracked migration rather than silent
drift.

Evidence: `tsconfig.base.json:10-11` (`allowImportingTsExtensions`,
`verbatimModuleSyntax`); `packages/api/package.json:14-15`
(`node --experimental-transform-types` run scripts); `packages/api/Dockerfile`
(`CMD` runs `@sequence/api start`).

## Acceptance Criteria

- A runtime/build model is chosen and recorded (tsx vs `tsc-alias`-build vs
  native `#`-imports), with the trade-off rationale captured.
- An absolute alias map (e.g. `@db/*`, `@game/*`, `@web/*` / consolidate the
  existing `@/*`) is defined once and resolves consistently across **every**
  consumer: the chosen API/game-logic runtime, `apps/web` (Next), and Vitest
  (`resolve.alias`).
- All relative imports are converted to absolute aliases and file extensions are
  removed (codemod across ~415 imports), with no remaining `../`/`./` relative
  imports in `apps`/`packages` source.
- `packages/api/package.json` scripts and `packages/api/Dockerfile` are updated
  for the chosen runtime, and the production container boots and passes
  `GET /health`.
- All gates pass: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`,
  `pnpm test`, `pnpm build`, plus `pnpm --filter @sequence/web e2e` against a
  test database.
- The root `AGENTS.md` import-convention note is updated (or removed) to reflect
  the new alias style once the migration is complete.
