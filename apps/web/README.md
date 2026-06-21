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

## Game UI Notes

The game route uses `GameSnapshotView` plus streamed events from
`components/game-state.ts`. Leaf components are prop-driven and should stay
usable from tests or future fixture-driven playgrounds.

The board currently uses full card SVGs from `public/cards` and renders them
with `object-fit: contain`. A symbolic/physical-board rendering direction is a
backlog item, not an implemented mode.
