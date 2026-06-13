# web-mvp Deployment Handoff

**Status:** blocked at p07-t02 (Railway deploy target not linked)
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

## Blocker

p07-t02 cannot deploy non-interactively yet.

Observed locally:

- `railway` CLI is not installed in `PATH`.
- `vercel` CLI is not installed in `PATH`.
- `wscat` and `bru` are not installed in `PATH`.
- `RAILWAY_TOKEN` and `VERCEL_TOKEN` are present locally, but no values were printed or recorded.
- No Railway project/service/environment link is present in the repo (`.railway/` missing).
- No non-interactive Railway target env vars are present: `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE_ID`, `RAILWAY_ENVIRONMENT_ID`.
- No Vercel link is present in the repo (`.vercel/` missing), and `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` are absent.

Required before resuming p07-t02:

- Railway project + API service created or linked, preferably US East (`us-east4-eqdc4a`).
- A non-interactive Railway target available to the agent, either via `.railway/` link metadata or explicit project/service/environment IDs.
- Confirm Railway "Serverless" sleep is off for the API service.
- Confirm production Neon direct `DATABASE_URL` is the intended production branch. Do not use the test branch for deploy.
- Vercel project linked for `apps/web`, or project/org IDs made available before p07-t03.

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

Once a Railway service is linked:

1. Confirm the linked service is the API service and region is US East.
2. Set env vars from the checklist above.
3. Confirm Serverless sleep is off.
4. Deploy the current commit.
5. Confirm predeploy migrations complete.
6. Capture the public API URL.
7. Verify:
   - `GET <api-url>/health` returns `200` and `{"status":"ok"}`.
   - A WebSocket connection to `<ws-url>/trpc` upgrades and receives the tRPC keepalive frame.
   - A forged `X-Forwarded-For` does not bypass the public preview/join rate limit.

## Vercel Web Env Checklist

Set on the Vercel web project:

- `NEXT_PUBLIC_API_URL=https://<api-host>`
- `NEXT_PUBLIC_WS_URL=wss://<api-host>`

The web project root should be `apps/web`, with workspace-aware install/build from the monorepo root.

## Production Smoke Checklist

Fill these after p07-t03/p07-t04:

- API health: pending
- WS upgrade: pending
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
