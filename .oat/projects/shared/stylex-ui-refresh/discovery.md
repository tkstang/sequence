---
oat_status: complete
oat_ready_for: null
oat_blockers: []
oat_last_updated: 2026-06-22
oat_generated: true
---

# Discovery: stylex-ui-refresh

> Captured retroactively (`oat-project-capture`) from the `stylex` branch and the
> working session that produced it. Discovery records the intent and decisions;
> the as-built detail lives in `design.md` and `implementation.md`.

## Initial Request

Migrate the `apps/web` client from Tailwind CSS to StyleX, and use the migration
as an opportunity to improve the UI ("some things look kind of not great") now
that the local dev playground exists. The user ranked the drivers:

1. **Developer experience** — typed, co-located, atomic styles.
2. **Standardization / preference** — a single, consistent styling system.
3. **Scaling** — keep styling sane as the app grows.

The user asked for the refactor to be executed autonomously (overnight) using
subagent/dynamic workflows, with opinionated visual improvements applied along
the way, for review in the morning.

## Clarifying Questions

### Question 1: Migration strategy

**Q:** Incremental (Tailwind and StyleX side-by-side) or big-bang (convert
everything at once)?
**A:** Big-bang.
**Decision:** Remove Tailwind entirely in one pass; no dual-system bridge period.

### Question 2: Visual scope

**Q:** How bold should the visual changes be?
**A:** "Opinionated is okay… once you start reviewing, if bolder feels right, go
for it. Act autonomously."
**Decision:** Apply confident visual polish (not a 1:1 reskin), iterate against
the dev views, and surface choices for morning review.

### Question 3: Dark mode

**Q:** Add dark mode now or later?
**A:** Add it now.
**Decision:** Ship light + dark theming as part of the token/theme foundation.

### Question 4: Cross-platform caveat

**Q:** A React Native app is coming — does that change the decision?
**A:** Raised mid-discovery as a "last caveat."
**Decision:** It *strengthens* the StyleX case: StyleX (via React Strict DOM) is
a credible path to share styling across web and native, where Tailwind is not.

## Key Decisions

1. **Styling system:** Replace Tailwind with StyleX (`@stylexjs/stylex`),
   compiled via the Babel plugin + PostCSS plugin. Tailwind removed entirely.
2. **Migration shape:** Big-bang — every web component converted in one branch.
3. **Theming:** Design tokens via `defineVars`; light/dark via `createTheme` plus
   `prefers-color-scheme`, with a manual toggle and cross-tab/iframe sync.
4. **Dark mode now:** delivered with the foundation, not deferred.
5. **Visual refresh in-scope:** board and chrome get real improvements, reviewed
   live via the dev playground rather than Storybook.
6. **Storybook skipped:** the dev `/dev` playground (already backlogged as
   `bl-d319`) is sufficient for fast iteration; Storybook stays a separate
   go/no-go (`bl-b0e7`).
7. **Review via real dev views:** use the Orca CLI browser against the local
   `/dev` routes to evaluate changes at multiple viewports.

## Constraints

- **Next.js 16 + Turbopack** is the build/runtime; the StyleX pipeline had to
  work under Turbopack's `__dirname` virtualization (resolved via a `rootDir`
  derived from `process.cwd()`).
- Next's Babel loader accepts only `.js`/`.json`/`.babelrc` config (not
  `.cjs`/`.mjs`), which forced `babel.config.js` (CommonJS) and dropping
  `"type": "module"` from `apps/web`.
- Keep `@sequence/game-logic` framework-free (no React/DOM/StyleX there).
- `packages/api` remains the authority for auth, persistence, move validation,
  redaction, timers, and realtime — UI-only change.
- Relative imports keep explicit `.ts`/`.tsx` extensions and `import type`
  (`verbatimModuleSyntax` + native-Node API runtime).
- All standard gates must stay green: `pnpm typecheck`, `lint`, `format:check`,
  `test`, `build`.

## Success Criteria

- Tailwind fully removed; every `apps/web` component renders via StyleX.
- Light **and** dark themes working, with a user toggle.
- Visual quality improved (board legibility, spacing, affordances), not just
  ported.
- A dev playground good enough to review components at phone/tablet/desktop
  sizes and to inspect individual components large.
- All gates green (achieved: full suite 396/396 across api + game-logic + web).

## Out of Scope

- Symbolic / physical-board rendering direction (tracked as `bl-821f`).
- Absolute path-alias imports / dropping `.ts` extensions (`bl-3fcf`).
- Adopting Storybook (`bl-b0e7`).
- Any API / game-logic behavior changes.

## Deferred Ideas

- **`@stylexswc` (Rust/SWC) compiler** — would delete `babel.config.js`, restore
  `"type": "module"`, and drop the Turbopack `rootDir` workaround. Pre-1.0 and
  version-coupled, so scoped as an isolated spike — captured as backlog `bl-2ae1`.
- **React Strict DOM adoption** for real web/native style sharing — revisit when
  the React Native app work begins.

## Risks

- **StyleX on Next 16 + Turbopack:** the central risk — an unusual, lightly
  documented combination.
  - **Likelihood:** Medium · **Impact:** High
  - **Mitigation:** prove the build pipeline end-to-end first (foundation
    commit) before converting components; keep the Babel setup as the known-good
    baseline.
- **Vitest + StyleX incompatibility:** uncompiled `defineVars` throws under the
  test runtime.
  - **Mitigation:** alias `@stylexjs/stylex` to a no-op stub for tests.
