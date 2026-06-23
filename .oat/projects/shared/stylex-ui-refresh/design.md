---
oat_status: complete
oat_ready_for: null
oat_blockers: []
oat_last_updated: 2026-06-22
oat_generated: true
---

# Design: stylex-ui-refresh

> Captured retroactively to reflect what was built. The forward-looking design
> notes written during the session live in
> `.superpowers/specs/2026-06-21-tailwind-to-stylex-design.md`; the morning
> review lives in `.superpowers/reviews/2026-06-22-tailwind-to-stylex-review.md`.

## Overview

The web client's styling moves from Tailwind's utility classes to **StyleX** —
typed, co-located, atomic styles compiled at build time. Design values become
**StyleX variables** (`defineVars`) grouped by concern (color, space, radius,
shadow, typography, z-index), and light/dark themes are **`createTheme`** token
overrides driven by `prefers-color-scheme` with a manual override. Tailwind, its
config, and its `@theme` block are removed entirely.

The migration is big-bang: every `apps/web` component is rewritten to
`stylex.create` + `stylex.props`. Alongside the mechanical conversion, the UI was
improved — most visibly the game board (upright/rectangular layout, a
"spotlight" play-target affordance, circular chips, an optional rotate control)
— and the dev `/dev` playground gained a viewport switcher and a per-component
Expand overlay so changes can be reviewed at real device sizes without Storybook.

The defining constraint was making StyleX's build-time compiler work under
**Next.js 16 + Turbopack**, whose `__dirname` virtualization breaks StyleX's
module resolution unless the `rootDir` is reconstructed from the real
`process.cwd()`.

## Architecture

### System Context

UI-only change inside `apps/web`. No change to `packages/api` (still the
authority for auth/persistence/validation/realtime) or `@sequence/game-logic`
(still framework-free). The board and hand components remain prop-driven from the
single `GameSnapshotView` shape, so they stay usable from tests and the
playground fixtures.

**Key Components:**

- **Build pipeline:** `babel.config.js` + `postcss.config.mjs` compile StyleX and
  emit atomic CSS in place of the `@stylex;` directive in `globals.css`.
- **Token + theme layer:** `styles/tokens.stylex.ts` (`defineVars`) and
  `styles/themes.stylex.ts` (`createTheme`), consumed by `ThemeProvider`.
- **Component layer:** every page/component under `apps/web/src` using
  `stylex.props`.
- **Dev playground:** `/dev` section pages + `_playground/*` (Stage, stories,
  ViewportPreview) + a chrome-less `/dev-frame/[section]` iframe target.
- **Test shim:** a no-op `@stylexjs/stylex` stub aliased in `vitest.config.ts`.

### Build pipeline (the central problem)

```
*.tsx (stylex.create/props)
   │  babel.config.js  → next/babel + @stylexjs/babel-plugin
   ▼      (dev, runtimeInjection:false, treeshakeCompensation:true,
          unstable_moduleResolution:{ type:'commonJS', rootDir })
postcss.config.mjs → @stylexjs/postcss-plugin (include src/**, useCSSLayers)
   │  replaces `@stylex;` in globals.css with generated atomic CSS
   ▼
atomic CSS + className/style props at runtime
```

**Design decisions:**

- **`babel.config.js` (CommonJS), not `.cjs`/`.mjs`:** Next's Babel loader
  rejects `.cjs`/`.mjs`. This forced removing `"type": "module"` from
  `apps/web/package.json`. PostCSS (ESM) bridges back to it via `createRequire`.
- **`rootDir` from `process.cwd()`:** Turbopack virtualizes `__dirname` to
  `/ROOT/*`, which made StyleX fail to resolve imported style files. Computing
  `rootDir` from the real `process.cwd()` (via a `findRepoRoot` walk) fixes
  resolution. This is the single most load-bearing workaround.
- **`useCSSLayers: true`** so the `@layer resets` base reset (in `globals.css`)
  is overridden by component styles deterministically.
- **No `@` path aliases in StyleX-resolved imports** (Turbopack + StyleX
  resolution); explicit relative `.ts`/`.tsx` extensions retained.

### Token + theme layer

- `tokens.stylex.ts` defines `defineVars` groups: `color`, `space`, `radius`,
  `shadow`, `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `zIndex`.
  `color` carries surfaces, text, team colors, badges, and a semantic
  `highlight` token with a built-in dark default.
- `themes.stylex.ts` exposes `lightTheme` / `darkTheme` as `createTheme(color, …)`
  overrides — every color var is listed in both.
- Dark mode is layered: `defineVars` carries a `@media (prefers-color-scheme:
  dark)` default, and `createTheme` provides an explicit manual override.

### Data Flow — theming

```
ThemeProvider (mode: light | dark | system)
  → reads/writes localStorage('sequence-theme')
  → applies lightTheme/darkTheme class (createTheme) on a wrapper
  → 'storage' event listener re-syncs across tabs AND the dev-frame iframes
