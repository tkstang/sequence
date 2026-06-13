---
oat_status: in_progress
oat_ready_for: null
oat_blockers: []
oat_last_updated: 2026-06-12
oat_current_task_id: p05-t01
oat_generated: false
---

# Implementation: web-mvp

**Started:** 2026-06-12
**Last Updated:** 2026-06-12

> This document is used to resume interrupted implementation sessions.
>
> Conventions:
>
> - `oat_current_task_id` always points at the **next plan task to do** (not the last completed task).
> - When all plan tasks are complete, set `oat_current_task_id: null`.
> - Reviews are **not** plan tasks. Track review status in `plan.md` under `## Reviews` (e.g., `| final | code | passed | ... |`).
> - Keep phase/task statuses consistent with the Progress Overview table so restarts resume correctly.
> - Before running the `oat-project-pr-final` skill, ensure `## Final Summary (for PR/docs)` is filled with what was actually implemented.

## Progress Overview

| Phase                            | Status      | Tasks | Completed |
| -------------------------------- | ----------- | ----- | --------- |
| Phase 1: Foundation & Salvage    | completed (review passed) | 11 | 11/11 |
| Phase 2: game-logic rules engine | completed (review passed) | 11 | 11/11 |
| Phase 3: API foundation          | completed (review passed) | 10 | 10/10 |
| Phase 4: Game domain             | completed (pre-review) | 14 | 14/14 |
| Phase 5: Web shell               | pending     | 9     | 0/9       |
| Phase 6: Game UI                 | pending     | 13    | 0/13      |
| Phase 7: Deploy & handoff        | pending     | 5     | 0/5       |

**Total:** 46/73 tasks completed

**Execution schedule:** [p01] → [p02 ∥ p03] (parallel group, worktrees) → [p04] → [p05] → [p06] → [p07]
**HiLL checkpoints:** ["p07"] (pause only after the final phase) · auto-review at checkpoints: enabled
**Tier:** 1 (subagents) · **Dispatch ceiling:** claude opus (enforced, Task model arg; preset: maximum)

---

## Phase 1: Foundation & Salvage (p01)

**Status:** completed — review passed (`reviews/p01-review-2026-06-12.md`, 3 Minor)
**Started:** 2026-06-12

### Phase Summary

**Outcome (what changed):**

- pnpm monorepo skeleton live: `packages/game-logic`, `packages/api`, `apps/web` (Next 16 + React 19 + Tailwind v4), all root gates green (`typecheck` via tsgo, `lint` oxlint, `format:check` oxfmt, `test` vitest).
- Typed `BOARD_MAP` salvaged from legacy via TDD (6 tests); 54 SVGO-optimized card assets with LGPL attribution.
- Entire legacy app deleted including the committed GCP service key (operator must still revoke it in GCP Console — it remains in git history).
- Git hooks (oxlint/oxfmt pre-commit, conventional+pNN-tNN commit-msg) and worktree scripts adapted from stoa.

**Key files touched:** root workspace configs, `packages/game-logic/src/board-map.ts`, `apps/web/` skeleton, `apps/web/public/cards/`, `tools/git-hooks/`, `scripts/worktree/`.

**Verification:** all four root gates + `pnpm --filter @sequence/web build` green on clean tree; 7 tests passing.

**Notes / Decisions:** 5 recorded deltas (see Deviations table); J/Q/K SVGs remain heavy (~65–157KiB, WebP contingency documented for p06); `scripts/worktree/init.sh` is stoa-specific — orchestrator must review before p02/p03 worktree bootstrap.

| Task    | Name                                  | Status    | Commit    |
| ------- | ------------------------------------- | --------- | --------- |
| p01-t01 | Workspace scaffold                    | completed | `69b8fa0` |
| p01-t02 | TypeScript side-by-side setup         | completed | `0012e1f` |
| p01-t03 | Oxlint + Oxfmt                        | completed | `3f38110` |
| p01-t04 | Vitest workspace                      | completed | `f65cd5c` |
| p01-t05 | game-logic package skeleton           | completed | `4cb64f8` |
| p01-t06 | api package skeleton                  | completed | `3c01a3f` |
| p01-t07 | web app skeleton                      | completed | `6617f72` |
| p01-t08 | Salvage boardMap (TDD)                | completed | `9b25439` |
| p01-t09 | Card SVG pipeline + attribution       | completed | `a728b57` |
| p01-t10 | Legacy deletion + key scrub           | completed | `8a07e59` |
| p01-t11 | Git hooks + worktree scripts          | completed | `3849ad5` |

