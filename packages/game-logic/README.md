# `@sequence/game-logic`

Pure TypeScript rules engine for Sequence Online.

This package has no React, Next, Fastify, database, or auth dependencies. Keep
it framework-free so the API, web app, tests, and future clients can share the
same domain contract.

## Responsibilities

- Board map and position parsing
- Deck creation, seeded RNG, shuffling, and draw helpers
- Game creation
- Turn reducer through `applyMove`
- One-eyed and two-eyed jack rules
- Dead-card detection and turn-in behavior
- Sequence detection, locking, and over-five choice handling
- Win conditions
- Display helpers for valid placements
- Domain types for cards, moves, players, teams, game state, and events

## Public Surface

The package exports from `src/index.ts`. Prefer adding public APIs there instead
of importing deep module paths from other workspaces.

Common exports:

- `createGame`
- `applyMove`
- `resolveSequenceChoice`
- `turnInDeadCard`
- `validPlacements`
- `detectSequences`
- `checkWin`
- `BOARD_MAP`
- `Card`, `Move`, `GameState`, `GameEvent`, `RuleViolation`, and related types

## Commands

```bash
pnpm --filter @sequence/game-logic test
pnpm --filter @sequence/game-logic typecheck
```

## Design Rules

- Keep functions deterministic by default.
- Thread `Rng` through non-deterministic operations when tests need control.
- Return typed rule violations instead of throwing for expected illegal moves.
- Do not add framework, database, network, or DOM imports.
- Add focused tests for each rules change before depending on API or web tests.
