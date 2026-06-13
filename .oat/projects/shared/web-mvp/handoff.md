# web-mvp Deployment Handoff

**Status:** Railway API deployed; Vercel web deploy pending
**Last updated:** 2026-06-13
**No secrets are recorded here.**

## Current Local Artifacts

- API container: `packages/api/Dockerfile`
- Railway config-as-code: `railway.json`
- API healthcheck: `/health`
- Railway predeploy command: `pnpm --filter @sequence/api exec drizzle-kit migrate`
- API start command: `pnpm --filter @sequence/api start`
- Production cookie strategy: `AUTH_COOKIE_SAME_SITE=none`, `AUTH_COOKIE_SECURE=true`
- Railway proxy strategy: `TRUST_PROXY=1`

## Railway Deployment

- Project: `sequence`
- Environment: `production`
- Service: `sequence-api`
- Public API URL: `https://sequence-api-production-8687.up.railway.app`
- Deployment ID: `016512d9-afef-4204-b9e6-11fb1b74a9d6`
- Predeploy migrations: passed (`drizzle-kit migrate`)
- Healthcheck: passed (`GET /health` returned `{"status":"ok"}`)
- WebSocket upgrade: passed (`wss://sequence-api-production-8687.up.railway.app/trpc` opened)

Notes:

- Railway CLI auth was via local OAuth. A stale local `RAILWAY_TOKEN` from `.env` was explicitly unset during deployment because it did not have access to the new project.
- `DATABASE_URL` was sourced from local `.env` after checking it was distinct from `DATABASE_URL_TEST`, did not contain `pooler`, and did not look like a test URL. The value was never printed or recorded.
- `WEB_ORIGIN` is currently set to `https://sequence.vercel.app` as the expected web origin. Update it after p07-t03 if Vercel assigns a different production URL.

## Railway API Env Checklist

Set on the Railway API service, without committing values:

- `DATABASE_URL` = Neon direct production connection string, not the pooler and not `DATABASE_URL_TEST`
- `BETTER_AUTH_SECRET` = at least 32 chars
- `BETTER_AUTH_URL` = public API origin, for example `https://<api-host>`
- `WEB_ORIGIN` = public web origin, for example `https://<web-host>`
- `AUTH_COOKIE_SAME_SITE=none`
- `AUTH_COOKIE_SECURE=true`
- `TRUST_PROXY=1`
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

Set on the Vercel web project:

- `NEXT_PUBLIC_API_URL=https://<api-host>`
- `NEXT_PUBLIC_WS_URL=wss://<api-host>`

The web project root should be `apps/web`, with workspace-aware install/build from the monorepo root.

## Production Smoke Checklist

Fill these after p07-t03/p07-t04:

- API health: passed (`https://sequence-api-production-8687.up.railway.app/health`)
- WS upgrade: passed (`wss://sequence-api-production-8687.up.railway.app/trpc`)
- Signup/login cross-origin cookie round-trip: pending
- Guest join cookie round-trip: pending
- Local pass-and-play full game: pending
- Two-browser realtime game: pending
- Move-to-broadcast latency spot-check: pending
- 375px mobile pass on a real phone: pending
- Neon/Vercel/Railway tier audit: pending

## Operator Follow-Ups

- Revoke the legacy GCP service key if not already done.
- Configure social OAuth only when desired; email/password works without social provider env vars.
- Keep `AUTH_COOKIE_SAME_SITE=lax` only for a shared registrable-domain deployment. For Vercel-to-Railway cross-site hosting, keep `none`.
