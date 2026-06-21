# Sequence Online

Sequence Online is a web MVP for playing the Sequence board game online or as a
local pass-and-play game. It includes account sessions, guest invite joins,
lobby/team management, tap and drag play modes, timers, reconnect/freeze
behavior, save/resume, concede, rematch, and game history.

Current public MVP:

- Web: `https://sequence-online.vercel.app`
- API health: `https://sequence-api-production-8687.up.railway.app/health`

No secrets belong in this repository. Keep runtime values in local ignored env
files, Railway, Vercel, or Neon.

## Repository Layout

| Path | Purpose |
| --- | --- |
| `apps/web` | Next.js App Router client, game UI, auth pages, Playwright tests |
| `packages/api` | Fastify server, Better Auth, tRPC HTTP/WS API, persistence, timers |
| `packages/game-logic` | Pure TypeScript rules engine shared by API and web |
| `bruno` | Bruno API smoke collection for local auth/game requests |
| `docs` | Architecture, development, and deployment/operator documentation |
| `tools/git-hooks` | Local git hook installation and management scripts |

## Requirements

- Node from `.nvmrc` (`v24`)
- pnpm `10.17.0` or newer
- A Postgres/Neon connection string for API work
- Optional: a Neon test branch connection string for integration and Playwright
  tests

Install dependencies:

```bash
pnpm install
```

## Environment

The root `.env.example` lists all supported API and web variables.

For local API development, create a package-local env file because
`@sequence/api` scripts run from `packages/api` and use `node --env-file=.env`:

```bash
cp .env.example packages/api/.env
```

Fill in at least:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` with at least 32 characters
- `BETTER_AUTH_URL=http://localhost:3001`
- `WEB_ORIGIN=http://localhost:3000`

The web app defaults to `http://localhost:3001` and `ws://localhost:3001`, so
`apps/web/.env.local` is only needed when pointing at a non-default API.

## Local Development

Run the API and web app in separate terminals:

```bash
pnpm --filter @sequence/api dev
pnpm --filter @sequence/web dev
```

Open `http://localhost:3000`.

Useful routes:

- `/` for the public landing page
- `/signup` and `/login` for email/password auth
- `/dashboard` for saved/resumable games
- `/create` for new remote or pass-and-play games
- `/join/<invite-code>` for invite preview and join
- `/game/<game-id>` for active play
- `/history` for logged-in aggregate records

## Common Commands

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
```

Package-specific commands:

```bash
pnpm --filter @sequence/game-logic test
pnpm --filter @sequence/api test
pnpm --filter @sequence/web test
pnpm --filter @sequence/web e2e
```

`pnpm --filter @sequence/web e2e` loads the root `.env` and only starts its API
and web servers when `DATABASE_URL_TEST` is present. The suite runs one worker
against desktop Chromium and a 375px mobile viewport.

## Database and Migrations

Drizzle migrations live in `packages/api/drizzle`.

Generate migration SQL from schema changes:

```bash
pnpm --filter @sequence/api exec drizzle-kit generate
```

Apply migrations to the connection in `DATABASE_URL`:

```bash
pnpm --filter @sequence/api exec drizzle-kit migrate
```

For local verification, point `DATABASE_URL` at the Neon test branch or another
disposable database. Do not run local experiments against production.

## API Smoke Requests

The Bruno collection in `bruno/` exercises the local Better Auth and tRPC HTTP
surfaces. Start the API first, then open the collection in Bruno with the
`local` environment. See `bruno/README.md`.

## More Documentation

Start at [`docs/index.md`](docs/index.md) for the full documentation map. Key pages:

- `docs/architecture.md` - system boundaries and request/event flow
- `docs/game-rules.md` - the Sequence ruleset as implemented
- `docs/development.md` - local workflows, testing, and UI iteration
- `docs/configuration.md` - environment-variable reference
- `docs/deployment.md` - Railway/Vercel deployment and operator checks
- `docs/api-reference.md` - tRPC API reference
- `docs/game-logic-reference.md` - rules engine API
- `docs/data-model.md` - database schema reference
- `docs/testing.md` - test layers and the test-database workflow
- `CONTRIBUTING.md` - contributor guide, quality gates, and commit convention
- `apps/web/README.md`, `packages/api/README.md`, `packages/game-logic/README.md` - package details
- `bruno/README.md`, `tools/git-hooks/README.md` - API smoke collection and git hooks
