# Operator Pre-Flight Steps — web-mvp

*Standalone, actionable version of the checklist in `discovery.md` §Operator Pre-Flight. Complete all of this **before running `oat-project-implement`** so the build runs unblocked end-to-end. Exact env var names match `design.md` §Deployment → Configuration and the plan's p03/p07 tasks.*

## 1. Neon (database) — us-east-1

- [ ] Create a Neon project in **AWS us-east-1** (matches the Railway region decision).
- [ ] **Production branch** (default `main`): copy the **direct** connection string (NOT the `-pooler` variant) → this is `DATABASE_URL`.
- [ ] **Create a `test` branch** — the integration suite (p03-t08 onward) resets it per run. Copy its direct connection string → `DATABASE_URL_TEST`.
- [ ] Optional but recommended: a `dev` branch for local development if you want to keep `main` pristine → local `DATABASE_URL`.
- [ ] Optional: configure the Neon MCP server for the agent (nice for debugging, not required by the plan).

## 2. Better Auth (no external service — just secrets)

- [ ] Generate the secret: `openssl rand -base64 32` → `BETTER_AUTH_SECRET`.
- [ ] Decide launch auth scope: **email+password only** requires nothing more (recommended for MVP — social can be added later).
- [ ] If you want social at launch: create OAuth apps (e.g. Google/GitHub), collect client IDs/secrets. The API reads them config-gated by env presence (e.g. `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`).

## 3. Railway (API host)

- [ ] Create a Railway project + empty service in **US East**.
- [ ] Confirm the **"Serverless" sleep toggle is OFF** on the service (Settings → Deploy) — WebSockets need always-on.
- [ ] Create an API token (account or project scope) so the agent can deploy via CLI → store as `RAILWAY_TOKEN` in your shell env or `.env` (p07-t02 uses it).
- [ ] Nothing to deploy yet — p07 wires the Dockerfile and env.

## 4. Vercel (web host)

- [ ] Link the GitHub repo in Vercel; set the project root to `apps/web` (workspace-aware install). The directory doesn't exist yet — you can also defer linking to p07; what the agent needs is a **Vercel token** → `VERCEL_TOKEN`.
- [ ] No env vars needed in Vercel until p07-t03 (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` — values come from the Railway URL).

## 5. Local env files (what the agent reads during the build)

Create these (both gitignored — `.gitignore` covers `.env*` from p01-t01 onward; until then, do not commit them):

**`packages/api/.env`** *(directory exists after p01-t06; you can stage the file contents in a root `.env.preflight` the agent copies into place, or just create the dir now)*

```
DATABASE_URL=postgres://...          # Neon direct, dev or main branch
DATABASE_URL_TEST=postgres://...     # Neon direct, test branch
BETTER_AUTH_SECRET=...               # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3001
WEB_ORIGIN=http://localhost:3000
PORT=3001
```

**`apps/web/.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

**Deploy credentials** (shell env or root `.env`, never committed):

```
RAILWAY_TOKEN=...
VERCEL_TOKEN=...
```

## 6. GCP key revocation (security, independent of the build)

- [ ] **Revoke/delete the service-account key** committed as `firebase-service-key-sequence-staging.json` in the Google Cloud console (project: the old sequence staging Firebase project). The file is deleted from the working tree in p01-t10, but it lives in git history — revocation is the real mitigation. Decommission the Firebase project entirely if nothing else uses it.

## 7. Already done (no action)

- ✅ GitHub repo exists; agent owns workspace scaffolding (p01).
- ✅ OAT project `web-mvp` active: discovery/spec/design/plan complete, dispatch ceiling set.
- ✅ Bruno needs no setup — the agent scaffolds `bruno/` in p03-t10.
- ✅ TS7/tsgo, oxlint, oxfmt need no accounts — installed from npm in p01.

---

When every box above is checked, run **`oat-project-implement`**. It will confirm HiLL checkpoint selection (which phases pause for your review) before executing; p02+p03 run as a parallel group.
