---
oat_status: complete
oat_ready_for: null
oat_blockers: []
oat_last_updated: 2026-06-21
oat_generated: true
oat_summary_last_task: p08-t02
oat_summary_revision_count: 0
oat_summary_includes_revisions: []
---

# Project Summary: web-mvp

## Overview

This project replaced the legacy COVID-era Sequence prototype with a complete
server-authoritative web MVP. The shipped system supports registered users,
guest invite links, local pass-and-play, realtime play, persistent lifecycle
flows, history, and production deployment.

The architecture is a pnpm monorepo with a pure `@sequence/game-logic` rules
package, a Fastify/tRPC API on Railway, a Next.js web app on Vercel, and Neon
Postgres as the system of record. The game logic and typed API were kept
portable for a future React Native client.

## What Was Implemented

- Foundation: monorepo tooling, TS6/tsgo type gates, oxlint/oxfmt, Vitest,
  git hooks, optimized card assets, and full removal of the legacy Firebase app.
- Game logic: complete Sequence rules engine with board map, two-deck shuffle,
  dealing, turn order, jacks, dead cards, corners-as-wild, sequence locking,
  win conditions, pending >5-run choice, turn-in, forfeit, and display helpers.
- API: Fastify host, Better Auth, game-scoped guest tokens, Drizzle schema and
  migrations, tRPC HTTP/WS transport, seat authorization, lifecycle routes,
  move engine, realtime recovery, timers, presence, rematch, expiry sweep, and
  history aggregation.
- Web: landing/auth/dashboard/create/join/history shell plus the playable game
  route with lobby, board, hand, player rail, tap and drag modes, local handoff,
  lifecycle controls, game-over/rematch, notifications, and responsive layout.
- Deployment: Railway API, Vercel web, Neon database, Bruno collections,
  Docker/Railway config, production smoke notes, and operator handoff.
- Final review fixes: event sequence pairing no longer relies on PostgreSQL
  `RETURNING` row order, and the hot-path move route now shares the canonical
  seat-resolution helper with middleware coverage for outsider, guest, and local
  creator paths.

## Key Decisions

- The reducer in `packages/game-logic` owns the full turn loop. The API is the
  host that loads, reduces, persists, and broadcasts, preserving a reusable
  rules contract for future clients.
- Clients render authoritative server state rather than applying local moves.
  Move mutations carry a version and stale writes return `CONFLICT`.
- Private hands are stored per player and redacted at the subscription boundary;
  local pass-and-play is the only mode where the creator connection can receive
  both hands.
- Guest identity is resolved lazily against a game-scoped signed token because
  the target game is required to verify the cookie.
- Production auth uses cross-site cookie settings for the Vercel to Railway
  deployment, while local development keeps simpler same-site behavior.

## Design Deltas

- The persisted board is a sparse object keyed by position code rather than a
  dense 100-cell array, matching the in-memory `Map` model and avoiding empty
  cell storage.
- Game snapshots and broadcasts expose the current version so pure tRPC clients
  can make legal version-guarded moves without privileged database reads.
- Lifecycle writes use the same optimistic concurrency protocol as moves after
  review found that unguarded save/concede/freeze writes could race moves.
- Six-player web lobbies expose the approved 3-team layout; the engine and API
  can support additional legal 6-player team shapes later if product wants them.

## Notable Challenges

- The API integration suite needed repo-root `.env` loading, advisory locking,
  and eventually a single Vitest fork so shared Neon test-branch setup remained
  deterministic under the workspace runner.
- Node 24 required `--experimental-transform-types` for TypeScript parameter
  properties used in server classes.
- Production NFR2 latency required API server-timing instrumentation, a single
  Railway region, a move hot-path CTE optimization, and a short session-user
  cache.
- Railway proxy behavior made per-IP anonymous invite throttling unsafe, so the
  MVP intentionally uses a shared anonymous limiter bucket until a trusted edge
  identifier is verified.

## Verification

- Root gates were run throughout: `pnpm typecheck`, `pnpm lint`,
  `pnpm format:check`, and `pnpm test`.
- Package and focused checks covered game-logic unit tests, API integration
  tests, web unit tests, Playwright desktop/mobile e2e, Bruno auth/game
  collections, web builds, Docker build, Railway health/WS checks, and
  production auth/game smokes.
- Final p08 verification passed:
  `pnpm --filter @sequence/api exec vitest run src/game/routes/make-move.test.ts`,
  `pnpm --filter @sequence/api exec vitest run src/game/routes/make-move.test.ts src/trpc-game-middleware.test.ts`,
  and `pnpm --filter @sequence/api typecheck`.

## Follow-up Items

- Revoke the legacy GCP service key in Google Cloud if that has not already been
  done; the file was removed from the repo but remains in git history.
- Symbolic or more physical board rendering is tracked separately as backlog
  item `bl-821f`.
- Revisit the session-user cache bound and anonymous invite limiter strategy if
  traffic or memory observations justify it.
- Perform physical-phone operator smoke testing before broader public launch.
