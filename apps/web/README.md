# `@sequence/web`

Next.js App Router application for the Sequence Online browser experience.

## Responsibilities

- Public shell, signup, login, dashboard, create, join, game, and history routes
- Better Auth browser client pointed at the API auth surface
- tRPC HTTP queries/mutations and WebSocket subscription client
- Game route state projection from snapshots and tracked events
- Responsive game UI for board, hand, player rail, lobby, handoff, game over,
  and rematch flows
- Vitest component/unit tests and Playwright E2E tests

## Key Routes

| Route          | Purpose                                              |
| -------------- | ---------------------------------------------------- |
| `/`            | Public entry                                         |
| `/signup`      | Email/password signup                                |
| `/login`       | Email/password login                                 |
| `/dashboard`   | Saved and active games                               |
| `/create`      | Remote or local pass-and-play game creation          |
| `/join/[code]` | Invite preview and join                              |
| `/game/[id]`   | Lobby, active game, reconnect, and game-over surface |
| `/history`     | Logged-in aggregate records                          |
| `/ping`        | Lightweight app route check                          |

## Local Development

Start the API first, then run:

```bash
pnpm --filter @sequence/web dev
```

By default the client points at:

- `NEXT_PUBLIC_API_URL=http://localhost:3001`
- `NEXT_PUBLIC_WS_URL=ws://localhost:3001`

Set `apps/web/.env.local` only when overriding those defaults. See
[`../../docs/configuration.md`](../../docs/configuration.md) for the full
variable reference.

## Commands

```bash
pnpm --filter @sequence/web dev
pnpm --filter @sequence/web test
pnpm --filter @sequence/web typecheck
pnpm --filter @sequence/web build
pnpm --filter @sequence/web e2e
```

## Testing

See [`../../docs/testing.md`](../../docs/testing.md) for the full testing strategy
(layers and the test-database workflow).

Vitest covers component and route helper behavior under `apps/web/src`.

Playwright lives in `apps/web/e2e`. It loads the root `.env`, requires
`DATABASE_URL_TEST`, and starts API/web servers on `127.0.0.1` with a fixed test
auth secret.

## Component Playground (`/dev`)

A dev-only UI playground renders the reusable UI and game components in
isolation across their key visual states — no login, no live tRPC
subscription. It reuses the production Tailwind/typography pipeline, so previews
are visually faithful to what ships.

Open it by running the app and visiting [`/dev`](http://localhost:3000/dev):

```bash
pnpm --filter @sequence/web dev   # then open http://localhost:3000/dev
```

The whole `/dev` subtree is gated on `process.env.NODE_ENV !== 'production'`
(see `src/app/dev/layout.tsx`), so it 404s and never ships to users.

How it is wired:

- **Fixtures** — `src/app/game/[id]/components/game-fixtures.ts` exports
  representative `GameSnapshotView` states (lobby, active/your-turn,
  active/not-your-turn, dead-card, sequence-choice, game-over). These are shared
  by the playground and by tests (see `game-fixtures.test.ts`).
- **Sections** — `src/app/dev/_playground/sections.ts` lists the nav entries;
  `stories.tsx` maps each section slug to a renderer that drives the real
  components from the fixtures.

To add a component or state:

1. Add or extend a fixture in `game-fixtures.ts` (and surface it via
   `gameFixtures` if it is a new snapshot state).
2. Add a renderer in `_playground/stories.tsx` and a matching entry in
   `_playground/sections.ts` (the `slug` must match the `STORIES` key).

## Game UI Notes

The game route uses `GameSnapshotView` plus streamed events from
`components/game-state.ts`. Leaf components are prop-driven and should stay
usable from tests or the fixture-driven playground (see above).

The board currently uses full card SVGs from `public/cards` and renders them
with `object-fit: contain`. A symbolic/physical-board rendering direction is a
backlog item, not an implemented mode.
