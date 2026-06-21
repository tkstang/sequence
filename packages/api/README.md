# `@sequence/api`

Fastify API service for Sequence Online.

## Responsibilities

- Better Auth email/password sessions under `/api/auth/*`
- Game-scoped guest cookies for invite joins
- tRPC HTTP queries/mutations and WebSocket subscriptions under `/trpc`
- Postgres persistence through Drizzle ORM
- Game lifecycle, move validation, event persistence, and redacted snapshots
- Presence-driven freeze/resume behavior
- Turn timers and expiry sweep
- Deployment health route at `/health`

## Local Environment

The dev script runs from `packages/api` and uses `node --env-file=.env`, so the
local env file must be package-local:

```bash
cp .env.example packages/api/.env
```

Required for local API boot:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL=http://localhost:3001`
- `WEB_ORIGIN=http://localhost:3000`

Optional:

- `DATABASE_URL_TEST`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Commands

```bash
pnpm --filter @sequence/api dev
pnpm --filter @sequence/api start
pnpm --filter @sequence/api test
pnpm --filter @sequence/api typecheck
```

## tRPC Routers

`src/app-router.ts` combines:

- `game` - create, preview, join, lobby/team changes, start, move, sequence
  choice, dead-card turn-in, save/exit, concede, rematch, my games, event
  subscription
- `history` - aggregate and head-to-head records
- `health` - authenticated session/user health helpers

Game routes live one file per action in `src/game/routes`.

## Persistence and Migrations

Schema lives in `src/db/schema`. SQL migrations live in `drizzle`.

Generate migrations:

```bash
pnpm --filter @sequence/api exec drizzle-kit generate
```

Apply migrations using `DATABASE_URL`:

```bash
pnpm --filter @sequence/api exec drizzle-kit migrate
```

Use a test or disposable database for local migration verification.

## Runtime Notes

The API uses `@sequence/game-logic` as the authoritative rules engine. Clients
submit an expected game `version`; lifecycle mutations reject stale versions.

Production keeps `TRUST_PROXY=false` and uses a shared anonymous limiter bucket
for public invite preview/join traffic to avoid forged-XFF limiter bypasses on
Railway.

Realtime rooms, timers, presence, and rate-limit buckets are process-local in
the MVP.
