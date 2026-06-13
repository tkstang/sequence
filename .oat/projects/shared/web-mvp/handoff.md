# web-mvp Deployment Handoff

**Status:** Railway API and Vercel web deployed; operator handoff ready
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

## Operator Test Script

Use these URLs:

- Web: `https://sequence-cyan.vercel.app`
- API health: `https://sequence-api-production-8687.up.railway.app/health`

Use disposable email/password accounts for manual testing. Email/password auth is enabled; social OAuth is intentionally unset until provider credentials are configured.

### Functional Checks

| ID | What to verify | Manual path |
| --- | --- | --- |
| FR1 | Accounts and sessions | Sign up, reload the dashboard, log out, log back in, and confirm protected pages redirect unauthenticated users to login. |
| FR2 | Game creation and settings | From `/dashboard`, create games with 2, 3, 4, and 6 players; try tap mode, hard drag mode, timer off, and timer on. Confirm invalid timer values are not offered. |
| FR3 | Invite and join | Create a remote game, copy the invite link from the lobby, open it in another browser/context, join once as a registered user and once as a guest. Guest join should set an API cookie and route to the game. |
| FR4 | Lobby and teams | In a 4-player or 6-player lobby, change teams, randomize teams, and kick a non-creator. Start should only succeed with a full legal team layout. |
| FR5 | Core rules | Play normal moves, jack moves, sequence completion, and dead-card turn-in paths. Detailed rule coverage is primarily automated in `packages/game-logic`; manual smoke should confirm the UI follows server-accepted moves. |
| FR6 | Real-time sync | Keep two browser contexts open on the same game. A move in one context should appear in the other without reload. Reload one context and confirm it recovers from the snapshot. |
| FR7 | Two play modes | In tap mode, select a card then a highlighted board cell. In hard mode, drag the chip to a legal target and confirm invalid targets do not commit. |
| FR8 | Turn timer | Create a timed game, let a turn expire, and confirm the server advances/forfeits the turn. Also check that disconnect/reconnect pauses and resumes timed play. |
| FR9 | Disconnect auto-save and rejoin | In a remote game, close one browser tab. The game should freeze/save. Reopen the game within the window and confirm play resumes once all original players return. |
| FR10 | Save and exit | Use Save & exit in an active logged-in game. Confirm it appears on the dashboard as resumable and can be resumed. |
| FR11 | Concede | Use Concede from an active game. All browsers should land on game over, and the result should identify the conceding team. |
| FR12 | Game over and rematch | Finish or concede a game, start a rematch, and confirm the new game keeps the roster/settings while rotating first player. |
| FR13 | In-game display | On desktop and mobile width, confirm round, turn, players, last-played card, sequence counts, timer when enabled, board, and hand are visible without horizontal scrolling. |
| FR14 | History and profile | Finish logged-in games and check `/history` for aggregate W-L, recent games, and head-to-head records. Local games should be labeled and excluded from aggregate/head-to-head records. |
| FR15 | Shell and navigation | Walk `/`, `/signup`, `/login`, `/dashboard`, `/create`, `/join/<code>`, `/game/<id>`, `/history`, and game-over/rematch navigation. |
| FR16 | Local pass-and-play | From `/dashboard`, choose Pass & play, name the opponent, play across at least two turns, and confirm the handoff screen hides the outgoing hand until the next player reveals it. Save/resume should work through the creator account. |

### Non-Functional Checks

| ID | Current status | Operator note |
| --- | --- | --- |
| NFR1 | Passed by automated unit/integration coverage | Crafted illegal moves and private-hand redaction are covered in the API/game-logic suites. |
| NFR2 | Open follow-up | Current production probes did not meet the ~500ms target for DB-backed game mutations. Re-test after performance work; do not treat this NFR as passed yet. |
| NFR3 | Passed in automated 375px viewport | A real phone pass was not performed; run one before broader playtesting. |
| NFR4 | Passed by `@sequence/game-logic` tests | Run `pnpm --filter @sequence/game-logic test` for the rules suite. |
| NFR5 | Passed for current repo/deploy posture | No secrets are recorded in this handoff. Keep env values in Railway/Vercel only and revoke the legacy GCP service key if still active. |
| NFR6 | Passed for MVP architecture | Current deployment uses Vercel web, one Railway API service, and Neon Postgres; no paid-tier-only service was introduced. |
| NFR7 | Passed by type gates during implementation | Run `pnpm typecheck` before opening a release PR. |

## Known Limitations

- Production NFR2 is not met by current probes. The likely next investigation is authenticated DB-backed route latency: session lookup, `gamePlayerProcedure`, `loadGameState`, per-seat hand updates, and event append all perform sequential database work.
- The 375px production pass used an automated Pixel 5 viewport, not a physical phone.
- Social OAuth is not configured. Email/password works without social provider env vars.
- Anonymous invite preview/join is intentionally protected by one shared anonymous bucket. This prevents forged-XFF bypasses on Railway but means anonymous invite bursts can throttle all anonymous preview/join traffic on the single API instance.
- Realtime rooms, turn timers, and rate-limit buckets are process-local. The MVP deploy runs one Railway API service instance; horizontal scaling would need external pub/sub, durable timer coordination, and distributed rate limiting.

## Operator Follow-Ups

- Revoke the legacy GCP service key if not already done.
- Configure social OAuth only when desired; email/password works without social provider env vars.
- Keep `AUTH_COOKIE_SAME_SITE=lax` only for a shared registrable-domain deployment. For Vercel-to-Railway cross-site hosting, keep `none`.
- Investigate and reduce production authenticated game-route latency before claiming NFR2 complete.
