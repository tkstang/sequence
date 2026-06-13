---
oat_status: complete
oat_ready_for: oat-project-implement
oat_blockers: []
oat_last_updated: 2026-06-12
oat_phase: plan
oat_phase_status: complete
oat_plan_parallel_groups: [['p02', 'p03']] # file-disjoint; p02 installs no new deps, so root pnpm-lock.yaml is touched only by p03
oat_plan_hill_phases: ['p07'] # from workflow.hillCheckpointDefault: final
oat_auto_review_at_hill_checkpoints: true # from workflow.autoReviewAtHillCheckpoints
oat_plan_source: spec-driven # spec-driven | quick | imported
oat_import_reference: null
oat_import_source_path: null
oat_import_provider: null
oat_generated: false
oat_template: false
---

# Implementation Plan: web-mvp

> Execute this plan using `oat-project-implement` — sequential by default, parallel when `oat_plan_parallel_groups` is declared.

**Goal:** Complete, rule-faithful, server-authoritative multiplayer Sequence web MVP — 2–6 players (users + guests + local pass-and-play), real-time, persistent, deployed and operator-testable.

**Architecture:** pnpm monorepo — pure `game-logic` reducer (owns the complete turn loop), Fastify 5 + tRPC 11 API (thin host: persist + broadcast + timers) on Railway, Next.js 16 web app on Vercel, Neon Postgres via Drizzle. WS subscriptions, room-scoped, snapshot-first recovery.

**Tech Stack:** TypeScript (tsgo + TS6 side-by-side), oxlint, oxfmt, Vitest, Playwright, Drizzle + postgres.js, Better Auth ^1.6, Tailwind, Motion, Bruno.

**Commit Convention:** `{type}(p{NN}-t{NN}): {description}` — e.g., `feat(p02-t03): create-game dealing and turn order`

**Conventions (apply to every task):** kebab-case files (PascalCase components/classes), tests as dot-extension siblings (`foo.ts` / `foo.test.ts`), file-per-route under each API domain's `routes/`, no framework imports in `game-logic`. Root gates: `pnpm typecheck` (tsgo), `pnpm lint` (oxlint), `pnpm format:check` (oxfmt), `pnpm test` (vitest).

## Planning Checklist

- [x] Defer HiLL checkpoint confirmation to oat-project-implement
- [x] Evaluated phases for parallelism opportunities
- [x] Set `oat_plan_parallel_groups` in frontmatter (user confirmed: [['p02','p03']])

---

## Phase 1: Foundation & Salvage (p01)

Goal: clean monorepo skeleton, tooling green, legacy gone. Exit state: empty packages build, all gates pass on a clean tree.

### Task p01-t01: Workspace scaffold

**Files:**
- Create: `pnpm-workspace.yaml`, root `package.json` (workspace scripts: `typecheck`, `lint`, `format`, `format:check`, `test`, `build`)
- Modify: `.nvmrc` (keep 24), `.gitignore` (add `node_modules`, `.next`, `dist`, `.env*`)

**Implement:** workspace globs `apps/*`, `packages/*`; root scripts fan out via `pnpm -r`. No packages exist yet — scripts must tolerate empty targets.

**Verify:** `pnpm install` succeeds; `git status` clean of build artifacts.

**Commit:** `chore(p01-t01): pnpm workspace scaffold`

### Task p01-t02: TypeScript side-by-side setup

**Files:**
- Create: `tsconfig.base.json` (strict, ES2022, moduleResolution bundler, isolatedModules)
- Modify: root `package.json` (devDeps: `typescript@^6`, `@typescript/native-preview`; script `typecheck` runs `tsgo --noEmit` per package via `pnpm -r typecheck`)

**Implement:** each package will own a `tsconfig.json` extending base; root `typecheck` delegates per-package (sidesteps the known tsgo workspace-references bug).

**Verify:** `pnpm typecheck` exits 0 (no packages yet).

**Commit:** `chore(p01-t02): tsgo + ts6 side-by-side typecheck gate`

### Task p01-t03: Oxlint + Oxfmt

**Files:**
- Create: `.oxlintrc.json` (react, react-hooks, jsx-a11y, import plugins; no type-aware rules), `.oxfmtrc.json` (import sorting on, Tailwind class sorting on)

**Verify:** `pnpm lint && pnpm format:check` exit 0.

**Commit:** `chore(p01-t03): oxlint and oxfmt configs`

### Task p01-t04: Vitest workspace

**Files:**
- Create: `vitest.workspace.ts` (projects: `packages/*`, `apps/web`)

**Verify:** `pnpm test` exits 0 with "no tests" tolerated.

**Commit:** `chore(p01-t04): vitest workspace config`

### Task p01-t05: game-logic package skeleton

**Files:**
- Create: `packages/game-logic/package.json` (name `@sequence/game-logic`, dep: `zod`), `packages/game-logic/tsconfig.json`, `packages/game-logic/src/index.ts` (placeholder export), `packages/game-logic/src/index.test.ts` (smoke: import succeeds)

**Verify:** `pnpm --filter @sequence/game-logic exec vitest run` green; `pnpm typecheck` green.

**Commit:** `chore(p01-t05): game-logic package skeleton`

### Task p01-t06: api package skeleton

**Files:**
- Create: `packages/api/package.json` (name `@sequence/api`; deps added per-phase later), `packages/api/tsconfig.json`, `packages/api/src/index.ts` (placeholder)

**Verify:** `pnpm typecheck` green.

**Commit:** `chore(p01-t06): api package skeleton`

### Task p01-t07: web app skeleton

**Files:**
- Create: `apps/web/` — Next.js 16 + React 19 minimal app (`package.json` name `@sequence/web`, `next.config.ts` with `typescript.ignoreBuildErrors: true` per design, `src/app/layout.tsx`, `src/app/page.tsx` placeholder), Tailwind config + globals

**Verify:** `pnpm --filter @sequence/web build` succeeds; root gates green.

**Commit:** `chore(p01-t07): nextjs web app skeleton with tailwind`

### Task p01-t08: Salvage boardMap (TDD)

**Files:**
- Create: `packages/game-logic/src/board-map.ts`, `packages/game-logic/src/board-map.test.ts`

**RED:** tests assert: 100 cells; exactly 4 corner cells at the 4 corners; 48 distinct card codes each appearing exactly twice; no jacks on the board.
**GREEN:** port legacy `boardMap` (from `utils/game.js`) as `readonly` typed constant `BOARD_MAP: readonly (readonly PositionId[])[]`; minimal `PositionId`/parse helpers.

**Verify:** `pnpm --filter @sequence/game-logic exec vitest run src/board-map.test.ts`

