---
oat_status: in_progress
oat_ready_for: null
oat_blockers: []
oat_last_updated: 2026-06-21
oat_current_task_id: p08-t01
oat_generated: false
---

# Implementation: web-mvp

**Started:** 2026-06-12
**Last Updated:** 2026-06-13

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
| Phase 4: Game domain             | completed (review passed) | 14 | 14/14 |
| Phase 5: Web shell               | completed (review passed) | 9 | 9/9 |
| Phase 6: Game UI                 | completed (review passed) | 13 | 13/13 |
| Phase 7: Deploy & handoff        | completed (review passed) | 5 | 5/5 |
| Phase 8: Final review fixes      | in progress | 2     | 0/2       |

**Total:** 73/75 tasks completed

**Execution schedule:** [p01] → [p02 ∥ p03] (parallel group, worktrees) → [p04] → [p05] → [p06] → [p07] → [p08]
**HiLL checkpoints:** ["p07"] (pause only after the final phase) · auto-review at checkpoints: enabled
**Tier:** 1 (subagents) · **Dispatch ceiling:** codex xhigh / claude opus (enforced where supported; preset: maximum)

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

**Notes / Decisions:** Recorded deltas live in the Deviations table; J/Q/K SVGs remain heavy (~65–157KiB, WebP contingency documented for p06); `scripts/worktree/init.sh` is stoa-specific — orchestrator must review before p02/p03 worktree bootstrap.

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

**Status:** completed (review passed)
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

**Status:** complete — review passed (`reviews/p05-review-2026-06-13.md`, fail -> fixes -> re-review pass)
**Started:** 2026-06-12

### Phase Summary

The complete web shell — everything except the game route (p06). App-shell
theme (Tailwind v4 `@theme` design tokens: slate `#2d3142` chrome, felt green,
cream surface, team colors) + UI primitives (Button/Card/Badge/AppHeader); the
tRPC client with a **split link** (HTTP batch for queries/mutations with
`credentials: 'include'`, reconnecting WS link for subscriptions only,
`lastEventId` passthrough; `AppRouter` as a **type-only** import — `@sequence/api`
moved to web devDependencies); Better Auth email+password screens (login/signup)
with a validated shared form, a session hook + authed-page gate; the landing
page (FR15, SSR hero / how-it-works / CTA); the dashboard per the approved
wireframe (Create + Pass-&-play CTAs, FROZEN/SAVED resumables with live expiry
countdowns + the all-must-return note, local-labeled recent results, history
link); the create-game screen (player count 2/3/4/6, play mode with the in-UI
explanation [FR2], the timer picker [off | 30s steps to 3:00 | 60s steps], the
local 2p-only toggle + opponent name) → `game.create` → game route; the invite
join page (public `game.preview`, guest-name path or login-first, started/full/
local guards); the history page (aggregate record, head-to-head table, paged
games list [FR14]). Component/unit tests via Vitest + Testing Library (jsdom).

**Carried fix (filed `fix(p04-t13)`):** `head-to-head.ts` now scores a
no-winner FFA concede with conceder-only-loss semantics (matching `myRecord`),
closing a run-1 outstanding item — verified by a new integration test against
the Neon test branch.

**Review-fix loop (2026-06-13):** p05 review findings C1/I1/I2/M1/m1 applied
without marking the review passed. Commits: `57f692b` preserves safe relative
`/login?next=/join/{code}` redirects; `efa852e` adds a reachable authenticated
shell logout control (Better Auth sign-out + query cache clear + `/login`
redirect), removes nested dashboard link/button CTAs, and renders neutral
no-result list items; `7551aa3` returns tri-state `result: "win" | "loss" |
"none"` from `game.myGames` and `history.myGames` using `GameConceded.payload.team`
for no-winner FFA concedes.

**Verification:** root gates green on a clean tree — `pnpm typecheck` (3
packages), `pnpm lint` (oxlint, 0 errors; pre-existing warnings only),
`pnpm format:check`, `pnpm test` (313 tests / 44 files, api integration against
the Neon test branch). `pnpm --filter @sequence/web build` and
`pnpm --filter @sequence/web typecheck` green. Focused fix suites green: web
auth/login/dashboard/history/join tests (30 tests) and API `game.myGames` +
`history.myGames` integration tests (17 tests). Screen walk:
booted api (against `DATABASE_URL_TEST`) + web locally; all 9 shell routes
return 200 and render their expected content; Better Auth signup round-trips
(session cookie issued); tRPC `health.ping` returns over HTTP. See the screen-
walk record below.

**Notes / Decisions:** 3 recorded p05 deltas (see Deviations table) — the
`AppRouter` type re-export from the api package root, the additive `MyGameCard`
enhancement (myTeam/opponents/round/result) the dashboard consumes, and the
carried head-to-head fix. No game-route UI or `game-logic` touched (p06).
Lifecycle-broadcast version stamping remains deferred to p06.

#### Screen-walk record (p05-t09, FR15 + a11y)

- **Boot:** api on `:3001` against the Neon **test** branch (DATABASE_URL set
  to the `DATABASE_URL_TEST` value for the one boot — prod `DATABASE_URL`
  untouched); web dev on `:3000` with `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_WS_URL`
  pointed at the api.
- **9 routes, all HTTP 200, content verified:** `/` (landing hero +
  how-it-works), `/login` (Welcome back form), `/signup`, `/dashboard`,
  `/create` + `/create?local=1`, `/join/[code]`, `/history`, `/ping`
  (live tRPC over HTTP renders "pong"). Authed shell pages render a brief
  "Loading…" then client-gate to `/login` when unauthenticated (expected).
- **a11y:** `oxlint` (jsx-a11y plugin) clean on `apps/web` (0 errors/warnings).
  Inputs carry explicit `aria-label`s and `aria-describedby` error wiring;
  toggle buttons use `aria-pressed`; the avatar has an `aria-label`.
- **375px:** no fixed pixel widths in shell components (all `max-w-*` / `w-full`
  / flex) — no horizontal scroll at mobile width; full desktop responsiveness
  verified via the build + route renders.
- **Gaps found:** p05 review caught missing logout, invite-login redirect loss,
  neutral-result list semantics, nested CTA markup, and stale hash bookkeeping;
  all were fixed in iteration 1 and re-reviewed as pass.

| Task    | Name                            | Status   | Commit |
| ------- | ------------------------------- | -------- | ------ |
| p05-t01 | Theme + layout foundation       | complete | a37ab3c |
| p05-t02 | tRPC client wiring              | complete | a198474 |
| p05-t03 | Auth screens + session          | complete | e16faab |
| p05-t04 | Landing page                    | complete | da536d8 |
| p05-t05 | Dashboard                       | complete | 4ca1eb6 |
| p05-t06 | Create-game screen              | complete | b74fd1c |
| p05-t07 | Join page                       | complete | 74f0fb2 |
| (p04-t13)| head-to-head FFA-concede carried fix | complete | 8b79dc0 |
| p05-t08 | History page                    | complete | 2eb642f |
| p05-t09 | Shell screen walk + a11y pass   | complete | ab1e9f5 |

