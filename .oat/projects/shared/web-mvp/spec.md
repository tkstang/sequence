---
oat_status: complete
oat_ready_for: oat-project-design
oat_blockers: []
oat_last_updated: 2026-06-12
oat_generated: false
oat_template: false
---

# Specification: web-mvp

## Phase Guardrails (Specification)

Specification is for requirements and acceptance criteria, not design/implementation details.

- Avoid concrete deliverables (specific scripts, file paths, function names).
- Keep the "High-Level Design" section to architecture shape and component boundaries only.
- If a design detail comes up, record it under **Open Questions** for `oat-project-design`.

## Problem Statement

The Sequence card game project (started 2020, Next.js + Firestore) never reached a playable multiplayer state. The legacy code proved the concept — board rendering and partial sequence detection worked — but it lacks jack handling, win conditions, corner rules, any hand/turn UI, tests, and a sustainable architecture. A 2025 modernization attempt updated tooling but migrated no functionality.

This project is a ground-up rewrite delivering the complete web MVP: real-time multiplayer Sequence playable by 2–6 players (registered users and link-invited guests), with the full official rule set enforced server-side, two interaction modes, game persistence (auto-save, save & exit, rejoin), and player history. It is built as a pnpm monorepo whose pure game-logic package and portable auth/API layers are explicitly structured so a React Native client (separate later project) can reuse them without rearchitecting.

Requirements were settled in an extended discovery brainstorm (2026-06-11). Canonical decision docs: `.oat/repo/reference/planning/2026-rewrite/discovery.md` (consolidated discovery), `rules-and-flows.md` (gameplay/flow decisions), `code-organization.md` (conventions), `game-instructions.md` (official rules).

## Goals

### Primary Goals

- A complete, rule-faithful, server-authoritative multiplayer Sequence game playable end-to-end on desktop and mobile web.
- Real-time experience: all players see moves, turn changes, and game events live, with robust disconnect/reconnect behavior.
- Persistence model that respects real life: auto-save on disconnect, deliberate save & exit, rejoin/resume, concede, rematch.
- Multi-client-ready foundation: pure shared game logic, framework-agnostic auth, typed API consumable by a future RN client.
- Deployed and operator-testable: web on Vercel, API on Railway, DB on Neon.

### Secondary Goals

- History/profile depth (head-to-head records) that makes the friend-group experience sticky.
- Hard mode preserving the board-scanning challenge of physical Sequence.

## Non-Goals

- React Native app (separate project after web MVP).
- Chat/social features, random matchmaking, spectator view, replay viewer, series scoring.
- Player counts 8–12 (officially legal; deliberately capped at 6 for MVP).
- Monetization.
- Offline move queueing (server-authoritative fail-and-retry only; optimistic UI is a deferred client-side layer).
- Offline local play (client-side reducer + PWA) — deferred fast-follow after web MVP, before/alongside the RN project. The design keeps the full turn loop inside `game-logic` so this lands without forking rules orchestration.

## Requirements

### Functional Requirements

**FR1: Accounts & Authentication**

- **Description:** Users can sign up / log in (email+password; social providers optional at launch) with session-based auth that works for the web client and is portable to RN. Login is required to create games; persistence features (saves, history, records) are login-only.
- **Acceptance Criteria:**
  - Sign-up, login, logout flows work on desktop and mobile web.
  - Sessions persist across page reloads and are validated on the API server.
  - Unauthenticated users cannot create games or access history.
- **Priority:** P0

**FR2: Game Creation & Settings**

- **Description:** A logged-in user creates a game, choosing player count (2, 3, 4, 6), play mode (default tap-to-reveal vs hard-mode drag, with in-UI explanation), and turn timer (off by default; 30s increments to 3 min, 1-min increments beyond).
- **Acceptance Criteria:**
  - All three settings are configurable at creation and immutable after start.
  - Resulting game is joinable via invite link/code.
- **Priority:** P0

**FR3: Invite & Join Flow**

- **Description:** Shareable link/code lands on a join page showing a game preview; visitors join as a guest (ephemeral) or log in first.
- **Acceptance Criteria:**
  - Guests can join and play a full game without an account.
  - Guest games cannot be saved; guests have no history.