**Commit:** `feat(p01-t08): typed board map salvaged from legacy`

### Task p01-t09: Card SVG pipeline + attribution

**Files:**
- Create: `apps/web/public/cards/*.svg` (52 faces + 2 backs, SVGO-optimized from legacy `public/cards/`), `apps/web/public/cards/ATTRIBUTION.md` (LGPL 3, Chris Aguilar "Vectorized Playing Cards 1.3"), `scripts/optimize-cards.mjs` (one-shot SVGO run; documents source → output)
- Delete duplicates: `10*.svg` aliases (keep `T*` naming to match board codes)

**Verify:** all 52 faces + 2 backs present; spot-check face-card size reduction (target <50%/file; note outliers); attribution file present.

**Commit:** `feat(p01-t09): optimized card svg assets with lgpl attribution`

### Task p01-t10: Legacy deletion + key scrub

**Files:**
- Delete: `pages/`, `components/`, `db/`, `services/`, `utils/`, `app/`, `styled-system/`, `panda.config.ts`, `next.config.js` (root legacy), `eslint.config.mjs`, `.prettierrc`, `firebase-service-key-sequence-staging.json`, `repomix-output.md`, `rewrite.md`, `sequence-rewrite-plan.md`, legacy `public/` remnants (cards now live under `apps/web/public/cards/`), `next-env.d.ts` (root), `.next/`
- Note for operator (echo in task output): **revoke the GCP service key in Google Cloud** — it is in git history; revocation is the real mitigation.
- Reference access after deletion: the `legacy-final` git tag marks the last legacy-containing commit — `git show legacy-final:utils/game.js` retrieves any legacy file (used by p02 tasks as algorithm reference if needed).

**Verify:** `pnpm typecheck && pnpm lint && pnpm test` all green on clean tree; `git grep -l "firebase"` returns nothing outside `.oat/`.

**Commit:** `chore(p01-t10): remove legacy app and committed service key`

### Task p01-t11: Git hooks + worktree scripts

**Files:**
- Modify: `tools/git-hooks/pre-commit` (replace lint-staged with staged-file oxlint + oxfmt check), `tools/git-hooks/commit-msg` (replace commitlint with a light conventional-commit + `pNN-tNN` scope regex check — no new deps), `tools/git-hooks/README.md` (update for this stack)
- Keep as-is: `tools/git-hooks/manage-hooks.js`, `tools/git-hooks/pre-push`, `tools/git-hooks/post-checkout`, `scripts/worktree/init.sh`, `scripts/worktree/validate.sh` (ported from stoa; stack-agnostic)
- Modify: root `package.json` (scripts: `worktree:init`, `worktree:validate`, `hooks:setup` → `node tools/git-hooks/manage-hooks.js setup`, wired via `prepare`)

**Why here:** `scripts/worktree/init.sh` copies gitignored `.env` files from the main checkout into linked worktrees — required for the p02/p03 parallel group (the p03 worktree needs `DATABASE_URL_TEST`). `oat-project-implement` worktree bootstrap should run `pnpm worktree:init` after checkout.

**Verify:** `pnpm hooks:setup` installs hooks; a malformed commit message is rejected; `bash scripts/worktree/validate.sh` passes in the main checkout.

**Commit:** `chore(p01-t11): adapted git hooks and worktree env scripts`

---

## Phase 2: game-logic — the rules engine (p02)

Goal: the rules contract, proven by an exhaustive suite before any endpoint or pixel exists. Every task is TDD. All tests run via `pnpm --filter @sequence/game-logic exec vitest run <file>`.

### Task p02-t01: Domain types + lifecycle state machine

**Files:**
- Create: `packages/game-logic/src/types.ts`, `packages/game-logic/src/state-machine.ts`, `packages/game-logic/src/state-machine.test.ts`

**RED:** state-machine tests: allowed transitions exactly per design table (`lobby→active`, `active→frozen|saved|finished`, `frozen→active`, `saved→active`); illegal transitions rejected.
**GREEN:** types: `Card`, `Rank`, `Suit`, `Position`, `Seat`, `Team`, `GameSettings` (playerCount 2|3|4|6, mode 'tap'|'drag', timerSeconds, local), `BoardCell {chip?: Team; lockedBy?: number}`, `GameState` (board, hands, deck, played, sequences, currentSeat, round, status, pendingChoice?), `Move` union (`place` | `removeChip`), `RuleViolation` union, `GameEvent` union (ChipPlaced, ChipRemoved, CardDrawn, DeadCardSwapped, SequenceCompleted, PendingChoice, TurnAdvanced, GameWon). `state-machine.ts`: `canTransition(from, to): boolean` + `GameStatus`.

**Commit:** `feat(p02-t01): domain types and lifecycle state machine`

### Task p02-t02: Deck + seedable RNG

**Files:**
- Create: `packages/game-logic/src/deck.ts`, `packages/game-logic/src/deck.test.ts`

**RED:** 104 cards (two standard decks); exactly 4 one-eyed jacks (J♠ J♥) and 4 two-eyed (J♦ J♣); same seed → same shuffle; different seeds differ.
**GREEN:** `buildDeck(): Card[]`, `Rng` interface, `createSeededRng(seed)`, `shuffle(cards, rng)`, `isOneEyedJack(card)` / `isTwoEyedJack(card)`.

**Commit:** `feat(p02-t02): deck construction and seedable rng`

### Task p02-t03: createGame — dealing + turn order

**Files:**
- Create: `packages/game-logic/src/create-game.ts`, `packages/game-logic/src/create-game.test.ts`

**RED:** deal table (2→7, 3→6, 4→6, 6→5); turn order alternates teams (4p: B G B G; 6p 3-team: B G R B G R); 3p = three teams of one; rejects invalid counts/uneven teams; initial board empty; deck = 104 − dealt.
**GREEN:** `createGame(settings, players: PlayerSeed[], rng): GameState`.

**Commit:** `feat(p02-t03): game creation with dealing and alternating turn order`

### Task p02-t04: Sequence detection with corners + locking

**Files:**
- Create: `packages/game-logic/src/sequence-detection.ts`, `packages/game-logic/src/sequence-detection.test.ts`

**RED:** 5-in-row detected (all 4 directions); **corner counts as wild for any team** (4 chips + corner = sequence); two teams may share a corner; run of exactly 5 → auto-lock candidate; run of 6+ → returns choice-required with eligible cells; two sequences from one placement (crossing) both reported; 9-in-row reports two-sequence potential with one shared cell; locked cells reported for reuse rule (one shared space allowed between own sequences).
**GREEN:** `detectSequences(board, position, team): DetectionResult` (`{ autoLock: Position[][] } | { choiceRequired: {runLength, cells} } | none`), `lockSequence(board, cells, seqId)`.