---

## Phase 2: game-logic — the rules engine (p02)

**Status:** complete
**Started:** 2026-06-12

### Phase Summary

The pure rules engine: domain types + lifecycle state machine, seedable deck,
dealing with alternating-team turn order, corner-as-wild sequence detection +
locking, jack rules, per-turn dead-card evaluation with resurrection, win
conditions (incl. double-sequence instant win), the full `applyMove` turn loop
(placement / removal / pending >5-run choice / dead-card turn-in / forfeit),
reducer-backed display helpers, and the public surface. 13 test files / 112
tests; seeded 2p/3p/4p-team simulations terminate < 500 turns with invariants
(hand size, 104-card conservation, chip bounds) held every turn. No new deps —
zod (from p01) untouched; root `pnpm-lock.yaml` unchanged. Root gates green.

| Task    | Name                                          | Status   | Commit  |
| ------- | --------------------------------------------- | -------- | ------- |
| p02-t01 | Domain types + lifecycle state machine        | complete | b65cb25 |
| p02-t02 | Deck + seedable RNG                           | complete | 06ace15 |
| p02-t03 | createGame — dealing + turn order             | complete | 763a3ea |
| p02-t04 | Sequence detection with corners + locking     | complete | 2864cd1 |
| p02-t05 | Jack rules                                    | complete | 83b9158 |
| p02-t06 | Dead cards (per-turn evaluation)              | complete | 33338a2 |
| p02-t07 | Win conditions                                | complete | 7d5ab69 |
| p02-t08 | applyMove — placement path                    | complete | 3589af0 |
| p02-t09 | applyMove — removal, pending choice, forfeit  | complete | d94923c |
| p02-t10 | Display helpers                               | complete | 2669785 |
| p02-t11 | Public API + full-game simulation             | complete | (this)  |

---

## Phase 3: API foundation (p03)

**Status:** completed (pre-review)
**Started:** 2026-06-12

### Phase Summary

**Outcome (what changed):**

- Fastify 5 host with zod-validated env, pino logging, credentialed CORS, `/health`.
- Drizzle ORM over postgres.js (fixed pool ≤10); full game schema (`games`, `game_players`, `game_events`) + Better Auth tables, two migrations applied to the Neon test branch with all 4 required indexes + cascade FKs.
- Better Auth self-hosted at `/api/auth/*` (email+password, env-gated social, drizzle adapter, httpOnly+secure cookies) via a Web-Request bridge.
- tRPC 11 over HTTP + WS (`useWSS`, ~20s keepAlive heartbeat); context resolves Better Auth session → `{ user | null }`; `publicProcedure` / `authedProcedure` / `gamePlayerProcedure` (seat resolution: user / local-creator / guest cookie).
- Signed, game-scoped guest tokens (HMAC, hash-stored, no JWT). Reusable tRPC rate-limit middleware + `@fastify/rate-limit` on auth routes.
- Integration harness on the Neon test branch (drizzle push + truncate + advisory-lock serialization); Bruno auth collection green against a booted server.

**Key files:** `packages/api/src/{server,env,trpc,app-router}.ts`, `db/{client,schema/*}.ts`, `user/{auth,guest-tokens}.ts`, `shared/rate-limit-middleware.ts`, `test/{harness,global-setup,db-lock}.ts`, `bruno/`.

**Verification:** api unit + integration suites (28 api tests) green vs the test branch; root gates green (typecheck/lint/format:check/test = 35 tests) on a clean tree; Bruno `auth` 6/6 vs a local server. Integration tests env-gate (skip cleanly without `DATABASE_URL_TEST`).

**Notes / Decisions:** 4 recorded deltas (see Deviations table) — text-column user refs (FK ordering), Web-Request auth mount + CLI version, lazy guest resolution, advisory-lock test isolation. None are advisory concerns; all behaviors verified.

