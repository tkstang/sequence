# Deployment and Operator Notes

The MVP deploys the web app to Vercel, the API to Railway, and Postgres to
Neon. This document is a public, non-secret runbook for the current deployment
shape.

## Production URLs

- Web: `https://sequence-online.vercel.app`
- API health: `https://sequence-api-production-8687.up.railway.app/health`
- API origin: `https://sequence-api-production-8687.up.railway.app`
- API WebSocket origin: `wss://sequence-api-production-8687.up.railway.app`

## Railway API

Railway project/service:

- Project: `sequence`
- Environment: `production`
- Service: `sequence-api`
- Region: `us-east4-eqdc4a`

Relevant files:

- `packages/api/Dockerfile`
- `railway.json`
- `packages/api/drizzle`

Railway config-as-code uses:

- Dockerfile builder
- predeploy migration command:
  `pnpm --filter @sequence/api exec drizzle-kit migrate`
- start command: `pnpm --filter @sequence/api start`
- health check path: `/health`

Required Railway environment variables:

- `DATABASE_URL` - Neon direct production connection string, not the pooler and
  not `DATABASE_URL_TEST`
- `BETTER_AUTH_SECRET` - at least 32 characters
- `BETTER_AUTH_URL` - public API origin
- `WEB_ORIGIN` - public web origin
- `AUTH_COOKIE_SAME_SITE=none`
- `AUTH_COOKIE_SECURE=true`
- `TRUST_PROXY=false`
- `NODE_ENV=production`
- `PORT` - usually omitted so Railway can inject it

Optional social auth variables:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Email/password auth works without social provider variables.

See `configuration.md` for the full environment-variable reference (scopes,
defaults, and validation).

## Vercel Web

Vercel project:

- Project: `sequence-online`
- Root directory: `apps/web`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @sequence/web build`
- Production alias: `https://sequence-online.vercel.app`

Required Vercel environment variables:

- `NEXT_PUBLIC_API_URL=https://sequence-api-production-8687.up.railway.app`
- `NEXT_PUBLIC_WS_URL=wss://sequence-api-production-8687.up.railway.app`

The public `vercel.app` alias needs to be reachable for operator testing.

## Smoke Checks

After deploying, verify:

1. `GET /health` on the API returns `200` and `{"status":"ok"}`.
2. A WebSocket connection can open to the API `/trpc` endpoint.
3. Signup/login sets a session cookie and `health.me` succeeds.
4. Guest invite join sets the guest cookie.
5. Local pass-and-play can create a game and render the board.
6. Two browser contexts can share a remote game and receive move broadcasts.
7. Concede reaches game over in all connected contexts.
8. A 375px viewport shows the board, hand, and player rail without horizontal
   scrolling.
9. A forged-XFF invite preview/join burst cannot bypass the anonymous limiter.

## Production Constraints

The MVP intentionally runs one API instance. These are process-local:

- realtime rooms
- turn timers
- presence state
- anonymous and auth rate-limit buckets

Do not horizontally scale the API without introducing external pub/sub, durable
timer coordination, and distributed rate limiting.

Production currently keeps `TRUST_PROXY=false` because Railway forwarded enough
client-supplied `X-Forwarded-For` to make IP-keyed anonymous invite throttling
forgeable when proxy trust was enabled.

## Known Limitations

- Real physical-phone verification has not replaced the automated 375px mobile
  viewport pass.
- Social OAuth is supported in code (presence-gated) but left unconfigured in
  the production deployment.
- Anonymous invite preview/join traffic shares one anonymous limiter bucket.
- Server processing latency is measured with `Server-Timing`; total client
  round-trip can be higher because of edge and network paths.

## Operator Follow-Ups

- Revoke any legacy cloud service keys that are no longer needed.
- Configure social OAuth only when product requirements need it.
- Keep `AUTH_COOKIE_SAME_SITE=none` for the current Vercel-to-Railway
  cross-site deployment.