**Commit:** `feat(p02-t04): sequence detection with corner-as-wild and locking`

### Task p02-t05: Jack rules

**Files:**
- Create: `packages/game-logic/src/jack-rules.ts`, `packages/game-logic/src/jack-rules.test.ts`

**RED:** two-eyed jack legal on any open cell, illegal on occupied; one-eyed removes opponent unlocked chip, illegal on own chip / locked chip / empty cell; `oneEyedTargets(board, team)` empty on fresh board (no-target = unplayable, NOT dead).
**GREEN:** `canPlaceWild`, `canRemoveChip`, `oneEyedTargets`.

**Commit:** `feat(p02-t05): one-eyed and two-eyed jack rules`

### Task p02-t06: Dead cards (per-turn evaluation)

**Files:**
- Create: `packages/game-logic/src/dead-cards.ts`, `packages/game-logic/src/dead-cards.test.ts`

**RED:** card dead when both board cells covered; **resurrection**: dead card becomes live after a one-eyed jack frees a cell; jacks are never dead; auto-swap (default mode) swaps at most one dead card per turn and emits `DeadCardSwapped`; hard-mode turn-in validates the card is actually dead (`not-a-dead-card` violation otherwise).
**GREEN:** `isDeadCard(card, board)`, `findDeadCards(hand, board)`, `autoSwapDeadCard(state, seat, rng)`.

**Commit:** `feat(p02-t06): dead card evaluation with resurrection semantics`

### Task p02-t07: Win conditions

**Files:**
- Create: `packages/game-logic/src/win-conditions.ts`, `packages/game-logic/src/win-conditions.test.ts`

**RED:** 2 teams → 2 sequences to win; 3 teams → 1; double-sequence in one move = instant win in 2-team game; one space from first sequence reusable in second; sequence counts tracked per team.
**GREEN:** `sequencesToWin(teamCount)`, `checkWin(state, team): boolean`.

**Commit:** `feat(p02-t07): win conditions including double-sequence instant win`

### Task p02-t08: applyMove — placement path

**Files:**
- Create: `packages/game-logic/src/apply-move.ts`, `packages/game-logic/src/apply-move.test.ts`
- Create: `packages/game-logic/src/card-consumption.ts`, `packages/game-logic/src/card-consumption.test.ts`

**RED:** rejects out-of-turn (`not-your-turn`), card-not-in-hand, space-occupied, wrong-card-for-space; **explicit-card path** (tap mode): the named card is consumed as sent — a player may deliberately play a two-eyed jack even while holding the natural card; **inferred path** (`card` omitted, drag mode): `wouldConsumeCard` applies natural-over-jack — the jack is never spent implicitly; jack-only placement consumes the jack; auto-draw refills hand; events emitted in order (ChipPlaced, CardDrawn, TurnAdvanced); deck-empty triggers reshuffle of played pile.
**GREEN:** `applyMove(state, move): MoveResult` placement branch with `Move.place.card` **optional** (explicit honored, absent → inferred); `wouldConsumeCard(placement, hand): Card`; turn-advance helper running dead-card auto-swap for the incoming player (default mode).

**Commit:** `feat(p02-t08): move application for placements with natural-over-jack consumption`

### Task p02-t09: applyMove — removal, pending choice, forfeit

**Files:**
- Modify: `packages/game-logic/src/apply-move.ts`, `packages/game-logic/src/apply-move.test.ts`

**RED:** removeChip validates via jack rules and consumes a one-eyed jack; cannot place on freed cell same turn (rule); >5 run produces `pendingChoice` state (turn does NOT advance) and `resolveSequenceChoice(cells)` validates cells form a straight 5 including the placed chip, then locks + advances; `turnInDeadCard` (hard mode) swaps and continues the turn; `forfeitTurn(state)` advances without play or draw; win check fires on lock (including instant win).
**GREEN:** remaining `applyMove` branches + `resolveSequenceChoice`, `turnInDeadCard`, `forfeitTurn`.

**Commit:** `feat(p02-t09): chip removal, pending sequence choice, dead-card turn-in, forfeit`

### Task p02-t10: Display helpers

**Files:**
- Create: `packages/game-logic/src/display-helpers.ts`, `packages/game-logic/src/display-helpers.test.ts`

**RED:** `validPlacements(hand, board)` maps each card to its open cells (two-eyed jack → all open cells; one-eyed → removable targets); excludes dead cards; agrees with `applyMove` legality (property: every suggested placement is accepted by the reducer).
**GREEN:** implement over existing rule functions — no duplicated logic.

**Commit:** `feat(p02-t10): client display helpers backed by reducer rules`

### Task p02-t11: Public API + full-game simulation

**Files:**
- Create: `packages/game-logic/src/simulate.test.ts`
- Modify: `packages/game-logic/src/index.ts` (export the complete public surface per design §Component Design)

**RED→GREEN:** seeded simulation: scripted bots play random legal moves (via `validPlacements`) for 2p, 3p, and 4p-teams games until `GameWon`; assert invariants every turn (hand sizes correct, board chip count consistent with events, no illegal state, game terminates < 500 turns).

**Verify:** `pnpm --filter @sequence/game-logic exec vitest run` (full package suite green) and root gates.

**Commit:** `feat(p02-t11): public api and seeded full-game simulations`

---

## Phase 3: API foundation (p03)

Goal: server skeleton with identity — Fastify + tRPC + Drizzle + Better Auth, integration-test harness on a Neon test branch. Integration tests run via `pnpm --filter @sequence/api exec vitest run <file>` with `DATABASE_URL_TEST`.

