---
oat_status: in_progress
oat_ready_for: null
oat_blockers: []
oat_last_updated: 2026-06-12
oat_generated: false
oat_template: false
---

# Design: web-mvp

## Overview

Greenfield pnpm monorepo replacing all legacy code: `apps/web` (Next.js 16), `packages/api` (Fastify 5 + tRPC 11), `packages/game-logic` (pure TS). The API is a standalone long-lived Node service on Railway; the web app deploys to Vercel; state of record is Neon Postgres (us-east-1, co-located with the API). The future RN app will consume `game-logic` and the tRPC router types — those two surfaces are the multi-client contract and stay framework-free.

The architecture is **server-authoritative with a pure rules core**: `game-logic` owns the *complete turn loop* (move legality, jack semantics, dead-card evaluation, sequence detection/locking, win conditions, turn advancement) as a reducer returning events; the API is a thin host (load → reduce → persist → broadcast → timers). This rule is the insurance policy for the planned offline-PWA fast-follow: an offline local mode is just a different thin host around the same reducer.

Approach reaffirmed with the user (2026-06-12) from discovery's chosen direction. Includes FR16 (local pass-and-play) added during design.

## Architecture

### System Context

New system; no existing architecture to integrate with. External touchpoints: Neon (Postgres), Better Auth's hosted-nothing model (self-hosted on our Fastify), Vercel (web hosting), Railway (API hosting), optional social OAuth providers.

**Key Components:**

- **`packages/game-logic`:** rules engine as pure functions over immutable state; consumed by API (enforcement) and web (display-side legality) — same code both sides, so client previews can never disagree with server verdicts.
- **`packages/api`:** domain-driven (`game/`, `user/`, `history/`, `shared/`): persistence, auth, game lifecycle, move engine, turn timers, real-time fan-out (tRPC WS subscriptions, room-scoped, ~20s heartbeat).
- **`apps/web`:** server-rendered landing/auth/dashboard/history shell + client-rendered game routes; single tRPC client (HTTP for queries/mutations, WS for subscriptions).

### Component Diagram

```
apps/web (Vercel)                      packages/api (Railway)
┌──────────────────────┐               ┌─────────────────────────────┐
│ shell routes (SSR)   │── HTTP ──────▶│ Better Auth  /api/auth/*    │
│ game routes (client) │── tRPC HTTP ─▶│ tRPC routers: game, history │
│  ├─ tap controller   │── tRPC WS ───▶│  ├─ session domain          │
│  └─ drag controller  │◀── events ────│  ├─ move engine ──┐         │
└─────────┬────────────┘               │  ├─ timer service │         │
          │ display helpers            │  └─ realtime layer│         │
          ▼                            └───────┬───────────┼─────────┘
┌──────────────────────┐                       │ Drizzle   │ reduce()
│ packages/game-logic  │◀──────────────────────┼───────────┘
│ (pure TS reducer)    │               ┌───────▼───────────┐
└──────────────────────┘               │ Neon Postgres     │
                                       │ (us-east-1)       │
                                       └───────────────────┘
```

### Data Flow

The one loop that matters:

```
client move intent (tRPC mutation, carries game version)
  → API: load game + hands (one transaction)
  → game-logic: applyMove(state, move) → { nextState, events } | { error }
  → API: persist changed fields + append events (same transaction, version guard)
  → realtime layer: emit events to room subscribers (redacted per recipient)
  → all clients (including actor) render from broadcast
```

Clients never apply moves locally from their own input — they render what the server broadcasts. Hand privacy is enforced at the subscription boundary: broadcast events carry public state only; hand changes travel only on the owning player's stream.

## Component Design

### `game-logic` package

**Purpose:** The rules contract — every Sequence rule as pure, exhaustively-tested functions.

**Responsibilities:**

- Board constants (`boardMap` ported from legacy), deck construction, seedable shuffling/dealing
- The full turn loop: move validation → application → dead-card evaluation → turn advancement → win detection
- Sequence detection (rows/columns/diagonals **including corner-as-wild**), chip locking, >5-run choice handling
- Display helpers for clients; lifecycle state-machine types

**Interfaces:**

