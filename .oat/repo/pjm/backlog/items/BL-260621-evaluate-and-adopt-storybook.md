---
id: BL-260621-evaluate-and-adopt-storybook
title: Evaluate and adopt Storybook for web UI components
status: open
priority: low
scope: feature
scope_estimate: M
labels:
  - web
  - game-ui
  - dx
  - tooling
  - storybook
assignee: null
created: 2026-06-21T18:55:00.000Z
updated: 2026-06-21T18:55:00.000Z
associated_issues: []
legacy_id: bl-b0e7
---

## Description

Outline what it would take to adopt [Storybook](https://storybook.js.org/) for
the web app's UI and game components, so we can make an informed go/no-go
decision later. This is a **planning + evaluation** item, not a commitment to
ship Storybook. If we do proceed, this item should contain enough detail to be
executed without re-deriving the design.

### Why this exists (and why it was deferred)

The dev-only `/dev` component playground (`bl-d319`) was the lightweight option
chosen for fast UI iteration: no new build tooling, reuses the prod
Tailwind/font/Next pipeline, and previews are pixel-identical to production.
Storybook was considered and intentionally deferred to keep the web MVP focused
and to avoid a second, parallel rendering/build pipeline before we knew we
needed one.

The groundwork is already favorable:

- Leaf components are pure and fully prop-driven (`GameBoard`, `CardHand`,
  `PlayerRail`, `LobbyTeams`, `GameOver`, `HandoffScreen`, and the
  `Button`/`Card`/`Badge` primitives).
- There is a single source-of-truth state shape (`GameSnapshotView` in
  `apps/web/src/app/game/[id]/components/game-state.ts`).
- A shared fixtures module already exists
  (`apps/web/src/app/game/[id]/components/game-fixtures.ts`) and was explicitly
  designed to be reusable as Storybook story args, not just by `/dev` and tests.

So the open question is not "can we" but "is the added tooling worth it" — and
if yes, exactly how to wire it without fighting Next.js 16 (App Router /
Turbopack), Tailwind v4 (CSS-configured `@theme`), and our `.ts`/`.tsx`
extension-in-import convention.

### What adoption would look like

The following is a concrete sketch of the implementation so the evaluation has
real substance. Treat it as a proposed design to validate, not settled fact.

#### 1. Tooling and dependencies

- Use the **`@storybook/nextjs`** (or `@storybook/nextjs-vite`) framework so
  Storybook reuses our Next config, the `next/image` component, `next/font`,
  and the `@/*` path alias rather than re-implementing them. Pin to a Storybook
  major that supports **Next.js 16** and **React 19**; verify compatibility
  before committing (Storybook's Next framework historically lags new Next
  majors by weeks — this is the single biggest adoption risk).
- Decide builder: Webpack5 (matches `@storybook/nextjs`) vs. Vite
  (`@storybook/nextjs-vite`). Vite is faster and closer to our Vitest setup,
  but the Next framework integration is less battle-tested. Spike both.
- Dev/CI-only dependency footprint; nothing ships in the production bundle.
- Co-locate Storybook config at `apps/web/.storybook/` (`main.ts`,
  `preview.tsx`), scoped to the `@sequence/web` workspace — not the monorepo
  root — so it only sees web components.

#### 2. Global decorators / parameters (`preview.tsx`)

- Import `apps/web/src/app/globals.css` so the Tailwind v4 `@theme` tokens
  (`--color-slate`, `--color-team-*`, `bg-cream`, etc.) and base body styles
  load exactly as in production. This is the key to visual fidelity and the same
  guarantee the `/dev` playground makes today.
- Wire `next/font` the same way `app/layout.tsx` does so typography matches.
- Provide a decorator that supplies any context a component needs in isolation
  (e.g. a no-op/mock `TRPCReactProvider`, router context). Most leaf components
  need none, mirroring how `/dev` renders them, but the wrapper keeps stories
  that touch providers from crashing.
- Set sensible `parameters` (viewport presets for mobile/desktop game layouts,
  backgrounds matching `cream`/`slate`/`felt`).

#### 3. Stories sourced from the existing fixtures

- Add `*.stories.tsx` co-located with each component under
  `apps/web/src/...`, OR a central `apps/web/src/stories/` tree — decide based
  on whether we want stories next to source (better locality) or isolated
  (cleaner prod tree). Co-location is the Storybook-recommended default.
- **Reuse `game-fixtures.ts` directly** as story `args`. Each representative
  `GameSnapshotView` (lobby, active/your-turn, active/not-your-turn, dead-card,
  sequence-choice, game-over) becomes a named story. This is the payoff of the
  fixtures being pipeline-agnostic — no fixture duplication between `/dev`,
  tests, and Storybook.
- Cover the same surface the `/dev` playground covers: board, hand, player rail,
  lobby teams, game-over, handoff, and the `Button`/`Card`/`Badge` primitives
  (with their variants/sizes/tones via Storybook `argTypes` controls).
- Use the CSF3 (Component Story Format 3) `Meta`/`StoryObj` typing so stories
  are type-checked by `tsgo`.

#### 4. Interaction, a11y, and visual testing (optional add-ons)

- `@storybook/addon-a11y` to surface accessibility regressions per story.
- `@storybook/addon-interactions` + the test runner to assert behavior (e.g.
  tap-to-select highlights valid targets) directly against stories.
- Visual regression: either Storybook's own test runner with snapshots, or an
  external service (Chromatic). Chromatic is the lowest-effort path but is a
  paid/3rd-party dependency — flag as a separate decision.
- Evaluate whether Storybook interaction tests should **replace or complement**
  the existing Vitest + Testing Library tests, to avoid maintaining two test
  styles for the same components.

#### 5. Scripts, CI, and build hygiene

- Add `storybook` (dev) and `build-storybook` (static export) scripts to
  `apps/web/package.json`.
- Ensure `build-storybook` output (`storybook-static/`) is gitignored and not
  published to users; if we want a hosted reference, deploy it as a separate
  artifact, not part of the app.
- Wire `build-storybook` into CI as a build smoke test (catches broken stories)
  without blocking the main app build.
- Keep `tsgo` typecheck and `oxlint`/`oxfmt` covering `*.stories.tsx`
  (extension-in-import convention applies).

#### 6. Relationship to the `/dev` playground

- Decide the end state: (a) Storybook **replaces** `/dev`, (b) both coexist
  (`/dev` for in-app/prod-pipeline fidelity, Storybook for richer
  controls/a11y/visual testing), or (c) `/dev` is retired once Storybook proves
  out. Document the decision and migration path either way.
- Because both consume the same `game-fixtures.ts`, migration is mostly moving
  the per-component "stories" rendering logic from
  `apps/web/src/app/dev/_playground/stories.tsx` into CSF story files.

### Open questions to resolve during evaluation

- Does a Storybook release support Next 16 + React 19 + Turbopack today, or do
  we pin to Webpack5 builder?
- Is Tailwind v4 (`@theme` in CSS, PostCSS plugin) fully picked up by the chosen
  builder without extra config?
- Do we accept a second build pipeline's maintenance cost vs. the `/dev` route?
- Do we want Chromatic (paid) for visual regression, or self-host snapshots?
- One test framework or two (Storybook interactions vs. Vitest/Testing Library)?

## Acceptance Criteria

- A documented evaluation (in this item or a linked decision record) of whether
  to adopt Storybook, covering: Next 16 / React 19 / Tailwind v4 compatibility,
  builder choice (Webpack5 vs. Vite), and the maintenance trade-off vs. the
  existing `/dev` playground.
- A concrete, ordered implementation plan that, if approved, can be executed
  without re-researching: dependencies + versions, `.storybook/main.ts` and
  `preview.tsx` outline, global decorators (Tailwind/`globals.css`, fonts,
  mock providers), and story file layout/convention.
- Confirmation that stories would reuse the existing `game-fixtures.ts`
  `GameSnapshotView` fixtures (no fixture duplication across `/dev`, tests, and
  Storybook), with the representative states enumerated.
- A defined relationship/migration path between Storybook and the existing
  `/dev` playground (replace, coexist, or retire `/dev`).
- Build/CI hygiene defined: dev + `build-storybook` scripts, `storybook-static`
  excluded from the shipped product, and a CI story-build smoke check.
- A decision on optional add-ons (a11y addon, interaction/visual-regression
  testing, Chromatic vs. self-hosted) with rationale.
- A go/no-go recommendation with rough effort sizing, so the team can schedule
  or close the item.