**Dependency convention (applies to p03/p05/p06):** any task introducing a new dependency also modifies that package's `package.json` and the root `pnpm-lock.yaml` — treat both as part of the task's file scope (non-exhaustive examples — first lands in p03-t01: fastify, pino, @fastify/cors, zod (api's own); p03-t02: drizzle-orm, drizzle-kit, postgres; p03-t04: better-auth; p03-t05: @trpc/server; p03-t06: @fastify/websocket; p03-t09: @fastify/rate-limit; p05-t02: @trpc/client; p05-t03: better-auth client + Testing Library/jsdom; p06-t11: motion; p06-t13: @playwright/test). p02 deliberately installs nothing new (zod ships in p01-t05) — this preserves the p02/p03 parallel-group disjointness.

### Task p03-t01: Fastify bootstrap + env validation

**Files:**
- Create: `packages/api/src/server.ts`, `packages/api/src/env.ts`, `packages/api/src/env.test.ts`

**RED:** env schema rejects missing `DATABASE_URL` / `BETTER_AUTH_SECRET`; defaults `PORT=3001`.
**GREEN:** zod-validated env loader; Fastify instance with pino logger, `/health` route, CORS (`WEB_ORIGIN`, credentials).

**Verify:** unit test green; `pnpm --filter @sequence/api dev` boots locally and `/health` returns 200.

**Commit:** `feat(p03-t01): fastify bootstrap with validated env and healthcheck`

### Task p03-t02: Drizzle + db client

**Files:**
- Create: `packages/api/drizzle.config.ts`, `packages/api/src/db/client.ts`, `packages/api/src/db/schema/index.ts`

**Implement:** `postgres.js` client (small fixed pool ≤10, direct connection string); drizzle instance; schema barrel.

**Verify:** `pnpm --filter @sequence/api exec drizzle-kit generate` runs (empty schema ok); typecheck green.

**Commit:** `feat(p03-t02): drizzle setup over postgres.js`

### Task p03-t03: Game schema + initial migration

**Files:**
- Create: `packages/api/src/db/schema/games.ts`, `packages/api/src/db/schema/game-players.ts`, `packages/api/src/db/schema/game-events.ts`
- Generate: `packages/api/drizzle/0000_*.sql`

**Implement:** tables + columns exactly per design §Data Models (incl. `version`, `local`, jsonb columns, `guest_token_hash`); indexes: `game_players(user_id, game_id)`, `games(status, finished_at)`, `games(invite_code)` unique, `game_events(game_id, seq)` unique.

**Verify:** migration applies to a scratch Neon branch (`drizzle-kit migrate`); typecheck green.

**Commit:** `feat(p03-t03): game schema and initial migration`

### Task p03-t04: Better Auth mounted

**Files:**
- Create: `packages/api/src/user/auth.ts`, `packages/api/src/db/schema/auth.ts` (generated via Better Auth CLI)
- Modify: `packages/api/src/server.ts` (mount `/api/auth/*` catch-all per Better Auth Fastify guide)

**Implement:** Better Auth instance (email+password enabled; social providers config-gated by env presence), Drizzle adapter, cookie settings (httpOnly, secure, sameSite).

**Verify:** boot server; `POST /api/auth/sign-up/email` round-trip against scratch branch (manual curl or Bruno smoke).

**Commit:** `feat(p03-t04): better auth mounted on fastify with drizzle adapter`

### Task p03-t05: tRPC init + context + HTTP plugin

**Files:**
- Create: `packages/api/src/trpc.ts`, `packages/api/src/app-router.ts`, `packages/api/src/game/game.router.ts` (empty), `packages/api/src/history/history.router.ts` (empty)
- Modify: `packages/api/src/server.ts` (register `fastifyTRPCPlugin`)

**Implement:** context resolves Better Auth session → `{ user | null, guest | null }`; `publicProcedure`, `authedProcedure` (UNAUTHORIZED without session); empty `game`/`history` routers composed; export `AppRouter` type.

**Verify:** typecheck; `/health` + a `publicProcedure` ping round-trips.

**Commit:** `feat(p03-t05): trpc context and router skeleton on fastify`

### Task p03-t06: WebSocket transport + heartbeat

**Files:**
- Modify: `packages/api/src/server.ts` (`@fastify/websocket` + `applyWSSHandler`, `useWSS`, keepAlive ~20s)

**Implement:** WS upgrade authenticates from the same cookie jar (session or guest token via `connectionParams`); heartbeat config per design.

**Verify:** ws client connects, ping/pong observed; typecheck green.

**Commit:** `feat(p03-t06): trpc websocket transport with heartbeat`

### Task p03-t07: Guest tokens (TDD)

**Files:**
- Create: `packages/api/src/user/guest-tokens.ts`, `packages/api/src/user/guest-tokens.test.ts`

**RED:** issued token verifies for its game; fails for another game; tampered token rejected; only hash stored (verify helper takes hash).
**GREEN:** `issueGuestToken(gameId, seat, secret)`, `verifyGuestToken(token, gameId, secret)`, `hashToken(token)` (HMAC-signed payload; no JWT dependency).

**Commit:** `feat(p03-t07): signed game-scoped guest tokens`

### Task p03-t08: Integration harness + gamePlayerProcedure

**Files:**
- Create: `packages/api/src/test/harness.ts` (boot app against `DATABASE_URL_TEST`, reset via `drizzle-kit push` + truncate, authed/guest client factories)
- Create: `packages/api/src/trpc-game-middleware.test.ts`
- Modify: `packages/api/src/trpc.ts` (`gamePlayerProcedure`)

**RED (integration):** seat resolves for session user; for guest cookie; FORBIDDEN for non-participant; local game: creator session authorized for both seats.
**GREEN:** middleware resolving caller → seat per design §API.

**Verify:** `pnpm --filter @sequence/api exec vitest run src/trpc-game-middleware.test.ts` against Neon test branch.

**Commit:** `feat(p03-t08): game player authorization middleware with integration harness`

### Task p03-t09: Auth integration tests + rate limiting

**Files:**
- Create: `packages/api/src/user/auth.test.ts`
- Modify: `packages/api/src/server.ts` (`@fastify/rate-limit` scoped to `/api/auth/*`)
- Create: `packages/api/src/shared/rate-limit-middleware.ts` (+ test) — reusable tRPC limiter, tested against a dummy procedure; attached to `preview`/`join` in p04-t03

**RED:** signup → login → session-validated procedure succeeds; logout invalidates; rate limit returns 429 after burst on auth endpoints; dummy procedure 429s after burst.
**GREEN:** wire limiter; no auth logic changes.

**Commit:** `feat(p03-t09): auth integration coverage and rate limiting`

### Task p03-t10: Bruno scaffold

**Files:**
- Create: `bruno/bruno.json`, `bruno/environments/local.bru`, `bruno/auth/*.bru` (signup, login, session)

**Verify:** Bruno CLI (`bru run bruno/auth --env local`) passes against local server + scratch branch.

**Commit:** `test(p03-t10): bruno collection scaffold with auth requests`

---

## Phase 4: Game domain — fully playable over the API (p04)

Goal: a complete game playable via tRPC/Bruno with no UI. Exit: scripted full game passes; integration suite covers the lifecycle table from design §Error Handling.

**Test convention:** integration tests run via `pnpm --filter @sequence/api exec vitest run <file>` against `DATABASE_URL_TEST` (Neon test branch, reset per run) — every task's RED/GREEN verifies with its own test file unless noted.

### Task p04-t01: GameState ↔ DB mapping (TDD)

**Files:**
- Create: `packages/api/src/game/game.types.ts`, `packages/api/src/game/state-mapping.ts`, `packages/api/src/game/state-mapping.test.ts`

**RED:** round-trip: assemble `GameState` from `games` row + `game_players` rows → persist diff back → identical state; jsonb shapes match design.
**GREEN:** `loadGameState(tx, gameId)`, `persistGameState(tx, gameId, state, prevVersion)` (throws on version mismatch), event-append helper assigning per-game `seq`.

**Commit:** `feat(p04-t01): game state assembly and versioned persistence`

### Task p04-t02: create-game route (incl. local)

**Files:**
- Create: `packages/api/src/game/routes/create-game.ts`, `packages/api/src/game/routes/create-game.test.ts`, `packages/api/src/game/invite-codes.ts`
- Modify: `packages/api/src/game/game.router.ts`

**RED (integration):** authed user creates game with settings (validated: counts, timer steps per FR2); UNAUTHORIZED for anonymous; **local:true** requires playerCount 2 + opponentName, skips lobby (status straight to `active`, both seats created, hands dealt); invite code ~10 chars unambiguous alphabet, unique.
**GREEN:** route + `generateInviteCode(rng)`.

**Commit:** `feat(p04-t02): game creation with settings validation and local pass-and-play`

### Task p04-t03: preview + join routes

**Files:**
- Create: `packages/api/src/game/routes/preview.ts`, `packages/api/src/game/routes/join-game.ts`, `packages/api/src/game/routes/join-game.test.ts`

**RED:** preview is public (players, settings, status — no hands); preview AND join are rate-limited (middleware from p03-t09 attached to both); join as user occupies a seat; join as guest issues game-scoped cookie + stores hash; join rejected when full or started; duplicate join is idempotent (returns existing seat).
**GREEN:** routes per design §API.

**Commit:** `feat(p04-t03): public preview and join with guest token issuance`

### Task p04-t04: Lobby operations

**Files:**
- Create: `packages/api/src/game/routes/set-team.ts`, `packages/api/src/game/routes/kick-player.ts`, `packages/api/src/game/routes/randomize-teams.ts`, `packages/api/src/game/routes/lobby.test.ts`

**RED:** self-sort: player sets own team; creator may move others / kick / randomize; non-creator FORBIDDEN on others; events emitted (PlayerJoined/TeamChanged/PlayerKicked).
**GREEN:** routes + lobby event types.

**Commit:** `feat(p04-t04): lobby team operations with creator controls`

### Task p04-t05: start-game route

**Files:**
- Create: `packages/api/src/game/routes/start-game.ts`, `packages/api/src/game/routes/start-game.test.ts`

**RED:** creator-only; validates team evenness (4p: 2v2; 6p: 3v3 or 2x3 per settings; 3p FFA); calls `createGame` (game-logic) with server RNG; status → `active`; `GameStarted` event; settings immutable after.
**GREEN:** route.

**Commit:** `feat(p04-t05): game start with team validation and dealing`

### Task p04-t06: Realtime — rooms, redaction, subscription

**Files:**
- Create: `packages/api/src/shared/realtime/rooms.ts`, `packages/api/src/shared/realtime/redaction.ts`, `packages/api/src/shared/realtime/redaction.test.ts`, `packages/api/src/game/routes/on-game-event.ts`, `packages/api/src/game/routes/on-game-event.test.ts`

**RED (unit, redaction):** public events identical for all seats; `HandUpdated` only to owning seat; **no event reaching a non-owning seat contains hand or deck data** (NFR1 acceptance — assert by scanning serialized payloads); local-game connection receives all hands.
**RED (integration, subscription):** subscribe without `lastEventId` → snapshot-first (game + own hand) then live events; with stale id → snapshot; with recent id → gap replay from `game_events`; `tracked()` ids = seq.
**GREEN:** room registry (gameId → sockets), `onGameEvent` async generator per design.

**Commit:** `feat(p04-t06): room-scoped subscriptions with redaction and snapshot-first recovery`

### Task p04-t07: Move engine route

**Files:**
- Create: `packages/api/src/game/routes/make-move.ts`, `packages/api/src/game/routes/make-move.test.ts`, `packages/api/src/game/move-engine.ts`

**RED (integration):** legal place applies + broadcasts to all subscribers; rule violations → BAD_REQUEST with typed `ruleViolation`; stale `version` → CONFLICT; concurrent double-submit: exactly one wins (race test); out-of-turn FORBIDDEN-by-engine (`not-your-turn` violation).
**GREEN:** `executeMove(gameId, seat, move, version)` = load → reduce → persist (version guard) → append events → emit to room, in one transaction per design data flow.

**Commit:** `feat(p04-t07): authoritative move engine with optimistic concurrency`

### Task p04-t08: Pending choice + dead-card turn-in routes

**Files:**
- Create: `packages/api/src/game/routes/choose-sequence-cells.ts`, `packages/api/src/game/routes/turn-in-dead-card.ts`, `packages/api/src/game/routes/choices.test.ts`

**RED:** >5 run → `PendingChoice` event, turn frozen until `chooseSequenceCells` (only placer may resolve; invalid cell set rejected); hard-mode `turnInDeadCard` swaps and play continues; both reuse the move-engine transaction path.
**GREEN:** routes delegating to game-logic `resolveSequenceChoice` / `turnInDeadCard`.

**Commit:** `feat(p04-t08): sequence choice resolution and manual dead-card turn-in`

### Task p04-t09: TimerService (TDD with fake timers)

**Files:**
- Create: `packages/api/src/game/TimerService.ts`, `packages/api/src/game/TimerService.test.ts`
- Modify: `packages/api/src/game/move-engine.ts` (turn-start scheduling hook), `packages/api/src/server.ts` (boot rehydration)

**RED:** schedule on turn start (timed games only); expiry executes forfeit through the move engine (version-guarded — races with a concurrent move resolve deterministically); pause stores `turn_remaining_ms` and clears deadline; resume reschedules; **boot rehydration**: constructing the service against DB rows with live deadlines re-arms them; no timer during `pendingChoice`.
**GREEN:** `TimerService` class per design (persisted `turn_deadline_at` + in-memory scheduler).

**Commit:** `feat(p04-t09): persistent turn timers with forfeit and boot rehydration`

### Task p04-t10: Presence — freeze / rejoin

**Files:**
- Create: `packages/api/src/game/presence.ts`, `packages/api/src/game/presence.test.ts`
- Modify: `packages/api/src/shared/realtime/rooms.ts` (heartbeat callbacks), `packages/api/src/server.ts` (presence wiring)

**RED (integration):** missed heartbeats (~2) → `connected=false`, status `active→frozen`, timer paused, `expires_at=+1h`, `PlayerDisconnected` broadcast; reconnect marks connected, but resume (`frozen→active`) only when **all** seats connected; **saved-game resume (`saved→active`)**: all original players reconnected → active with timer state restored; partial roster stays `saved`; **local games resume with the creator alone** (both seats are the creator's connection); `TimerResumed`/`PlayerReconnected` events.
**GREEN:** presence tracker wired to room registry heartbeat callbacks + lifecycle transitions via state machine.

**Commit:** `feat(p04-t10): disconnect freeze and all-players rejoin resume`

### Task p04-t11: save-and-exit, concede, my-games

**Files:**
- Create: `packages/api/src/game/routes/save-and-exit.ts`, `packages/api/src/game/routes/concede.ts`, `packages/api/src/game/routes/my-games.ts`, `packages/api/src/game/routes/lifecycle.test.ts`

**RED:** save: status→`saved`, `expires_at=+1wk`; non-local games with guest seats rejected (login-only rosters per FR10); **local games CAN save** — the creator's account owns persistence (FR16); concede: team loss recorded, status→`finished`, `end_reason='concede'`, broadcast; myGames returns resumables (frozen/saved with expiry) + recents for the session user.
**GREEN:** routes.

**Commit:** `feat(p04-t11): save-and-exit, concede, and dashboard game queries`

### Task p04-t12: Rematch + expiry sweep

**Files:**
- Create: `packages/api/src/game/routes/rematch.ts`, `packages/api/src/game/sweep.ts`, `packages/api/src/game/routes/rematch.test.ts`, `packages/api/src/game/sweep.test.ts`

**RED:** rematch from finished game: new game, same roster/settings, `rematch_of` linked, first player rotated, no new invite needed for present players; sweep deletes expired frozen/saved games (cascade events/players) and never touches finished games.
**GREEN:** route + hourly sweep (interval on boot).

**Commit:** `feat(p04-t12): rematch and expiry sweep`

### Task p04-t13: History domain

**Files:**
- Create: `packages/api/src/history/routes/my-record.ts`, `packages/api/src/history/routes/my-games.ts`, `packages/api/src/history/routes/head-to-head.ts`, `packages/api/src/history/history.test.ts`
- Modify: `packages/api/src/app-router.ts`, `packages/api/src/history/history.router.ts`

**RED:** aggregates correct over seeded finished games; **local games excluded** from record + head-to-head but present in games list (flagged); head-to-head pairs only registered users sharing finished games; cursor pagination on games list.
**GREEN:** SQL aggregation queries per design (no stats tables).

**Commit:** `feat(p04-t13): history aggregates and head-to-head queries`

### Task p04-t14: Bruno collection + scripted full game

**Files:**
- Create: `bruno/game/*.bru` (every procedure), `packages/api/src/test/full-game.e2e.test.ts`

**RED→GREEN:** scripted 2-player game over real tRPC clients (two sessions): create → join → teams → start → alternate legal moves (via game-logic `validPlacements` against snapshot/event state) → win → rematch. Asserts the FR6 broadcast invariant throughout.

**Verify:** `pnpm --filter @sequence/api exec vitest run src/test/full-game.e2e.test.ts`; `bru run bruno/game --env local`; full api suite green.

**Commit:** `test(p04-t14): bruno coverage and scripted full-game over the api`

---

## Phase 5: Web shell (p05)

Goal: everything except the game itself — auth, dashboard, join, history, landing. Component tests via Vitest + Testing Library; manual screen walk at exit.

### Task p05-t01: Theme + layout foundation

**Files:**
- Modify: `apps/web/src/app/layout.tsx`, Tailwind config (design tokens: slate `#2d3142` chrome, felt green, cream surface, team colors per `wireframes/README.md`), `apps/web/src/components/` (Button, Card, Badge primitives)

**Verify:** `pnpm --filter @sequence/web build`; visual smoke via dev server.

**Commit:** `feat(p05-t01): app shell theme and ui primitives`

### Task p05-t02: tRPC client wiring

**Files:**
- Create: `apps/web/src/lib/trpc/client.ts`, `apps/web/src/lib/trpc/provider.tsx`

**Implement:** split link — HTTP batch (queries/mutations, credentials include) + WS link (subscriptions only, reconnecting client, `lastEventId` passthrough); `AppRouter` type-only import from `@sequence/api`.

**Verify:** typecheck; ping query renders in a test page.

**Commit:** `feat(p05-t02): trpc client with http and websocket links`

### Task p05-t03: Auth screens + session

**Files:**
- Create: `apps/web/src/app/login/page.tsx`, `apps/web/src/app/signup/page.tsx`, `apps/web/src/lib/auth-client.ts`, `apps/web/src/lib/use-session.ts`, tests for form validation

**RED→GREEN:** Better Auth client (email+password); redirect-on-success; session hook gates authed pages.

**Verify:** component tests + manual signup/login against local API.

**Commit:** `feat(p05-t03): auth screens and session handling`

### Task p05-t04: Landing page

**Files:**
- Modify: `apps/web/src/app/page.tsx`

**Implement:** minimal marketing per FR15 (hero, how-it-works, CTA to signup/dashboard). Server-rendered.

**Verify:** `pnpm --filter @sequence/web build`; covered by the p05-t09 screen walk.

**Commit:** `feat(p05-t04): landing page`

### Task p05-t05: Dashboard

**Files:**
- Create: `apps/web/src/app/dashboard/page.tsx` + components per approved wireframe (`dashboard.html`)

**Implement:** Create game + Pass & play CTAs; Your games via `game.myGames` (FROZEN/SAVED badges, **expiry countdowns**, all-must-return note, Rejoin/Resume links); recent results strip (local games labeled); link to history.

**Verify:** component test with mocked tRPC; manual walk.

**Commit:** `feat(p05-t05): dashboard with resumables and recent results`

### Task p05-t06: Create-game screen

**Files:**
- Create: `apps/web/src/app/create/page.tsx` (+ form components)

**Implement:** player count (2/3/4/6), play mode with the in-UI mode explanation (FR2), timer picker (off | 30s steps to 3:00 | 1m steps), local pass-and-play toggle (2p only → opponent name input); submit → `game.create` → route to lobby (or straight to game when local).

**Verify:** form validation component tests; manual create.

**Commit:** `feat(p05-t06): create game screen with settings and local mode`

### Task p05-t07: Join page

**Files:**
- Create: `apps/web/src/app/join/[code]/page.tsx`

**Implement:** `game.preview` render (players, settings, status); join as guest (name input) or login-first path; on join → lobby route.

**Verify:** component test; manual guest join.

**Commit:** `feat(p05-t07): invite join page with guest path`

### Task p05-t08: History page

**Files:**
- Create: `apps/web/src/app/history/page.tsx`

**Implement:** aggregate record, head-to-head table, completed games list (paged) per FR14.

**Verify:** component test with mocked tRPC; covered by the p05-t09 screen walk.

**Commit:** `feat(p05-t08): history and head-to-head page`

### Task p05-t09: Shell screen walk + a11y pass

**Files:**
- Modify: any gaps found

**Verify:** manual 9-screen navigation walk (desktop + 375px); oxlint jsx-a11y clean; root gates green.

**Commit:** `chore(p05-t09): shell screen walk fixes`

---

## Phase 6: Game UI (p06)

Goal: the game — both modes, pass-and-play, responsive, animated. E2E via Playwright (two browser contexts).

### Task p06-t01: Game route state container

**Files:**
- Create: `apps/web/src/app/game/[id]/page.tsx`, `apps/web/src/app/game/[id]/components/game-state.ts` (subscription reducer)

**Implement:** subscribe `game.onGameEvent` (snapshot-first per design); client-side event reducer builds view state; status routing (lobby / game / handoff / game-over); blocking "Reconnecting…" overlay on WS loss; CONFLICT → refetch via resubscribe.

**Verify:** component test with scripted event stream; manual against local API.

**Commit:** `feat(p06-t01): game route with event-sourced view state and reconnect overlay`

### Task p06-t02: Lobby UI (stacked team rows)

**Files:**
- Create: `apps/web/src/app/game/[id]/components/LobbyTeams/LobbyTeams.tsx` (+ siblings, sub-components)

**Implement:** per approved wireframe `lobby-teams-v4.html`: full-width team bands, tap-to-join slots, creator kick/randomize, invite code + copy link, settings summary, derived turn-order preview, start button gating.

**Verify:** component tests (slot interactions); manual 2-browser lobby.

**Commit:** `feat(p06-t02): lobby with stacked team rows and creator controls`

### Task p06-t03: GameBoard + cells + chips

**Files:**
- Create: `apps/web/src/app/game/[id]/components/GameBoard/GameBoard.tsx`, `GameBoard.utils.ts`, `GameBoard.test.ts`, `components/BoardCell.tsx`, `components/Chip.tsx`

**Implement:** 10×10 CSS grid from `BOARD_MAP`; card SVG per cell (rotation trick from legacy reference); chip overlay (team colors), locked styling; highlight states (valid-target, hover-confirm, winning-sequence); **primitive props per cell** (React Compiler-friendly per design §Performance); SVG preloading hook (lobby-time).

**Verify:** component tests (render, highlight props); visual smoke.

**Commit:** `feat(p06-t03): game board with chips, locks, and highlight states`

### Task p06-t04: CardHand (peeking fan)

**Files:**
- Create: `apps/web/src/app/game/[id]/components/CardHand/CardHand.tsx` (+ siblings)

**Implement:** per wireframe `game-screen-mobile.html` option A: fan peeking from bottom edge overlapping board; tap to raise/lower; selected-card state; dead-card visual marker (default mode only — hard mode shows nothing).

**Verify:** component tests (raise/lower, selection); manual mobile-width check.

**Commit:** `feat(p06-t04): peeking card hand`

### Task p06-t05: PlayerRail + timer display

**Files:**
- Create: `apps/web/src/app/game/[id]/components/PlayerRail/PlayerRail.tsx` (+ siblings)

**Implement:** per-player chip color + name + **last-played card** (FR13), turn highlight, Round N, sequence count per team, countdown when timed (driven by server events; pause state shown).

**Verify:** `pnpm --filter @sequence/web exec vitest run src/app/game/[id]/components/PlayerRail/PlayerRail.test.tsx`

**Commit:** `feat(p06-t05): player rail with last-played cards and timer`

### Task p06-t06: Tap controller (default mode)

**Files:**
- Create: `apps/web/src/app/game/[id]/components/controllers/tap-controller.ts` (+ test)

**Implement:** select card → highlights from `validPlacements` (game-logic, client-side) → tap highlighted cell → `makeMove`; one-eyed jack → highlight removable opponent chips; dead-card auto-swap notice rendering (event-driven toast).

**Verify:** component/interaction tests with mocked mutation; agrees-with-reducer property reused from game-logic.

**Commit:** `feat(p06-t06): tap-to-reveal move controller`

### Task p06-t07: Drag controller (hard mode)

**Files:**
- Create: `apps/web/src/app/game/[id]/components/controllers/drag-controller.ts` (+ test)

**Implement:** drag generic chip from tray; **no pre-highlighting**; hover/drag-over shows confirm highlight only on the hovered cell; drop → place intent **without a card field** (server infers the consumed card via natural-over-jack; same `makeMove` procedure and shape as tap mode, `card` simply omitted); misdrop rejection feedback (shake + typed violation toast); one-eyed removal = drag opponent chip off board; dead-card turn-in gesture: drag card from hand to discard zone (settles the design open question with the simplest gesture consistent with drag mode).

**Verify:** interaction tests (pointer events); manual drag pass desktop + touch.

**Commit:** `feat(p06-t07): hard-mode drag controller with validation feedback`

### Task p06-t08: Pending-choice + sequence lock UI

**Files:**
- Create: `apps/web/src/app/game/[id]/components/GameBoard/components/SequenceChoice.tsx` (+ test)

**Implement:** on `PendingChoice` event (placer only): eligible cells pulse, tap 5 to select, confirm → `chooseSequenceCells`; other players see "choosing sequence…" state; completed sequences render locked styling permanently.

**Verify:** component test for the selection interaction; exercised end-to-end by p06-t13.

**Commit:** `feat(p06-t08): sequence choice flow for runs longer than five`

### Task p06-t09: HandoffScreen (pass-and-play)

**Files:**
- Create: `apps/web/src/app/game/[id]/components/HandoffScreen/HandoffScreen.tsx` (+ test)

**Implement:** per wireframe `handoff-interstitial.html` option B: hand-area veil drops **the instant** a local-game move commits; shows last move + whose turn; incoming player taps to reveal their fan. Board remains visible.

**Verify:** component test (veil timing on event); manual local game.

**Commit:** `feat(p06-t09): pass-and-play hand veil`

### Task p06-t10: GameOver + rematch

**Files:**
- Create: `apps/web/src/app/game/[id]/components/GameOver/GameOver.tsx` (+ test)

**Implement:** winning sequence highlighted on the final board; result + per-team sequence counts; concede attribution; Rematch button (`game.rematch` → route to new game), back to dashboard.

**Verify:** component test; rematch flow exercised by p06-t13.

**Commit:** `feat(p06-t10): game over screen with rematch`

### Task p06-t11: Notifications + Motion polish

**Files:**
- Create: `apps/web/src/app/game/[id]/components/toasts.tsx`
- Modify: board/hand components (Motion transitions)

**Implement:** typed-violation toasts (from error contract codes), disconnect/reconnect banners, save/concede confirmations; Motion: chip placement pop, card play, hand raise — transforms/opacity only per design §Performance.

**Verify:** toast component tests; animation smoke in manual pass (p06-t12).

**Commit:** `feat(p06-t11): game event notifications and animations`

### Task p06-t12: Responsive pass

**Files:**
- Modify: game components as needed

**Verify:** complete game playable at 375px without horizontal scroll (NFR3); desktop layout (board centered, hand below, rail side) verified; concede + save & exit reachable on both.

**Commit:** `fix(p06-t12): responsive layout pass at 375px and desktop`

### Task p06-t13: Playwright e2e suite

**Files:**
- Create: `apps/web/playwright.config.ts`, `apps/web/e2e/full-game.spec.ts`, `apps/web/e2e/reconnect.spec.ts`, `apps/web/e2e/rematch.spec.ts`, `apps/web/e2e/pass-and-play.spec.ts`

**Implement:** two-context games against local web+api+test-branch stack: join→play→win (tap mode); mid-game reload/reconnect recovers state; rematch keeps roster; local game handoff hides hands (assert hand not in DOM while veiled).

**Verify:** `pnpm --filter @sequence/web exec playwright test`

**Commit:** `test(p06-t13): playwright e2e for critical paths`

---

## Phase 7: Deploy & handoff (p07)

Goal: production, operator-testable. Requires operator pre-flight complete (Neon project, Railway service + token, Vercel link, env values).

### Task p07-t01: API Dockerfile + Railway config

**Files:**
- Create: `packages/api/Dockerfile` (pnpm workspace-aware multi-stage build), `railway.json`/`railway.toml` (predeploy: `drizzle-kit migrate`; healthcheck `/health`; restart policy)

**Verify:** `docker build` succeeds locally; container boots with env and serves `/health`.

**Commit:** `chore(p07-t01): api dockerfile and railway config with predeploy migrations`

### Task p07-t02: Railway deploy

**Files:**
- Create: `.oat/projects/shared/web-mvp/handoff.md` (skeleton: env/deploy summary — no secrets)

**Steps:** create/link service (US East), set env (`DATABASE_URL` direct Neon prod branch, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_ORIGIN`), confirm "Serverless" sleep toggle **off**, deploy, verify `/health` + WS upgrade on the public URL, confirm migrations applied.

**Verify:** prod healthcheck 200; `wscat` connects.

**Commit:** `chore(p07-t02): railway deployment notes and handoff skeleton`

### Task p07-t03: Vercel deploy

**Steps:** link `apps/web` (workspace-aware build), set `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` to Railway URL, deploy, verify auth cookie flow against prod API (CORS + credentials).

**Verify:** prod signup/login round-trip; game route loads.

**Commit:** `chore(p07-t03): vercel deployment wiring`

### Task p07-t04: Production smoke + checks

**Files:**
- Modify: `.oat/projects/shared/web-mvp/handoff.md` (append smoke results)

**Steps:** play a full local pass-and-play game on prod (fastest full-loop smoke); 2-browser real-time game; latency spot-check (move→broadcast feel, NFR2); 375px mobile pass on a real phone (NFR3); Neon/Vercel/Railway tier audit (NFR6).

**Verify:** all flows pass; observations recorded in handoff.md.

**Commit:** `docs(p07-t04): production smoke results`

### Task p07-t05: Operator handoff notes

**Files:**
- Modify: `.oat/projects/shared/web-mvp/handoff.md` — finalize: how to test each FR flow, known limitations, operator follow-ups (revoke GCP key if not yet done; configure social OAuth when wanted)

**Verify:** root gates green; all phases committed.

**Commit:** `docs(p07-t05): operator handoff notes`

---

## Reviews

| Scope  | Type     | Status  | Date | Artifact |
| ------ | -------- | ------- | ---- | -------- |
| p01    | code     | passed  | 2026-06-12 | reviews/p01-review-2026-06-12.md |
| p02    | code     | passed  | 2026-06-12 | reviews/p02-review-2026-06-12.md (fail → fixes → re-review pass) |
| p03    | code     | passed  | 2026-06-12 | reviews/p03-review-2026-06-12.md (pass + fix round verified) |
| p04    | code     | passed | 2026-06-12 | reviews/p04-review-2026-06-12.md (fail → fixes → re-review pass) |
| p05    | code     | passed | 2026-06-13 | reviews/p05-review-2026-06-13.md (fail -> fixes -> re-review pass) |
| p06    | code     | passed | 2026-06-13 | reviews/p06-review-2026-06-13.md (fail -> fixes -> re-review pass) |
| p07    | code     | fixes_completed | 2026-06-13 | reviews/p07-review-2026-06-13.md (fail -> fixes complete; re-review pending) |
| final  | code     | pending | -    | -        |
| spec   | artifact | pending | -    | -        |
| design | artifact | pending | -    | -        |
| plan   | artifact | passed  | 2026-06-12 | structured (in-memory, 2 passes) |

**Status values:** `pending` → `received` → `fixes_added` → `fixes_completed` → `passed`

---

## Implementation Complete

**Summary:**

- Phase 1: 11 tasks — Foundation & salvage (workspace, tooling, assets, legacy deletion, hooks/worktree scripts)
- Phase 2: 11 tasks — game-logic rules engine (TDD, exhaustive suite, simulations)
- Phase 3: 10 tasks — API foundation (Fastify, Drizzle, Better Auth, harness, Bruno)
- Phase 4: 14 tasks — Game domain (lifecycle, move engine, realtime, timers, history)
- Phase 5: 9 tasks — Web shell (auth, dashboard, create, join, history)
- Phase 6: 13 tasks — Game UI (board, hand, controllers, handoff, e2e)
- Phase 7: 5 tasks — Deploy & handoff (Railway, Vercel, smoke, notes)

**Total: 73 tasks**

Ready for code review and merge.

---

## References

- Design: `design.md` (architecture, data models, API contract, error handling, phases)
- Spec: `spec.md` (16 FRs, 7 NFRs, requirement index)
- Discovery: `discovery.md` + `.oat/repo/reference/planning/2026-rewrite/` (consolidated discovery, rules-and-flows, code-organization, official rules)
- Wireframes: `wireframes/README.md` (approved layouts: peeking hand, hand veil, stacked team rows, dashboard)