---

## Phase 6: Game UI (p06)

**Status:** complete — review passed (`reviews/p06-review-2026-06-13.md`, fail -> fixes -> re-review pass)
**Started:** 2026-06-13

### Phase Summary

The playable game route is implemented end-to-end. The route consumes snapshot-first
realtime state, keeps optimistic `version` current from live events, and renders
the lobby, board, chips/locks/highlights, peeking hand, player rail/timer,
tap-mode legal-target controller, hard-mode drag/drop controller, pending
sequence-choice resolution, local pass-and-play hand veil, game-over/rematch,
typed notifications, reconnect banner, and responsive mobile/desktop layout.
Playwright covers the local-game handoff path plus remote join → play → win,
reload recovery, rematch routing/roster retention, and hard-mode drag in
desktop and 375px mobile projects against the real API/test DB.

**Review-fix loop (2026-06-13):** Blocking p06 findings C1/C2/I1/I2 and the
medium concede-attribution finding were addressed without marking review passed.
Active games now expose confirmable Save & exit / Concede controls with success
and error toasts; stale-version `CONFLICT`s trigger a page-level resubscribe;
recent-event replay sends a current snapshot/version before the next mutation;
6-player randomize follows the approved 3-teams-of-2 web shape; and GameOver
renders the conceded team when concede metadata is available.

**Carried p04 obligation closed:** lifecycle broadcasts from `presence.ts` and
`concede.ts` now carry the bumped post-transition `version`; the next mover no
longer needs to absorb an avoidable stale-version conflict after freeze/resume
or concede races.

**Verification:** focused component/controller suites per task; `pnpm typecheck`;
`pnpm lint` (0 errors; pre-existing warnings only); `pnpm format:check`;
`pnpm --filter @sequence/web build`; `pnpm --filter @sequence/web exec
playwright test` (10 tests across desktop + mobile-375). Focused review-fix
runs passed for web controls/state/GameOver (13 tests) and API lobby/replay
version correctness (21 tests). Root `pnpm test` reached 374/375 passing; the
only failure was a transient Neon `CONNECTION_ENDED` timeout in the pre-existing
API full-game e2e, and an isolated rerun of that test passed (1/1).

| Task    | Name                                   | Status  | Commit |
| ------- | -------------------------------------- | ------- | ------ |
| p06-t01 | Game route state container             | completed | `accf051` (+`8223fa3` fix) |
| p06-t02 | Lobby UI (stacked team rows)           | completed | `f9199d3` (+`7e379d3` fix) |
| p06-t03 | GameBoard + cells + chips              | completed | `3171cc3` |
| p06-t04 | CardHand (peeking fan)                 | completed | `e07f2f5` |
| p06-t05 | PlayerRail + timer display             | completed | `3cc8846` |
| p06-t06 | Tap controller (default mode)          | completed | `d2debfe` |
| p06-t07 | Drag controller (hard mode)            | completed | `eefa5a5` |
| p06-t08 | Pending-choice + sequence lock UI      | completed | `7282d95` |
| p06-t09 | HandoffScreen (pass-and-play)          | completed | `e816fea` |
| p06-t10 | GameOver + rematch                     | completed | `c6e4bdd` (+`e538a1c` fix) |
| p06-t11 | Notifications + Motion polish          | completed | `cdf26ca` |
| p06-t12 | Responsive pass                        | completed | `a1d57ac` (+`e538a1c` fix) |
| p06-t13 | Playwright e2e suite                   | completed | `c5ec8bd` (+`7293143` fix; +`974ed77` coverage) |

---

## Phase 7: Deploy & handoff (p07)

**Status:** implementation tasks complete; final review pending
**Started:** 2026-06-13

### Phase Summary

p07-t01 local deploy artifacts are complete: API Dockerfile, Railway
config-as-code, `.dockerignore`, production cookie strategy, and numeric
trust-proxy support. The API image preserves the existing
`node --experimental-transform-types` start path. Railway config uses the
Dockerfile builder, predeploy `drizzle-kit migrate`, `/health` healthcheck,
US East region, sleep disabled, and on-failure restart policy.

**p07-t01 verification:** focused API config/join tests green (30 tests);
root `pnpm typecheck`, `pnpm lint` (warnings only, pre-existing),
`pnpm format:check`, and root `pnpm test` green (383 tests / 58 files);
`docker build -f packages/api/Dockerfile -t sequence-api:p07 .` green;
container booted against `DATABASE_URL_TEST` mapped to `DATABASE_URL` and
served `/health`; Railway predeploy migration command passed against a
disposable local Postgres. The same migrate command was also attempted against
the existing Neon test branch and failed because that branch has been
maintained with `drizzle-kit push` rather than migration history; production DB
was not used.

p07-t02 is complete. Railway project `sequence`, environment `production`, and
service `sequence-api` were linked through explicit IDs. Required API variables
were set without printing secret values; a stale local `RAILWAY_TOKEN` was
unset so the freshly authenticated Railway OAuth session owned the deploy. The
API deployed as Railway deployment `016512d9-afef-4204-b9e6-11fb1b74a9d6` at
`https://sequence-api-production-8687.up.railway.app`. Railway logs confirmed
the predeploy migration completed, `/health` returned `{"status":"ok"}`, and a
Node 24 WebSocket client opened `wss://sequence-api-production-8687.up.railway.app/trpc`.
`WEB_ORIGIN` is currently the expected Vercel origin `https://sequence.vercel.app`
and must be corrected during p07-t03 if Vercel assigns a different URL.

p07-t03 is complete. Vercel project `sequence` was created with root directory
`apps/web`, install command `pnpm install --frozen-lockfile`, and build command
`pnpm --filter @sequence/web build`. The first Vercel deploy exposed that the
root `prepare` hook tried to install git hooks in Vercel's non-git build
archive, so `tools/git-hooks/manage-hooks.js setup` now no-ops outside a git
repository. The retry deployed production deployment
`dpl_3dyyJiXnxBRaPw6mkQp8N38EC9Rn`, aliased at
`https://sequence-cyan.vercel.app`. Railway `WEB_ORIGIN` was updated to that
alias and redeployed successfully (`9629e69f-3f80-4971-b616-619c4faa08dd`).
Production smoke for p07-t03 passed: root page 200, `/game/prod-smoke` 200,
cross-origin signup/login session cookies (`SameSite=None`, `Secure`,
`HttpOnly`) round-tripped through `health.me`.

