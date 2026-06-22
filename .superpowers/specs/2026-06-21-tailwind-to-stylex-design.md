# Design Spec — Migrate `apps/web` from Tailwind v4 to StyleX (+ visual refresh, dark mode)

- **Date:** 2026-06-21
- **Branch:** `stylex`
- **Author:** Claude (autonomous overnight run, for AM review by Thomas)
- **Status:** Approved-to-execute (user delegated autonomy; review in the morning)

## 1. Motivation

Ranked drivers from the user: **(A) developer experience**, **(C) standardization /
preference**, **(B) scaling / output**. A late, decisive addition: **a React Native
app is on the roadmap.**

Honest framing: at today's scale (~36 styled files, no `clsx`/`cva` class-soup,
Tailwind v4 already giving tokens + co-location) the *pure-engineering* ROI of a
swap is modest. The decision is justified by **preference + the cross-platform
roadmap**, where StyleX is meaningfully better positioned than Tailwind:

- **Tailwind → React Native** means adopting **NativeWind**, a *separate* library
  with its own runtime/config that only resembles Tailwind. Two systems, two mental
  models, drift over time.
- **StyleX** is Meta's cross-platform styling foundation (API modeled on RN's
  `StyleSheet`). Via **React Strict DOM (RSD)** — "RSD standardizes the development
  of styled React components for web and native" — design tokens and the styling
  model become shareable across web + Expo/RN. RSD's styling layer is StyleX-powered.

Caveats accepted: RSD is **pre-1.0** (~0.0.54); StyleX alone does not render to RN —
cross-platform reuse flows *through* RSD. If the RN app ends up a separate UI, the
shared win narrows to **shared tokens + shared mental model** (still > Tailwind).

**Decision implication:** Do the plain-StyleX web migration now (a strict
prerequisite either way, lower risk). Keep tokens framework-agnostic so a future
RN/RSD app can consume/mirror them. Leave "adopt RSD from the start vs. StyleX-now /
RSD-later" as a flagged AM decision.

## 2. Scope

**In scope**
- Big-bang removal of Tailwind v4 from `apps/web`; StyleX as the sole styling system.
- A portable StyleX token system (colors, spacing, radii, shadows, typography, z).
- **Dark mode** (new): system-preference automatic + a manual toggle in the header.
- An **opinionated visual refresh** during conversion (latitude to go bolder where it
  clearly helps), using the `/dev` playground as the review surface.
- Convert all 36 styled source files; update the 1 class-asserting test + any tests
  broken by render changes.

**Out of scope (now)**
- Adopting React Strict DOM for the web app (flagged decision).
- Extracting tokens into a shared monorepo package (documented future step; YAGNI
  until the RN app exists).
- Any `packages/api` / `packages/game-logic` changes (game-logic stays framework-free).
- New features or routing changes.

## 3. Strategy — big-bang, gated

The risk is concentrated in **build setup** (StyleX on Next 16 + Turbopack is new),
not in per-file conversion. So we **prove the foundation on a vertical slice before
bulk work**:

1. **Foundation** (sequential, by orchestrator): install StyleX, add Babel + PostCSS
   config, rewrite `globals.css`, remove Tailwind, build the token + theming system,
   convert `Button` as a representative slice.
2. **Hard build gate**: `pnpm install`, `typecheck`, `build`, and `next dev` must all
   succeed and the `/dev` playground must render with StyleX classes applied. If this
   fails after the documented setup + webpack fallback, **stop and reassess** rather
   than converting 36 files on a broken base.
3. **Visual audit**: open `/dev` routes via the **orca CLI** browser, capture current
   state, produce a concrete punch list.
4. **Bulk conversion** (dynamic workflow, parallel subagents): one file per agent,
   pipeline `convert → self-check`. Files are independent (they import token modules,
   not each other's styles), so parallelism is safe without worktrees.
5. **Verify**: full gates + repair loop.
6. **Visual review**: re-open `/dev` via orca CLI, before/after, iterate / go bolder.
7. **Wrap-up**: incremental commits on `stylex`, AM summary with screenshots + flagged
   decisions.

## 4. Build setup (to verify at the gate)

Per StyleX's official Next.js guide (works with Webpack **and** Turbopack since Next
16.0.3; repo is on 16.2.9):

- Add dev deps: `@stylexjs/stylex` (runtime), `@stylexjs/babel-plugin`,
  `@stylexjs/postcss-plugin`, `autoprefixer`.
- Remove: `tailwindcss`, `@tailwindcss/postcss`, and `@import 'tailwindcss'`.
- **`babel.config.cjs`** (CommonJS — `apps/web` is `"type": "module"`, so `.cjs` is
  required for `module.exports`/`require`): `presets: ['next/babel']`, plugin
  `@stylexjs/babel-plugin` with `dev`, `runtimeInjection: false`,
  `treeshakeCompensation: true`, `unstable_moduleResolution: { type: 'commonJS' }`,
  and `aliases: { '@/*': [path.join(__dirname, 'src', '*')] }` (this repo's `@/`
  maps to `apps/web/src`, not the project root).
