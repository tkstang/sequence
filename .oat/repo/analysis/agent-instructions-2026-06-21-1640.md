---
oat_generated: true
oat_generated_at: 2026-06-21
oat_analysis_type: agent-instructions
oat_analysis_mode: full
oat_analysis_providers: [agents_md, claude, codex, cursor]
oat_analysis_commit: bdef3ed
---

# Agent Instructions Analysis: sequence

**Date:** 2026-06-21
**Mode:** full
**Providers:** agents_md, claude, codex, cursor
**Commit:** bdef3ed

## Bundle Outputs

The companion bundle for this analysis lives beside the markdown artifact and is the primary generation contract for
`oat-agent-instructions-apply` when present.

| Path                                                                  | Purpose                                       |
| --------------------------------------------------------------------- | --------------------------------------------- |
| `.oat/repo/analysis/agent-instructions-2026-06-21-1640.md`            | Human-readable review artifact                |
| `.oat/repo/analysis/agent-instructions-2026-06-21-1640.bundle/summary.md`           | Compact bridge summary for apply-time context |
| `.oat/repo/analysis/agent-instructions-2026-06-21-1640.bundle/recommendations.yaml` | Manifest of executable recommendations        |
| `.oat/repo/analysis/agent-instructions-2026-06-21-1640.bundle/packs/`               | Recommendation-scoped packs                   |

Every recommendation below includes a stable `Recommendation ID` that maps to exactly one pack file.

## Summary

- **Files evaluated:** 2 (`AGENTS.md`, `bruno/AGENTS.md`)
- **Coverage:** ~40% of assessed directories have instruction files (2 of 5: root + `bruno/` covered; `apps/web`, `packages/api`, `packages/game-logic` uncovered)
- **Findings:** 0 Critical, 3 High, 4 Medium, 2 Low
- **Delta scope:** N/A (full mode — no prior `agentInstructions` tracking entry)
- **Evidence-backed recommendations:** 11
- **Open questions / ask-user items:** 1 (whether to add dedicated test-authoring glob rules vs. folding the conventions into scoped `AGENTS.md` files)

**Headline:** The repository is documentation-rich (4 docs pages + 4 READMEs, all current and high quality) but
instruction-thin. A single 49-line root `AGENTS.md` carries the entire monorepo, and the three substantial workspace
units — a Next.js web app, a Fastify/tRPC/Drizzle API, and a framework-free rules engine — have **no scoped
instruction files**. The `claude` provider is active but **no `CLAUDE.md` shim exists anywhere**, so Claude Code never
imports the canonical `AGENTS.md`. The biggest agent-correctness risks are: (1) a non-obvious repo-wide import
convention (explicit `.ts`/`.tsx` extensions + `import type`), and (2) a three-way test-runner split (Playwright e2e
`.spec.ts` vs. vitest+jsdom `.test.tsx` vs. vitest-node `.test.ts`) that an agent will guess wrong without guidance.

## Documentation Inventory

Available documentation surfaces discovered in this repository. These are high-value link targets — every scoped
instruction file should link to its package README and the relevant `docs/` page rather than restating their content.

| #   | Type       | Path                            | Topics/Scope                                                              | Current? | Notes                                          |
| --- | ---------- | ------------------------------- | ------------------------------------------------------------------------ | -------- | ---------------------------------------------- |
| 1   | standalone | `docs/architecture.md`          | Workspace boundaries, game data flow, auth/guests, realtime/timers, security notes | current  | Strong system map; not referenced by `AGENTS.md` |
| 2   | standalone | `docs/development.md`           | Install, env files, run-local, test gates, Playwright, DB workflow, UI iteration | current  | Mirrors `AGENTS.md` command guidance in more depth |
| 3   | standalone | `docs/deployment.md`            | Vercel/Railway/Neon runbook, env vars, smoke checks, security constraints | current  | Operator-facing; security-relevant (`TRUST_PROXY`) |
| 4   | readme     | `README.md`                     | Repo layout, requirements, env, common commands, DB, links               | current  | Repo-root overview; links all docs + READMEs   |
| 5   | readme     | `apps/web/README.md`            | Web responsibilities, routes table, commands, testing, game UI notes     | current  | Package-level; ideal link target for `apps/web` scoped file |
| 6   | readme     | `packages/api/README.md`        | API responsibilities, env, tRPC routers, persistence/migrations, runtime notes | current  | Package-level; documents route-per-action + `TRUST_PROXY` |
| 7   | readme     | `packages/game-logic/README.md` | Responsibilities, public surface, commands, **Design Rules**             | current  | "Design Rules" already captures the engine conventions |

No knowledge base (`.oat/repo/knowledge/`) exists. No `ARCHITECTURE.md`/`CONTRIBUTING.md`/ADR directories at root.
`.github/` instruction surfaces are absent (copilot provider is disabled in `.oat/sync/config.json`).

## Instruction File Inventory

| #   | Provider  | Format    | Path              | Lines | Bytes | Quality            |
| --- | --------- | --------- | ----------------- | ----- | ----- | ------------------ |
| 1   | agents_md | AGENTS.md | `AGENTS.md`       | 49    | 3078  | minor issues       |
| 2   | agents_md | AGENTS.md | `bruno/AGENTS.md` | 15    | 675   | pass (minor: no README link) |

