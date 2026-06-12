# Code Organization & Style Guide

*Referenced from the Sequence discovery doc. This is the structural convention the agent should follow throughout the monorepo — web, mobile, backend, and shared packages.*

## Core Principles

1. **Co-location over central directories.** Things live next to what they belong to. Tests, utils, config, and types sit beside the file they serve — not in a separate `__tests__/` or top-level `utils/` directory.
2. **Lean core files.** Keep the main file (component, service, router) focused. Push helpers, config, and types into sibling dot-extension files so the core logic stays scannable.
3. **Bubble up only when genuinely shared.** Code lives with the component, sub-component, or domain it belongs to. Only when something is used across many places does it move up to a shared location.
4. **The pattern applies everywhere** — not just React components. Backend domains, server-side logic, and shared packages follow the same colocation philosophy.

## File Naming

| Kind | Case | Example |
|---|---|---|
| **General files** (logic, utils, config, services, routes) | **kebab-case** | `sequence-detection.ts`, `make-move.ts`, `board-validator.ts` |
| **React components** (`.tsx`) | **PascalCase** | `GameBoard.tsx`, `CardHand.tsx` |
| **Component sibling files** | **PascalCase + dot-extension** | `GameBoard.utils.ts`, `GameBoard.test.ts`, `GameBoard.config.ts` |
| **Class files** | **PascalCase** (follows class convention) | `SessionManager.ts` |

**Rule of thumb:** kebab-case by default. Use PascalCase only where there's a strong convention otherwise — React components and class files being the main cases.

## Dot-Extension Sibling Pattern

A file's companions share its base name with a descriptive extension. This keeps the namespace flat and makes it obvious what belongs together:

```
GameBoard.tsx          # the component (lean — just composition + core render)
GameBoard.utils.ts     # helpers used only by GameBoard
GameBoard.test.ts      # co-located tests
GameBoard.config.ts    # component-specific config/constants
GameBoard.types.ts     # component-specific types (if substantial)
```

*(`.styles.ts` would also fit here, but it's irrelevant under Tailwind/NativeWind — styling lives in the markup.)*

## Component Composition

When a component grows beyond a clean single file, break sub-components into a nested `components/` directory. Each sub-component follows the same sibling pattern:

```
GameBoard/
├── GameBoard.tsx
├── GameBoard.utils.ts
├── GameBoard.test.ts
└── components/
    ├── CardHand.tsx
    ├── CardHand.utils.ts
    ├── CardHand.test.ts
    ├── BoardCell.tsx
    └── BoardCell.test.ts
```

Parent stays lean; complexity is organized into children. Sub-components live under the parent that owns them.

## Shared Code Hierarchy

The resolution order for where something lives:

1. **With the component** — if only that component uses it → sibling file (`GameBoard.utils.ts`).
2. **With the sub-component** — if only a nested component uses it → in that sub-component's directory.
3. **With the domain** — backend logic lives in its domain folder (see below).
4. **Genuinely shared** → bubble up to `src/shared/`:
   - `src/shared/types/` — types used across the app
   - `src/shared/utils/` — universal helpers
   - `src/components/` — universally shared/reused components (not tied to one parent)

## Backend Structure (Domain-Driven)

The `api` package is organized by **domain**, each self-contained:

```
packages/api/src/
├── game/
│   ├── game.router.ts      # tRPC procedures for the game domain
│   ├── game.service.ts     # business logic
│   ├── game.types.ts       # domain types
│   ├── game.test.ts
│   └── routes/             # file-per-route granularity
│       ├── create-game.ts
│       ├── make-move.ts
│       ├── join-game.ts
│       └── save-game.ts
├── user/
│   ├── user.router.ts
│   ├── user.service.ts
│   ├── user.types.ts
│   └── routes/
│       ├── login.ts
│       └── logout.ts
└── shared/
    ├── types/
    └── utils/
```

**Route granularity:** Prefer **file-per-route** — one file per endpoint/procedure. It keeps individual handlers small and easy to find. (If a handler is trivially small, grouping is acceptable, but default to granular.)

## `game-logic` Package

Pure TypeScript — no components, just functions and types. Kebab-case throughout, tests co-located:

```
packages/game-logic/src/
├── sequence-detection.ts
├── sequence-detection.test.ts
├── board-validator.ts
├── board-validator.test.ts
├── jack-rules.ts
├── jack-rules.test.ts
└── index.ts                # package entry / public exports
```

## Summary

- Co-locate tests (`*.test.ts`) and utils (`*.utils.ts`) with their source.
- Kebab-case files; PascalCase for components and classes.
- Dot-extension siblings keep core files lean.
- Nest sub-components under their parent.
- Backend organized by domain, file-per-route handlers.
- Genuinely shared code → `src/shared/`.
- The same philosophy applies to web, mobile, and backend alike.
