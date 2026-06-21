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
- Keep `@sequence/game-logic` framework-free. Do not add React, Next, Fastify,
  database, network, or DOM imports there.
- Treat `packages/api` as the authority for auth, persistence, move validation,
  version guards, redaction, timers, and realtime subscriptions.
- The current board uses full card SVGs with contained image rendering. The
  symbolic/physical-board direction is backlog work, not current behavior.
- The dev-only UI playground is backlog work. Do not document `/dev` routes as
  existing until they are implemented.