| Task    | Name                                       | Status    | Commit    |
| ------- | ------------------------------------------ | --------- | --------- |
| p03-t01 | Fastify bootstrap + env validation         | completed | `b67caad` |
| p03-t02 | Drizzle + db client                        | completed | `cf58235` |
| p03-t03 | Game schema + initial migration            | completed | `f8f6a80` |
| p03-t04 | Better Auth mounted                        | completed | `5587895` |
| p03-t05 | tRPC init + context + HTTP plugin          | completed | `e804900` |
| p03-t06 | WebSocket transport + heartbeat            | completed | `88936ec` |
| p03-t07 | Guest tokens (TDD)                         | completed | `57490dc` (+`743323a` fix) |
| p03-t08 | Integration harness + gamePlayerProcedure  | completed | `6c6e69b` (+`a677671` fix) |
| p03-t09 | Auth integration tests + rate limiting     | completed | `20e9020` |
| p03-t10 | Bruno scaffold                             | completed | `b9b3a8f` |

---

## Phase 4: Game domain — fully playable over the API (p04)

**Status:** complete (pre-review)
**Started:** 2026-06-12

### Phase Summary

A complete game is playable over tRPC with no UI. GameState ↔ DB mapping
(versioned persistence, sparse object board, per-game event seq); the full
session lifecycle (create incl. local, preview/join with guest tokens, lobby
team ops, start, save/concede/rematch/sweep); the authoritative move engine
(load→reduce→persist[version guard]→broadcast, optimistic concurrency, typed
rule violations); pending-choice + dead-card turn-in routes (chained
additionalRuns resolved sequentially); persistent turn timers with forfeit +
boot rehydration; room-scoped WS subscriptions with per-recipient redaction
(NFR1) and snapshot-first recovery; presence-driven freeze/rejoin lifecycle;
history aggregates + head-to-head. A scripted 2-player full game runs
create→join→start→win→rematch over real HTTP (FR6 broadcast invariant
asserted); the Bruno game collection covers the procedures. The design
§Error Handling lifecycle table is fully covered by integration tests.

**Carried obligations addressed:** I3 (WS `ctx.ip` fallback via `resolveClientIp`
+ onRequest hook, regression-tested), p02-m6 (move engine ALWAYS stamps the
authenticated seat on makeMove/chooseSequenceCells/turnInDeadCard), p02 deltas
(server RNG passed explicitly; chained `additionalRuns` resolved sequentially;
6p team count derived from seeds — 3v3 AND 2x3), p02-m4 (chained-additionalRuns
reducer test added as `fix(p02-t09)`).

**Verification:** api suite 125/125 green vs the Neon test branch (serial);
root gates green on a clean tree — `pnpm typecheck` (all 3 packages),
`pnpm lint` (0 errors), `pnpm format:check`, `pnpm test` (258 tests / 35 files,
api single-fork). Bruno `game` 6/6 + `auth` 3/3 vs a booted server.

| Task    | Name                                         | Status   | Commit  |
| ------- | -------------------------------------------- | -------- | ------- |
| p04-t01 | GameState ↔ DB mapping (TDD)                 | complete | d9e01a2 |
| p04-t02 | create-game route (incl. local)              | complete | ce66113 |
| p04-t03 | preview + join routes (+ I3)                  | complete | 7d84f75 |
| p04-t04 | Lobby operations                             | complete | d38efdc |
| p04-t05 | start-game route                             | complete | 4e90cce |
| p04-t06 | Realtime — rooms, redaction, subscription    | complete | 2549f59 |
| p04-t07 | Move engine route (+ p02-m6)                  | complete | b5e8c7e |
| p04-t08 | Pending choice + dead-card turn-in routes    | complete | ca0fc16 |
| (p02-m4)| chained additionalRuns reducer test          | complete | 8ccee89 |
| p04-t09 | TimerService (TDD with fake timers)          | complete | 734ca0d |
| p04-t10 | Presence — freeze / rejoin                   | complete | 5ff4f4c |
| p04-t11 | save-and-exit, concede, my-games             | complete | 2bc9e8b |
| p04-t12 | Rematch + expiry sweep                       | complete | 7f14269 |
| p04-t13 | History domain                               | complete | 422d4c4 |
| p04-t14 | Bruno collection + scripted full game        | complete | 048c69a (+7a8e893, ac2db17 fixes) |

---

## Phase 5: Web shell (p05)

**Status:** pending
**Started:** -

### Phase Summary (fill when phase is complete)

_Pending._

| Task    | Name                            | Status  | Commit |
| ------- | ------------------------------- | ------- | ------ |
| p05-t01 | Theme + layout foundation       | pending | -      |
| p05-t02 | tRPC client wiring              | pending | -      |
| p05-t03 | Auth screens + session          | pending | -      |
| p05-t04 | Landing page                    | pending | -      |
| p05-t05 | Dashboard                       | pending | -      |
| p05-t06 | Create-game screen              | pending | -      |
| p05-t07 | Join page                       | pending | -      |
| p05-t08 | History page                    | pending | -      |
| p05-t09 | Shell screen walk + a11y pass   | pending | -      |