p07-t04 is complete. Production smoke passed for API health, WS upgrade,
cross-origin auth cookies, guest cookie round-trip, automated local
pass-and-play at a 375px viewport, two-browser realtime move/concede, and the
Neon/Vercel/Railway hobby-tier audit. The forged-XFF rate-limit check initially
failed under `TRUST_PROXY=1` plus IP-keyed anonymous invite throttling, so
production was changed to `TRUST_PROXY=false` and anonymous `game.preview` /
`game.join` now share one limiter bucket. After redeploy
`12949411-5cfa-4c42-89b7-f6861a9e50f2`, the 31st rotated-XFF preview request
returned `429`.

NFR2 initially failed review. Functional move broadcast passed, but production
latency probes missed the ~500ms server-processing target: two-browser remote
render observed `3846ms`; direct browser `game.makeMove` fetch observed
`2553ms`; direct Node `game.makeMove` fetch with the same session cookie
observed `2548ms`; server timing added during the fix showed the pre-fix API
handler at `1780.3ms`.

The review-fix path corrected Railway placement to one `us-east4-eqdc4a`
replica (removing the previous `sfo` replica), exposed server-timing smoke
headers, collapsed `game.makeMove` from many sequential DB round trips into one
joined load plus one atomic state/event write CTE, and added a short
auth-mutation-invalidated Better Auth session-user cache for gameplay requests.
After deployment `85e343cd-993c-4e72-8ab3-5bae24c55061`, production
`game.makeMove` returned `Server-Timing: app;dur=24.4` with HTTP 200, so NFR2
now passes on the server-processing acceptance criterion.

p07-t05 is complete. `handoff.md` now includes the live URLs, deployment/env
checklists, FR-by-FR operator test script, NFR status table, known limitations,
and follow-ups. After the p07 review-fix, the NFR2 section records the passing
server-timing result and keeps only the client-network caveat as a limitation.

Post-handoff production hotfix: a manual production test exposed that opening a
game route without the creator/participant session rendered the generic
"Connection interrupted" banner over "Loading game..." forever. The root cause
was a pre-snapshot `game.onGameEvent` subscription authorization error
(`FORBIDDEN`) with no initial-load error branch. Commit `87d84d3` adds an
actionable "Game unavailable" state with login/dashboard actions and a
regression test. Vercel deployment `dpl_HPXqFU225rj2JQ5JWzax1DzSGru9` is live
behind `https://sequence-online.vercel.app`; `sequence-cyan.vercel.app` was
removed. Production smokes passed for the unauthenticated game-route error path
and for signup -> local pass-and-play -> initial WS snapshot -> board render.

| Task    | Name                                | Status  | Commit |
| ------- | ----------------------------------- | ------- | ------ |
| p07-t01 | API Dockerfile + Railway config     | completed | `3329bf2` |
| p07-t02 | Railway deploy                      | completed | `3896a8e` |
| p07-t03 | Vercel deploy                       | completed | `9bbcf76`, `57227bc` |
| p07-t04 | Production smoke + checks           | completed | `13fba71`, `b36afa6`, `953139f`, `519e21f`, `8afd6a3`, `acbdec9`, `87d84d3` |
| p07-t05 | Operator handoff notes              | completed | `694b40e` |

---

## Phase 8: Final review fixes (p08)

**Status:** in progress — final review fixes added from
`reviews/archived/final-review-2026-06-21.md`
**Started:** 2026-06-21

### Review Received: final

**Date:** 2026-06-21
**Review artifact:** `reviews/archived/final-review-2026-06-21.md`

**Findings:**

- Critical: 0
- Important: 1
- Medium: 2
- Minor: 2

**New tasks added:** `p08-t01`, `p08-t02`

**Finding disposition map:**

- I1 -> converted to `p08-t01`: fix move hot-path event `seq`/payload pairing
  so realtime replay cursors do not depend on PostgreSQL `RETURNING` row order.
- M1 -> converted to `p08-t02`: share the move-route seat-resolution helper
  with `gamePlayerProcedure` and add move-route tests for non-participant,
  guest, and local-creator authorization branches.
- M2 -> deferred with rationale: bound the short-lived session-user cache as a
  post-release cleanup unless traffic patterns change. The current 10s TTL,
  auth-mutation invalidation, and single-instance MVP traffic make this a
  slow-leak maintainability issue, not a correctness/privacy blocker.
- m1 -> deferred with rationale: physical-phone smoke remains an operator
  playtesting follow-up. Automated 375px/mobile-375 verification satisfies the
  written NFR3 acceptance criterion.
- m2 -> deferred with rationale: the shared anonymous invite limiter bucket is a
  deliberate safer tradeoff after Railway XFF spoofing tests. Revisit only when
  a trusted edge identifier can be verified.

**Deferred Findings:**

- Medium M2: unbounded session-user cache. Follow-up trigger: sustained public
  traffic, memory growth observations, or any auth-cache touch.
- Minor m1: physical-phone smoke. Follow-up trigger: broader operator
  playtesting or public launch.
- Minor m2: anonymous invite shared limiter bucket. Follow-up trigger:
  anonymous invite traffic volume or verified proxy overwrite behavior.

**Next:** Execute `p08-t01` and `p08-t02`, then update the final review row to
`fixes_completed` and re-run final code review focused on p08 fixes.

| Task    | Name                                          | Status  | Commit |
| ------- | --------------------------------------------- | ------- | ------ |
| p08-t01 | Fix move hot-path event seq pairing           | pending | -      |
| p08-t02 | Share and cover move-route seat authorization | pending | -      |

---

## Orchestration Runs

_Each run from `oat-project-implement` appends an entry below with:_
_- Run header (number, timestamp, branch, tier, policy, phase counts)_
_- Phase Outcomes table_
_- Parallel Groups list_
_- Outstanding Items_

<!-- orchestration-runs-start -->

### Run 10 — 2026-06-13 18:44

**Branch:** 2026
**Tier:** 1
**Policy:** post-handoff production hotfix
**Phases:** 0 completed, 0 passed, 0 failed, 0 stopped (p07 hotfix deployed; final HiLL still pending)

#### Phase Outcomes

| Phase | Implementer | Review | Fix Iterations | Disposition |
| ----- | ----------- | ------ | -------------- | ----------- |
| p07   | hotfix completed | not run | 0/2 | fixed pre-snapshot game-stream auth errors so unauthorized/non-participant game routes show "Game unavailable" instead of indefinite loading; deployed Vercel `dpl_HPXqFU225rj2JQ5JWzax1DzSGru9` |

#### Parallel Groups

- p07: sequential