- **Priority:** P0

**FR4: Lobby & Team Formation**

- **Description:** Lobby shows team slots; players self-sort into teams. Creator can move/kick players and randomize. Turn order (alternating teams) derives automatically. Game starts when slots are validly filled.
- **Acceptance Criteria:**
  - 4- and 6-player games enforce even teams; 2-player and 3-player free-for-all work.
  - Turn order alternates teams per official rules.
- **Priority:** P0

**FR5: Core Game Engine (server-authoritative)**

- **Description:** Full official rules enforced server-side: card-deal table (7/6/6/5), turn loop with auto-draw, chip placement on either matching space, two-eyed jacks (wild), one-eyed jacks (remove unlocked opponent chip; no-target = unplayable, not dead), corners-as-wild for all teams, dead-card handling (per-turn evaluation; auto-swap+notify in default mode, self-noticed turn-in in hard mode), sequence detection including corners and locked-chip tracking, win conditions (2 sequences for 2 teams, 1 for 3 teams), double-sequence-in-one-move instant win, player tap-to-lock choice for runs longer than 5, one reusable space between own sequences, draw-deck reshuffle from played cards.
- **Acceptance Criteria:**
  - Every rule above has unit coverage in the shared game-logic package.
  - Illegal moves are rejected server-side regardless of client behavior.
  - The legacy algorithm's known gaps (jacks, corners, win conditions) are covered by explicit tests.
- **Priority:** P0

**FR6: Real-Time Game Sync**

- **Description:** All participants see board changes, turn changes, timer state, and game events pushed live. Reconnecting clients resume the event stream without a full reload.
- **Acceptance Criteria:**
  - A move by one player is visible to all others without user action.
  - A client that drops and reconnects recovers current game state and missed events.
  - The server detects a dropped player promptly (heartbeat) and pauses the turn timer.
- **Priority:** P0

**FR7: Two Play Modes**

- **Description:** Per-game, creator-set interaction mode. Default: tap a card → valid squares highlight → tap to confirm. Hard mode: drag a generic chip with no pre-highlighting; hover shows confirm highlight; invalid placement rejected with feedback; natural card auto-consumed (jacks never spent implicitly); one-eyed jack removal via dragging opponent chip off the board; dead cards self-noticed.
- **Acceptance Criteria:**
  - Both modes complete a full game on desktop and mobile web.
  - Mixed-mode games are impossible (mode is game-level).
- **Priority:** P0

**FR8: Turn Timer Enforcement**

- **Description:** When enabled, the configured per-turn timer is visible to all players; expiry forfeits the turn outright (no play, no draw); timer pauses while any player is disconnected.
- **Acceptance Criteria:**
  - Timeout advances to the next player and the game continues normally.
  - Pause/resume on disconnect/reconnect works.
- **Priority:** P0

**FR9: Disconnect Auto-Save & Rejoin**

- **Description:** Any disconnect freezes the game with a 1-hour rejoin window. Play resumes only when all original players are present. Expired games are cleaned up.
- **Acceptance Criteria:**
  - Closed tab / dropped connection triggers freeze + auto-save.
  - Rejoin within the window restores the exact game state for all players.
- **Priority:** P0

**FR10: Save & Exit**

- **Description:** Explicit save-and-exit persists the game for 1 week (logged-in rosters only). Resume requires all original players.
- **Acceptance Criteria:**
  - Saved games appear on participants' home/dashboard and can be resumed within the window.
- **Priority:** P0

**FR11: Concede**

- **Description:** Any player may concede; their team takes the recorded loss and the game ends immediately for everyone.
- **Acceptance Criteria:**
  - Works in 2-player, 3-player free-for-all, and team games.
  - Result is recorded in history for logged-in players.
- **Priority:** P0

**FR12: Game Over & Rematch**

- **Description:** On win (or concede), the result screen highlights the winning sequence(s) and records outcomes. One-tap rematch creates a new game with same roster and settings, rotating the first player.
- **Acceptance Criteria:**
  - Rematch requires no new invite link for present players.
  - Outcomes are recorded for logged-in players (guests excluded from records).
- **Priority:** P0

**FR13: In-Game Information Display**

