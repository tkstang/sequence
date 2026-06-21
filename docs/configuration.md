# Configuration

This is the canonical environment-variable reference for Sequence Online. The
committed `.env.example` is the example template (variable names only, no real
values). For local API development, copy it to `packages/api/.env` — the API dev
script runs from `packages/api` with `node --env-file=.env`:

```bash
cp .env.example packages/api/.env
```

See `development.md` for the local workflow and `deployment.md` for the
production (Vercel web, Railway API, Neon Postgres) deployment. Cookie and auth
behavior is described in `architecture.md`.

The API validates its environment once at boot via the Zod schema in
`packages/api/src/env.ts`; a missing required variable or a malformed value
fails fast with a `ZodError` rather than surfacing later as a runtime error.

## Variable Reference

`Scope` is where a variable is read: **API** (validated by the API env schema),
**Web** (`NEXT_PUBLIC_*`, read in the browser/Next.js build), or **Deploy**
(used only by tooling/CI/deploy, not parsed by the API schema). `Required?`
marks whether the API refuses to boot without it.

| Variable | Scope | Required? | Default | Validation / Notes |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | API | Yes (API boot) | none | Non-empty string. Neon direct connection string (postgres.js), not the pooler. |
| `BETTER_AUTH_SECRET` | API | Yes (API boot) | none | String, min 32 chars (enforced at boot). Signs Better Auth sessions and game-scoped guest tokens. |
| `BETTER_AUTH_URL` | API | No | `http://localhost:3001` | Must be a valid URL. Public base URL Better Auth issues cookies/links against. |
| `WEB_ORIGIN` | API | No | `http://localhost:3000` | Must be a valid URL. Allowed credentialed CORS origin (the web app); also a Better Auth trusted origin. |
| `PORT` | API | No | `3001` | Coerced to a positive integer. HTTP listen port (`0.0.0.0`). |
| `NODE_ENV` | API | No | `development` | One of `development` \| `test` \| `production`. Drives logger level, cookie defaults, and the expiry sweep. |
| `TRUST_PROXY` | API | No | unset → `false` | String matching `true` \| `false` \| `0` \| positive integer; transformed to boolean/number. See below. |
| `AUTH_COOKIE_SAME_SITE` | API | No | `none` in production, else `lax` | One of `lax` \| `none`. See below. |
| `AUTH_COOKIE_SECURE` | API | No | derived from `NODE_ENV`/SameSite | One of `true` \| `false` \| `1` \| `0`; transformed to boolean. See below. |
| `DATABASE_URL_TEST` | API / Deploy | No | none | Non-empty string when set. Neon test-branch connection string; gates the integration suite and Playwright. See below. |
| `GITHUB_CLIENT_ID` | API | No | none | Non-empty string when set. Presence-gated (with secret) to enable GitHub OAuth. |
| `GITHUB_CLIENT_SECRET` | API | No | none | Non-empty string when set. Presence-gated (with id) to enable GitHub OAuth. |
| `GOOGLE_CLIENT_ID` | API | No | none | Non-empty string when set. Presence-gated (with secret) to enable Google OAuth. |
| `GOOGLE_CLIENT_SECRET` | API | No | none | Non-empty string when set. Presence-gated (with id) to enable Google OAuth. |
| `NEXT_PUBLIC_API_URL` | Web | No | `http://localhost:3001` | API origin for tRPC HTTP and Better Auth. Set to the public API origin in production. |
| `NEXT_PUBLIC_WS_URL` | Web | No | `ws://localhost:3001` | WebSocket origin for tRPC subscriptions. Set to the `wss://` API origin in production. |
| `RAILWAY_TOKEN` | Deploy | No | none | Railway deploy credential (shell env / CI). Not parsed by the API. |
| `VERCEL_TOKEN` | Deploy | No | none | Vercel deploy credential (shell env / CI). Not parsed by the API. |

Only `DATABASE_URL` and `BETTER_AUTH_SECRET` are required for the API to boot;
every other API variable has a default or is optional.

## `BETTER_AUTH_SECRET`

Required, and a minimum of 32 characters is enforced at boot
(`packages/api/src/env.ts:17`–`19`,
`'BETTER_AUTH_SECRET must be at least 32 characters'`). A weak or placeholder
secret fails fast. The secret signs Better Auth sessions and is also passed as
the guest-token signing secret (`packages/api/src/server.ts:163`,
`guestSecret: env.BETTER_AUTH_SECRET`). Generate one with `openssl rand -base64 32`.

## `AUTH_COOKIE_SAME_SITE` and `AUTH_COOKIE_SECURE`

These control the SameSite/Secure attributes on Better Auth session cookies and
the game-scoped guest cookie, resolved in
`packages/api/src/user/cookie-attributes.ts`.

- For the production cross-site shape (Vercel web on one registrable site,
  Railway API on another), use `AUTH_COOKIE_SAME_SITE=none` and
  `AUTH_COOKIE_SECURE=true`. Without these, credentialed tRPC calls and WS
  upgrades arrive without the session cookie.
- Use `AUTH_COOKIE_SAME_SITE=lax` only when web and API share one registrable
  site.

When unset, defaults are derived from `NODE_ENV`: SameSite is `none` in
production and `lax` otherwise; Secure defaults to true unless `NODE_ENV` is
`development` (and is always true when SameSite is `none`).

## `TRUST_PROXY`

Controls whether Fastify trusts the edge proxy's `X-Forwarded-For` when
resolving `request.ip`. When unset it resolves to `false`
(`packages/api/src/server.ts:234`–`236`,
`return env.TRUST_PROXY ?? false;`).

Production keeps it `false` because Railway was observed forwarding enough
client-supplied XFF that `TRUST_PROXY=1` let forged headers rotate the public
(IP-keyed) rate-limit buckets. Set a numeric hop count only after verifying the
edge overwrites — rather than appends — client-supplied XFF; `true` remains
available for verified private/shared proxy topologies.

## `DATABASE_URL` vs `DATABASE_URL_TEST`

`DATABASE_URL` is the production/dev Neon direct connection string and is
required for boot. `DATABASE_URL_TEST` is a separate Neon test-branch string;
it is optional in production but gates testing: the integration harness skips
cleanly when it is absent, and Playwright only starts its API/web servers when
`DATABASE_URL_TEST` is present (see `development.md`). Point `DATABASE_URL` at
production only for an intentional production deploy or migration.

## Social OAuth (`GITHUB_*`, `GOOGLE_*`)

Social providers are presence-gated: a provider registers only when both its
client id and secret are set (`packages/api/src/user/auth.ts:14`–`29`). The code
supports both GitHub and Google. A deploy without any OAuth credentials simply
offers email + password, which is the only method enabled for the MVP.

> **Known gap:** `.env.example` lists only the `GOOGLE_*` social variables, even
> though `env.ts` and the auth code also support `GITHUB_CLIENT_ID` /
> `GITHUB_CLIENT_SECRET`. This is an owner follow-up; `.env.example` is not
> changed here.