useTheme() → returns FALLBACK_THEME when no provider (keeps tests/standalone safe)
```

## Component Design

### Theme system — `components/theme/`

- **`theme-provider.tsx`:** holds mode (`light`/`dark`/`system`), persists to
  `localStorage`, listens to `storage` for cross-context sync, applies the
  `createTheme` class. `useTheme()` returns a fallback when unprovided.
- **`theme-toggle.tsx`:** segmented control built on a `<fieldset>` (oxlint
  `prefer-tag-over-role` — no `role="group"`).

### Dev playground — `app/dev/` + `app/dev-frame/`

- **`ViewportPreview` (`_playground/viewport-preview.tsx`):** device switcher
  (Fit / Mobile / Mobile L / Tablet / Desktop). "Fit" renders the story inline;
  device presets render the story inside an **iframe** pointed at
  `/dev-frame/[section]` so CSS media queries respond to the *real* device width.
  The iframe is **auto-grown** to its content height (measured via
  `ResizeObserver`) to avoid clipping, then **scaled to fit** the panel width. A
  "Rotate" control swaps the device's width/height.
- **`/dev-frame/[section]` + `dev-frame/layout.tsx`:** a dev-only, chrome-less
  render target for the same section stories, used as the iframe `src`.
- **`Stage` (`_playground/stage.tsx`):** frames each preview variant on a
  production-faithful surface and provides a per-component **Expand** affordance.
  Expand turns the same surface into a fixed, in-app overlay (NOT the OS
  Fullscreen API) that covers the layout, with Close + Esc.
- **`overview.tsx` / section pages:** the section grid, reused for both the index
  and the iframe target.

**Expand overlay — key design decisions:**

- **Repositions the same surface** instead of re-rendering children in a separate
  node, so component state (e.g. board rotation) is *preserved* on expand.
- **`safe center` + scroll** so the top stays reachable when content is taller
  than the viewport.
- **Size caps are CSS variables.** The board's width cap and vertical reserve are
  `var(--board-max-width)` / `var(--board-reserve)`; the playground wrappers'
  width cap is `var(--preview-max, …)`. The overlay raises these so an expanded
  (and/or rotated) board grows to fill and stays centered, while still
  self-limiting via `94vw` + a viewport-height term.

### Game board — `app/game/[id]/components/GameBoard/`

- **Upright/rectangular layout (`GameBoard.utils.ts`, `BoardCell.tsx`):** all
  cells render upright (no per-row rotation); removing the rotated side rows makes
  the board rectangular and removes dead space. Card faces render contained.
- **Spotlight play targets (`GameBoard.tsx`, `BoardCell.tsx`):** when a hand card
  is selected, every non-target cell dims (`brightness` filter) and valid targets
  stay bright and lift — replacing the old ring. Gated strictly on
  `validTargets.length > 0`, which is populated only on card selection
  (`createTapSelection` returns null with no selected card) — so it never
  auto-reveals all plays.
- **Circular chips (`Chip.tsx`):** chips sized by width + `aspect-ratio: 1` so
  they stay circular on the (taller-than-wide) cells.
- **Optional rotate control (`GameBoard.tsx`):** a toolbar pill (off the board)
  cycles rotation by 90°. The rotated grid is centered with `inset: 0 +
  margin: auto` + rotate-around-center (NOT `translate(-50%,-50%)`, which
  mis-centers a rotated element).
- **Accessible highlight color:** the winning/selected accent uses the semantic
  `color.highlight` token (blue/green) instead of the prior low-contrast yellow.

## Testing Strategy

- **StyleX stub for Vitest:** uncompiled `defineVars` throws under jsdom, so
  `vitest.config.ts` aliases `@stylexjs/stylex` to `src/test/stylex-mock.ts`, a
  no-op implementing `create/props/defineVars/createTheme/keyframes/
  defineConsts/firstThatWorks`. Cheaper and more robust than running Babel in
  tests; the trade-off (styles aren't asserted in unit tests) is acceptable —
  visual review happens in the playground.
- **Existing component tests preserved** (`GameBoard.test.tsx` updated to scope
  the 100-cell count to the grid and assert the new Rotate control).
- **Gates:** `pnpm typecheck`, `lint`, `format:check`, `test`, `build`.
  Verified green; full suite 396/396 across api + game-logic + web.

## Deployment / Build Notes

- No infra change. Vercel build runs the same `pnpm build`; the StyleX PostCSS
  plugin emits CSS during the normal Next build.
- Removing `"type": "module"` from `apps/web` is required for the Next Babel
  loader; `postcss.config.mjs` stays ESM and bridges via `createRequire`.

## Risks and Mitigation

- **StyleX × Next 16 × Turbopack:** Medium likelihood / High impact.
  - **Mitigation:** foundation proven before mass conversion; `rootDir` computed
    from `process.cwd()`; Babel pipeline kept as the known-good baseline.
  - **Contingency:** `@stylexswc` spike (`bl-2ae1`) if the Babel pipeline becomes
    a drag.
- **Test runtime vs StyleX:** mitigated by the no-op stub alias.

## Open Questions

- **Compiler:** keep the Babel plugin or move to `@stylexswc`? Deferred to
  `bl-2ae1`.
- **Cross-platform:** adopt React Strict DOM when the native app starts.

## References

- Session design notes: `.superpowers/specs/2026-06-21-tailwind-to-stylex-design.md`
- Session review: `.superpowers/reviews/2026-06-22-tailwind-to-stylex-review.md`
- Discovery: `discovery.md` · Implementation: `implementation.md`
- Backlog: `bl-2ae1` (stylex-swc spike), `bl-d319` (dev playground)
