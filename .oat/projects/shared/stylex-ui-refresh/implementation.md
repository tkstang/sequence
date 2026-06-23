---
oat_status: complete
oat_ready_for: null
oat_blockers: []
oat_last_updated: 2026-06-22
oat_current_task_id: null
oat_generated: true
---

# Implementation: stylex-ui-refresh

**Started:** 2026-06-21
**Last Updated:** 2026-06-22

> Captured retroactively (`oat-project-capture`) from the `stylex` branch
> (16 commits beyond `main`; 58 files, +5207/-854). Tasks group related commits;
> the referenced SHA is the latest in each group.

## Progress Overview

| Phase                                   | Status   | Tasks | Completed |
| --------------------------------------- | -------- | ----- | --------- |
| Phase 1 — StyleX foundation & migration | complete | 3     | 3/3       |
| Phase 2 — Game board visual refresh     | complete | 6     | 6/6       |
| Phase 3 — Dev playground viewport tools | complete | 5     | 5/5       |

**Total:** 14/14 tasks completed

---

## Phase 1: StyleX foundation & full migration

**Status:** complete

### Phase Summary

**Outcome (what changed):**

- Tailwind fully removed; the entire `apps/web` UI renders via StyleX.
- Design tokens + light/dark theming established; dark mode shipped.
- StyleX compiles cleanly under Next 16 + Turbopack; tests run via a StyleX stub.

**Key files touched:** `babel.config.js`, `postcss.config.mjs`,
`styles/tokens.stylex.ts`, `styles/themes.stylex.ts`, `components/theme/*`,
`globals.css`, `vitest.config.ts`, `src/test/stylex-mock.ts`, ~40 components.

**Verification:** `pnpm typecheck`, `lint`, `format:check`, `test`, `build` — all
green; full suite 396/396.

### Task p01-t01: StyleX foundation — tokens, theming, build pipeline

**Status:** completed
**Commit:** 138e748

**Outcome:**

- Added the StyleX build pipeline: `babel.config.js` (CommonJS, `next/babel` +
  `@stylexjs/babel-plugin`, `unstable_moduleResolution` with `rootDir` derived
  from `process.cwd()`) and `postcss.config.mjs` (`@stylexjs/postcss-plugin`,
  CSS layers).
- Introduced `tokens.stylex.ts` (`defineVars` groups) and `themes.stylex.ts`
  (`createTheme` light/dark); `globals.css` reduced to a layered reset + `@stylex;`.
- Added the Vitest StyleX no-op stub + alias so tests survive uncompiled
  `defineVars`.

**Files changed:** `apps/web/babel.config.js`, `apps/web/postcss.config.mjs`,
`apps/web/package.json` (drop `"type": "module"`, swap deps),
`apps/web/src/styles/tokens.stylex.ts`, `apps/web/src/styles/themes.stylex.ts`,
`apps/web/src/test/stylex-mock.ts`, `apps/web/vitest.config.ts`,
`apps/web/src/app/globals.css`.

**Notes:** The `rootDir`-from-`process.cwd()` workaround for Turbopack's
`__dirname` virtualization was the key unblocker for the whole migration.

### Task p01-t02: Convert all components to StyleX + dark mode + polish

**Status:** completed
**Commit:** 4c6196d

**Outcome:**

- Rewrote every page and component under `apps/web/src` from Tailwind classes to
  `stylex.create`/`stylex.props`.
- Added `ThemeProvider` + `theme-toggle` (segmented `<fieldset>`), with
  localStorage persistence and cross-tab/iframe `storage` sync.
- Applied first-pass visual polish across chrome (header, cards, badges, buttons,
  lobby, rail, game-over, handoff, toasts).

**Files changed:** ~40 files incl. `app/layout.tsx`, `components/*` (button,
card, badge, app-header, authenticated-header), all route views (create,
dashboard, history, join, login, signup, page), and `game/[id]/components/*`.

**Verification:** `pnpm test` green after adding the StyleX stub.

### Task p01-t03: Migration review docs

**Status:** completed
**Commit:** 41f2000 (also 3574a0b)

**Outcome:**

- Wrote the morning review summary and stamped the full-suite result (396/396)
  for the Tailwind→StyleX migration.