- **Description:** Game screen shows each player's last-played card, a Round N indicator, turn indicator, your hand, sequence count per team, and timer when enabled. No discard-pile browsing (own or others').
- **Acceptance Criteria:**
  - All listed elements visible on desktop and mobile web layouts.
- **Priority:** P0

**FR14: History & Profile**

- **Description:** Logged-in users see aggregate win-loss record, reverse-chronological completed-games list, and head-to-head per-opponent records.
- **Acceptance Criteria:**
  - Records update after each completed (or conceded) game.
  - Head-to-head shows per-opponent W-L for opponents who are registered users.
- **Priority:** P0

**FR15: Site Shell & Navigation**

- **Description:** Landing/marketing page (server-rendered), home/dashboard (create game, resumable games, recent results), and navigation among the 9 MVP screens.
- **Acceptance Criteria:**
  - All 9 screens from the screens inventory exist and are navigable.
- **Priority:** P1 (landing content minimal; game flows are the priority)

**FR16: Local Pass-and-Play (2-Player)**

- **Description:** A logged-in user can create a local 2-player game played on a single device: creator names the opponent (no second account, no lobby), and between turns a handoff interstitial hides the outgoing player's hand until the incoming player taps to reveal. Server-backed (same engine and persistence); auto-save/resume works via the creator's account. Local games appear in the creator's history marked "local" but are excluded from aggregate W-L and head-to-head records.
- **Acceptance Criteria:**
  - Local game playable start-to-finish on one device with no hand leakage between turns.
  - Save/resume works; records exclusion verified.
- **Priority:** P0

### Non-Functional Requirements

**NFR1: Server-Authoritative Integrity**

- **Description:** Game rules are enforced exclusively server-side; clients render state and submit intents. No client-trusted game state.
- **Acceptance Criteria:**
  - Crafted/malformed move submissions cannot produce illegal state.
  - Hands are private: a player can never receive another player's hand data.
- **Priority:** P0

**NFR2: Real-Time Responsiveness**

- **Description:** Move-to-broadcast propagation feels instant for a turn-based game.
- **Acceptance Criteria:**
  - Server processes and broadcasts a move in under ~500ms under normal conditions (DB and API co-located in us-east-1).
- **Priority:** P1

**NFR3: Responsive Web Design**

- **Description:** Full game experience usable on desktop and small-screen mobile web (board + peeking hand always visible, per the interaction model).
- **Acceptance Criteria:**
  - Complete game playable on a ~375px-wide viewport without horizontal scrolling.
- **Priority:** P0

**NFR4: Game-Logic Test Coverage**

- **Description:** The shared game-logic package is comprehensively unit-tested (it is the rules contract for every future client).
- **Acceptance Criteria:**
  - All FR5 rules have co-located Vitest tests, including edge cases (corner sequences, double sequences, jack interactions, dead-card resurrection).
- **Priority:** P0

**NFR5: Security Hygiene**

- **Description:** Session security via Better Auth defaults; secrets only in env (legacy committed GCP key scrubbed); all inputs validated at the API boundary; guests scoped to their game only.
- **Acceptance Criteria:**
  - No secrets in the repo; auth-protected procedures reject unauthenticated/unauthorized callers.
- **Priority:** P0

**NFR6: Hobby-Tier Cost Envelope**

- **Description:** Runs within ~$10–15/mo total (Neon free tier, Vercel Hobby, Railway Hobby).
- **Acceptance Criteria:**
  - No architectural choice requires a paid tier upgrade for MVP-scale usage.
- **Priority:** P1

**NFR7: End-to-End Type Safety**

- **Description:** Single source of truth for API and game types — tRPC inference from server to client, strict TypeScript everywhere, shared domain types from the game-logic package.
- **Acceptance Criteria:**
  - Type gate (tsgo) passes across all packages; no `any`-typed API boundaries.
- **Priority:** P0

## Constraints

