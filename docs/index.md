# Sequence Online Documentation

Documentation for Sequence Online — web and iOS clients for the Sequence board
game with online multiplayer and local pass-and-play. For a project overview and
quickstart, see the root [`../README.md`](../README.md); the pages below go
deeper.

## Contents

### Concepts

- [`architecture.md`](architecture.md) — workspace boundaries, request/event flow, auth and guests, realtime, timers, shared client state, scaling limits, and security notes.
- [`game-rules.md`](game-rules.md) — the Sequence ruleset as the engine enforces it: objective, jacks, dead cards, sequences, and digital-only behavior.

### Getting started

- [`development.md`](development.md) — local setup, running web/mobile apps, test gates, database workflow, the `/dev` playground, and UI iteration.
- [`styling.md`](styling.md) — shared design tokens, the web StyleX build pipeline, light/dark themes, and conventions.
- [`configuration.md`](configuration.md) — canonical environment-variable reference for API, web, mobile, and deploy.
- [`testing.md`](testing.md) — test layers (unit, integration, mobile Jest, e2e) and the test-database workflow.
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — prerequisites, quality gates, commit convention, and code rules.

### Reference

- [`api-reference.md`](api-reference.md) — tRPC procedures (`game`, `history`, `health`) and the Better Auth surface.
- [`game-logic-reference.md`](game-logic-reference.md) — `@sequence/game-logic` exports, domain types, and engine contracts.
- [`data-model.md`](data-model.md) — Postgres/Drizzle schema, jsonb shapes, and the persistence model.

### Operations

- [`deployment.md`](deployment.md) — Railway/Vercel/Neon deployment, required env vars, and smoke checks.
- [`mobile-operator-runbook.md`](mobile-operator-runbook.md) — mobile machine setup, Expo account/OAuth, and Phase 12 operator checklists.

## Package documentation

- [`../apps/web/README.md`](../apps/web/README.md) — Next.js web app: routes, components, and client.
- [`../apps/mobile/README.md`](../apps/mobile/README.md) — Expo iOS client: commands, API configuration, simulator loop, and release notes.
- [`../packages/api/README.md`](../packages/api/README.md) — Fastify API service.
- [`../packages/client-state/README.md`](../packages/client-state/README.md) — shared redacted game-view state, fixtures, and rule-violation copy.
- [`../packages/design-tokens/README.md`](../packages/design-tokens/README.md) — shared light/dark palette, dimensions, and StyleX generation.
- [`../packages/game-logic/README.md`](../packages/game-logic/README.md) — pure rules engine package.
- [`../bruno/README.md`](../bruno/README.md) — Bruno API smoke collection.
- [`../tools/git-hooks/README.md`](../tools/git-hooks/README.md) — local git hook installation and management.
