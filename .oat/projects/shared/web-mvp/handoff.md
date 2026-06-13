# web-mvp Deployment Handoff

**Status:** Railway API and Vercel web deployed; production smoke recorded
**Last updated:** 2026-06-13
**No secrets are recorded here.**

## Current Local Artifacts

- API container: `packages/api/Dockerfile`
- Railway config-as-code: `railway.json`
- API healthcheck: `/health`
- Railway predeploy command: `pnpm --filter @sequence/api exec drizzle-kit migrate`
- API start command: `pnpm --filter @sequence/api start`
- Production cookie strategy: `AUTH_COOKIE_SAME_SITE=none`, `AUTH_COOKIE_SECURE=true`
- Railway proxy strategy: `TRUST_PROXY=false`; public invite preview/join use a shared anonymous limiter bucket

## Railway Deployment

- Project: `sequence`
- Environment: `production`
- Service: `sequence-api`
- Public API URL: `https://sequence-api-production-8687.up.railway.app`
- Deployment IDs:
  - Initial deploy: `016512d9-afef-4204-b9e6-11fb1b74a9d6`
  - `WEB_ORIGIN` redeploy: `9629e69f-3f80-4971-b616-619c4faa08dd`
  - `TRUST_PROXY=false` redeploy: `95589e4e-9361-4672-a64f-0909bd8b3379`
  - Invite limiter hardening redeploy: `12949411-5cfa-4c42-89b7-f6861a9e50f2`
- Predeploy migrations: passed (`drizzle-kit migrate`)
- Healthcheck: passed (`GET /health` returned `{"status":"ok"}`)
- WebSocket upgrade: passed (`wss://sequence-api-production-8687.up.railway.app/trpc` opened)

Notes:

- Railway CLI auth was via local OAuth. A stale local `RAILWAY_TOKEN` from `.env` was explicitly unset during deployment because it did not have access to the new project.
- `DATABASE_URL` was sourced from local `.env` after checking it was distinct from `DATABASE_URL_TEST`, did not contain `pooler`, and did not look like a test URL. The value was never printed or recorded.
- `WEB_ORIGIN` was updated to the actual Vercel production alias `https://sequence-cyan.vercel.app` and Railway was redeployed successfully.
- `TRUST_PROXY=1` plus the prior IP-keyed anonymous invite limiter did not survive a forged-XFF smoke check on Railway. Production now keeps `TRUST_PROXY=false`, and anonymous `game.preview`/`game.join` traffic shares one limiter bucket so rotating `X-Forwarded-For` cannot bypass invite-code throttling.

## Railway API Env Checklist

Set on the Railway API service, without committing values:

- `DATABASE_URL` = Neon direct production connection string, not the pooler and not `DATABASE_URL_TEST`
- `BETTER_AUTH_SECRET` = at least 32 chars
- `BETTER_AUTH_URL` = public API origin, for example `https://<api-host>`
- `WEB_ORIGIN` = public web origin, for example `https://<web-host>`
- `AUTH_COOKIE_SAME_SITE=none`
- `AUTH_COOKIE_SECURE=true`
- `TRUST_PROXY=false`
- `NODE_ENV=production`
- `PORT` can be omitted unless overriding Railway's injected `PORT`
- Optional: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Railway Deploy Steps

Completed on 2026-06-13:

1. Confirmed the linked target is project `sequence`, environment `production`, service `sequence-api`.
2. Generated Railway service domain.
3. Set env vars from the checklist above without printing secret values.
4. Deployed current branch via `railway up --detach`.
5. Polled deployment status until Railway reported `SUCCESS`.
6. Confirmed predeploy migrations completed in Railway logs.
7. Verified:
   - `GET https://sequence-api-production-8687.up.railway.app/health` returns `200` and `{"status":"ok"}`.
   - WebSocket connection to `wss://sequence-api-production-8687.up.railway.app/trpc` opens.

## Vercel Web Env Checklist

Set on the Vercel web project `sequence`:

- `NEXT_PUBLIC_API_URL=https://sequence-api-production-8687.up.railway.app`
- `NEXT_PUBLIC_WS_URL=wss://sequence-api-production-8687.up.railway.app`

Vercel project settings:

- Project: `sequence`
- Project ID: `prj_n0X1Xk6YS1Efwnd45l3EfKfy5lmr`
- Root directory: `apps/web`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @sequence/web build`
- Initial production deployment: `dpl_3dyyJiXnxBRaPw6mkQp8N38EC9Rn`
- Current production deployment: `dpl_2EvfgY4k8miUL2Eb8sMX2GQ6WN9R`
- Current production URL: `https://sequence-nix9lmbc1-stangtks-projects.vercel.app`
- Production alias: `https://sequence-cyan.vercel.app`

Deployment note:

- Initial Vercel deploy failed because the root `prepare` hook tried to install git hooks in Vercel's non-git build archive. `tools/git-hooks/manage-hooks.js setup` now no-ops outside a git repository; retry deploy succeeded.

## Production Smoke Checklist

- API health: passed (`https://sequence-api-production-8687.up.railway.app/health`)
- WS upgrade: passed (`wss://sequence-api-production-8687.up.railway.app/trpc`)
- Signup/login cross-origin cookie round-trip: passed (`Origin: https://sequence-cyan.vercel.app`; CORS credentials allowed; session cookies `SameSite=None`, `Secure`, `HttpOnly`; `health.me` returned 200 after signup and login)
- Guest join cookie round-trip: passed; guest cookie was `SameSite=None`, `Secure`, `HttpOnly`
- Local pass-and-play full game: passed in an automated 375px browser viewport; real physical phone not performed
- Two-browser realtime game: passed; move broadcast observed and two-browser concede reached final state
- Move-to-broadcast latency spot-check: functional broadcast passed, but the latency target is not met by current production probes. Observed values: two-browser remote render `3846ms`; direct browser `game.makeMove` fetch `2553ms`; direct Node `game.makeMove` fetch with the same session cookie `2548ms`. API health from this machine was roughly `0.76s-0.84s`; public `game.preview` settled near `0.50s`; authenticated `health.me` settled near `0.63s-0.70s`. Treat NFR2 as an open production performance follow-up, not passed.
- 375px mobile pass: passed in an automated Pixel 5 / 375px viewport; real physical phone not performed
- Forged-XFF invite rate-limit check: passed after limiter hardening; 31st rotated-header `game.preview` request returned `429`
- Neon/Vercel/Railway tier audit: passed for MVP architecture; one Vercel Hobby project, one Railway API service, external Neon direct Postgres URL, no Railway database/buckets/volumes, and no paid-tier-only dependency was added

## Operator Follow-Ups

- Revoke the legacy GCP service key if not already done.
- Configure social OAuth only when desired; email/password works without social provider env vars.
- Keep `AUTH_COOKIE_SAME_SITE=lax` only for a shared registrable-domain deployment. For Vercel-to-Railway cross-site hosting, keep `none`.