#### Dispatch Notes

- Reproduced the screenshot against production by opening a game route without the API participant cookie; WS returned `FORBIDDEN`.
- Deployed via Vercel CLI after device login; corrected alias so `sequence-online.vercel.app` points at the new deployment and removed `sequence-cyan.vercel.app`.

#### Outstanding Items

- **Final HiLL approval still pending:** do not proceed to final review / PR completion without operator approval.
- **Physical phone caveat:** still only automated 375px viewport, not a real phone, unless operator runs a device pass.

#### Artifact / Design Deltas

Run-scoped snapshot only. The durable record is `## Deviations from Plan / Design`.

### Run 9 — 2026-06-13 17:01

**Branch:** 2026
**Tier:** 1
**Policy:** merge-strategy=merge, retry-limit=2
**Phases:** 0 completed, 0 passed, 1 fix completed, 0 stopped (p07 re-review pending)

#### Phase Outcomes

| Phase | Implementer | Review | Fix Iterations | Disposition |
| ----- | ----------- | ------ | -------------- | ----------- |
| p07   | review-fix completed | pending re-review | 1/2 | p07 review found NFR2 blocking; fixed Railway region placement, move hot path DB round trips, and session lookup overhead; production server timing now `24.4ms` |

#### Parallel Groups

- p07: sequential

#### Dispatch Notes

- Review artifact: `.oat/projects/shared/web-mvp/reviews/p07-review-2026-06-13.md`.
- Deployment targets: Railway API `https://sequence-api-production-8687.up.railway.app`; Vercel web alias `https://sequence-online.vercel.app`.

#### Outstanding Items

- **p07 re-review pending:** verify the NFR2 fix and update the plan review row after pass/fail.
- **Physical phone caveat:** still only automated 375px viewport, not a real phone, unless operator runs a device pass.

#### Artifact / Design Deltas

Run-scoped snapshot only. The durable record is `## Deviations from Plan / Design`.

### Run 8 — 2026-06-13 16:23

**Branch:** 2026
**Tier:** 1
**Policy:** merge-strategy=merge, retry-limit=2
**Phases:** 1 completed, 0 passed, 0 failed, 0 stopped (p07 implementation tasks complete; final review pending)

#### Phase Outcomes

| Phase | Implementer | Review | Fix Iterations | Disposition |
| ----- | ----------- | ------ | -------------- | ----------- |
| p07   | p07-t05 completed | pending | 0/2 | operator handoff ready; all 73 implementation tasks complete; final p07 review/HiLL remains |

#### Parallel Groups

- p07: sequential

#### Dispatch Notes

- Dispatch: p07 implementation effort_axis=selected:xhigh via Codex `oat-phase-implementer-xhigh`.
- Handoff artifact: `.oat/projects/shared/web-mvp/handoff.md`.

#### Outstanding Items

- **Final review pending:** run p07 review before the configured final HiLL checkpoint.
- **Review gate:** p07 review pending; NFR2 later fixed in Run 9.

#### Artifact / Design Deltas

Run-scoped snapshot only. The durable record is `## Deviations from Plan / Design`.

### Run 7 — 2026-06-13 16:20

**Branch:** 2026
**Tier:** 1
**Policy:** merge-strategy=merge, retry-limit=2
**Phases:** 1 continued, 0 passed, 0 failed, 0 stopped (p07 in progress)

#### Phase Outcomes

| Phase | Implementer | Review | Fix Iterations | Disposition |
| ----- | ----------- | ------ | -------------- | ----------- |
| p07   | p07-t04 completed | not run | 0/2 | production smoke recorded; XFF limiter hardening deployed; NFR2 latency remains an operator follow-up; continuing at p07-t05 |

#### Parallel Groups

- p07: sequential

#### Dispatch Notes

- Dispatch: p07 implementation effort_axis=selected:xhigh via Codex `oat-phase-implementer-xhigh`.
- Deployment targets: Railway API `https://sequence-api-production-8687.up.railway.app`; Vercel web alias `https://sequence-online.vercel.app`.

#### Outstanding Items

- **Operator handoff pending:** document how to test each FR, current limitations, and the NFR2 performance follow-up.

#### Artifact / Design Deltas

Run-scoped snapshot only. The durable record is `## Deviations from Plan / Design`.

### Run 6 — 2026-06-13 15:49

**Branch:** 2026
**Tier:** 1
**Policy:** merge-strategy=merge, retry-limit=2
**Phases:** 1 continued, 0 passed, 0 failed, 0 stopped (p07 in progress)

#### Phase Outcomes

| Phase | Implementer | Review | Fix Iterations | Disposition |
| ----- | ----------- | ------ | -------------- | ----------- |
| p07   | p07-t03 completed | not run | 0/2 | sequential on-branch; Vercel project created/deployed, Railway `WEB_ORIGIN` corrected, auth smoke passed; continuing at p07-t04 |

#### Parallel Groups

- p07: sequential

#### Dispatch Notes

- Dispatch: p07 implementation effort_axis=selected:xhigh via Codex `oat-phase-implementer-xhigh`.
- Deployment target: Vercel project `sequence-online`, root directory `apps/web`, production alias `https://sequence-online.vercel.app`.

#### Outstanding Items

- **Production smoke pending:** guest join cookie round-trip, full local pass-and-play game, two-browser realtime game, latency spot-check, mobile-375 pass, Neon/Vercel/Railway tier audit, and forged-XFF rate-limit check remain for p07-t04.

#### Artifact / Design Deltas

Run-scoped snapshot only. The durable record is `## Deviations from Plan / Design`.

### Run 5 — 2026-06-13 15:36

**Branch:** 2026
**Tier:** 1
**Policy:** merge-strategy=merge, retry-limit=2
**Phases:** 1 continued, 0 passed, 0 failed, 0 stopped (p07 in progress)

#### Phase Outcomes

| Phase | Implementer | Review | Fix Iterations | Disposition |
| ----- | ----------- | ------ | -------------- | ----------- |
| p07   | p07-t02 completed | not run | 0/2 | sequential on-branch; Railway API deployed, migrations applied, health and WS verified; continuing at p07-t03 |

#### Parallel Groups

- p07: sequential

#### Dispatch Notes

- Dispatch: p07 implementation effort_axis=selected:xhigh via Codex `oat-phase-implementer-xhigh`.
- Deployment target: Railway project `sequence`, environment `production`, service `sequence-api`.

#### Outstanding Items

- **Vercel pending:** web project is not linked yet; p07-t03 must deploy the Next app and update Railway `WEB_ORIGIN` if the assigned Vercel URL differs from `https://sequence.vercel.app`.
- **Smoke pending:** cross-origin auth, guest join, pass-and-play, two-browser realtime, latency, mobile-375, tier audit, and forged-XFF rate-limit check remain for p07-t03/p07-t04.

