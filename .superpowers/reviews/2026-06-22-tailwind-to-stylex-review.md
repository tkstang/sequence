# Tailwind → StyleX Migration — Morning Review

- **Date:** 2026-06-22 (overnight autonomous run)
- **Branch:** `stylex` (3 commits ahead of `main`)
- **Spec:** [.superpowers/specs/2026-06-21-tailwind-to-stylex-design.md](../specs/2026-06-21-tailwind-to-stylex-design.md)
- **Screenshots:** `.superpowers/reviews/screenshots/` — `before-*` (original Tailwind),
  `light-*` and `dark-*` (new StyleX), for all 8 `/dev` routes.

## TL;DR

`apps/web` is fully migrated from Tailwind v4 to StyleX, **dark mode added**, all
quality gates green. The light-mode look is intentionally faithful to the
original (no visual regression — see the before/after pairs); dark mode is net
new; polish was kept conservative and consistent. A few **decisions are left for
you** (below) — chiefly how bold to go on visuals and the React Native / React
Strict DOM path.

## Gates

| Gate | Result |
| --- | --- |
| `pnpm -r typecheck` (tsgo) | ✅ pass |
| `pnpm lint` (oxlint) | ✅ pass (only pre-existing warnings in api/game-logic) |
| `pnpm format:check` (oxfmt) | ✅ pass |
| `pnpm --filter @sequence/web build` (Next 16 + Turbopack) | ✅ pass |
| Web tests (vitest) | ✅ 103/103 (23 files) |
| Full suite `pnpm test` | ✅ 396/396 tests, 60/60 files (api + game-logic + web) |

## What shipped

**Foundation (commit `138e748`)**
- Removed `tailwindcss` + `@tailwindcss/postcss`; added `@stylexjs/{stylex,
  babel-plugin,postcss-plugin}` + `autoprefixer`.
- `babel.config.js` + `postcss.config.mjs` wired for Next 16 + Turbopack.
- Portable token system `src/styles/tokens.stylex.ts` (color/space/radius/shadow/
  fontFamily/fontSize/fontWeight/lineHeight/zIndex) — semantic, framework-free,
  RN-portable. Colors carry light + `prefers-color-scheme: dark` values.
- `src/styles/themes.stylex.ts` — explicit light/dark `createTheme` for the manual
  toggle.
- `ThemeProvider` + segmented `ThemeToggle` (light / system / dark, persisted to
  localStorage; "system" honors OS, the toggle overrides it).
- `globals.css` reduced to a reset + `@stylex;`; root layout styled via tokens.

**Conversion + polish (commit `4c6196d`)**
- All ~34 remaining styled files converted via a 16-agent parallel workflow:
  primitives, headers, dev playground, every shell page, and every game component.
- ThemeToggle added to `AppHeader` and the `/dev` sidebar.
- Conservative polish: consistent spacing/radii/shadows from the scales,
  focus-visible states, hover transitions, light+dark contrast via semantic tokens.

## Non-obvious technical decisions (worth knowing)

1. **Turbopack virtualizes `__dirname`.** StyleX on Next 16 failed at first: under
   Turbopack the Babel config's `__dirname` becomes `/ROOT/apps/web`, and StyleX's
   `/ROOT/` path reconstruction needs the *real* workspace root. Fixed by computing
   `rootDir` from `process.cwd()` (which stays real) walking up to
   `pnpm-workspace.yaml`. This is the single most fragile piece — see the comment
   in `babel.config.js`.
2. **`apps/web` is no longer `"type": "module"`.** Next's Babel loader only accepts
   `.js`/`.json` config (not `.cjs`/`.mjs`), and the package being ESM made
   `babel.config.js` unloadable. Dropping `type: module` (the default for Next
   apps) was safe — there are no hand-run `.js` files in the package.
3. **Vitest doesn't run the StyleX Babel plugin**, so uncompiled `defineVars`
   throws at import. Aliased `@stylexjs/stylex` → `src/test/stylex-mock.ts` (no-op
   runtime) for tests, which assert behavior not CSS. Standard StyleX-testing
   pattern.
4. **`useTheme()` falls back to a safe default with no provider** so header
   components render in isolated tests (the real app always wraps via root layout).

## Visual review (orca CLI, all 8 `/dev` routes, light + dark)

- **Light:** near-identical to the original Tailwind UI — compare `before-*` vs
  `light-*`. Confirms a faithful conversion with no regression. Minor intentional
  shifts: a hair more consistent spacing, clearer focus rings, and the player-rail
  active-turn highlight is a slightly warmer gold.
- **Dark (new):** coherent across every surface — dark page chrome, elevated card
  surfaces with subtle borders, badges/buttons keep strong contrast, the gold
  active-turn ring pops on the near-black rail. The felt board/hand stay green
  (game identity) with darkened surrounding chrome.

## Decisions for you

1. **How bold on visuals?** I deliberately stopped at a faithful + polished
   conversion rather than a redesign — an overnight bold redesign is subjective and
   risky to land well unattended, and easy for you to greenlight per-area now that
   the foundation is solid. Easy next steps if you want more: richer board framing,
   a stronger landing hero, and motion (the `motion` package is already a dep) for
   card/turn transitions. Tell me which areas and I'll push further.
2. **React Native path — RSD now or later?** Per our discussion, the tokens are
   kept framework-agnostic so they're shareable. Open question: adopt **React
   Strict DOM** for the web app now (maximizes web↔native component reuse, but
   it's pre-1.0) vs. stay plain-StyleX on web and bring RSD in with the RN app.
   I recommend **StyleX-now / RSD-with-the-RN-app**, and extracting tokens into a
   shared package (`packages/design-tokens`) when the RN app starts.
3. **Dark mode default.** Currently "system" (follows OS) with a manual override.
   Want a different default, or the toggle placed somewhere other than the header?
4. **Dev-mode class names.** `babel-plugin` runs with `dev` on in development, so
   classes get readable debug prefixes (e.g. `button__styles.base`). Fine, just
   noting it; production builds use hashed atomic classes.

## Known minor follow-ups (non-blocking)

- No "white wash on dark chrome" semantic token yet; the header hover/account use
  literal `rgba(255,255,255,…)` (mirrors the existing toggle). Could add a token.
- Badge `neutral` tone uses `color.slate` text on a translucent bg — acceptable
  contrast, slightly lower than other tones; candidate for a polish tweak.
- `AppHeader` now always renders its right cluster (to host the toggle) — a minor
  behavior delta vs. the old "only when `right` is passed".

## How to review

```bash
pnpm --filter @sequence/web dev      # http://localhost:3000
# open /dev, /dev/primitives, /dev/board, /dev/hand, /dev/player-rail,
# /dev/lobby, /dev/handoff, /dev/game-over — toggle light/system/dark in the header
```

Screenshots for a quick scan: `.superpowers/reviews/screenshots/` (`before-*`,
`light-*`, `dark-*`).

## Commits on `stylex`

- `138e748` feat(web): StyleX foundation — tokens, theming, build pipeline
- `4c6196d` feat(web): convert all components to StyleX + dark mode + visual polish
- (this review doc + spec)
