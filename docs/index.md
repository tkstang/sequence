# Sequence Online Documentation

Documentation for Sequence Online — a web MVP of the Sequence board game with
online multiplayer and local pass-and-play. For a project overview and quickstart,
see the root [`../README.md`](../README.md); the pages below go deeper.

## Contents

### Concepts

- [`architecture.md`](architecture.md) — workspace boundaries, request/event flow, auth and guests, realtime, timers, scaling limits, and security notes.
- [`game-rules.md`](game-rules.md) — the Sequence ruleset as the engine enforces it: objective, jacks, dead cards, sequences, and digital-only behavior.

### Getting started

- [`development.md`](development.md) — local setup, running the app, test gates, database workflow, and UI iteration.
- [`configuration.md`](configuration.md) — canonical environment-variable reference for API, web, and deploy.
- [`testing.md`](testing.md) — test layers (unit, integration, e2e) and the test-database workflow.
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — prerequisites, quality gates, commit convention, and code rules.

### Reference

- [`api-reference.md`](api-reference.md) — tRPC procedures (`game`, `history`, `health`) and the Better Auth surface.
- [`game-logic-reference.md`](game-logic-reference.md) — `@sequence/game-logic` exports, domain types, and engine contracts.
- [`data-model.md`](data-model.md) — Postgres/Drizzle schema, jsonb shapes, and the persistence model.

### Operations

- [`deployment.md`](deployment.md) — Railway/Vercel/Neon deployment, required env vars, and smoke checks.

## Package documentation

- [`../apps/web/README.md`](../apps/web/README.md) — Next.js web app: routes, components, and client.
- [`../packages/api/README.md`](../packages/api/README.md) — Fastify API service.
- [`../packages/game-logic/README.md`](../packages/game-logic/README.md) — pure rules engine package.
- [`../bruno/README.md`](../bruno/README.md) — Bruno API smoke collection.
- [`../tools/git-hooks/README.md`](../tools/git-hooks/README.md) — local git hook installation and management.