---

## Phase 6: Game UI (p06)

**Status:** pending
**Started:** -

### Phase Summary (fill when phase is complete)

_Pending._

| Task    | Name                                   | Status  | Commit |
| ------- | -------------------------------------- | ------- | ------ |
| p06-t01 | Game route state container             | pending | -      |
| p06-t02 | Lobby UI (stacked team rows)           | pending | -      |
| p06-t03 | GameBoard + cells + chips              | pending | -      |
| p06-t04 | CardHand (peeking fan)                 | pending | -      |
| p06-t05 | PlayerRail + timer display             | pending | -      |
| p06-t06 | Tap controller (default mode)          | pending | -      |
| p06-t07 | Drag controller (hard mode)            | pending | -      |
| p06-t08 | Pending-choice + sequence lock UI      | pending | -      |
| p06-t09 | HandoffScreen (pass-and-play)          | pending | -      |
| p06-t10 | GameOver + rematch                     | pending | -      |
| p06-t11 | Notifications + Motion polish          | pending | -      |
| p06-t12 | Responsive pass                        | pending | -      |
| p06-t13 | Playwright e2e suite                   | pending | -      |

---

## Phase 7: Deploy & handoff (p07)

**Status:** pending
**Started:** -

### Phase Summary (fill when phase is complete)

_Pending._

| Task    | Name                                | Status  | Commit |
| ------- | ----------------------------------- | ------- | ------ |
| p07-t01 | API Dockerfile + Railway config     | pending | -      |
| p07-t02 | Railway deploy                      | pending | -      |
| p07-t03 | Vercel deploy                       | pending | -      |
| p07-t04 | Production smoke + checks           | pending | -      |
| p07-t05 | Operator handoff notes              | pending | -      |

---

## Orchestration Runs

_Each run from `oat-project-implement` appends an entry below with:_
_- Run header (number, timestamp, branch, tier, policy, phase counts)_
_- Phase Outcomes table_
_- Parallel Groups list_
_- Outstanding Items_

<!-- orchestration-runs-start -->

### Run 1 — 2026-06-12 20:54

**Branch:** 2026
**Tier:** 1
**Policy:** merge-strategy=merge, retry-limit=2
**Phases:** 3 executed, 3 passed, 0 failed, 0 stopped (p04-p07 pending)

#### Phase Outcomes

| Phase | Implementer        | Review | Fix Iterations | Disposition |
| ----- | ------------------ | ------ | -------------- | ----------- |
| p01   | DONE_WITH_CONCERNS (advisory only) | pass | 0/2 | merged (sequential, on-branch) |
| p02   | DONE | fail → pass (re-review) | 1/2 | merged `84759ba` (fan-in, no conflicts) |
| p03   | DONE | pass (+ proactive fix round, verified) | 1/2 | merged `fce98ec` (fan-in, implementation.md conflict resolved by subagent) |

#### Parallel Groups

- Group 1 [p02, p03]: worktree-based at `.worktrees/web-mvp/{p02,p03}`, base `fbd9db4` (verified), merged in plan order; integration verification green after each merge (132 tests post-p02; 166 post-p03 incl. live Neon-test-branch integration). Worktrees removed.
- p01, p04, p05, p06, p07: sequential

#### Dispatch Notes

- Dispatch: p01 implementation model_axis=selected:opus (bleeding-edge toolchain integration); p01 review model_axis=selected:opus (ceiling).
- User directive (2026-06-12, mid-run): all subsequent REVIEW dispatches run at model_axis=selected:fable (host model above the configured opus ceiling; user-directed override — resolver ladder unchanged). Implementer dispatches remain capped at opus. Applies from the p02/p03 reviews onward.
- Dispatch: p02/p03 implementation model_axis=selected:opus; p02 review + re-review, p03 review + fix verification model_axis=selected:fable (user override). p02 fix loop iteration 1 cleared all 10 findings; p03 proactive fix round closed I2/M1/M2 + 4 minors.

#### Outstanding Items