- Conventions per `code-organization.md`: co-located tests/utils, kebab-case (PascalCase components/classes), dot-extension siblings, domain-driven backend with file-per-route handlers.
- `game-logic` package stays pure TypeScript — no framework imports (RN-shared surface).
- Structure for the future RN client (portable auth, shared tRPC client types) without building RN code.
- Stack as validated in consolidated discovery (Better Auth, tRPC v11 WS subscriptions on Fastify v5, Neon + `postgres.js`, side-by-side tsgo/TS6, oxlint/oxfmt, Tailwind, Motion).
- Legacy salvage: `boardMap` and card SVGs extract as-is (LGPL 3 attribution); sequence scanners reference-only; legacy Firebase code and committed service key removed.
- Operator pre-flight (env credentials, Neon/Railway/Vercel setup) completes before implementation.

## Dependencies

- **External services:** Neon (Postgres), Railway (API hosting), Vercel (web hosting), optional social OAuth providers.
- **Key libraries:** Better Auth (+ Postgres adapter), tRPC v11, Fastify v5 + `@fastify/websocket`, Next.js 16/React 19, Tailwind, Motion, `postgres.js`, Vitest, oxlint/oxfmt, tsgo + TS6.
- **Legacy assets:** 52 card SVGs (LGPL 3), 10×10 `boardMap` layout data.

## High-Level Design (Proposed)

A pnpm-workspace monorepo with three production packages. The **game-logic package** (pure TS) owns the rules: board layout, move legality, jack semantics, dead-card evaluation, sequence detection/locking, win conditions — consumed by the API for authoritative enforcement and by clients for display logic (highlighting valid squares, hard-mode hover validation). The **API package** (Fastify + tRPC) owns game lifecycle, lobby, persistence, auth (Better Auth), and real-time fan-out via tRPC WebSocket subscriptions scoped to game rooms. The **web app** (Next.js) serves the marketing/auth/dashboard shell plus client-rendered game routes consuming the typed tRPC client.

State of record lives in Postgres (Neon); the server is the single writer. Clients submit move intents over tRPC mutations; the engine validates against game-logic, persists, and broadcasts the resulting events to the room's subscribers.

**Key Components:**

- Game-logic package — rules engine, board/data constants, pure functions, exhaustive tests
- Game session domain (API) — lifecycle: create/join/lobby/start/save/resume/concede/rematch/cleanup
- Move engine (API) — validation, application, timer enforcement, event emission
- Real-time layer (API) — WS subscriptions, room scoping, heartbeat/disconnect detection, reconnect resume
- Auth domain (API) — Better Auth integration, session context for tRPC, guest identity
- History domain (API) — outcomes, aggregates, head-to-head queries
- Web shell (web) — landing, auth, dashboard, history screens
- Game UI (web) — board, hand, lobby, game-over; two interaction modes; responsive layouts

**Alternatives Considered:**

- Firestore real-time model (legacy) — rejected: no server authority, rules unenforceable, vendor coupling.
- SSE transport for subscriptions — rejected for this use case: no server-side disconnect detection (needed for timer pause), weaker Fastify/RN fit.
- Separate Vite SPA for the game — rejected for MVP: one web app, one deploy; escape hatch remains.