- **`postcss.config.cjs`**: `@stylexjs/postcss-plugin` with `include`
  globs over `src/**`, `babelConfig` referencing the babel plugins,
  `useCSSLayers: true`; plus `autoprefixer`. Replaces `postcss.config.mjs`.
- **`globals.css`**: a `@layer resets { … }` block + `@stylex;` (replaces
  `@import 'tailwindcss'` and the `@theme` block; tokens move to `tokens.stylex.ts`).

**Open question resolved at the gate:** whether adding a Next-consumed Babel config
forces the webpack pipeline. Documented expectation is Turbopack-compatible.
**Fallback if not:** add `--webpack` to `dev`/`build` scripts (Next 16 supports
opting back to webpack). Either outcome is acceptable and will be documented.

## 5. Token + theming system

`src/styles/tokens.stylex.ts` — framework-agnostic, semantic, RN/RSD-portable. Built
with `stylex.defineVars`. Carries forward the current palette and extends it:

- **Brand/surface:** slate `#2d3142` (+ `slateSoft #3a3f54`), felt `#2e7d4f`
  (+ `feltDark #1f5c39`), cream `#f6f3ee`.
- **Teams:** blue `#3a6ea5`, green `#2e9e5b`, red `#c0453c`.
- **Status badges:** frozen bg/fg, saved bg/fg.
- **New semantic layer:** `bg`, `surface`, `surfaceRaised`, `text`, `textMuted`,
  `border`, `accent`, `danger`, `focusRing` — defined as `{ default, [DARK]: … }`
  so they respond to `@media (prefers-color-scheme: dark)` automatically.
- **Scales (new):** spacing, radii, shadow, fontSize/weight/lineHeight, z-index —
  replacing ad-hoc Tailwind utilities with a consistent, reviewable system.

**Dark mode:** two layers — (1) automatic via `@media (prefers-color-scheme: dark)`
in the semantic vars; (2) a **manual override** via `stylex.createTheme` applied on a
wrapper (`<html>`/root) by a small client `ThemeProvider` (`light` | `dark` |
`system`), persisted to `localStorage`, with a toggle in the app header. Requires
`unstable_moduleResolution` (already set).

## 6. Visual refresh

Treat conversion as a polish pass within the slate/felt/cream identity; go bolder
where it clearly helps (per user latitude). Targets: spacing/rhythm consistency,
type hierarchy, contrast (incl. dark mode), focus states, primitive consistency
(Button/Badge/Card), and the heavier game surfaces (board, hand, rail, lobby,
handoff, game-over). The `/dev` playground (`/dev`, `/dev/primitives`, `/dev/board`,
`/dev/hand`, `/dev/player-rail`, `/dev/lobby`, `/dev/handoff`, `/dev/game-over`) is
the audit + before/after review surface, driven through the orca CLI browser.

Component variant patterns (e.g. `Button` `variant`/`size`) convert to StyleX style
maps composed via `stylex.props(styles.base, styles[variant], styles[size])` —
preserving each component's public props API so consumers and tests are unaffected.

## 7. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| StyleX + Next 16 + Turbopack setup friction | Vertical-slice **build gate** before bulk; documented `--webpack` fallback. |
| Babel config in an ESM package | Use `.cjs` config files; verified at gate. |
| Tests asserting class names break | Only `game/[id]/page.test.tsx` asserts classes; rewrite to behavior/role assertions. Re-run full suite in verify phase. |
| Parallel agents conflict on shared files | Tokens/config authored once up front; conversion agents each own one file. No worktrees needed. |
| Visual regressions | orca CLI before/after screenshots on every `/dev` route; AM review. |
| `oxfmt`/`oxlint` on generated config | Run `format`/`lint` in verify loop and auto-fix. |
| RSD pre-1.0 uncertainty | Not adopted now; tokens kept portable; decision flagged for AM. |

## 8. Verification plan

Green required on: `pnpm -r typecheck`, `pnpm lint` (oxlint),
`pnpm format:check` (oxfmt), `node scripts/run-tests.mjs`, `pnpm -r build`. Plus:
`next dev` boots and all `/dev` routes render in light **and** dark via orca CLI,
captured as before/after evidence. E2E (`pnpm --filter @sequence/web e2e`) only if
`DATABASE_URL_TEST` is available; otherwise noted as not-run.

## 9. Deliverables for AM review

- All gates green (or explicitly noted exceptions).
- Incremental commits on `stylex` with a clear narrative.
- Before/after screenshots of every `/dev` route, light + dark.
- This spec + a concise AM summary: decisions made, what to look at, and flagged
  open questions (chiefly **RSD-now vs StyleX-now/RSD-later** and how bold the visual
  refresh should ultimately go).