**Files changed:**
`.superpowers/specs/2026-06-21-tailwind-to-stylex-design.md`,
`.superpowers/reviews/2026-06-22-tailwind-to-stylex-review.md`.

---

## Phase 2: Game board visual refresh

**Status:** complete

### Phase Summary

**Outcome:** Board became upright/rectangular (less dead space), gained an
accessible "spotlight" play-target affordance (replacing the ring), circular
chips, an optional rotate control, and a fixed list-marker regression.

**Key files:** `GameBoard.tsx`, `GameBoard.utils.ts`, `GameBoard.test.tsx`,
`components/BoardCell.tsx`, `components/Chip.tsx`, `components/SequenceChoice.tsx`,
`globals.css`.

### Task p02-t01: Upright board cards + blue highlight

**Status:** completed
**Commit:** 627c9a1

**Outcome:**

- All cells render upright (removed per-row rotation); the board is now
  rectangular with the dead space removed.
- Replaced the low-contrast yellow highlight with an accessible blue/`highlight`
  token.

**Files changed:** `GameBoard.tsx`, `GameBoard.utils.ts`, `BoardCell.tsx`,
`Chip.tsx`, `SequenceChoice.tsx`.

### Task p02-t02: Green highlight + Desktop scale-to-fit

**Status:** completed
**Commit:** 3bef30c

**Outcome:**

- Moved the valid-target highlight to green (matching the selected-card ring) for
  legibility on a busy board.
- Scaled the Desktop viewport preview to fit (precursor to the later spotlight
  and viewport work; cross-cuts Phase 3).

**Files changed:** `BoardCell.tsx`, `Chip.tsx`, `SequenceChoice.tsx`,
`_playground/viewport-preview.tsx`.

### Task p02-t03: Restore list-style reset

**Status:** completed
**Commit:** 373e47a

**Outcome:**

- Restored `ol, ul { list-style: none }` in the layered reset — lists had begun
  showing default markers after Tailwind's preflight was removed.

**Files changed:** `apps/web/src/app/globals.css`.

### Task p02-t04: Optional rotate-board control

**Status:** completed
**Commit:** 8dc10da

**Outcome:**

- Added an optional control to rotate the board 90° (turn it like a table); the
  control sits in a toolbar off the board. Updated `GameBoard.test.tsx` to scope
  the 100-cell assertion to the grid and assert the new control.

**Files changed:** `GameBoard.tsx`, `GameBoard.test.tsx`.

### Task p02-t05: Spotlight valid play targets

**Status:** completed
**Commit:** aa04cba

**Outcome:**

- Replaced the ring with a spotlight: on card selection, non-target cells dim and
  valid targets stay bright and lift.
- Gated on `validTargets.length > 0` (only populated by a selected card), so it
  never auto-reveals all plays.

**Files changed:** `GameBoard.tsx`, `BoardCell.tsx`.

### Task p02-t06: Rotated board centers + fits when expanded

**Status:** completed
**Commit:** 929bc1e

**Outcome:**

- Fixed rotated-board centering: `inset:0 + margin:auto` + rotate-around-center
  (the old `translate(-50%,-50%)` mis-centered a rotated element).
- Made playground preview-wrapper width caps a CSS var (`--preview-max`) so the
  Expand overlay can let a rotated board fill and center (cross-cuts Phase 3).

**Files changed:** `GameBoard.tsx`, `_playground/stories.tsx`,
`_playground/stage.tsx`.

---

## Phase 3: Dev playground viewport & Expand tooling

**Status:** complete

### Phase Summary

**Outcome:** The `/dev` playground gained a device-viewport switcher (iframe at
real device widths, auto-height, scale-to-fit, rotate) and a per-component
Expand overlay that maximizes a single preview into the layout (replacing an OS
fullscreen attempt), preserving component state.

**Key files:** `_playground/viewport-preview.tsx`, `_playground/overview.tsx`,
`_playground/stage.tsx`, `dev-frame/[section]/page.tsx`, `dev-frame/layout.tsx`,
`dev/page.tsx`, `dev/[section]/page.tsx`, `dev/layout.tsx`.

### Task p03-t01: Viewport switcher in the playground