```typescript
applyMove(state: GameState, move: Move): MoveResult
//   MoveResult = { ok: true; nextState: GameState; events: GameEvent[] }
//              | { ok: false; error: RuleViolation }
resolveSequenceChoice(state: GameState, cells: Position[]): MoveResult
turnInDeadCard(state: GameState, seat: Seat, card: Card): MoveResult
validPlacements(hand: Card[], board: Board): Map<Card, Position[]>
isDeadCard(card: Card, board: Board): boolean
wouldConsumeCard(placement: Placement, hand: Card[]): Card  // natural-over-jack rule
createGame(settings: GameSettings, players: PlayerSeed[], rng: Rng): GameState
```

**Dependencies:** none (pure TS; zod for shared schema types only).

**Design Decisions:**

- **Reducer returns events** (ChipPlaced, ChipRemoved, SequenceCompleted, TurnAdvanced, DeadCardSwapped, GameWon…), not just next-state — the API persists and broadcasts these directly; the move log becomes a replayable event stream for free.
- **The reducer owns the complete turn loop** (auto-draw, default-mode dead-card auto-swap, pending-choice sub-state, turn advancement). The API host stays thin; the future offline host reuses everything.
- Seedable RNG injection for deterministic tests.

### Game session domain (`api/game/`)

**Purpose:** Lifecycle owner from creation to cleanup.

**Responsibilities:** create (settings validation; local pass-and-play flag), join (user or guest token issuance), lobby ops (team slots, kick, randomize), start (deal + alternating-team turn order), save & exit, freeze/rejoin, concede, rematch (linked game, rotated first player), hourly expiry sweep.

**Design Decisions:** Local games (FR16) skip the lobby — creator names the opponent; both seats bind to the creator's connection.

### Move engine (`api/game/`)

**Purpose:** The authoritative loop host.

**Responsibilities:** load state, call `game-logic`, persist in a transaction with **optimistic concurrency** (`version` column; duplicates/races lose cleanly as `CONFLICT`), trigger broadcast.

### Turn timer service (`api/game/`)

**Purpose:** Server-side timer enforcement (FR8).

**Design Decisions:** Deadlines are **persisted** (`turn_deadline_at`), with an in-memory scheduler that fires forfeits and **rehydrates from the DB on boot** — a Railway redeploy can't strand a timed game. Pause-on-disconnect stores `turn_remaining_ms`. The timer does not run during `pending-choice`.

### Real-time layer (`api/shared/`)

**Purpose:** Room-scoped event fan-out and presence.

**Responsibilities:** room registry (gameId → subscriber set, in-memory — single instance), tRPC WS subscriptions with `tracked()` IDs from the per-game `seq`, snapshot-first recovery (see Error Handling), ~20s heartbeat → disconnect detection → session domain (freeze/pause), per-recipient redaction (public events to room; `HandUpdated` only to owning seat; local games receive all hands on the one connection).

### Auth domain (`api/user/`)

**Purpose:** Identity for tRPC context.

**Responsibilities:** Better Auth mounted at `/api/auth/*`; context resolves session → `user | guest | anonymous`; guest tokens: signed, game-scoped, httpOnly cookie, hash stored. Local games authorize the creator's session for both seats.

### History domain (`api/history/`)

**Purpose:** Outcomes and records (FR14).

**Design Decisions:** Aggregate W-L, games list, head-to-head computed by **SQL aggregation at query time — no materialized stats tables** (YAGNI at friend-group scale). Local games listed but excluded from aggregates/head-to-head.

### Web app (`apps/web`)

**Purpose:** All 9 MVP screens + game UI.

**Responsibilities:** shell routes (landing, auth, dashboard, history) and game routes (join, lobby, game, game-over). Game UI tree per conventions: `GameBoard` (grid + chips + highlights), `CardHand`, `PlayerRail` (last-played, turn, timer), `LobbyTeams`, `GameOver`, `HandoffScreen` (FR16 interstitial — hides outgoing hand until incoming player reveals). Two **input controllers** over the same board rendering (tap / drag), selected by game settings.

## Data Models

