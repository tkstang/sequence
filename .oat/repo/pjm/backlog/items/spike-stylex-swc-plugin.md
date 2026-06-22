---
id: bl-2ae1
title: 'Spike: evaluate stylex-swc to drop the StyleX Babel pipeline'
status: open # open | in_progress | closed | wont_do
priority: medium # urgent | high | medium | low | none
scope: task # idea | task | feature | initiative
scope_estimate: M # XS | S | M | L | XL | XXL
labels: [stylex, build, dx, spike]
assignee: null
created: '2026-06-22T15:35:34Z'
updated: '2026-06-22T15:35:34Z'
associated_issues: []
oat_template: true
oat_template_name: backlog-item
---

## Description

Evaluate replacing the StyleX Babel pipeline in `apps/web`
(`@stylexjs/babel-plugin` + `@stylexjs/postcss-plugin`) with the community
Rust/SWC compiler `@stylexswc/nextjs-plugin` (repo `Dwlad90/stylex-swc-plugin`,
currently pre-1.0).

Context: StyleX compiles via Babel today. Because Next's Babel loader only
accepts `.js`/`.json` config and StyleX needs a computed `rootDir`, `apps/web`
had to drop `"type": "module"` and carries a Turbopack-specific `/ROOT/`
`rootDir` workaround in `babel.config.js` (Turbopack virtualizes `__dirname`).
The SWC plugin runs the StyleX transform in Rust, integrates via `next.config`
(no Babel config), and supports Turbopack — so adopting it would let us delete
`babel.config.js`, restore `"type": "module"`, remove the `rootDir` hack, and get
faster builds.

Run as an isolated worktree spike so the working Babel setup stays as the
fallback and `main`/`stylex` is untouched until it's proven.

Trade-off to validate: the SWC plugin is community-maintained, pre-1.0, and not
Meta-official — it reimplements StyleX's transform in Rust, so it is
version-coupled to `@stylexjs/stylex` (currently 0.19). Mismatches could surface
as class-hash or feature differences.

## Acceptance Criteria

- Spike runs on a throwaway worktree/branch; the Babel setup on `stylex` is left
  intact until the SWC path is proven.
- Swap to `@stylexswc/nextjs-plugin` (+ its Turbopack entrypoint); remove
  `@stylexjs/babel-plugin`, `@stylexjs/postcss-plugin`, `babel.config.js`, and the
  StyleX bits of `postcss.config.mjs`; restore `"type": "module"` in
  `apps/web/package.json`.
- `pnpm --filter @sequence/web build` passes on Turbopack and `next dev` boots.
- Theming (`defineVars`/`createTheme`, light + dark), the game board, and the key
  `/dev` surfaces render identically to the Babel output (visual diff via `/dev`
  in light and dark).
- A `@stylexswc` version compatible with `@stylexjs/stylex` 0.19 is pinned (or
  both bumped together); the version coupling is documented.
- Note that the Vitest StyleX stub is still required (unchanged by this swap).
- Capture the build-time delta (Babel vs SWC) and a clear go/no-go
  recommendation.
- If adopted: update the docs/AGENTS notes that describe the Babel + dropped
  `type: module` setup.