- **Carried to p04 (must address):** I3 — WS path `ctx.ip` is `'unknown'` (tRPC fastify WS adapter passes bare IncomingMessage); fix before attaching the rate limiter to preview/join in p04-t03. p02-m6 — actor-seat enforcement is opt-in in game-logic; p04 move engine MUST always set `move.seat`/`actorSeat`, and the p04 review must verify it.
- **Carried to p07 (deploy bucket):** I1 — SameSite=Lax breaks cross-site prod auth (cookie/domain strategy decided at deploy); M3 — boolean trustProxy keys on leftmost XFF; needs hop-count support or a forged-XFF smoke assertion on Railway.
- **Advisory:** heavy J/Q/K SVGs (WebP contingency at p06); `manage-hooks.js` ESM warning; p02 m4 (chained additionalRuns lacks reducer-level test) + m5 (`not-a-dead-card` code reused for turn-in cap).

#### Artifact / Design Deltas

Run-scoped snapshot only. The durable record is `## Deviations from Plan / Design` (5 p01 rows consolidated there).

<!-- orchestration-runs-end -->

---

## Implementation Log

Chronological log of implementation progress.

### 2026-06-12 — Run 1 start

- Tier 1 (subagents) selected; dispatch ceiling claude opus (enforced), preset maximum, source project-state.
- HiLL checkpoints confirmed: ["p07"] (from workflow.hillCheckpointDefault: final).
- Auto-review at HiLL checkpoints: enabled (workflow.autoReviewAtHillCheckpoints).
- `.oat/config.json` aligned with stoa baseline before start (archive/S3, localPaths, workflow block); documentation block deliberately omitted (no docs app in this repo); postImplementSequence set to `pr` (not `docs-pr`) for the same reason.
- p01 implemented by oat-phase-implementer (opus): 11/11 tasks, commits `69b8fa0`..`3849ad5`, DONE_WITH_CONCERNS (3 advisory: stoa-specific worktree init.sh, heavy J/Q/K SVGs, manage-hooks ESM warning). Phase review next.

---

## Deviations from Plan / Design

Document any intentional deviations from the original plan, spec, or design. Include accepted review findings where the shipped implementation is source of truth and a lifecycle artifact needs alignment.

