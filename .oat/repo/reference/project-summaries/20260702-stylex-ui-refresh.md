---
oat_status: complete
oat_ready_for: null
oat_blockers: []
oat_last_updated: 2026-07-02
oat_generated: true
oat_summary_last_task: prev1-t02
oat_summary_revision_count: 0
oat_summary_includes_revisions: []
---

# Summary: stylex-ui-refresh

## Overview

The web client styled the whole UI with Tailwind. To improve developer
experience, standardize on one styling system, and prepare for a future React
Native app (where Tailwind doesn't translate but StyleX, via React Strict DOM,
can), `apps/web` was migrated from Tailwind to **StyleX** — and the migration was
used as the moment to actually improve the UI rather than port it 1:1.

## What Was Implemented

- **Full Tailwind→StyleX migration** of `apps/web`: a StyleX build pipeline,
  design tokens (`defineVars`), light/dark themes (`createTheme`), and every page
  and component rewritten to `stylex.props`. Tailwind and its config are gone.
- **Dark mode**, shipped with the foundation: `prefers-color-scheme` defaults
  plus a manual toggle, persisted and synced across tabs and the playground's
  preview iframes.
- **Game board refresh:** an upright/rectangular board (dead space removed), an
  accessible **spotlight** for legal play targets (the rest of the board dims when
  a card is selected; replaces the old ring), circular chips, and an optional
  rotate-the-board control.
- **Dev playground tooling:** a device-viewport switcher (renders stories in an
  iframe at real device widths, auto-grows to content height, scales to fit, and
  rotates) and a per-component **Expand** overlay that maximizes one preview into
  the app layout for close inspection.
- **Production hardening (from final review):** the `/dev` playground had been
  leaking its Flight payload + chunks into production 404 responses; page-level
  `NODE_ENV` guards (plus a dev-only `generateMetadata`) now keep it fully out of
  the production bundle — `/dev*` return a generic 404, while `next dev` still
  serves it.

## Key Decisions

- **Big-bang migration** over incremental — no dual-system bridge period.
- **Babel + PostCSS StyleX pipeline** with `rootDir` reconstructed from
  `process.cwd()` — the workaround that makes StyleX resolve under Turbopack's
  virtualized `__dirname`. This forced `babel.config.js` (CommonJS) and removing
  `"type": "module"` from `apps/web`, because Next's Babel loader rejects
  `.cjs`/`.mjs` config.
- **Vitest StyleX stub** instead of running Babel in tests — uncompiled
  `defineVars` throws under jsdom, so `@stylexjs/stylex` is aliased to a no-op.
- **Spotlight gated on card selection** (`validTargets.length > 0`, which is only
  populated when a card is selected) — never an automatic "show all my plays".
- **Skip Storybook**; review via the `/dev` playground and the Orca CLI browser.

## Design Deltas

- **Highlight affordance evolved during review:** yellow → blue → green ring →
  **spotlight (dim-the-rest)**, after mocking options on the real board. The
  ghost-chip variant was tried and dropped.
- **"Fullscreen" became "Expand":** an OS Fullscreen API attempt (filled the
  whole monitor and the entire 3-board stack) was replaced by a per-component,
  in-app overlay that covers only the app layout.
- **Board rotation centering:** switched from `translate(-50%,-50%)` (which
  mis-centers a rotated element) to `inset:0 + margin:auto` + rotate-around-center.

## Notable Challenges

- **StyleX on Next 16 + Turbopack** was the core risk; resolution failures from
  `__dirname` virtualization were fixed via the `process.cwd()`-derived `rootDir`.
- **Expand + rotate + fit** took several iterations: preserving component state on
  expand (reposition the same surface, don't remount), keeping the top reachable
  (`safe center` + scroll), and stopping a rotated board from overflowing
  fixed-width preview wrappers (made the caps CSS vars the overlay lifts).

## Tradeoffs Made

- Unit tests don't assert StyleX output (the stub no-ops styling); acceptable
  because visual verification happens in the playground.
- Kept the Babel pipeline (with its `"type": "module"` / `rootDir` workarounds)
  rather than blocking on the faster `@stylexswc` compiler — deferred to a spike.

## Integration Notes

- Relative imports in `apps/web` keep explicit `.ts`/`.tsx` extensions and
  `import type` (`verbatimModuleSyntax` + native-Node API runtime); StyleX-resolved
  imports must not use `@` aliases under Turbopack.
- New styles go through `tokens.stylex.ts` / `themes.stylex.ts`; add color vars to
  both light and dark themes.

## Follow-up Items

- **`BL-260622-spike-stylex-swc-plugin`** — spike `@stylexswc` (Rust/SWC) to drop the Babel pipeline,
  restore `"type": "module"`, and remove the Turbopack `rootDir` workaround.
- React Strict DOM adoption to share styles with the future native app.

## Associated Issues

- Relates to `bl-d319` (dev UI playground) — extended here with viewport + Expand
  tooling. Spawned `BL-260622-spike-stylex-swc-plugin`.
