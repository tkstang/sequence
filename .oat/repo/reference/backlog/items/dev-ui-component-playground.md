---
id: bl-d319
title: 'Dev-only UI component playground for fast UI iteration'
status: in_progress # open | in_progress | closed | wont_do
priority: medium # urgent | high | medium | low | none
scope: task # idea | task | feature | initiative
scope_estimate: S # XS | S | M | L | XL | XXL
labels: [web, game-ui, dx, tooling]
assignee: null
created: '2026-06-21T15:10:31.000Z'
updated: '2026-06-21T18:38:00.000Z'
associated_issues: []
oat_template: false
oat_template_name: backlog-item
---

## Description

Add a lightweight, dev-only UI playground so reusable UI and game components can
be rendered in isolation across their key visual states, without going through
account login, a live tRPC subscription, or real game plumbing. Today the only
ways to view UI are running the full app (where `/dashboard`, `/create`, and
`/history` redirect to `/login` via the client-side `useRequireSession()` guard,
and `/game/[id]` needs a live game-event subscription) or reading the headless
Vitest + Testing Library tests. This makes visual iteration slow.

The codebase is already well-shaped for this: leaf components (`GameBoard`,
`CardHand`, `PlayerRail`, `LobbyTeams`, `GameOver`, `HandoffScreen`, and the
`Button`/`Card`/`Badge` primitives) are pure and fully prop-driven, and game
state has a single source-of-truth shape (`GameSnapshotView` in
`apps/web/src/app/game/[id]/components/game-state.ts`) plus the `applyStreamItem`
reducer. A fixtures module of `GameSnapshotView` states feeding real components
under a dev-gated route is enough.

Approach is the lightweight `/dev` route option (no new build tooling, reuses the
prod Tailwind/font/Next pipeline so previews are pixel-identical). Storybook was
considered and deferred; the fixtures built here are intended to be reusable if
Storybook is added later.

## Acceptance Criteria

- A shared fixtures module exports representative `GameSnapshotView` states
  (at minimum: lobby, active/your-turn, active/not-your-turn, dead-card,
  sequence-choice, and game-over), reusable from both the playground and tests.
- Dev-only routes under `/dev` render the real components (board, hand, player
  rail, lobby teams, game-over, handoff, and the shared primitives) driven by the
  fixtures, with no auth guard and no live tRPC subscription required.
- The playground is excluded from production builds (e.g. gated on
  `process.env.NODE_ENV !== 'production'`) so it never ships to users.
- Previews use the same Tailwind/typography pipeline as production so they are
  visually faithful.
- Brief note in web developer docs/README on how to open the playground and add
  a new component/state.