#### Artifact / Design Deltas

Run-scoped snapshot only. The durable record is `## Deviations from Plan / Design`.

### Run 4 — 2026-06-13 06:12

**Branch:** 2026
**Tier:** 1
**Policy:** merge-strategy=merge, retry-limit=2
**Phases:** 1 started, 0 passed, 0 failed, 1 stopped

#### Phase Outcomes

| Phase | Implementer | Review | Fix Iterations | Disposition |
| ----- | ----------- | ------ | -------------- | ----------- |
| p07   | BLOCKED at p07-t02 | not run | 0/2 | stopped; p07-t01 committed and p07-t02 handoff skeleton committed |

#### Parallel Groups

- p07: sequential

#### Dispatch Notes

- Dispatch: p07 implementation effort_axis=selected:xhigh via Codex `oat-phase-implementer-xhigh`.

#### Outstanding Items

- **Blocking:** Railway deploy target is not linked. The repo has no `.railway/` metadata and no `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE_ID`, or `RAILWAY_ENVIRONMENT_ID`; `railway` CLI is not installed in `PATH`. Vercel is also not linked and `vercel` CLI is absent.
- **Ready local artifacts:** API Dockerfile, Railway config, production cookie/proxy hardening, and `handoff.md` skeleton are committed.

#### Artifact / Design Deltas

Run-scoped snapshot only. The durable record is `## Deviations from Plan / Design`.

### Run 3 — 2026-06-13 05:49

**Branch:** 2026
**Tier:** 1
**Policy:** merge-strategy=merge, retry-limit=2
**Phases:** 1 executed, 1 passed, 0 failed, 0 stopped (p07 pending)

#### Phase Outcomes

| Phase | Implementer | Review | Fix Iterations | Disposition |
| ----- | ----------- | ------ | -------------- | ----------- |
| p06   | DONE_WITH_CONCERNS (advisory only) | fail -> pass (re-review) | 1/2 | sequential on-branch; fixes closed lifecycle controls, browser coverage, 6p randomize, replay version recovery, and concede attribution |

#### Parallel Groups

- p06: sequential

#### Dispatch Notes

- Dispatch: p06 implementation effort_axis=selected:xhigh via Codex `oat-phase-implementer-xhigh`.
- Dispatch: p06 review effort_axis=selected:xhigh via Codex `oat-reviewer-xhigh`; initial verdict fail.
- Dispatch: p06 fix effort_axis=selected:xhigh via Codex `oat-phase-implementer-xhigh`.
- Dispatch: p06 re-review effort_axis=selected:xhigh via Codex `oat-reviewer-xhigh`; verdict pass.

#### Outstanding Items

- **Verification reliability:** root `pnpm test` remains vulnerable to a transient Neon `CONNECTION_ENDED` timeout in the API full-game e2e; the isolated rerun passed and p06-focused verification passed.
- **Carried to p07 (deploy bucket):** I1 — SameSite=Lax breaks cross-site prod auth; M3 — boolean trustProxy keys on leftmost XFF; p07 should decide cookie/domain strategy and verify Railway forwarded-IP behavior.

#### Artifact / Design Deltas

Run-scoped snapshot only. The durable record is `## Deviations from Plan / Design`.

### Run 2 — 2026-06-13 02:55

**Branch:** 2026
**Tier:** 1
**Policy:** merge-strategy=merge, retry-limit=2
**Phases:** 1 executed, 1 passed, 0 failed, 0 stopped (p06-p07 pending)

#### Phase Outcomes

| Phase | Implementer | Review | Fix Iterations | Disposition |
| ----- | ----------- | ------ | -------------- | ----------- |
| p05   | DONE | fail -> pass (re-review) | 1/2 | sequential on-branch; fixes closed logout, invite redirect, tri-state list results, CTA markup, and bookkeeping hash |

#### Parallel Groups

- p05: sequential resume after interrupted Claude review dispatch

#### Dispatch Notes

- Dispatch: p05 review effort_axis=selected:xhigh via Codex `oat-reviewer-xhigh` after Claude's selected `claude-fable-5` model was unavailable.
- Dispatch: p05 fix effort_axis=selected:xhigh via Codex `oat-phase-implementer-xhigh`.
- Dispatch: p05 re-review effort_axis=selected:xhigh via Codex `oat-reviewer-xhigh`; verdict pass.

#### Outstanding Items

- **Carried to p06:** lifecycle broadcasts (`presence.ts:191`, `concede.ts:78`) do not carry the bumped `version` -> one recoverable CONFLICT for the next mover after freeze/resume; fold into p06-adjacent work.
- **Carried to p07 (deploy bucket):** I1 — SameSite=Lax breaks cross-site prod auth; M3 — boolean trustProxy keys on leftmost XFF; needs hop-count support or forged-XFF smoke assertion on Railway.

#### Artifact / Design Deltas

Run-scoped snapshot only. The durable record is `## Deviations from Plan / Design`.

### Run 1 — 2026-06-12 20:54

**Branch:** 2026
**Tier:** 1
**Policy:** merge-strategy=merge, retry-limit=2
**Phases:** 4 executed, 4 passed, 0 failed, 0 stopped (p05-p07 pending)

#### Phase Outcomes

| Phase | Implementer        | Review | Fix Iterations | Disposition |
| ----- | ------------------ | ------ | -------------- | ----------- |
| p01   | DONE_WITH_CONCERNS (advisory only) | pass | 0/2 | merged (sequential, on-branch) |
| p02   | DONE | fail → pass (re-review) | 1/2 | merged `84759ba` (fan-in, no conflicts) |
| p03   | DONE | pass (+ proactive fix round, verified) | 1/2 | merged `fce98ec` (fan-in, implementation.md conflict resolved by subagent) |
| p04   | DONE | fail → pass (re-review) | 1/2 | sequential on-branch; fix round closed Critical (client version contract) + Important (lifecycle version guard) + 4 minors |

#### Parallel Groups

- Group 1 [p02, p03]: worktree-based at `.worktrees/web-mvp/{p02,p03}`, base `fbd9db4` (verified), merged in plan order; integration verification green after each merge (132 tests post-p02; 166 post-p03 incl. live Neon-test-branch integration). Worktrees removed.
- p01, p04, p05, p06, p07: sequential

#### Dispatch Notes