**Status:** completed
**Commit:** f8bd82c

**Outcome:**

- Added a viewport switcher that renders stories inside an iframe at a chosen
  device width so media queries respond correctly.

**Files changed:** `_playground/viewport-preview.tsx`, `dev` routes.

### Task p03-t02: Index preview, more presets, rotate

**Status:** completed
**Commit:** b8d81c3

**Outcome:**

- Added an index preview, more device presets, and a rotate (width/height swap)
  control; extracted the section grid (`overview.tsx`) and the chrome-less
  `/dev-frame/[section]` iframe target.

**Files changed:** `_playground/viewport-preview.tsx`, `_playground/overview.tsx`,
`dev-frame/[section]/page.tsx`, `dev-frame/layout.tsx`, `dev/page.tsx`.

### Task p03-t03: Fullscreen button + auto-height + taller Desktop

**Status:** completed
**Commit:** 353b03a

**Outcome:**

- Auto-grew the preview iframe to its content height (no clipping), bumped the
  Desktop preset taller, and added a (later-revised) fullscreen control.

**Files changed:** `_playground/viewport-preview.tsx`.

### Task p03-t04: Per-board Expand overlay (replaces OS fullscreen)

**Status:** completed
**Commit:** aedd033

**Outcome:**

- Replaced the OS Fullscreen API (whole-stack, monitor-filling) with a per-Stage
  Expand overlay that covers the app layout; the board grows via CSS-var caps
  (`--board-max-width`, `--board-reserve`).

**Files changed:** `_playground/stage.tsx`, `_playground/viewport-preview.tsx`,
`GameBoard.tsx`.

### Task p03-t05: Expand keeps board mounted + reachable top

**Status:** completed
**Commit:** daa4ec2

**Outcome:**

- Reworked Expand to reposition the same surface (children stay mounted, so board
  rotation is preserved) and use `safe center` + scroll so the top stays
  reachable.

**Files changed:** `_playground/stage.tsx`.

---

## Test Results

| Scope                         | Result                                          |
| ----------------------------- | ----------------------------------------------- |
| Full suite `pnpm test`        | 396/396 tests, 60/60 files (api+game-logic+web) |
| Web tests (final spotlight)   | 103/103, 23 files                               |
| typecheck / lint / format     | clean                                           |
| `pnpm build` (web)            | compiles under Next 16 + Turbopack              |

## Final Summary (for PR/docs)

**What shipped:**

- Full Tailwind→StyleX migration of `apps/web` (tokens, themes, every component).
- Light + dark theming with a toggle and cross-tab/iframe sync.
- A working StyleX build pipeline on Next 16 + Turbopack.
- Game board visual refresh: upright/rectangular layout, accessible spotlight
  play targets, circular chips, optional rotate control.
- Dev playground tooling: device-viewport switcher (iframe, auto-height,
  scale-to-fit, rotate) and a per-component Expand overlay.

**Behavioral changes (user-facing):**

- App supports light/dark; board reads more clearly; selecting a card spotlights
  its legal targets (only on selection); `/dev` can preview at device sizes and
  expand any component.

**Key files / modules:**

- `apps/web/babel.config.js`, `apps/web/postcss.config.mjs` — StyleX pipeline.
- `apps/web/src/styles/tokens.stylex.ts`, `themes.stylex.ts` — tokens/themes.
- `apps/web/src/components/theme/*` — theming runtime.
- `apps/web/src/app/dev/_playground/*`, `app/dev-frame/*` — playground tooling.
- `apps/web/src/app/game/[id]/components/GameBoard/*` — board refresh.

**Verification performed:** `pnpm typecheck`, `lint`, `format:check`, `test`
(396/396), `build`; live review via the Orca CLI browser at multiple viewports.

**Follow-ups:**

- `bl-2ae1` — spike `@stylexswc` to drop the Babel pipeline (added in this branch,
  commit 16d4603).

## References

- Plan: `plan.md` · Design: `design.md` · Discovery: `discovery.md`
- Session notes: `.superpowers/specs/2026-06-21-tailwind-to-stylex-design.md`,
  `.superpowers/reviews/2026-06-22-tailwind-to-stylex-review.md`
