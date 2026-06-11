# Sequence Rewrite Log

## Purpose
- Track decisions, progress, and follow-ups while modernizing the Sequence web app.
- Mirror and extend the high-level migration plan in `sequence-rewrite-plan.md` with day-to-day notes.

## Target Stack (initial checkpoints)
- Node.js 24.x (Current) noted in `.nvmrc` and `package.json` engines; confirm deployment targets stay compatible once LTS lands.
- Next.js 15.5 (App Router-first) with `/app` as the primary surface.
- React 19, React DOM 19, and Server Components where appropriate.
- TypeScript 5.9 in strict mode with incremental build.
- ESLint 9 (flat config) with TypeScript + React rules.
- Panda CSS (per https://panda-css.com/llms.txt) via `@pandacss/dev` codegen + cssgen outputs.
- Firebase JS SDK 12 (modular) and Admin SDK 13+.
- Vitest + Playwright for tests; GitHub Actions for CI (to be set up later).
- Package management via pnpm 10.17 (`packageManager` field).

## Work Log
### 2025-09-21 — Kickoff
- Reviewed existing stack and long-term rewrite plan (`sequence-rewrite-plan.md`).
- Agreed on the target toolchain listed above.
- Prepared to align the repository scaffolding with the new stack (TypeScript, App Router, Panda CSS, upgraded dependencies).

### 2025-09-21 — Modern stack scaffolding
- Bumped runtime metadata to Node 22 via `.nvmrc` and `package.json#engines`.
- Replaced dependency manifest with Next 15.5 / React 19 / TypeScript 5.9 baseline plus Panda CSS, Vitest, Playwright, and ESLint 9.
- Added TypeScript configuration (`tsconfig.json`, `next-env.d.ts`) and an App Router shell in `/app`.
- Introduced Panda CSS config stub, ESLint flat config, and ignored generated `styled-system/` artifacts.

### 2025-09-21 — Tooling alignment
- Switched package management to pnpm 10.17 (`package.json#packageManager`) and removed the legacy `package-lock.json`.
- Dropped obsolete Babel and legacy ESLint configs (`.babelrc`, `.eslintrc`) now that Next.js and the flat config cover the build.
- Noted future preference for Zustand v5 if additional client-side state management becomes necessary.

### 2025-09-21 — Dependency corrections
- Removed the invalid `@pandacss/styled-system` entry; Panda's CLI generates runtime artifacts in `styled-system/`.
- Reminder logged to keep Node runtime aligned with the declared engines during installs.

### 2025-09-21 — Panda package cleanup
- Trimmed Panda dependencies to the supported CLI package (`@pandacss/dev`) per official install docs.
- Deferred eslint plugin evaluation until styling migration is underway.

### 2025-09-22 — Dependency updates & Panda generation
- Adopted the latest stable releases for core packages (Next 15.5.3, React 19.1.1, Firebase 12.3, ESLint 9.36, Vitest 3.2, etc.) and moved engines/`.nvmrc` to Node 24.x.
- Ran `pnpm exec panda codegen` + `pnpm exec panda cssgen` after `pnpm panda init -p` to emit the Panda runtime and `styled-system/styles.css`, and wired the stylesheet into `app/layout.tsx`.
- Captured the dependency state in `pnpm-lock.yaml` for reproducible installs.

### 2025-09-22 — Dev server validation & TS config polish
- Verified `pnpm dev` locally (user environment) — Next.js boots successfully once Panda CSS assets are present.
- Removed the redundant `jsconfig.json`; path aliases now live solely in `tsconfig.json`.
- Reordered `tsconfig.json#include` to prioritize `next-env.d.ts` and kept JS support during migration; follow-up to disable `allowJs` once legacy modules are ported.

## Backlog (initial slices)
- [x] Update runtime metadata to modern Node (22 initially, now 24.x).
- [x] Replace legacy dependencies with modern stack (Next 15.5, React 19, Firebase 12, etc.).
- [x] Add TypeScript configuration (`tsconfig.json`, `next-env.d.ts`) with strict settings.
- [x] Bootstrap App Router entry point (`app/layout.tsx`, `app/page.tsx`) and transitional routing strategy.
- [ ] Integrate Panda CSS tokens/recipes throughout UI (migrate off styled-components).
- [x] Configure ESLint 9 flat config + Prettier strategy.
- [ ] Plan Firestore data layer updates (transactions, validation helpers) in TypeScript.
- [ ] Determine migration path for existing `pages/` routes and `styled-components` legacy code.
- [x] Generate `pnpm-lock.yaml` under pnpm 10.17.
- [ ] Stand up Vitest + Playwright harnesses and wire CI workflow.
- [ ] Evaluate adopting Zustand v5 if/when global client state requirements emerge.
- [ ] Disable `compilerOptions.allowJs` once remaining JS modules are migrated.

## Next Actions
- Decide on Panda codegen workflow for dev (e.g., run `pnpm panda` before commits, consider a watch step) and begin migrating styled-components modules to Panda recipes.
- Audit legacy `pages/` routes and plan their move into the App Router.
- Start porting `utils/game.js` (and related logic) to strict TypeScript with unit coverage.

## Open Questions
- Preferred approach for handling existing live games during migration (maintenance window vs. parallel deploy).
- Hosting targets (Vercel + Firebase) and deployment strategy for the rewrite branch.
- Confirm Node 24.x compatibility with deployment environments or identify fallback plan before LTS cutover.