- Dispatch: p01 implementation model_axis=selected:opus (bleeding-edge toolchain integration); p01 review model_axis=selected:opus (ceiling).
- User directive (2026-06-12, mid-run): all subsequent REVIEW dispatches run at model_axis=selected:fable (host model above the configured opus ceiling; user-directed override — resolver ladder unchanged). Implementer dispatches remain capped at opus. Applies from the p02/p03 reviews onward.
- Dispatch: p02/p03 implementation model_axis=selected:opus; p02 review + re-review, p03 review + fix verification model_axis=selected:fable (user override). p02 fix loop iteration 1 cleared all 10 findings; p03 proactive fix round closed I2/M1/M2 + 4 minors.

#### Outstanding Items

- ~~Carried to p04~~ **CLOSED in p04:** I3 (WS ctx.ip — fixed t03 with regression test, re-verified by review), p02-m6 (seat stamping — verified complete by review), p02-m4 (chained-runs reducer test added).
- **Carried to p05/p06:** lifecycle broadcasts (`presence.ts:191`, `concede.ts:78`) don't carry the bumped `version` → one recoverable CONFLICT for the next mover after freeze/resume; trivial stamp fix, fold into p06-adjacent work. `head-to-head.ts:57` scores no-winner FFA concedes as losses for both users — inconsistent with new myRecord semantics; fix when history is next touched (p05-t08 renders it).
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

### 2026-06-13 — Post-handoff card-fit hotfix

