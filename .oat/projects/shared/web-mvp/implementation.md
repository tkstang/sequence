---
oat_status: in_progress
oat_ready_for: null
oat_blockers: []
oat_last_updated: 2026-06-12
oat_current_task_id: p02-t01
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
| Phase 2: game-logic rules engine | pending     | 11    | 0/11      |
| Phase 3: API foundation          | pending     | 10    | 0/10      |
| Phase 4: Game domain             | pending     | 14    | 0/14      |
| Phase 5: Web shell               | pending     | 9     | 0/9       |
| Phase 6: Game UI                 | pending     | 13    | 0/13      |
| Phase 7: Deploy & handoff        | pending     | 5     | 0/5       |

**Total:** 11/73 tasks completed

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

**Status:** pending
**Started:** -

### Phase Summary (fill when phase is complete)

_Pending._

| Task    | Name                                       | Status  | Commit |
| ------- | ------------------------------------------ | ------- | ------ |
| p03-t01 | Fastify bootstrap + env validation         | pending | -      |
| p03-t02 | Drizzle + db client                        | pending | -      |
| p03-t03 | Game schema + initial migration            | pending | -      |
| p03-t04 | Better Auth mounted                        | pending | -      |
| p03-t05 | tRPC init + context + HTTP plugin          | pending | -      |
| p03-t06 | WebSocket transport + heartbeat            | pending | -      |
| p03-t07 | Guest tokens (TDD)                         | pending | -      |
| p03-t08 | Integration harness + gamePlayerProcedure  | pending | -      |
| p03-t09 | Auth integration tests + rate limiting     | pending | -      |
| p03-t10 | Bruno scaffold                             | pending | -      |

---

## Phase 4: Game domain — fully playable over the API (p04)

**Status:** pending
**Started:** -

### Phase Summary (fill when phase is complete)

_Pending._

| Task    | Name                                         | Status  | Commit |
| ------- | -------------------------------------------- | ------- | ------ |
| p04-t01 | GameState ↔ DB mapping (TDD)                 | pending | -      |
| p04-t02 | create-game route (incl. local)              | pending | -      |
| p04-t03 | preview + join routes                        | pending | -      |
| p04-t04 | Lobby operations                             | pending | -      |
| p04-t05 | start-game route                             | pending | -      |
| p04-t06 | Realtime — rooms, redaction, subscription    | pending | -      |
| p04-t07 | Move engine route                            | pending | -      |
| p04-t08 | Pending choice + dead-card turn-in routes    | pending | -      |
| p04-t09 | TimerService (TDD with fake timers)          | pending | -      |
| p04-t10 | Presence — freeze / rejoin                   | pending | -      |
| p04-t11 | save-and-exit, concede, my-games             | pending | -      |
| p04-t12 | Rematch + expiry sweep                       | pending | -      |
| p04-t13 | History domain                               | pending | -      |
| p04-t14 | Bruno collection + scripted full game        | pending | -      |

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
**Phases:** in progress (rows appended as phases complete)

#### Phase Outcomes

| Phase | Implementer        | Review | Fix Iterations | Disposition |
| ----- | ------------------ | ------ | -------------- | ----------- |
| p01   | DONE_WITH_CONCERNS (advisory only) | pass | 0/2 | merged (sequential, on-branch) |

#### Parallel Groups

- Group 1 [p02, p03]: worktree-based, merged in order (pending)
- p01, p04, p05, p06, p07: sequential

#### Dispatch Notes

- Dispatch: p01 implementation model_axis=selected:opus (bleeding-edge toolchain integration); p01 review model_axis=selected:opus (ceiling).

#### Outstanding Items

- None blocking. Advisory carried forward: `scripts/worktree/init.sh` is stoa-specific — orchestrator review required before p02/p03 worktree bootstrap; heavy J/Q/K SVGs (WebP contingency at p06); `manage-hooks.js` ESM warning.

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

## Test Results

Track test execution during implementation.

| Phase | Tests Run | Passed | Failed | Coverage |
| ----- | --------- | ------ | ------ | -------- |
| p01   | 7 (game-logic smoke + 6 board-map) | 7 | 0 | n/a |
| p02   | 132 (13 files; post-review fixes) | 132 | 0 | n/a |
| p03   | -         | -      | -      | -        |
| p04   | -         | -      | -      | -        |
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
