# @sequence/api

Fastify + tRPC + Drizzle API for Sequence Online — the authority for auth,
persistence, move validation, redaction, realtime, and timers. Inherits the root
`AGENTS.md`; this file adds the API-specific delta.

## Commands

- `pnpm --filter @sequence/api dev` — watch server (needs `packages/api/.env`)
- `pnpm --filter @sequence/api start` — run the server (native Node, no build)
- `pnpm --filter @sequence/api test` — Vitest (integration tests need `DATABASE_URL_TEST`)
- `pnpm --filter @sequence/api exec drizzle-kit generate` / `migrate`

## Non-Negotiables

- **Redaction (NFR1):** never serialize another seat's hand or the deck to a
  non-owning recipient. Route private events and snapshots through `redactEvent`
  / `buildSnapshot` (`src/shared/realtime/redaction.ts`). Local pass-and-play is
  the only exception — one connection owns every seat.
- **Rate limiting:** key limiters on `ctx.ip` only, never a hand-parsed
  `x-forwarded-for`. Production runs `TRUST_PROXY=false` to stop forged-XFF
  limiter bypasses on Railway.
- **Version guard:** clients submit their last-seen game `version`; lifecycle
  mutations reject stale versions (optimistic concurrency).

## Conventions

- **Route per action:** each game action is its own file under `src/game/routes/`
  exporting `<action>Route`, built from `authedProcedure` / `gamePlayerProcedure`
  / `publicProcedure` with a Zod `.input(...)`. Multi-write paths use
  `ctx.db.transaction`.
- **Schema & migrations:** schema lives in `src/db/schema/`; the SQL under
  `drizzle/` is **generated** (`drizzle-kit generate`) and committed — never
  hand-edit it (it is excluded from oxlint/oxfmt).
- **Process-local state:** realtime rooms, timers, presence, and rate-limit
  buckets are single-instance only — do not assume horizontal scaling.
- Surface game-logic rule violations through the tRPC error formatter
  (`error.data.ruleViolation`), not string matching.

## Tests

Integration tests boot the API in-process via `createHarness()`
(`src/test/harness.ts`) against the Neon **test** branch (`DATABASE_URL_TEST`),
truncating between tests. They run single-fork / serialized; without a test DB
the integration suites skip cleanly.

## References

- `packages/api/README.md` — responsibilities, tRPC routers, env
- `docs/architecture.md` — data flow, auth/guests, realtime/timers, security notes
- `docs/deployment.md` — Railway/Neon env vars, `TRUST_PROXY`, smoke checks