- Commit `feb38c8` fixes cropped playing-card artwork on the board, hand, and player rail by using contained card images, keeps the board square while fitting better in short desktop viewports, and makes the shared tRPC WebSocket client lazy so signup/create flows do not reuse an unauthenticated eager socket.
- Commit `c827395` records backlog item `bl-821f` for a larger symbolic/physical-board visual exploration; that work is intentionally out of scope for the card-cropping hotfix.
- Verification: `pnpm --filter @sequence/web typecheck`; `pnpm --filter @sequence/web test -- --runInBand`; `pnpm --filter @sequence/web build`; changed-file `oxfmt --check`; `git diff --check`; local dev smoke at `http://127.0.0.1:3010/game/38e4842a-176f-4e5a-ac1c-f53a4c1df81b`; production smoke after Vercel deployment `dpl_FzuuKDfc2iSB2weUV9LFmtuomrBh` (signup -> local game, 103 card images rendered, all sampled card images `object-fit: contain`, no game-unavailable/connection-interrupted state).

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
| p03 review (I1) | review p03 finding I1 (`SameSite=Lax` cross-site cookies) | Better Auth session cookie hard-coded `SameSite=Lax`; guest cookie same | Production defaults now resolve to `SameSite=None; Secure` for Better Auth session cookies and the `sequence_guest` cookie. Local dev remains `SameSite=Lax` / non-secure. `AUTH_COOKIE_SAME_SITE=lax` is an explicit escape hatch only for a shared-registrable-domain deploy; `AUTH_COOKIE_SECURE` can override secure handling. | p07 deploy target is Vercel(web) -> Railway(api), a cross-site credentialed flow; `Lax` would drop cookies on tRPC fetches and WS upgrades. Guest-token cookies need the same treatment as session cookies for anonymous invite players. | implementation (p07-t01) | p07-t03/t04 must still prove cross-origin signup/login and guest join against deployed URLs |
| p03 review M3 / p07 dispatch | p03 re-review M3 (`TRUST_PROXY` boolean trusts leftmost XFF) | `TRUST_PROXY` parsed as boolean; production default was boolean `true` | `TRUST_PROXY` accepts booleans or numeric hop counts, but the final production default is `false`. Anonymous `game.preview` / `game.join` traffic shares one limiter bucket instead of keying by IP. `.env.example` documents `TRUST_PROXY=false`. | Railway production smoke showed `TRUST_PROXY=1` plus IP-keyed anonymous throttling could be bypassed with rotating forged `X-Forwarded-For` values. Since neither XFF nor observed edge/socket IPs were stable enough for this public limiter, the MVP chooses the conservative shared anonymous budget and leaves proxy trust opt-in only after edge overwrite behavior is verified. | implementation (p07-t04) | none for invite-code throttling; future optimization can revisit per-IP buckets only after proxy behavior is verified |
| p04-t01 | design.md §Data Models (`board` jsonb "100 cells `{chip?,lockedBy?}`"; `sequences` "team, cells, order"; `pending_choice`) | `board` as a 100-element array; `sequences` rows carry `order`; `pending_choice = {seat,runLength,cells}` | `board` serialized as a **sparse object keyed by position code** (`{ '1AC': {chip,lockedBy} }`); `sequences` carry `{id,team,cells}` (no `order` — `nextSequenceId` column tracks issue order); `pending_choice` expanded to `{seat,team,placed,cells,additionalRuns?}`; added `games.next_sequence_id` column + migration `0003`. The game-logic `Board` is a `Map<Position,BoardCell>` keyed by string codes — a sparse object round-trips it exactly (empty cells absent), whereas a dense 100-array would need a fixed position↔index map and stores empties. `pending_choice` shape follows the p02 I1 delta (`additionalRuns`). | implementation (shipped) | none — round-trip integration-tested; design §Data Models jsonb shapes could note the object-keyed board |
| p04-t01 (infra) | plan.md p03 ("integration tests run … with `DATABASE_URL_TEST`") | `packages/api/vitest.config.ts` `loadEnv()` reads a package-local `.env` | Also loads the **monorepo-root** `.env` explicitly (`../../.env`) — the gitignored secrets live at root (worktree-init copies them there), so the package-local-only load left `DATABASE_URL_TEST` unset and every integration `describe` skipped. | Without this the entire p04 integration suite silently skipped. A package-local `.env` still wins if present. | implementation (shipped) | none |
| p04-t09 (infra) | plan.md p03-t01 / package.json (`start: node src/server.ts`) | `node src/server.ts` runs the API at boot | `start`/`dev` use `node --experimental-transform-types`; p07 Dockerfile starts the API through `pnpm --filter @sequence/api start`, preserving the same flag | Node 24's default strip-only TS mode cannot run **constructor parameter properties** (used by `TimerService`, `PresenceTracker`, `VersionConflictError`); `--experimental-transform-types` transpiles them. Verified by booting the server for the Bruno run and by p07 container `/health`. | implementation (shipped) | none |
| p04-t14 (infra) | plan.md p03-t08 deviation (advisory lock serializes integration files) | The per-file Postgres advisory lock is sufficient under the workspace runner | Pinned the api vitest project to a **single fork** (`poolOptions.forks.singleFork`) + raised `hookTimeout` to 120s | With 14+ integration files now (vs p03's 2) plus the ~120s full-game e2e holding the advisory lock, queued harness `beforeAll`s (drizzle-push + boot) starved past the 60s hook timeout under the workspace's parallel workers, crashing `afterAll` on an undefined harness. A single fork makes the project's `fileParallelism:false` real; the advisory lock is now belt-and-suspenders. game-logic/web keep parallel pools. | implementation (shipped) | none — root `pnpm test` green (258 tests / 35 files) |
| p04 review (Critical) | design.md §API (move inputs require `version`) / §Error Handling (recovery snapshot) | No client read path exposed `version` (snapshot/queries/broadcasts all omitted it) — makeMove uncallable over pure tRPC | **Design delta: `version` is now a client-facing field.** `GameSnapshot` carries the current `version`; the move engine + start-game stamp the post-commit `version` onto every broadcast event (global per-game, never redacted). A client reads it from the recovery snapshot and keeps it current from the live stream — no privileged DB read. `start-game` also returns `version`. | review finding (closed) — implementation is source of truth | design.md §API/§Error Handling should note `version` on the snapshot + event envelope; the full-game e2e now drives version blind (no DB reads) and bruno `game` has create-local + make-move |
| p04 review (Important) | design.md §Data Flow (only the move engine version-guards `games`) | concede/saveAndExit/presence freeze+resume wrote `games.status` with no version predicate or bump | All lifecycle status writes route through new `persistLifecycleTransition` (same optimistic-concurrency predicate as `persistGameState`: `WHERE version=prev`, bump to `prev+1`, zero-row → CONFLICT). A concurrent move can no longer revert a concede/save/freeze (and vice-versa). | review finding (closed) — shipped | Race-tested (concede vs move: exactly one linearizes) |
| p04 review (Minor) | rules-and-flows ("their team takes the recorded loss") / FR11/FR14 (unspecified for FFA non-conceders) | `myRecord` counted a no-winner FFA concede as a loss for every team | **Decision delta:** in a no-winner (3+-team) FFA concede, only the conceding team takes the loss; non-conceding teams record neither win nor loss (excluded from total). Conceding team read from the persisted `GameConceded` event. | review finding (closed) — shipped | least-surprising per rules-and-flows; 2-team concede unchanged (winner_team set) |
| p04 review (Minor) | — (cursor pagination) | `history.myGames` cursor ordered/advanced by `finished_at` only → rows could skip on a `finished_at` tie | Composite `(finished_at, id)` keyset cursor (total order), encoded `"<iso>\|<id>"`; ordered `desc(finished_at), desc(id)`. | review finding (closed) — shipped | none — tie-paging integration-tested |
| p04 review (Minor) | redaction.ts §snapshot (`pendingChoice = {seat,cells}`) | snapshot omitted `pendingChoice.placed` / `additionalRuns` | Snapshot `pendingChoice` now includes `placed` and (when present) `additionalRuns`, so a placer reconnecting mid-choice can rebuild the pending choice from a cold snapshot. | review finding (closed) — shipped | none |
| p05-t02 | design.md §Internal Dependencies ("web depends on api's router types (type-only import)") / plan.md p05-t02 (`AppRouter` type-only from `@sequence/api`) | `AppRouter` importable from the package root | Added `export type { AppRouter } from './app-router.ts'` to `packages/api/src/index.ts` so `import type { AppRouter } from '@sequence/api'` resolves at the package root (the index previously exported only `PACKAGE_NAME`). Type-only re-export — no API runtime ships in the web bundle; `@sequence/api` moved to web `devDependencies` (p01 review minor). | implementation (shipped) | none — matches the multi-client contract surface |
| p05-t05 | api `game.myGames` `MyGameCard` (`{…, mySeat}`) | Card carried only `mySeat` (no team/opponents/round) | Enhanced `MyGameCard` additively with `myTeam`, `opponents: string[]` (other players' display names via a `user` left-join), `round`, and tri-state `result: "win" \| "loss" \| "none"` so the dashboard can render "vs Sarah, Ben", the round number, and W/L/neutral markers per the approved wireframe and no-winner FFA concede semantics. Existing `lifecycle.test.ts` (asserts only `gameId` membership) unaffected. | implementation (shipped) — dashboard is the consumer | none — additive, no behavior change to existing fields |
| p05-t08 (carried fix, filed `fix(p04-t13)`) | rules-and-flows ("their team takes the recorded loss") — run-1 outstanding item (`head-to-head.ts:57`) | `headToHead` scored a no-winner FFA concede as a loss for BOTH users (`won=false → loss`), inconsistent with `myRecord`'s conceder-only-loss semantics | `headToHead` now left-joins the `GameConceded` event: a `winner_team`-null game counts as a loss vs the opponent ONLY when MY team conceded; otherwise it is excluded (not a decided head-to-head result) — matching `myRecord`. New integration test (`headToHead scores a no-winner FFA concede only against the conceder`) added; full history suite (8 tests) green vs the Neon test branch. | implementation (shipped) | none — closes a run-1 carried item |
| p06-t01 | plan.md p06-t01 (game route state container) / carried p04 outstanding item | Build the client route state container; lifecycle version stamping remained a carried p04 issue | p06-t01 also extended the API realtime payloads needed by the route: snapshot metadata/roster/settings, live lobby publications, private `HandUpdated` start events for local hand state, post-transition `version` stamping on presence/concede/save broadcasts, and review-fix replay recovery that emits a current snapshot/version after gap replay. The page now resubscribes/refetches on stale-version `CONFLICT`. | The route could not be correct without authoritative metadata, live private hand updates, and a recovery path that refreshes mutation `version` before the next action; the carried lifecycle-version bug was p06-adjacent realtime correctness. | implementation (shipped) | none — API redaction/replay/lifecycle tests cover the added behavior |
| p06-t02 | p02/p04 engine supports legal 6-player 2-team and 3-team layouts | Full rules/API can start 6p as 3v3 or 2x3 depending on seeds | The web create/lobby/randomize path currently presents 6-player games as 3 teams of 2 (matching the p06 lobby wireframe) and does not expose a 6p 2-team selector. `game.randomizeTeams` follows that web shape so a randomized 6p lobby remains startable. | The approved p06 lobby wireframe uses the 3-team layout; adding a team-count mode would expand create/lobby UX beyond this phase's UI scope. | implementation (shipped UI constraint) | Follow-up if product wants 6p 3v3 in the web UI: add team-count selection to create/lobby before start |
| p06 review C1/M1 | p06 review artifact C1 + medium concede attribution | Active games needed accessible Save & exit / Concede controls; GameOver needed concede attribution | Added `ActiveGameControls` with confirmation, pending states, success/error toasts, and responsive placement. `GameConceded.payload.team` is preserved through event/snapshot state and rendered as "Team N conceded" on GameOver. | Review found FR10/FR11 lifecycle actions unreachable on the active game route and concede outcomes missing attribution. | implementation (review-fix loop) | none — component/state tests and browser e2e cover the reachable controls/attribution path |
| p06 review C2 | p06 review artifact C2 / plan.md p06-t13 | Browser e2e should cover critical p06 flows, not only one local smoke path | Replaced the single smoke with DB-backed Playwright specs for remote join → play → win, reload recovery, rematch routing/roster retention, pass-and-play handoff, and hard-mode drag across desktop + mobile-375. | Review found the required critical browser paths absent. | implementation (review-fix loop) | none — `pnpm --filter @sequence/web exec playwright test` passes 10/10 |
| p06-t13 | plan.md p06-t13 / p04 test infra | Playwright e2e should run against `DATABASE_URL_TEST` only when DB-backed | `apps/web/playwright.config.ts` loads the repo root `.env`, starts the API with `DATABASE_URL="$DATABASE_URL_TEST"` and the web app pointed at that API, and skips only when `DATABASE_URL_TEST` is absent. | Matches the API Vitest env-loading convention and prevents accidental production `DATABASE_URL` use while still making local/CI browser e2e executable. | implementation (shipped) | none — desktop and mobile-375 Playwright projects passed against the test DB |
| p07 review I1 / NFR2 | spec NFR2 and plan p07-t04 latency spot-check | Production smoke recorded functional realtime success but server/client probes missed the ~500ms server-processing target | Added API server-timing headers, moved the Railway API service to a single `us-east4-eqdc4a` replica, optimized `game.makeMove` to one joined load plus one atomic state/event CTE, and added a short auth-mutation-invalidated session-user cache for gameplay requests. | Review correctly treated the documented miss as blocking. The final production probes measured `Server-Timing: app;dur=24.4` after the latency fix and `app;dur=45.6` after the lifecycle version-guard redeploy, satisfying the server-processing acceptance criterion. | implementation (review-fix) | p07 re-review pending; total client round-trip from this machine still includes Railway edge/network time and is not the NFR2 measurement |
| p07 review-fix regression | p04 review Important (version-guarded lifecycle writes) / p06 active game controls | Lifecycle transitions used `persistLifecycleTransition`, but `saveAndExit`/`concede` supplied the just-read DB version instead of the client's last-seen version | `game.saveAndExit` and `game.concede` now require `version` input, and the web active-game controls send `state.version`. The lifecycle race test now races `game.makeMove(version: 1)` against `game.concede(version: 1)` and asserts exactly one winner/one `CONFLICT`. | A lifecycle transition that reads after a racing move must lose as stale rather than observe the new row and commit a second transition. This preserves the same optimistic-concurrency protocol used by moves. | implementation (review-fix) | none — focused lifecycle suite and full root suite passed; production versioned concede smoke passed |

## Test Results

Track test execution during implementation.

| Phase | Tests Run | Passed | Failed | Coverage |
| ----- | --------- | ------ | ------ | -------- |
| p01   | 7 (game-logic smoke + 6 board-map) | 7 | 0 | n/a |
| p02   | 132 (13 files; post-review fixes) | 132 | 0 | n/a |
| p03   | 34 api after review fixes (9 env + 7 guest + 7 rate-limit unit + 11 integration [4 auth + 7 middleware]; +7 game-logic salvage = 41 root) | 34 api / 41 root | 0 | n/a |
| p04   | 258 root / 125 api (22 api files; +1 game-logic chained-runs) | 258 / 125 | 0 | n/a |
| p05   | 313 root / 44 files after review fixes (web login/logout/dashboard/history/join focused tests; API `game.myGames` + `history.myGames` integration; full root gate) | 313 | 0 | n/a |
| p06   | Review-fix focused web controls/state/GameOver (13); focused API lobby/replay (21); Playwright desktop+mobile-375 (10); web build; root typecheck/lint/format; root test aggregate; isolated API full-game rerun | 34 focused + 10 Playwright + 1 isolated API e2e; root aggregate 374/375 | 1 root aggregate timeout (transient Neon `CONNECTION_ENDED`; isolated rerun passed) | n/a |
| p07   | p07-t01 focused API env/cookie/proxy/join tests (30); root `pnpm typecheck`; `pnpm lint`; `pnpm format:check`; root `pnpm test`; Docker build; container `/health`; `drizzle-kit migrate` on disposable Postgres; p07-t02 Railway deploy, prod `/health`, WS upgrade, Railway logs; p07-t03 Vercel build/deploy, prod root/game route checks, signup/login auth smoke; p07-t04 focused API invite limiter/env/server tests (23), production guest/local/realtime/XFF/tier/latency smoke; p07 review-fix focused auth/makeMove/full-game/lifecycle tests; API/web typechecks; touched-file oxlint; full root `pnpm test`; post-rereview alias rename smoke; post-handoff game-route auth-error regression test and deployed browser smokes | 30 focused + 383 root + Docker/migrate/health; p07 review-fix local gate: lifecycle 9/9, makeMove+auth 11/11, full-game e2e 1/1, API typecheck, web typecheck, oxlint, root 386/386; post-handoff web page regression 1/1, web typecheck, full web suite 98/98, web build; Railway deployment `016512d9-afef-4204-b9e6-11fb1b74a9d6` SUCCESS; prod health + WS passed; Vercel deployments READY; auth + guest cookie smoke passed; functional realtime smoke passed; forged-XFF check passed after `b36afa6` and Railway deployment `12949411-5cfa-4c42-89b7-f6861a9e50f2`; NFR2 server timing passed after `acbdec9` / Railway `85e343cd-993c-4e72-8ab3-5bae24c55061` (`game.makeMove` `app;dur=24.4ms`) and after lifecycle deploy `2a313ac4-91b1-4915-aa16-4b4722c8f3da` (`game.makeMove` `app;dur=45.6ms`, `game.concede` `app;dur=49.8ms`); Vercel production deployments `dpl_3EgH16neQoi79NZmeHfHxarjgB2v`, `dpl_GnJi7APdv7NBa5v1afXjhhou1W12`, and `dpl_HPXqFU225rj2JQ5JWzax1DzSGru9` READY; Railway `WEB_ORIGIN` redeploy `eb50f46c-f4b7-4e63-850a-05f5426ddbf4` SUCCESS; `https://sequence-online.vercel.app` `/ping`, API CORS preflight, `/health`, signup -> `health.me` auth-cookie round trip, unauthenticated game-route error UX, and signup -> local game WS snapshot all passed | Pre-fix NFR2 probes failed (`game.makeMove` direct Node fetch `2548ms`, server timing `1780.3ms`); grouped focused Vitest run was manually terminated after opaque silence, then equivalent files passed individually; Neon test branch migrate attempt failed due existing schema-pushed branch, prod DB not used for that local check; one post-handoff Playwright smoke clicked before hydration and was rerun with network-idle waits successfully | n/a |

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