No `CLAUDE.md`, `.claude/rules/*.md`, `.cursor/rules/*.mdc`, or `.github/**` instruction files exist (verified via
repo-wide `find`). `codex` reads `AGENTS.md` natively; `cursor` reads `AGENTS.md` natively; `claude` requires a
`CLAUDE.md` shim (see Provider Baseline Gaps).

## Instruction Load Budget

Computed task-load scenarios. The cross-provider ceiling is 32 KiB combined instruction content.

| Scenario                | Includes                                                  | Size     | Assessment       | Notes                                                            |
| ----------------------- | --------------------------------------------------------- | -------- | ---------------- | --------------------------------------------------------------- |
| Always-on baseline load | root `AGENTS.md` (+ proposed `CLAUDE.md` `@AGENTS.md` shim) | ~3.1 KB  | healthy          | Shim adds only the import line; effective load is `AGENTS.md`    |
| Typical task load       | root `AGENTS.md` + one scoped `AGENTS.md` (e.g. `apps/web`, est. ~3–4 KB) | ~6–7 KB  | healthy          | Most common working set once scoped files exist                 |
| Worst-case task load    | root + `packages/api/AGENTS.md` (est. ~4–5 KB) + one glob rule (~2 KB) | ~10 KB   | healthy          | Deepest realistic working set; still well under 32 KiB          |
| Aggregate repo total    | all current instruction files (`AGENTS.md` + `bruno/AGENTS.md`) | 3.75 KB  | awareness only   | After adding all recommendations, total stays comfortably < 32 KiB |

Budget is not a constraint here — the repo is far under budget. The opportunity is **coverage**, not trimming.

## Existing Rule Validation

No existing glob-scoped rules (`.claude/rules/*.md`, `.cursor/rules/*.mdc`, `.github/instructions/*`) exist to
validate. The two `AGENTS.md` files were validated for command/claim accuracy under Findings.

Spot-validation of root `AGENTS.md` claims (all **verified accurate**):

- Gates `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build` — all present in root `package.json:scripts`.
- `pnpm --filter @sequence/api dev` — present (`packages/api/package.json:scripts.dev`).
- `pnpm --filter @sequence/web e2e` gated on `DATABASE_URL_TEST` — verified (`apps/web/playwright.config.ts:10,43`).
- Web defaults `http://localhost:3001` / `ws://localhost:3001` — verified (`docs/development.md:30-31`; `NEXT_PUBLIC_API_URL` default).
- "Never commit `.env*` other than `.env.example`" — verified: `.gitignore:28-29` ignores `.env*` and re-includes `.env.example`; `git ls-files` confirms only `.env.example` is tracked.
- `@sequence/game-logic` framework-free — verified (`packages/game-logic/package.json` deps: only `zod`).
- `/dev` playground + symbolic board are backlog, not implemented — verified (`docs/development.md:114-120`).

## Findings

### Critical

None.

### High

1. **`claude` provider active but no `CLAUDE.md` shim exists (root)**
   - File: `CLAUDE.md` (missing); evidence `.oat/sync/config.json` (`claude.enabled: true`), `AGENTS.md:1`
   - Issue: Claude Code loads `CLAUDE.md` as project memory, not `AGENTS.md`. With no `CLAUDE.md`, Claude Code never imports the canonical instructions — the entire `AGENTS.md` is invisible to the active `claude` provider. `oat sync` only manages skill/agent symlinks (`.oat/sync/manifest.json` contains only `contentType: skill|agent`), so it does **not** generate this shim automatically.
   - Evidence: `.oat/sync/manifest.json` (all 124 entries are `contentType: skill|agent` — 116 skill + 8 agent across all providers; zero `contentType: instruction` entries, and none target `AGENTS.md`/`CLAUDE.md`); `find` confirms no `CLAUDE.md` repo-wide.
   - Confidence: high
   - Disclosure: inline (canonical `@AGENTS.md` import)
   - Fix: Create `CLAUDE.md` containing `@AGENTS.md` plus any Claude-only additions. See `rec-002`.