_Design-related open questions are tracked in the [Open Questions](#open-questions) section below._

## Success Metrics

- A logged-in user can create a game, share a link, and complete a full real-time game with 2–6 players including guests — on first operator test after handoff.
- 100% of FR5 rule behaviors covered by passing unit tests; type gate and lint pass across the monorepo.
- Disconnect → rejoin, save & exit → resume, concede, and rematch each demonstrably work in a manual flow pass.
- Deployed end-to-end on Vercel + Railway + Neon within the cost envelope.

## Requirement Index

| ID   | Description                                | Priority | Verification                              | Planned Tasks |
| ---- | ------------------------------------------ | -------- | ----------------------------------------- | ------------- |
| FR1  | Accounts & session auth                    | P0       | integration: auth flows; manual: UX       | TBD — see plan.md |
| FR2  | Game creation & settings                   | P0       | integration: create-game procedure        | TBD — see plan.md |
| FR3  | Invite & join (incl. guests)               | P0       | e2e: join flow                            | TBD — see plan.md |
| FR4  | Lobby & team formation                     | P0       | integration: lobby state; manual: UX      | TBD — see plan.md |
| FR5  | Core game engine (full rules)              | P0       | unit: game-logic rules suite              | TBD — see plan.md |
| FR6  | Real-time sync & reconnect                 | P0       | integration: WS events; manual: reconnect | TBD — see plan.md |
| FR7  | Two play modes                             | P0       | e2e: move flows; manual: hard mode        | TBD — see plan.md |
| FR8  | Turn timer enforcement                     | P0       | integration: timeout/pause                | TBD — see plan.md |
| FR9  | Disconnect auto-save & rejoin              | P0       | integration: freeze/rejoin lifecycle      | TBD — see plan.md |
| FR10 | Save & exit                                | P0       | integration: save/resume lifecycle        | TBD — see plan.md |
| FR11 | Concede                                    | P0       | integration: concede outcomes             | TBD — see plan.md |
| FR12 | Game over & rematch                        | P0       | e2e: rematch flow                         | TBD — see plan.md |
| FR13 | In-game information display                | P0       | manual: layout pass (desktop + mobile)    | TBD — see plan.md |
| FR14 | History & head-to-head                     | P0       | integration: aggregate queries            | TBD — see plan.md |
| FR15 | Site shell & navigation                    | P1       | manual: screen walk                       | TBD — see plan.md |
| FR16 | Local pass-and-play (2-player)             | P0       | e2e: local game flow; manual: handoff UX  | TBD — see plan.md |
| NFR1 | Server-authoritative integrity             | P0       | unit + integration: illegal-move rejection| TBD — see plan.md |
| NFR2 | Real-time responsiveness (<500ms)          | P1       | manual: latency spot-check                | TBD — see plan.md |
| NFR3 | Responsive design (375px)                  | P0       | manual: mobile-web pass                   | TBD — see plan.md |
| NFR4 | Game-logic test coverage                   | P0       | unit: rules suite completeness            | TBD — see plan.md |
| NFR5 | Security hygiene                           | P0       | integration: authz; manual: secret scan   | TBD — see plan.md |
| NFR6 | Hobby-tier cost envelope                   | P1       | manual: tier audit at deploy              | TBD — see plan.md |
| NFR7 | End-to-end type safety                     | P0       | unit: type gate (tsgo) across packages    | TBD — see plan.md |

**Notes:**

- Verification format: `method: pointer` (unit / integration / e2e / manual / perf).
- Planned Tasks filled by `oat-project-plan`.

## Open Questions

- **Data model:** Full Postgres schema — sessions, board state, locks, moves, outcomes, aggregates (design phase core).
- **API surface:** tRPC router/procedure layout, event payload shapes, room subscription contract (design phase core).
- **Wireframes:** Layouts for the 9 MVP screens; board+hand composition on mobile (design phase, visual session).
- **Hard-mode UX details:** Dead-card turn-in gesture, drag ergonomics, move-rejection feedback.
- **Guest identity mechanics:** How a guest is identified within a single live session (cookie/token scoped to game) without implying cross-session persistence.

## Assumptions

- Solo operator + agent workflow; operator completes pre-flight before implementation.
- TS7 GA (~July 2026) lands mid-project enabling tsgo-only flip; not blocking.
- Free tiers suffice for MVP validation traffic.

## Risks

- **Bleeding-edge tooling (tsgo beta, oxfmt beta):** Known workarounds documented; side-by-side TS install is the fallback.
  - **Likelihood:** Medium · **Impact:** Low · **Mitigation:** side-by-side install; flip at GA.
- **Better Auth churn / small core team:** Pin minors; conventional session model keeps roll-your-own exit path.
  - **Likelihood:** Medium · **Impact:** Medium · **Mitigation:** version pinning; deliberate upgrades.
- **Real-time lifecycle complexity (timers + disconnect + resume interplay):** The riskiest design surface; needs explicit state-machine treatment in design.
  - **Likelihood:** Medium · **Impact:** High · **Mitigation:** model game/turn/connection state machines explicitly; integration tests for lifecycle paths.
- **Railway WS idle drops:** Heartbeat (required anyway) neutralizes; portable container makes Render/Fly an afternoon swap.
  - **Likelihood:** Low · **Impact:** Low · **Mitigation:** 20s heartbeat.

## References

- Discovery: `discovery.md` (project) + `.oat/repo/reference/planning/2026-rewrite/` (canonical planning docs)
- Official rules: `.oat/repo/reference/planning/2026-rewrite/game-instructions.md`
