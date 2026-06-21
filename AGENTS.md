<!-- OAT tools -->
## Tool Packs

- **Skills directory:** `.agents/skills/`
- **Discover available skills:** scan `.agents/skills/*/SKILL.md`
- **Refresh provider views:** `oat sync --scope all`
- **Update skills to latest versions:** `oat tools update`
- **User-scoped skills:** `~/.agents/skills/` (core packs installed at user scope)

### Installed Packs

- **core** — Diagnostics and documentation (oat-doctor, oat-docs) _(user scope)_
- **ideas** — Idea capture and refinement
- **docs** — Documentation and instruction governance workflows
- **project-management** — Local backlog, roadmap, and reference doc management (oat-pjm-* skills)
- **workflows** — Project lifecycle (create, discover, plan, implement, review, complete)
- **utility** — Standalone utilities (skill authoring, maintainability review, code reviews)
- **research** — Research, analysis, verification, and synthesis
- **brainstorm** — Always-on brainstorming entry point with visual companion

### Workflow Execution Continuation

- This guidance applies only to OAT project lifecycle execution, such as `oat-project-implement`, and OAT project review/receive flows. It does not apply to non-OAT tasks or ad-hoc work outside the OAT project workflow.
- When executing an OAT project implementation or OAT project review workflow, do not stop at task boundaries, phase boundaries, or other clean checkpoints unless the configured HiLL checkpoint has been reached, a real blocker exists, or explicit user input is required.
- Status summaries, completed bookkeeping, and "clean boundary" pauses are not valid stop reasons. After updating tracking artifacts, continue execution until an allowed stop condition applies.
<!-- END OAT tools -->

## Project Snapshot

Sequence Online is a pnpm + Node 24 monorepo with three runtime boundaries:
`apps/web` (Next.js App Router client), `packages/api` (Fastify + tRPC +
Drizzle/Postgres server), and `packages/game-logic` (framework-free rules engine
shared by both). Web deploys to Vercel, the API to Railway, the database to Neon.
Canonical commands live in `package.json`; see the gates below.

## Sequence Project Guidance

- Use Node `v24` from `.nvmrc` and pnpm `10.17.0+`.
- Keep secrets in ignored env files or provider settings. Never commit local
  `.env*` files other than `.env.example`.
- The API dev script runs from `packages/api`; create `packages/api/.env` from
  `.env.example` before using `pnpm --filter @sequence/api dev`.
- The web app defaults to `http://localhost:3001` and `ws://localhost:3001` for
  local API access. Only add `apps/web/.env.local` for non-default targets.
- Use these gates before PR-ready handoff when code changes are involved:
  `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, and
  `pnpm build`.
- For UI or gameplay-flow changes, also run the relevant web tests and
  `pnpm --filter @sequence/web e2e` when `DATABASE_URL_TEST` is available.
- Relative imports must include explicit `.ts`/`.tsx` extensions (e.g.
  `'../../db/schema/games.ts'`), and type-only imports must use `import type`.
  Both are required by `verbatimModuleSyntax` and by the native-Node runtime that
  runs the API's `.ts` directly (`node --experimental-transform-types`). Moving to
  absolute path-alias imports (`@db/schema/games`) is backlog work (`bl-3fcf`);
  until then, do not drop extensions or use unconfigured `@` aliases.
- Keep `@sequence/game-logic` framework-free. Do not add React, Next, Fastify,
  database, network, or DOM imports there.
- Treat `packages/api` as the authority for auth, persistence, move validation,
  version guards, redaction, timers, and realtime subscriptions.
- The current board uses full card SVGs with contained image rendering. The
  symbolic/physical-board direction is backlog work, not current behavior.
- The dev-only UI playground is backlog work. Do not document `/dev` routes as
  existing until they are implemented.

## Documentation

- Project documentation lives in `docs/`. Start at `docs/index.md`, which maps
  every page; update its `## Contents` section when adding, moving, or removing a
  page.
- Use `.md`-suffixed relative links between docs pages.
- Keep cross-cutting setup detail canonical and link to it rather than restating
  it: the environment reference lives in `docs/configuration.md`, the testing
  strategy in `docs/testing.md`.
- For a broad docs audit run `oat-docs-analyze`; to apply approved doc changes run
  `oat-docs-apply`. Do not hand-apply bulk documentation changes outside that flow.

## References

- `README.md` — repo layout, requirements, common commands, environment.
- `docs/index.md` — documentation map and entry point.
- `docs/architecture.md` — system boundaries, game data flow, auth/guests,
  realtime/timers, and production security notes.
- `docs/development.md` — local workflows, env files, test gates, Playwright, and
  the Drizzle database workflow.
- `docs/deployment.md` — Vercel/Railway/Neon runbook, env vars, and smoke checks.
- `apps/web/AGENTS.md`, `packages/api/AGENTS.md`,
  `packages/game-logic/AGENTS.md` — scoped guidance per workspace.
