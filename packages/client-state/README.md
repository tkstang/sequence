# `@sequence/client-state`

Shared game-view state helpers for the web and mobile clients.

This package is framework-free TypeScript. It depends only on
`@sequence/game-logic` types and data shapes, so it can run in Next.js, Expo
React Native, tests, and dev playground fixtures without pulling in API or UI
runtime code.

## Responsibilities

- Define the redacted `GameSnapshotView` shape consumed by client routes.
- Convert snapshot payloads into `GameViewState` with `stateFromSnapshot`.
- Apply tracked subscription events with `applyGameEvent` and
  `applyStreamItem`.
- Select the high-level route surface with `screenForState`.
- Provide representative `gameFixtures` for component tests and dev
  playgrounds.
- Centralize rule-violation copy with `RULE_VIOLATION_MESSAGES` and
  `ruleViolationMessage`.

## Public Surface

The package exports from `src/index.ts`. Import the package root from other
workspaces rather than deep module paths:

```ts
import {
  applyStreamItem,
  gameFixtures,
  ruleViolationMessage,
  type GameSnapshotView,
} from '@sequence/client-state';
```

Key exports:

- State helpers: `stateFromSnapshot`, `applyGameEvent`, `applyStreamItem`,
  `screenForState`.
- Fixture helpers: `gameFixtures`, `getGameFixture`,
  `winningSequenceCells`.
- Rule-copy helpers: `RULE_VIOLATION_MESSAGES`, `ruleViolationMessage`.
- Types: `GameSnapshotView`, `GameViewState`, `GameStreamItem`,
  `LoggedGameEvent`, `SnapshotPlayer`, `SnapshotBoardCell`,
  `SnapshotSequence`, `PendingChoiceView`, `GameScreen`.

## Ownership Boundary

`@sequence/api` remains the authority for auth, persistence, validation,
redaction, timers, and realtime subscriptions. This package only applies the
already-redacted snapshot/event stream that clients receive.

Do not import React, Next.js, Expo, Fastify, database code, browser APIs, or
React Native APIs here. UI components should consume this package; this package
should not consume UI components.

## Commands

```bash
pnpm --filter @sequence/client-state test
pnpm --filter @sequence/client-state typecheck
```

The root `pnpm test` gate runs this package through the Vitest workspace.

## Tests

Tests live beside the source under `src/` and use Vitest. Add focused tests when
changing stream application, screen selection, fixture behavior, or violation
message coverage.