2. **`apps/web/` (Next.js web app) has no scoped instruction file**
   - File: `apps/web/AGENTS.md` (missing)
   - Issue: The web app is a semi-independent unit with its own build config (`next.config.ts`, `playwright.config.ts`, `vitest.config.ts`, `tsconfig.json`), a different runtime (browser / Next.js 16 / React 19) from the API, a public route surface, and a **distinct test setup** (vitest+jsdom+Testing Library vs. the API's node integration harness). An agent working from the root `AGENTS.md` alone has no guidance on the component-test setup, the type-only `AppRouter` import boundary, or the e2e/component/unit test split.
   - Evidence: `apps/web/package.json` (Next 16, React 19, tRPC client, Tailwind 4, Playwright); `apps/web/vitest.config.ts:13-19` (jsdom + setup); `docs/architecture.md:14-27` (web imports `AppRouter` as a **type**, no API runtime in browser; lazy WS).
   - Confidence: high
   - Disclosure: inline (thin delta) + link_only to `apps/web/README.md`, `docs/architecture.md`, `docs/development.md`
   - Fix: Create `apps/web/AGENTS.md`. See `rec-004`.

3. **`packages/api/` (Fastify/tRPC/Drizzle API) has no scoped instruction file**
   - File: `packages/api/AGENTS.md` (missing)
   - Issue: This is the largest, most domain-dense, most security-sensitive unit (≈80 source files): its own build config (`Dockerfile`, `drizzle.config.ts`, `vitest.config.ts`), a public tRPC API surface, and several **non-obvious invariants** an agent would otherwise miss — per-recipient redaction (never serialize other seats' hands/deck), optimistic-concurrency version guards, rate limiters keying on `ctx.ip` (never hand-parsed XFF), route-per-action layout, a single-fork integration harness, and the migration-before-commit Drizzle workflow. The root `AGENTS.md:44-45` summarizes this as one line ("Treat `packages/api` as the authority for auth, persistence, move validation, version guards, redaction, timers, and realtime subscriptions") — accurate but far too thin for safe edits.
   - Evidence: `packages/api/src/shared/realtime/redaction.ts:1-13,54-79` (redaction invariant, NFR1); `packages/api/src/trpc.ts:40-47,176-188` (IP must come from `ctx.ip`, not raw XFF); `packages/api/src/game/routes/` (15 route files, one per action); `packages/api/src/test/harness.ts` (`createHarness`, `DATABASE_URL_TEST`, db-lock); `packages/api/vitest.config.ts:21-32` (singleFork serialization).
   - Confidence: high
   - Disclosure: inline (delta) + link_only to `packages/api/README.md`, `docs/architecture.md`, `docs/deployment.md`
   - Fix: Create `packages/api/AGENTS.md`. See `rec-006`.

### Medium

4. **Root `AGENTS.md` salience: project snapshot, canonical commands, and non-negotiables sit below 26 lines of OAT tooling boilerplate**
   - File: `AGENTS.md:1-26` (OAT "Tool Packs" block) vs. `AGENTS.md:28-49` (Sequence project guidance)
   - Issue: The first screenful is the tool-managed OAT "Tool Packs" / "Workflow Execution Continuation" block. The project's own snapshot, canonical commands, and security non-negotiable (secrets) only begin at line 28. Per the positional-recall ("lost in the middle") constraint, canonical commands and non-negotiables should lead. There is also no 2–4 line project snapshot ("what this repo is") and no canonical-command code block — commands are described in prose.
   - Evidence: `AGENTS.md:1-26`; `references/docs/agent-instruction.md` §3.2, §6 (salience rule), §7.1–7.4.
   - Confidence: high
   - Disclosure: inline
   - Fix: Add a project snapshot + canonical-command block as the first **project** section (the OAT block is tool-managed and may remain), and ensure the secrets non-negotiable stays salient. See `rec-001`.

5. **Repo-wide import convention (explicit `.ts`/`.tsx` extensions + `import type`) is undocumented**
   - File: `AGENTS.md` (no "Code Style & Conventions" section)
   - Issue: Relative imports use **explicit `.ts`/`.tsx` extensions** (e.g. `import { games } from '../../db/schema/games.ts'`), enabled by `tsconfig.base.json` (`allowImportingTsExtensions`, `moduleResolution: bundler`, `verbatimModuleSyntax`). `verbatimModuleSyntax` also **requires** `import type` for type-only imports. Both are non-obvious — most TypeScript projects omit extensions and allow value-position type imports — so an agent will routinely produce code that fails `pnpm typecheck`/`pnpm lint`. This is invisible in the current instructions.
   - Evidence (exhaustive counts): 332/332 relative imports in `packages/api/src` + `packages/game-logic/src` carry an explicit `.ts` extension (0 without); `apps/web/src` adds 83 explicit-extension relative imports alongside 44 `@/`-alias imports; 110 `import type` statement lines (145 including inline `import { type … }` specifiers) across the three units; `tsconfig.base.json:10-11`.
   - Confidence: high
   - Disclosure: inline (root `AGENTS.md`, 2–3 lines)
   - Fix: Add a short Code Style section to root `AGENTS.md`. See `rec-001`.

6. **`packages/game-logic/` (rules engine) has no scoped instruction file**
   - File: `packages/game-logic/AGENTS.md` (missing)
   - Issue: A distinct domain (the authoritative Sequence rules engine) with conventions the root does not state: return **typed rule violations instead of throwing** for expected illegal moves, thread an injected `Rng` for determinism, and add public APIs via `src/index.ts` (not deep imports). The root `AGENTS.md:43` states only the framework-free rule. The marginal value over `packages/game-logic/README.md` ("Design Rules") is modest, so the scoped file should be a thin delta that links to the README.
   - Evidence: `packages/game-logic/README.md:46-52` (Design Rules); `packages/api/src/game/routes/create-game.ts:1` (imports `createGame` from `@sequence/game-logic` public surface).
   - Confidence: high
   - Disclosure: link_only-heavy (link `packages/game-logic/README.md`); minimal inline delta
   - Fix: Create a thin `packages/game-logic/AGENTS.md`. See `rec-008`.

7. **Nested `CLAUDE.md` shim missing for `bruno/`**
   - File: `bruno/CLAUDE.md` (missing); `bruno/AGENTS.md` exists
   - Issue: Per provider-baseline policy, every directory with an `AGENTS.md` should have a matching `CLAUDE.md` `@AGENTS.md` import when `claude` is active, so Claude Code picks up the scoped guidance when working under `bruno/`.
   - Evidence: `bruno/AGENTS.md:1`; `.oat/sync/config.json` (`claude.enabled: true`).
   - Confidence: high
   - Disclosure: inline (`@AGENTS.md`)
   - Fix: Create `bruno/CLAUDE.md`. See `rec-003`.

### Low

8. **Root `AGENTS.md` has no References section linking the docs/ tree or READMEs (Criterion 14)**
   - File: `AGENTS.md` (no References section)
   - Issue: The repo has four current, high-quality docs pages and four READMEs, but the always-on instructions point to none of them. Adding a short References block enables progressive disclosure (link instead of inline).
   - Evidence: `docs/architecture.md`, `docs/development.md`, `docs/deployment.md`, `README.md`, package READMEs (all current).
   - Confidence: high
   - Disclosure: link_only
   - Fix: Folded into `rec-001` (add References section).

9. **`bruno/AGENTS.md` does not reference `bruno/README.md` (Criterion 14)**
   - File: `bruno/AGENTS.md:1-15`
   - Issue: Minor — the scoped file is otherwise clean (concise, no duplication, real divergence) but omits a link to its own package README.
   - Evidence: `bruno/AGENTS.md`; `bruno/README.md` (referenced from `docs/development.md:132` and `README.md:127`).
   - Confidence: high (`bruno/README.md` confirmed present at the analysis commit, 1.5 KB; also referenced by `README.md:127` and `docs/development.md:132`)
   - Disclosure: link_only
   - Fix: Add a one-line README reference. Optional; low priority.

## Provider Baseline Gaps

Missing always-on provider compatibility files. `codex` and `cursor` read `AGENTS.md` natively (no shim required);
`copilot` and `gemini` are disabled in `.oat/sync/config.json`. Only `claude` needs shims.

| #   | Provider | Required Path                  | Format             | Reason                                                            | Evidence                                                   | Severity |
| --- | -------- | ------------------------------ | ------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------- | -------- |
| 1   | claude   | `CLAUDE.md`                    | Claude import shim | claude active + root `AGENTS.md` present + shim missing + not sync-generated | `.oat/sync/config.json`; `AGENTS.md:1`; `.oat/sync/manifest.json` | High     |
| 2   | claude   | `bruno/CLAUDE.md`              | Claude import shim | claude active + `bruno/AGENTS.md` present + shim missing          | `bruno/AGENTS.md:1`                                        | Medium   |
| 3   | claude   | `apps/web/CLAUDE.md`           | Claude import shim | chained: created with the new `apps/web/AGENTS.md`               | (depends on `rec-004`)                                     | Medium   |
| 4   | claude   | `packages/api/CLAUDE.md`       | Claude import shim | chained: created with the new `packages/api/AGENTS.md`          | (depends on `rec-006`)                                     | Medium   |
| 5   | claude   | `packages/game-logic/CLAUDE.md`| Claude import shim | chained: created with the new `packages/game-logic/AGENTS.md`   | (depends on `rec-008`)                                     | Low      |

## Coverage Gaps

### Directory Coverage

Directories assessed (full mode, all depths) as needing instruction files but currently uncovered. Excluded after
assessment: `docs/` (documentation target, not code), `scripts/worktree/` and `tools/git-hooks/` (small self-contained
utilities that follow root conventions with nothing distinct to capture), and tooling dirs (`.oat`, `.agents`,
`.claude`, `.cursor`, `.codex`, `node_modules`, `.next`).

| #   | Directory               | Reason                                                                                                  | Evidence                                                                                  | Disclosure                | Link Target                                                        | Severity |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------ | -------- |
| 1   | `apps/web/`             | Own build config; different runtime (browser/Next 16/React 19); public route surface; distinct test setup (jsdom+RTL) | `apps/web/package.json`; `apps/web/vitest.config.ts:13-19`; `docs/architecture.md:14-27` | inline delta + link_only  | `apps/web/README.md`, `docs/architecture.md`, `docs/development.md` | High     |
| 2   | `packages/api/`         | Own build config; public tRPC API surface; distinct domain; security-sensitive invariants (redaction, IP, version guards) | `packages/api/src/shared/realtime/redaction.ts`; `packages/api/src/trpc.ts:40-47`; `packages/api/src/game/routes/` | inline delta + link_only  | `packages/api/README.md`, `docs/architecture.md`, `docs/deployment.md` | High     |
| 3   | `packages/game-logic/`  | Distinct domain (rules engine); conventions root omits (typed violations, `Rng` injection, `index.ts` public surface) | `packages/game-logic/README.md:46-52`                                                     | link_only-heavy           | `packages/game-logic/README.md`                                    | Medium   |

Nested concerns (route-per-action `packages/api/src/game/routes/`, drizzle schema `packages/api/src/db/schema/`,
realtime redaction `packages/api/src/shared/realtime/`, game UI `apps/web/src/app/game/[id]/components/`, e2e
`apps/web/e2e/`) are intentionally **folded into the package-level scoped files and the glob opportunities below**
rather than spun out as separate nested `AGENTS.md` files — this respects anti-sprawl for a repo of this size.

### Glob-Scoped Rule Opportunities

Discovered via the file-type pattern process. Inventory: 128 `.ts`, 50 `.tsx`, plus compound suffixes `.test.ts` (42),
`.test.tsx` (17), `.spec.ts` (4), `.router.ts` (2), `.config.ts` (5).

| #   | Pattern                              | Count | Consistency | Competing Sub-Patterns                                                  | Convention Summary                                                                                          | Correctness Impact                                  | Exception to Project Rule? | Recommended Action                                  | Evidence                                                                 | Disclosure | Severity |
| --- | ------------------------------------ | ----- | ----------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------ | ---------- | -------- |
| 1   | test files (`.test.ts` / `.test.tsx` / `.spec.ts`) | 63    | 3-way split by runner | e2e `apps/web/e2e/*.spec.ts` (Playwright, 4) · web component `src/**/*.test.tsx` (vitest jsdom+RTL, 17) · api integration `packages/api/src/**/*.test.ts` (harness, 24; 9 in `routes/`) · game-logic `src/*.test.ts` (pure vitest, 13) | Location + suffix select the runner: Playwright `testDir: ./e2e` only picks `e2e/`; web vitest `include: src/**/*.test.{ts,tsx}` **excludes** e2e; component tests need jsdom+`vitest.setup.ts`; api integration tests need `createHarness()` + `DATABASE_URL_TEST` + single-fork serialization | **Crashes/wrong runner**: an e2e test named `*.test.ts` runs under vitest/jsdom (no browser) and fails; a component test without jsdom setup throws; an api test without the harness can't reach the DB | No (project has no single test rule) | Capture in scoped `AGENTS.md` (web + api); optionally split into glob rules (`rec-010`, ask_user) | `apps/web/playwright.config.ts:16-58`; `apps/web/vitest.config.ts:13-19`; `packages/api/vitest.config.ts:14-32`; `packages/api/src/test/harness.ts` | inline / ask_user | High     |
| 2   | relative imports in `**/*.{ts,tsx}`  | ~415  | 100% (api+game-logic 332/332; web 83 relative) | web also offers `@/` alias (44) | Relative imports carry explicit `.ts`/`.tsx` extension; type-only imports use `import type` (`verbatimModuleSyntax`) | **Lint/typecheck failure** if extension omitted or `import type` not used | Yes — overrides the common TS norm of extensionless imports | Document in root `AGENTS.md` Code Style (`rec-001`); glob rule optional | `tsconfig.base.json:10-11`; 332-import exhaustive count; 110 `import type` statement lines | inline     | Medium   |
| 3   | api route-per-action `packages/api/src/game/routes/*.ts` | 15 (+9 tests) | 15/15 one action per file | — | Each file exports `<action>Route` built from `authedProcedure`/`gamePlayerProcedure`/`publicProcedure` with `.input(zodSchema).mutation\|query(...)`; multi-write paths use `ctx.db.transaction`; throw `TRPCError` (rule violations flow through the error formatter) | Wrong base procedure → broken authz; missing version guard → stale-write bug | No | Capture in `packages/api/AGENTS.md` (`rec-006`); glob rule optional | `packages/api/src/game/routes/create-game.ts:62-148`; `packages/api/src/trpc.ts:224-304`; `packages/api/README.md:49-59` | inline     | Medium   |
| 4   | component co-location `apps/web/src/**/*.tsx` | 50    | high | leaf components are prop-driven; some routes co-locate `*.test.tsx`, `*.utils.ts` | `Component.tsx` + co-located `Component.test.tsx`; leaf game UI components are prop-driven (`GameSnapshotView`); no React import needed (automatic JSX runtime, `react/react-in-jsx-scope: off`) | Style/behavioral consistency; non-prop-driven leaf breaks future fixture/playground reuse | No | Capture in `apps/web/AGENTS.md` (`rec-004`) | `apps/web/src/app/game/[id]/components/` tree; `docs/architecture.md:94-108`; `.oxlintrc.json:24` | inline     | Low      |
| 5   | drizzle schema/migrations `packages/api/src/db/schema/*.ts` + `drizzle/*.sql` | 5 schema + 4 SQL | n/a | — | Schema in `src/db/schema`; SQL migrations are **generated** (`drizzle-kit generate`) into `drizzle/`, never hand-edited; `drizzle/` is lint/format-ignored | Hand-editing generated SQL or skipping `generate` → schema drift / failed predeploy migrate | Yes — `drizzle/` is generated, excluded from oxlint/oxfmt | Capture migration workflow in `packages/api/AGENTS.md` (`rec-006`) | `docs/development.md:92-110`; `.oxlintrc.json:30`; `.oxfmtrc.json:13`; `packages/api/drizzle/` | inline     | Low      |

**Note on formatting/lint:** oxfmt (`singleQuote`, `semi`, `trailingComma: all`, `printWidth: 80`, `tabWidth: 2`,
`sortImports`, `sortTailwindcss`) and oxlint fully enforce style. Per Criterion 11, instruction files must **reference
the commands** (`pnpm format`, `pnpm lint`) and **not restate** quote/semi/width/import-order trivia. The current
`AGENTS.md` correctly omits these — keep it that way.

## Cross-Format Consistency

Single instruction format in use today (`AGENTS.md` only; no provider-specific glob rules exist). Cross-format body
consistency is **not yet applicable**. It becomes relevant only if `rec-010` adds provider-specific test/import glob
rules across `.claude/rules/` and `.cursor/rules/` — at which point apply must keep rule bodies byte-identical and vary
only frontmatter.

| Rule Target | Claude Body | Cursor Body | Status            |
| ----------- | ----------- | ----------- | ----------------- |
| (none)      | N/A         | N/A         | not applicable yet |

## Progressive Disclosure Decisions

| Topic                                   | Decision  | Keep Inline In                       | Link Target                                   | Evidence                                  |
| --------------------------------------- | --------- | ------------------------------------ | --------------------------------------------- | ----------------------------------------- |
| Canonical commands / gates              | inline    | root `AGENTS.md`                      | `docs/development.md`                          | `AGENTS.md:37-41`; `package.json:scripts` |
| Secrets / env non-negotiable            | inline    | root `AGENTS.md`                      | —                                             | `AGENTS.md:31-36`; `.gitignore:27-29`     |
| Import convention (`.ts` ext + `import type`) | inline | root `AGENTS.md` (Code Style)        | `tsconfig.base.json`                           | `tsconfig.base.json:10-11`                |
| Full architecture / data flow           | link_only | scoped files                         | `docs/architecture.md`                         | `docs/architecture.md`                    |
| Deployment / env vars / smoke checks    | link_only | `packages/api/AGENTS.md`             | `docs/deployment.md`                           | `docs/deployment.md`                      |
| Redaction invariant (NFR1)              | inline    | `packages/api/AGENTS.md`             | `packages/api/src/shared/realtime/redaction.ts` | `redaction.ts:1-13`                       |
| Web test split (jsdom vs e2e vs node)   | inline    | `apps/web/AGENTS.md`                 | `apps/web/README.md`, `docs/development.md`     | `apps/web/vitest.config.ts`               |
| Rules-engine design rules               | link_only | `packages/game-logic/AGENTS.md`      | `packages/game-logic/README.md`                | `README.md:46-52`                         |
| Drizzle migration workflow              | inline    | `packages/api/AGENTS.md`             | `docs/development.md`                           | `docs/development.md:92-110`              |

## Recommendations

Prioritized. Each maps to one pack under `.oat/repo/analysis/agent-instructions-2026-06-21-1640.bundle/packs/`.

1. **Enhance root `AGENTS.md`** — add a 2–4 line project snapshot, a canonical-command block, a short Code Style section (explicit `.ts`/`.tsx` import extensions + `import type`), and a References section to docs/READMEs (addresses findings #4, #5, #8)
   - Recommendation ID: `rec-001`
   - Target: `AGENTS.md`
   - Provider/Format: agents_md / AGENTS.md
   - Bundle Pack: `packs/rec-001.md`
   - Evidence: `AGENTS.md:1-49`; `tsconfig.base.json:10-11`; `package.json:scripts`; `docs/*`
   - Confidence: high
   - Disclosure: inline
   - Link Targets: `docs/architecture.md`, `docs/development.md`, `docs/deployment.md`, package READMEs
   - Content Guidance: Keep the OAT `<!-- OAT tools -->` block intact (tool-managed). Add project sections after it (or a snapshot line at the very top). Do not restate oxfmt/oxlint-enforced style.
   - Must Include: project snapshot (pnpm workspace: web + api + game-logic); canonical commands (`pnpm install`, gates); import convention (explicit `.ts`/`.tsx` + `import type`); References to the 4 docs + 4 READMEs.
   - Must Not Include: quote/semi/width/import-order prose (oxfmt-enforced); duplicated README content.
   - Preferred Default for New Files: N/A
   - Claim Corrections: none (existing claims verified accurate)

2. **Create root `CLAUDE.md` shim** — `@AGENTS.md` import so the active claude provider loads canonical instructions (addresses finding #1, baseline gap #1)
   - Recommendation ID: `rec-002`
   - Target: `CLAUDE.md`
   - Provider/Format: claude / CLAUDE.md import shim
   - Bundle Pack: `packs/rec-002.md`
   - Evidence: `.oat/sync/config.json`; `AGENTS.md:1`; `.oat/sync/manifest.json`
   - Confidence: high
   - Disclosure: inline
   - Link Targets: `AGENTS.md`
   - Content Guidance: Minimal — a single `@AGENTS.md` import line; add Claude-only notes only if needed.
   - Must Include: `@AGENTS.md`
   - Must Not Include: any duplication of `AGENTS.md` content.
   - Preferred Default for New Files: N/A
   - Claim Corrections: none

3. **Create `bruno/CLAUDE.md` shim** — `@AGENTS.md` import for the bruno subtree (addresses finding #7, baseline gap #2)
   - Recommendation ID: `rec-003`
   - Target: `bruno/CLAUDE.md`
   - Provider/Format: claude / CLAUDE.md import shim
   - Bundle Pack: `packs/rec-003.md`
   - Evidence: `bruno/AGENTS.md:1`; `.oat/sync/config.json`
   - Confidence: high
   - Disclosure: inline
   - Link Targets: `bruno/AGENTS.md`
   - Content Guidance: Single `@AGENTS.md` import (resolves to `bruno/AGENTS.md` by directory).
   - Must Include: `@AGENTS.md`
   - Must Not Include: duplication of `bruno/AGENTS.md`.
   - Preferred Default for New Files: N/A
   - Claim Corrections: none

4. **Create `apps/web/AGENTS.md`** — scoped web delta: test split, type-only `AppRouter` boundary, prop-driven leaf components, lazy WS (addresses finding #2, coverage gap #1)
   - Recommendation ID: `rec-004`
   - Target: `apps/web/AGENTS.md`
   - Provider/Format: agents_md / AGENTS.md
   - Bundle Pack: `packs/rec-004.md`
   - Evidence: `apps/web/package.json`; `apps/web/vitest.config.ts:13-19`; `apps/web/playwright.config.ts:16-58`; `docs/architecture.md:14-27,94-108`
   - Confidence: high
   - Disclosure: inline delta + link_only
   - Link Targets: `apps/web/README.md`, `docs/architecture.md`, `docs/development.md`
   - Content Guidance: Thin (target 40–90 lines). Capture only the web delta over root; link the README/docs for depth.
   - Must Include: test split (vitest+jsdom `src/**/*.test.tsx`, RTL `vitest.setup.ts`; e2e `e2e/*.spec.ts` Playwright gated on `DATABASE_URL_TEST`); `AppRouter` imported as a **type** (no API runtime in browser); leaf game UI components are prop-driven from `GameSnapshotView`; no React import needed (automatic JSX runtime).
   - Must Not Include: restated root commands; oxfmt/oxlint style trivia; the backlog `/dev` playground as if it exists.
   - Preferred Default for New Files: component test → `*.test.tsx` in `src/` co-located; e2e → `*.spec.ts` in `e2e/`.
   - Claim Corrections: none

5. **Create `apps/web/CLAUDE.md` shim** — chained with `rec-004` (baseline gap #3)
   - Recommendation ID: `rec-005`
   - Target: `apps/web/CLAUDE.md`
   - Provider/Format: claude / CLAUDE.md import shim
   - Bundle Pack: `packs/rec-005.md`
   - Evidence: depends on `rec-004`; `.oat/sync/config.json`
   - Confidence: high
   - Disclosure: inline
   - Link Targets: `apps/web/AGENTS.md`
   - Content Guidance: Single `@AGENTS.md` import.
   - Must Include: `@AGENTS.md`
   - Must Not Include: duplication.
   - Preferred Default for New Files: N/A
   - Claim Corrections: none

6. **Create `packages/api/AGENTS.md`** — scoped API delta: redaction invariant, version guards, IP/limiter rule, route-per-action, drizzle migration workflow, integration harness (addresses finding #3, coverage gap #2)
   - Recommendation ID: `rec-006`
   - Target: `packages/api/AGENTS.md`
   - Provider/Format: agents_md / AGENTS.md
   - Bundle Pack: `packs/rec-006.md`
   - Evidence: `packages/api/src/shared/realtime/redaction.ts:1-13,54-79`; `packages/api/src/trpc.ts:40-47,176-188,224-304`; `packages/api/src/game/routes/create-game.ts:62-148`; `packages/api/src/test/harness.ts`; `packages/api/vitest.config.ts:14-32`; `docs/deployment.md:91-105`
   - Confidence: high
   - Disclosure: inline delta + link_only
   - Link Targets: `packages/api/README.md`, `docs/architecture.md`, `docs/deployment.md`
   - Content Guidance: Target 60–120 lines. Lead with the security/correctness invariants; link README/docs for the rest.
   - Must Include: **redaction** (never serialize other seats' hands/deck for non-local games — `redactEvent`/`buildSnapshot`); rate limiters key on `ctx.ip`, never hand-parsed `x-forwarded-for`; clients submit expected `version`, lifecycle mutations reject stale versions; route-per-action under `src/game/routes/` exporting `<action>Route`; migrations are **generated** via `drizzle-kit generate` then committed, never hand-edited; integration tests use `createHarness()` + `DATABASE_URL_TEST` (single-fork serialized); `TRUST_PROXY=false` in production is intentional.
   - Must Not Include: restated root commands; secrets; duplication of `packages/api/README.md` prose.
   - Preferred Default for New Files: new game action → one file per action in `src/game/routes/` built from `authedProcedure`/`gamePlayerProcedure`.
   - Claim Corrections: none

7. **Create `packages/api/CLAUDE.md` shim** — chained with `rec-006` (baseline gap #4)
   - Recommendation ID: `rec-007`
   - Target: `packages/api/CLAUDE.md`
   - Provider/Format: claude / CLAUDE.md import shim
   - Bundle Pack: `packs/rec-007.md`
   - Evidence: depends on `rec-006`; `.oat/sync/config.json`
   - Confidence: high
   - Disclosure: inline
   - Link Targets: `packages/api/AGENTS.md`
   - Content Guidance: Single `@AGENTS.md` import.
   - Must Include: `@AGENTS.md`
   - Must Not Include: duplication.
   - Preferred Default for New Files: N/A
   - Claim Corrections: none

8. **Create `packages/game-logic/AGENTS.md`** — thin delta linking the README "Design Rules" (addresses finding #6, coverage gap #3)
   - Recommendation ID: `rec-008`
   - Target: `packages/game-logic/AGENTS.md`
   - Provider/Format: agents_md / AGENTS.md
   - Bundle Pack: `packs/rec-008.md`
   - Evidence: `packages/game-logic/README.md:46-52`; `packages/game-logic/package.json` (only `zod`)
   - Confidence: high
   - Disclosure: link_only-heavy
   - Link Targets: `packages/game-logic/README.md`
   - Content Guidance: Very thin (target 20–40 lines). The README already documents this well; capture only the agent-facing non-negotiables and link.
   - Must Include: framework-free (no React/Next/Fastify/db/network/DOM); return **typed rule violations** instead of throwing for expected illegal moves; thread injected `Rng` for determinism; add public APIs via `src/index.ts`.
   - Must Not Include: duplication of the full README; root command restatement.
   - Preferred Default for New Files: new rule module → pure function + co-located `*.test.ts`; export through `src/index.ts`.
   - Claim Corrections: none

9. **Create `packages/game-logic/CLAUDE.md` shim** — chained with `rec-008` (baseline gap #5)
   - Recommendation ID: `rec-009`
   - Target: `packages/game-logic/CLAUDE.md`
   - Provider/Format: claude / CLAUDE.md import shim
   - Bundle Pack: `packs/rec-009.md`
   - Evidence: depends on `rec-008`; `.oat/sync/config.json`
   - Confidence: high
   - Disclosure: inline
   - Link Targets: `packages/game-logic/AGENTS.md`
   - Content Guidance: Single `@AGENTS.md` import.
   - Must Include: `@AGENTS.md`
   - Must Not Include: duplication.
   - Preferred Default for New Files: N/A
   - Claim Corrections: none

10. **Add `bruno/README.md` link to `bruno/AGENTS.md`** — minor Criterion 14 polish (addresses finding #9)
    - Recommendation ID: `rec-010`
    - Target: `bruno/AGENTS.md`
    - Provider/Format: agents_md / AGENTS.md
    - Bundle Pack: `packs/rec-010.md`
    - Evidence: `bruno/AGENTS.md`; `bruno/README.md` (referenced by `README.md:127`, `docs/development.md:132`)
    - Confidence: high (`bruno/README.md` confirmed present; apply may still re-check)
    - Disclosure: link_only
    - Link Targets: `bruno/README.md`
    - Content Guidance: One-line reference; do not restructure the otherwise-clean file.
    - Must Include: a link to `bruno/README.md`.
    - Must Not Include: any new prose duplicating the README.
    - Preferred Default for New Files: N/A
    - Claim Corrections: none

11. **(ask_user) Dedicated test-authoring glob rules** — optionally split the 3-way test split (glob opportunity #1) into provider glob rules instead of folding it into scoped `AGENTS.md` (addresses glob opportunity #1)
    - Recommendation ID: `rec-011`
    - Target: `.claude/rules/tests.md` + `.cursor/rules/tests.mdc` (and/or per-runner rules)
    - Provider/Format: claude + cursor / glob-rule
    - Bundle Pack: `packs/rec-011.md`
    - Evidence: `apps/web/playwright.config.ts:16-58`; `apps/web/vitest.config.ts:13-19`; `packages/api/vitest.config.ts:14-32`; `packages/api/src/test/harness.ts`
    - Confidence: medium
    - Disclosure: ask_user
    - Link Targets: `docs/development.md`
    - Content Guidance: Only if the user wants file-creation-time rules in addition to the scoped `AGENTS.md` guidance. For a repo this size, folding into `apps/web/AGENTS.md` + `packages/api/AGENTS.md` (recs 4 & 6) may be sufficient; a glob rule fires more precisely when an agent *creates* a test file. If adopted, keep claude/cursor rule **bodies byte-identical** and vary only frontmatter (`paths`/`globs`).
    - Must Include: the runner-selection rule (e2e → `e2e/*.spec.ts` Playwright; component → `src/**/*.test.tsx` vitest+jsdom; api integration → harness + `DATABASE_URL_TEST`; game-logic → pure vitest).
    - Must Not Include: oxfmt/oxlint style trivia.
    - Preferred Default for New Files: see `rec-004`/`rec-006`.
    - Claim Corrections: none

## Apply Contract

- `oat-agent-instructions-apply` may only implement recommendations backed by evidence in this artifact and its companion bundle.
- When the bundle exists, apply treats `recommendations.yaml` + `packs/*.md` as the primary generation contract and this markdown as reviewer context.
- `rec-011` is marked `ask_user` — require explicit user confirmation before generating provider glob rules.
- If cited config/docs/files are missing at apply time, stop and re-run analyze or ask the user rather than inventing a replacement rule. In particular, verify `bruno/README.md` exists before applying `rec-010`.
- oxfmt/oxlint already enforce style — generated instructions must prefer commands/links over prose restatement.
- For chained shims (`rec-005`, `rec-007`, `rec-009`), generate the `CLAUDE.md` alongside its `AGENTS.md`.

## Next Step

Run `oat-agent-instructions-apply` with this artifact to generate or update the instruction files.