| Task / Review | Source Artifact | Planned / Documented | Actual / Accepted | Reason | Source of Truth | Follow-up |
| ------------- | --------------- | -------------------- | ----------------- | ------ | --------------- | --------- |
| p01-t01/t03 | plan.md p01-t01 ("root scripts fan out via `pnpm -r`") | All root scripts fan out via `pnpm -r` | `typecheck`/`test`/`build` fan out per-package; `lint`/`format`/`format:check` run root-level `oxlint`/`oxfmt` scoped to `apps packages scripts tools` (with `--no-error-on-unmatched-pattern`) | oxlint/oxfmt are single-binary whole-tree tools driven by root `.oxlintrc.json`/`.oxfmtrc.json` (as p01-t03 itself specifies); per-package fan-out would duplicate config and mis-scope. Scoping avoids linting `.oat/`, `.agents/`, docs. | implementation (shipped) | none — matches tool design |
| p01-t04 | plan.md p01-t04 (projects: `packages/*`, `apps/web`) | `vitest.workspace.ts` lists literal `apps/web` | Lists glob `apps/*` instead; root `test` wrapped in `scripts/run-tests.mjs` guard for the empty-tree "no tests tolerated" case | Vitest errors on a literal not-yet-existing path (`apps/web`) but tolerates an empty glob; the guard satisfies the t04 verify before any package exists | implementation (shipped) | `apps/web` is the only app, so glob is equivalent |
| p01-t05 | tsconfig.base.json (p01-t02) | Base config per p01-t02 list | Added `allowImportingTsExtensions: true` to base | Required for explicit `.ts` import specifiers under bundler resolution + `noEmit`; foundational TS setting surfaced by the first real `.ts` import | implementation (shipped) | none |
| p01-t10 | plan.md p01-t10 delete list | List does not include root `tsconfig.json` | Also deleted legacy root `tsconfig.json` | It is a Next/Panda-era remnant (paths to deleted dirs, `include: **/*.ts` scanning the monorepo) contradicting "legacy gone"; no package extends it (only `tsconfig.base.json`) | implementation (shipped) | none |
| p01-t11 | plan.md p01-t11 ("Keep as-is: …`scripts/worktree/validate.sh`") + verify "`validate.sh` passes" | Keep validate.sh unchanged | Adapted validate.sh: `type-check`→`typecheck`, dropped `--filter documentation docs:format:check`, added `format:check` | As-is it references stoa-only `pnpm run type-check` and a `documentation` package absent here, so it could not pass — internal plan conflict between "keep as-is" and "must pass" | implementation (shipped) | `scripts/worktree/init.sh` left as-is per plan but references stoa-only `scripts/sync-archived-projects-from-s3.sh` + `oat local sync`; review before p02/p03 worktree bootstrap |
| p02-t08/t09 | design.md §Component Design (`applyMove(state, move): MoveResult`) | 2-arg reducer signature | `applyMove(state, move, rng?)` — optional third `Rng` param (also on `resolveSequenceChoice`, `turnInDeadCard`); defaults to a state-seeded RNG | The turn loop owns auto-draw deck-reshuffle and default-mode dead-card auto-swap, both of which need an RNG to stay deterministic+testable; design omitted the seam. Optional + defaulted so the documented 2-arg call site still compiles and is deterministic. | implementation (shipped) | p04 move-engine should pass a server RNG explicitly; design.md §Component Design interface block could note the optional rng |
| p02 review I4 | design.md §Component Design (`applyMove(state, move)`; `resolveSequenceChoice(state, cells)`) | No actor-seat seam — host owns turn ownership | `Move` gains optional `seat?: Seat`; `applyMove` returns `not-your-turn` when `move.seat !== state.currentSeat`. `resolveSequenceChoice(state, cells, rng?, actorSeat?)` rejects a non-placer with `not-your-turn`. `turnInDeadCard` validates `seat === currentSeat`. | Review I4: the engine must reject out-of-turn regardless of client (NFR1); p02-t08/p04-t07/p04-t08 RED specs require engine-produced `not-your-turn` and "only placer resolves". Optional fields keep the documented 2-arg call sites compiling. | implementation (shipped) | p04 move-engine sets `move.seat` from the authenticated seat and passes `actorSeat` to `resolveSequenceChoice`; design.md §Component Design interface block should add the seat param |
| p02 review I1 | design.md §Data Models / sequence-detection union | `DetectionResult.choiceRequired = {runLength, cells}`; `PendingChoice = {seat,team,placed,cells}` | `choiceRequired` extended with `autoLock: Position[][]` + `additionalChoices: ChoiceRun[]`; `PendingChoice` gains `additionalRuns?`. A placement may auto-lock a crossing exactly-5 while freezing a >5 choice, and multiple >5 runs resolve sequentially. New `ChoiceRun` type exported. | Review I1: the prior union could not represent "auto-lock + choice", silently discarding an earned crossing sequence (and losing a double-sequence instant win). | implementation (shipped) | p04 choose-sequence-cells route resolves chained `additionalRuns`; p06 sequence-choice UI handles a follow-on PendingChoice |
| p02 review I2/I3 | plan.md p02-t03 / design.md §Data Models (GameSettings) | `createGame` derives team count from playerCount (6→3); turn order positional `[1,2,...]` | Team count derived from the seeds' distinct teams, validated against legal counts per player count (6p → 2 **or** 3 teams). Seat-ordered teams taken directly from `PlayerSeed.seat/.team` (honored, not remapped) with contiguity/evenness/alternation validation. | Review I2: 6p 3v3 was rejected (plan p04-t05 requires it). Review I3: explicit lobby seat/team selections were silently overwritten. No GameSettings field added — the team axis lives in the seeds, which already carry per-player team. | implementation (shipped) | p04-t05 start-game passes seat-ordered alternating seeds from the lobby; p05/p06 lobby produces them |
| p02 review M1 | plan.md p02-t06 / rules-and-flows (≤1 turn-in per turn) | `turnInDeadCard` unguarded | Added game-active / no-pending-choice / current-seat guards and a one-per-turn cap via new `GameState.deadCardTurnedIn` flag (set on turn-in, cleared in `advanceTurn`). | Review M1: unguarded turn-in allowed mid-opponent-turn swaps and unlimited turn-ins. | implementation (shipped) | none |
| p02 review M2 | design.md §Component Design (`validPlacements(hand, board)`) | `validPlacements(hand, board, team=1)` | `team` is now **required** (no default) | Review M2: a team=1 default mislabeled other teams' own chips as one-eyed targets, breaking the agrees-with-reducer property. | implementation (shipped) | p06 callers pass the seat's team (always known) |
| p02 review m1 | types.ts `RuleViolation` union | Included `not-a-wild-card`, `no-chip-to-remove`, `freed-cell-same-turn` | Removed the two never-produced codes; replaced `freed-cell-same-turn` with a comment (removal ends the turn → structurally enforced). `not-your-turn` is now produced (I4). | Review m1: dead union members implied enforced rules that weren't. | implementation (shipped) | none |
| p03-t03 | design.md §Data Models ("Our FKs point at `user.id`") | `games.created_by` / `game_players.user_id` as DB-level FKs to Better Auth's `user.id` | Stored as plain `text` columns matching Better Auth's default text id, with **no DB-level FK constraint** to `user` in migration `0000` | Better Auth owns and generates the `user` table in p03-t04 (later task); a hard FK in t03's migration would forward-reference a table that does not yet exist, breaking migration ordering. Referential integrity to `user` is enforced at the application layer (route handlers only accept the caller's authenticated `user.id`). The `game_id` FKs (within api-owned tables) ARE enforced at the DB with `ON DELETE CASCADE`. | implementation (shipped) | Optional follow-up: add a `user` FK in a later additive migration once auth tables exist, if DB-level integrity is desired. Not blocking. |
| p03-t04 | plan.md p03-t04 ("mount `/api/auth/*` catch-all per Better Auth Fastify guide"; "`auth.ts` … generated via Better Auth CLI") | `toNodeHandler` raw-stream catch-all; schema via `better-auth` package CLI | Mounted via a **Web `Request`→`Response` bridge** (`auth.handler(request)`) instead of `toNodeHandler` raw-stream hijack; auth schema generated with `@better-auth/cli@1.4.21` (the `better-auth` 1.6 package ships no bin) | The raw-stream `toNodeHandler` approach left Fastify's already-parsed body unconsumed → Better Auth saw an undefined body (400 VALIDATION_ERROR). The Web-Request bridge is body-parser-agnostic and coexists cleanly with the tRPC HTTP plugin on the same instance. CLI version skew is harmless: the generated tables match Better Auth 1.6's expected shape (`user.id` is `text`, validating the t03 column-type choice). | implementation (shipped) | none — round-trips verified (signup/login/logout/session) against the Neon test branch and via Bruno |
| p03-t05/t08 | design.md §API ("context resolves … `{ user \| null, guest \| null }`") | Guest resolved into `ctx.guest` at context-build time | Guest identity is resolved **lazily in `gamePlayerProcedure`** (which knows the target `gameId`), not at context build; `ctx.guest` stays null in p03 | A guest token is game-scoped, so it can only be verified once the target game is known — that is the per-procedure `gameId` input, not the bare request. `gamePlayerProcedure` reads the `sequence_guest` cookie, verifies the token for the requested game, and matches the stored hash. `guestSecret` is threaded through context for testability. | implementation (shipped) | none — matches the game-scoped guest model; integration-tested |
| p03-t08/t09 | plan.md p03-t08 ("reset via `drizzle-kit push` + truncate") | Per-run push + per-test truncate is sufficient for isolation | Added a **Postgres session advisory lock** held per integration test file, serializing the two integration files against the one shared test branch | The vitest **workspace** runner (root `pnpm test`) runs the API's integration files in parallel workers; both `TRUNCATE` shared Better Auth tables, so an unguarded interleave caused a nondeterministic FK failure (`linkAccount` 500) when run together. The per-project `fileParallelism:false` is not honored under the workspace; the advisory lock makes correctness independent of scheduling. | implementation (shipped) | none — root `pnpm test` is green and stable across repeated runs |
| p03 review (M2) | implementation.md p03-t03 deviation row (covered only `user`-ref columns) | `games.rematch_of` left without a DB-level FK | Added a real self-FK `rematch_of REFERENCES games(id) ON DELETE SET NULL` (migration `0002_petite_sentinel.sql`) | `rematch_of` references the api-owned `games` table, so the Better-Auth migration-ordering rationale that justifies plain-text user refs does not apply; the p04-t12 expiry sweep could otherwise leave dangling pointers. Applied to the test branch (verified, no drift). | implementation (shipped) | none — supersedes the gap noted against the p03-t03 row |
| p03 review (I1) | review p03 finding I1 (`SameSite=Lax` cross-site cookies) | — | **Deliberately deferred to p07** | The cross-site cookie strategy (SameSite=None;Secure vs shared registrable domain) depends on the deploy domains decided in p07-t02/t03; local/p03/p04 testing is same-site and unaffected. A code comment at `user/auth.ts` cookie config flags the p07 obligation. | review finding (open) | Address in p07-t02/t03 with a cross-origin credentialed smoke assertion |
| p04-t01 | design.md §Data Models (`board` jsonb "100 cells `{chip?,lockedBy?}`"; `sequences` "team, cells, order"; `pending_choice`) | `board` as a 100-element array; `sequences` rows carry `order`; `pending_choice = {seat,runLength,cells}` | `board` serialized as a **sparse object keyed by position code** (`{ '1AC': {chip,lockedBy} }`); `sequences` carry `{id,team,cells}` (no `order` — `nextSequenceId` column tracks issue order); `pending_choice` expanded to `{seat,team,placed,cells,additionalRuns?}`; added `games.next_sequence_id` column + migration `0003`. The game-logic `Board` is a `Map<Position,BoardCell>` keyed by string codes — a sparse object round-trips it exactly (empty cells absent), whereas a dense 100-array would need a fixed position↔index map and stores empties. `pending_choice` shape follows the p02 I1 delta (`additionalRuns`). | implementation (shipped) | none — round-trip integration-tested; design §Data Models jsonb shapes could note the object-keyed board |
| p04-t01 (infra) | plan.md p03 ("integration tests run … with `DATABASE_URL_TEST`") | `packages/api/vitest.config.ts` `loadEnv()` reads a package-local `.env` | Also loads the **monorepo-root** `.env` explicitly (`../../.env`) — the gitignored secrets live at root (worktree-init copies them there), so the package-local-only load left `DATABASE_URL_TEST` unset and every integration `describe` skipped. | Without this the entire p04 integration suite silently skipped. A package-local `.env` still wins if present. | implementation (shipped) | none |
| p04-t09 (infra) | plan.md p03-t01 / package.json (`start: node src/server.ts`) | `node src/server.ts` runs the API at boot | `start`/`dev` use `node --experimental-transform-types` | Node 24's default strip-only TS mode cannot run **constructor parameter properties** (used by `TimerService`, `PresenceTracker`, `VersionConflictError`); `--experimental-transform-types` transpiles them. Verified by booting the server for the Bruno run. | implementation (shipped) | p07 Dockerfile must use the same flag (or a build step) for the prod boot |
| p04-t14 (infra) | plan.md p03-t08 deviation (advisory lock serializes integration files) | The per-file Postgres advisory lock is sufficient under the workspace runner | Pinned the api vitest project to a **single fork** (`poolOptions.forks.singleFork`) + raised `hookTimeout` to 120s | With 14+ integration files now (vs p03's 2) plus the ~120s full-game e2e holding the advisory lock, queued harness `beforeAll`s (drizzle-push + boot) starved past the 60s hook timeout under the workspace's parallel workers, crashing `afterAll` on an undefined harness. A single fork makes the project's `fileParallelism:false` real; the advisory lock is now belt-and-suspenders. game-logic/web keep parallel pools. | implementation (shipped) | none — root `pnpm test` green (258 tests / 35 files) |

## Test Results

Track test execution during implementation.

| Phase | Tests Run | Passed | Failed | Coverage |
| ----- | --------- | ------ | ------ | -------- |
| p01   | 7 (game-logic smoke + 6 board-map) | 7 | 0 | n/a |
| p02   | 132 (13 files; post-review fixes) | 132 | 0 | n/a |
| p03   | 34 api after review fixes (9 env + 7 guest + 7 rate-limit unit + 11 integration [4 auth + 7 middleware]; +7 game-logic salvage = 41 root) | 34 api / 41 root | 0 | n/a |
| p04   | 258 root / 125 api (22 api files; +1 game-logic chained-runs) | 258 / 125 | 0 | n/a |
| p05   | -         | -      | -      | -        |
| p06   | -         | -      | -      | -        |
| p07   | -         | -      | -      | -        |

## Final Summary (for PR/docs)

**What shipped:**

- {capability 1}
- {capability 2}

**Behavioral changes (user-facing):**

- {bullet}

**Key files / modules:**

- `{path}` - {purpose}

**Verification performed:**

- {tests/lint/typecheck/build/manual steps}

**Design deltas (if any):**

- {what changed vs design.md and why}

## References

- Plan: `plan.md`
- Design: `design.md`
- Spec: `spec.md`