**Schema layer:** **Drizzle ORM** over `postgres.js` — TS-native schema, generated migrations (`drizzle-kit`), Better Auth adapter alignment (Neon's own guide pattern). Raw SQL stays available on hot paths.

### Better Auth tables

`user`, `session`, `account`, `verification` — generated/owned by Better Auth. Our FKs point at `user.id`.

### `games`

**Purpose:** One row per game — the single-writer row.

**Schema (column groups):**

- Identity: `id` (uuid), `invite_code` (short unique, ~10 chars), `created_by` → user, `rematch_of` → games, `local` (boolean — FR16)
- Settings (immutable after start): `player_count` (2|3|4|6), `mode` (`tap`|`drag`), `timer_seconds` (null = untimed)
- Live state: `status` (`lobby`→`active`→`frozen`|`saved`→`finished`), `version` (optimistic concurrency), `current_seat`, `round`, `turn_deadline_at`, `turn_remaining_ms`, `pending_choice` (jsonb — >5-run lock selection)
- Game data (jsonb): `board` (100 cells `{chip?: team, lockedBy?: seqId}`), `deck` (ordered, server secret), `played`, `sequences` (completed: team, cells, order)
- Outcome: `winner_team`, `end_reason` (`win`|`concede`|`expired`), `finished_at`
- Lifecycle: `expires_at` (1h frozen / 1wk saved), `created_at`, `updated_at`

**Validation rules:** settings immutable post-start (enforced in session domain); status transitions only via the lifecycle state machine.

**Storage decision:** jsonb for board/deck/hands — the game is always loaded/saved whole by one writer in a transaction; normalizing 100 cells buys nothing and costs joins. `version` gives atomic whole-game updates.

### `game_players`

`id`, `game_id`, `seat` (unique per game), `team` (1–3), `user_id` (nullable) **or** `guest_name` + `guest_token_hash`, `hand` (jsonb — private), `connected`, `last_seen_at`, `is_creator`. Hands live here: the privacy boundary matches the table boundary. Local-game seat 2 = `guest_name`, no `user_id`, no token.

### `game_events`

`id`, `game_id`, `seq` (per-game monotonic), `type`, `payload` (jsonb), `actor_seat`, `created_at`. Triple duty: move log (requirement), subscription resume cursor (`lastEventId` = seq), future replay. **Events store full truth server-side (including draws); the subscription layer redacts per recipient at broadcast** — one source of truth, privacy at the edge.

### History = queries, not tables

Aggregates derive from `games (status='finished')` ⋈ `game_players`; head-to-head = self-join on shared finished games where both seats have `user_id`. Cleanup deletes only expired unfinished games (cascade); finished games persist — they are the history.

**Indexes:** `game_players(user_id, game_id)`, `games(status, finished_at)`, `games(invite_code)`, `game_events(game_id, seq)`.

**`game-logic` ↔ DB mapping:** in-memory `GameState` assembles from `games` jsonb + all `game_players.hand`; after `applyMove`, the engine writes changed fields + appends events in one transaction.

## API Design

**Two surfaces:** Better Auth owns REST at `/api/auth/*` (not wrapped in tRPC). Everything else: tRPC routers `game` + `history`, HTTP for queries/mutations, WS for subscriptions, zod on every input.

**Authorization chain:** `publicProcedure` → `authedProcedure` (session required) → `gamePlayerProcedure` (caller → seat via session user or guest cookie; local games: creator session covers both seats). Guest tokens ride the same cookie jar on HTTP and WS `connectionParams`.

### `game` router

| Kind | Procedure | Auth | Notes |
|---|---|---|---|
| mutation | `create(settings)` | authed | settings incl. `local` + `opponentName` (FR16); returns game + invite code |
| query | `preview(inviteCode)` | public | join-page preview; rate-limited |
| mutation | `join(inviteCode, guestName?)` | public | issues guest token when unauthenticated |
| mutation | `setTeam` · `kick` · `randomizeTeams` · `start` | seat/creator | lobby ops |
| mutation | `makeMove(gameId, version, move)` | seat | hot path |
| mutation | `chooseSequenceCells(gameId, cells)` | seat | resolves pending >5-run choice |
| mutation | `turnInDeadCard(gameId, card)` | seat | hard mode manual swap |
| mutation | `saveAndExit` · `concede` · `rematch` | seat | lifecycle |
| query | `myGames()` | authed | dashboard resumables + recents |
| subscription | `onGameEvent(gameId, lastEventId?)` | seat | the single live stream |

**Move shape** (discriminated union mirroring game-logic): `{type:'place', card, position}` · `{type:'removeChip', position}`. **Mode never changes the wire contract** — hard mode is purely client-side affordance.

### `history` router

`myRecord()` · `myGames(cursor)` · `headToHead()` — authed queries over the finished-games join.

### Event stream contract

One subscription multiplexes everything: game events, lobby events (PlayerJoined, TeamChanged, GameStarted), connection events (PlayerDisconnected/Reconnected, TimerPaused/Resumed). Each event carries `seq` via `tracked()`. Per-recipient redaction at emit. **Decision:** one multiplexed subscription — one reconnect path, one cursor, one registry entry.

### Error contract

`UNAUTHORIZED` · `FORBIDDEN` (not a seat / not creator) · `CONFLICT` (stale version / not your turn) · `BAD_REQUEST` with typed `ruleViolation` from game-logic (`card-not-in-hand`, `space-occupied`, `chip-locked`, `not-a-dead-card`, …) — clients render rule feedback from codes, never string matching.

## Security Considerations

### Authentication

Better Auth defaults: httpOnly secure session cookies, CSRF protection, internal password hashing. Sessions validated server-side in tRPC context. WS authenticates at upgrade via the same cookies; a socket is bound to an identity for its lifetime.

### Authorization

The middleware chain above is the whole story; turn ownership enforced by the engine. Local games: creator session covers both seats — privacy is client-side (handoff screen), acceptable because the pass-and-play threat model is "opponent on the couch."

### Data Protection

- **Encryption:** TLS everywhere (Vercel/Railway/Neon defaults); at-rest via Neon.
- **PII:** email + display name only. No payment, no tracking. No hands/deck/PII in logs.
- **Hand privacy:** enforced at subscription emit (public events to room, `HandUpdated` to owning seat only); deck order never serialized to any client. Tests assert no event reaching a non-owning seat contains hand/deck data (NFR1 acceptance).
- **Input validation:** zod structurally, game-logic semantically — two rejection layers. Drizzle/postgres.js parameterization throughout.

### Threat Mitigation

- **Invite-code enumeration:** ~10-char unambiguous codes; `preview`/`join`/auth endpoints rate-limited per IP.
- **Guest token misuse:** signed, game-scoped, hash-stored, dies with the game.
- **Leaked legacy GCP key:** **delete from repo and revoke in GCP** (public in history → revocation is the real fix; history rewrite optional and low-value once revoked; Firebase project being decommissioned).
- **CORS:** API allows exactly the web origin, with credentials.

## Performance Considerations

### Scalability

A turn-based game for ≤6 friends has no server performance problem. One Node process, in-memory rooms, single-writer DB rows. Move path: one transaction + ≤6 in-memory WS writes, API/DB co-located (~1–3ms RTT) — comfortably under the 500ms NFR2 target. No caching layer needed or wanted (the DB is the hot state; one writer).

### Caching

None server-side (deliberate). Client: tRPC built-in query caching; static assets immutable-cached.

### Database Optimization

Indexes per Data Models. Neon scale-to-zero cold start (~500ms–2s after ~5 min idle) hits first lobby load, not mid-game moves — acceptable; autosuspend window configurable if it annoys. Small fixed pool (≤10, direct connection string).

### Resource Limits

Railway smallest instance suffices (low CPU, <512MB). **Card SVG weight is the real perf work:** face cards 100–230KB (~1.9MB set). SVGO at build time (Inkscape metadata strips well), immutable cache headers, **preload all 48 board faces during lobby**. If SVGO can't get face cards under ~50KB, rasterize worst offenders to WebP at 2× cell size.

**Board rendering:** React Compiler on; cells receive primitive props (chip team, locked, highlighted) so unchanged cells skip re-render; Motion animates transforms/opacity only.

## Error Handling

### Error Categories

- **User/domain errors:** typed `ruleViolation` + `CONFLICT`/`FORBIDDEN` — rendered as UI feedback (misdrop shake, "not your turn" toast); never retried. `CONFLICT` triggers a state refetch.
- **System errors:** unhandled → `INTERNAL_SERVER_ERROR`, structured-logged with game id + seq context, generic toast. Transactions make moves all-or-nothing.
- **External service errors:** DB unreachable → fail the mutation (client sees retryable transport error); Neon cold start is just latency, not an error.

### Retry Logic

Mutations: manual user retry is safe (version guard = idempotent-in-effect; duplicate → `CONFLICT`). WS: auto-reconnect with backoff behind a blocking "Reconnecting…" overlay.

**Recovery contract (load-bearing):** on every subscribe, if `lastEventId` is absent or stale beyond the retained window, the server's first emit is a **full redacted snapshot** (game + your hand), then the live stream. Gap replay covers blips; snapshot covers everything else. One recovery path; clients can't get it wrong.

**Lifecycle state machine** (types in `game-logic`):

| From → To | Trigger |
|---|---|
| `lobby → active` | creator starts (valid teams) |
| `active → frozen` | heartbeat lapse (~2 missed) → timer pauses, `expires_at` = +1h |
| `frozen → active` | all seats reconnected → timer resumes with remainder |
| `active → saved` | save & exit → `expires_at` = +1wk |
| `saved → active` | all original players rejoined |
| `active → finished` | win / double-sequence / concede |
| `frozen`/`saved` → deleted | expiry sweep |

Turn sub-states: `awaiting-move`, `pending-choice` (timer suspended during choice). Forfeit-vs-move race resolves via version guard — first commit wins, deterministically.

### Logging

Pino (Fastify-native) structured logs to Railway:

- **Info:** moves (game, seat, type, seq, duration), lifecycle transitions, WS connect/disconnect.
- **Warn:** rate-limit hits, heartbeat lapses, version conflicts.
- **Error:** all faults with game/seq context.

No hands, no deck, no PII. Error tracking (Sentry) deferred — pino + the event log already give replayable forensics.

## Testing Strategy

### Requirement-to-Test Mapping

| ID | Verification | Key Scenarios |
|---|---|---|
| FR1 | integration + manual | signup/login/logout; session survives reload; unauthenticated create rejected |
| FR2 | integration | settings validation (counts, timer steps); immutability post-start; invite code issued |
| FR3 | e2e | link → preview → guest join → play; guest cannot save |
| FR4 | integration + manual | team evenness enforcement; alternating turn order; kick/randomize |
| FR5 | unit | full rules catalog: deal table, jacks (incl. no-target), corners, dead cards (incl. resurrection), locking, win counts, double-sequence, >5-run choice, reshuffle |
| FR6 | integration + manual | event broadcast to all seats; reconnect resumes via lastEventId; snapshot fallback; heartbeat freeze |
| FR7 | e2e + manual | tap flow and drag flow complete games; natural-card auto-consume |
| FR8 | integration | forfeit on expiry (no play/no draw); pause/resume on disconnect; rehydrate after restart |
| FR9 | integration | freeze on drop; rejoin-all resumes; expiry cleanup |
| FR10 | integration | save & exit; dashboard resume; 1-week expiry |
| FR11 | integration | concede ends game; team loss recorded |
| FR12 | e2e | rematch same roster/settings; first player rotates |
| FR13 | manual | layout pass desktop + 375px |
| FR14 | integration | aggregates correct; head-to-head pairs; local games excluded |
| FR15 | manual | 9-screen walk |
| FR16 | e2e + manual | local game start-to-finish; handoff hides hands; records exclusion |
| NFR1 | unit + integration | crafted illegal moves rejected; **no cross-seat hand/deck data in any emitted event** |
| NFR2 | manual | latency spot-check on prod |
| NFR3 | manual | 375px playthrough |
| NFR4 | unit | FR5 suite completeness review |
| NFR5 | integration + manual | authz rejections; secret scan of repo |
| NFR6 | manual | tier audit at deploy |
| NFR7 | unit | tsgo gate green across packages |

### Unit Tests

- **Scope:** all of `game-logic` (the bulk of the project's test value); API pure helpers (redaction, turn-order derivation).
- **Coverage target:** game-logic ~100% of rule branches (seedable RNG makes every scenario constructible); no numeric target elsewhere.
- **Key cases:** corner sequences (4 chips + corner), sequence spanning two directions, one-eyed jack vs locked chip, dead-card resurrection after removal, double-sequence instant win, 9-in-a-row two-sequence counting with shared chip.

### Integration Tests

- **Scope:** tRPC procedures + lifecycle against a real Postgres.
- **Environment:** dedicated **Neon test branch**, reset per run via drizzle push (no docker dependency; matches prod engine; branching is the Neon differentiator). Vitest, fake timers for deadline tests.
- **Key cases:** the lifecycle table; version-guard races (concurrent move + forfeit); WS subscribe/replay/snapshot paths.

### End-to-End Tests

- **Scope:** Playwright (new dev dependency) against local dev servers, 2-browser-context games.
- **Scenarios:** join→play→win (tap mode), reconnect mid-game, rematch, local pass-and-play handoff.

## Deployment Strategy

### Build Process

pnpm workspace scripts (no turbo — three packages don't need it): `build`, `typecheck` (tsgo), `lint` (oxlint), `format` (oxfmt), `test` (vitest). API ships as a Dockerfile (Railway); web builds on Vercel with workspace-aware install.

### Deployment Steps

1. Migrations: `drizzle-kit migrate` as a release step (predeploy command on Railway), **not** on boot.
2. API: Railway deploys from GitHub push (Dockerfile at `packages/api`); "Serverless" sleep toggle OFF; healthcheck endpoint.
3. Web: Vercel deploys `apps/web` from the same push; env points at the Railway URL (HTTP + WS).
4. Smoke: create + play a local game on prod.

### Rollback Plan

Railway/Vercel one-click previous deployment. Migrations are additive during MVP (no destructive migrations without a deliberate decision); git is the artifact rollback.

### Configuration

- **Env (API):** `DATABASE_URL` (Neon direct), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_ORIGIN` (CORS), optional OAuth client ids/secrets, `PORT`.
- **Env (web):** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`.
- **Feature flags:** none (play mode and timer are per-game settings, not flags).

### Monitoring

Railway logs (pino) + Vercel deployment checks. No paid monitoring for MVP; healthcheck + manual smoke. Revisit Sentry post-MVP.

## Migration Plan

No database or data migrations — greenfield; legacy Firestore data is abandoned, not migrated. Schema evolution uses Drizzle migrations from day one. The only "migration" is repo-level: legacy code deleted in a dedicated cleanup task after salvage extraction (boardMap, card SVGs + LGPL attribution), and the leaked GCP key deleted + revoked per Security. Rollback is git: every phase commits independently.

## Open Questions

- **Wireframes:** screen layouts for the 9 screens + handoff interstitial — being resolved in a design-supplement session (visual companion) before/alongside planning; outputs land in `wireframes/` under this project.
- **Hard-mode gesture details:** dead-card turn-in gesture and misdrop feedback — to be settled in the wireframe session; the wire contract is unaffected either way.

## Implementation Phases

### Phase 1: Foundation & Salvage

**Goal:** Clean monorepo skeleton, tooling green, legacy gone.
**Tasks:** pnpm workspaces; tsgo+TS6 side-by-side; oxlint/oxfmt/vitest configs; package skeletons; boardMap → typed constant; SVGO card pipeline + LGPL attribution; delete all legacy code + key (operator revokes in GCP).
**Verification:** typecheck/lint/test gates pass on clean tree.

### Phase 2: `game-logic`

**Goal:** The rules contract, proven.
**Tasks:** GameState/events/state-machine types; reducer with full turn loop; sequence detection incl. corners; jacks; dead cards; win conditions; >5-run choice; display helpers; seedable RNG; the exhaustive suite.
**Verification:** unit suite green — rules proven before any pixel or endpoint exists.

### Phase 3: API Foundation

**Goal:** Server skeleton with identity.
**Tasks:** Fastify+tRPC bootstrap; Drizzle schema + migrations; Better Auth mounted + middleware chain; guest tokens; Neon wiring; Bruno scaffold.
**Verification:** auth integration tests + Bruno smoke on a Neon branch.

### Phase 4: Game Domain (server)

**Goal:** Fully playable game over the API — no UI.
**Tasks:** session lifecycle (create/join/lobby/start/save/freeze/rejoin/concede/rematch/sweep); move engine + version guard; timer service (persisted deadlines, boot rehydration); WS subscriptions (rooms, heartbeat, snapshot-first recovery, redaction); local-game flag; history queries.
**Verification:** integration suite over the lifecycle table; Bruno covers every procedure; scripted full game plays end-to-end.

### Phase 5: Web Shell

**Goal:** Everything except the game itself.
**Tasks:** Next.js app; Tailwind; tRPC client (HTTP+WS links); landing; auth screens; dashboard; join flow; history screens.
**Verification:** screen walk + component tests.

### Phase 6: Game UI

**Goal:** The game, playable and pleasant, both modes.
**Tasks:** GameBoard/CardHand/PlayerRail/LobbyTeams/GameOver; tap controller; drag controller; HandoffScreen (FR16); responsive 375px layouts; Motion animations; SVG preloading; reconnecting overlay.
**Verification:** Playwright e2e (join→play→win, reconnect, rematch, pass-and-play); manual mobile pass.

### Phase 7: Deploy & Handoff

**Goal:** Production, operator-testable.
**Tasks:** Railway Dockerfile + predeploy migrations; Vercel link; env propagation; prod smoke; latency spot-check; operator handoff notes.
**Verification:** the discovery success criterion — a real game end-to-end on production URLs.

## Dependencies

### External Dependencies

- **Neon** (Postgres + test branching) · **Railway** (API) · **Vercel** (web) — per validated discovery.
- **Better Auth ^1.6** (pin minors) · **tRPC v11** · **Fastify v5** + `@fastify/websocket` · **Next.js 16 / React 19** · **Drizzle ORM + drizzle-kit** · **postgres.js** · **Tailwind** · **Motion** · **zod**.

### Internal Dependencies

- `api` and `web` depend on `game-logic` (types + functions); `web` depends on `api`'s router types (type-only import).

### Development Dependencies

- **tsgo (`@typescript/native-preview`) + `typescript@6`** side-by-side · **oxlint** · **oxfmt** · **Vitest** · **Playwright** (e2e) · **Bruno** (API collection) · **SVGO** (asset pipeline).

## Risks and Mitigation

- **Real-time lifecycle complexity (timers × disconnect × resume):** Medium | High
  - **Mitigation:** explicit state machine in game-logic types; persisted deadlines; snapshot-first recovery; the P4 integration suite targets exactly this table.
  - **Contingency:** the lifecycle is server-only — fixable without client changes.
- **Bleeding-edge tooling (tsgo beta, oxfmt beta):** Medium | Low
  - **Mitigation:** side-by-side TS install; per-package checking if the workspace-references bug bites.
  - **Contingency:** delete one devDependency, run `tsc` — trivial fallback.
- **Better Auth churn / small core team:** Medium | Medium
  - **Mitigation:** pin minors, deliberate upgrades; conventional session model.
  - **Contingency:** roll-your-own sessions (Lucia guides + Arctic) — documented exit path.
- **Railway WS idle drops:** Low | Low
  - **Mitigation:** 20s heartbeat (needed anyway).
  - **Contingency:** Render/Fly.io afternoon swap (containerized).
- **SVG asset weight degrades mobile:** Medium | Low
  - **Mitigation:** SVGO pipeline + lobby preload (P1/P6).
  - **Contingency:** WebP rasterization of face cards.
- **Autonomous-build drift across sessions:** Medium | Medium
  - **Mitigation:** every phase ends green and committed; state.md tracks position; P4's no-UI playability checkpoint catches design flaws early.
  - **Contingency:** phase-level review gates can be enabled at any point.

## References

- Specification: `spec.md`
- Discovery: `discovery.md` + `.oat/repo/reference/planning/2026-rewrite/` (consolidated discovery, rules-and-flows, code-organization, official rules)
