---
oat_generated: true
oat_generated_at: 2026-06-13
oat_review_scope: final
oat_review_type: code
oat_review_invocation: manual
oat_project: .oat/projects/shared/web-mvp
---

# Code Review: final (web-mvp)

**Reviewed:** 2026-06-13
**Scope:** final — cross-cutting / integration review of `e50e6a6ab40d83ce570f912c49debfea4601f4df..HEAD` (173 commits, 650 files), deferred-ledger re-evaluation, and spec FR/NFR coverage. Per-phase defects already closed in p01–p07 reviews were not re-litigated.
**Files reviewed:** cross-cutting seams across `packages/game-logic`, `packages/api`, `apps/web`, plus all project artifacts and the seven prior phase reviews.
**Commits:** 173 in range.

## Summary

The web-mvp ships a complete, server-authoritative multiplayer Sequence implementation whose cross-cutting seams hold up under integration scrutiny: the pure `game-logic` reducer stays framework-free and is the single rules contract for API and web; hand/deck privacy (NFR1) is enforced uniformly at the subscription edge for snapshot, gap-replay, and live paths; the seat-authorization chain derives identity server-side for users, local creators, and game-scoped guests; and optimistic concurrency is enforced atomically in one SQL CTE. All 386 tests pass (58 files, against the live Neon test branch), typecheck/lint/format are green, and non-mutating production checks confirm the NFR2 region/latency fix, NFR2 server-timing exposure, and the NFR5 cross-origin cookie/CORS posture are all still in effect at final. Every P0 FR and NFR is implemented and verified. No Critical or Important findings. The single carried Minor (physical-phone smoke) is recommended for accept-defer; the two "resolved-for-context" ledger items (NFR2 latency, cross-origin cookie posture) are confirmed still resolved.

**Overall recommendation: PASS.**

## Findings

### Critical

None

### Important

None

### Medium

- **Unbounded session-user cache map** (`packages/api/src/trpc.ts:76`)
  - Issue: `sessionUserCache` is a process-global `Map` keyed on the full `Cookie` header string with a 10s TTL. Entries are only evicted lazily on the next lookup of that exact cookie or wholesale on any auth mutation (`clearSessionUserCache`, `packages/api/src/server.ts:144`). A stream of distinct expired cookies (e.g. rotated/garbage cookies on `/trpc` requests) is never proactively swept, so the map can grow unbounded between auth mutations on a long-lived single instance. Correctness and privacy are fine (TTL is short and logout/revocation clears the whole map), so this is not a security or correctness defect — it is a slow-leak maintainability concern on the one always-on Railway instance.
  - Fix: bound the cache (e.g. cap entry count with FIFO/LRU eviction, or sweep expired entries opportunistically on write). Low effort; safe to defer to a fast-follow given MVP traffic and the deliberate single-instance deploy.

### Minor

- **Physical-phone mobile smoke unperformed (carried from ledger)** (`.oat/projects/shared/web-mvp/handoff.md:104`, `handoff.md:157`)
  - Issue: the production 375px pass used an automated Pixel 5 / 375px viewport, not a real device. NFR3's written acceptance criterion is "complete game playable on a ~375px-wide viewport without horizontal scrolling" (`spec.md:201`, `spec.md:205`), which the automated pass satisfies; the Playwright suite additionally exercises the game at a mobile-375 project (`apps/web/e2e/pass-and-play.spec.ts`).
  - Suggestion: **Accept-defer.** The written NFR3 criterion is met by the automated pass; run one physical-device smoke before broad operator playtesting and append the result to `handoff.md`. Re-confirming the prior p07-rereview disposition; not a release blocker.
- **Stale Vercel URL in p07 rereview vs handoff** (`.oat/projects/shared/web-mvp/reviews/p07-review-2026-06-13-rereview.md:57`)
  - Issue: the p07 rereview cites the web alias as `https://sequence-cyan.vercel.app`, while the current `handoff.md` records the production alias as `https://sequence-online.vercel.app` (`handoff.md:91`) and Railway `WEB_ORIGIN` is set to that origin (live CORS confirms `access-control-allow-origin: https://sequence-online.vercel.app`). This is artifact drift from deploy-iteration churn, not a code defect — the live deployment is internally consistent (web alias, Railway `WEB_ORIGIN`, and CORS all agree on `sequence-online.vercel.app`).
  - Suggestion: leave the historical p07 rereview as-is (it is a point-in-time record) and treat `handoff.md` as the canonical URL source; optionally add a one-line note in `handoff.md` that earlier deploy iterations used a different alias.

## Cross-Cutting / Integration Assessment

Concerns a single-phase review could not see, verified end-to-end:

- **Shared rules contract / `game-logic` purity:** `packages/game-logic/src` imports no framework, ORM, tRPC, or `@sequence/api` symbols (grep-verified) — it is consumed by both the API (authoritative enforcement) and web (display legality) so client previews can never disagree with server verdicts. `@sequence/api` is a **type-only** import in web and lives in web `devDependencies` only (`apps/web/package.json`), so the multi-client tRPC type contract is in place without runtime coupling (NFR7, Constraints).
- **Hand/deck privacy at the seam (NFR1):** `redactEvent` strips card-bearing fields for any non-owning seat via an allowlist of private event types, and `buildSnapshot` serializes only the recipient's own hand (deck and other hands never leave the server; local games are the documented single-connection exception) — `packages/api/src/shared/realtime/redaction.ts`. Critically, `on-game-event.ts` applies `redactEvent` on **all three** delivery paths (gap-replay, post-replay snapshot, and the live loop) using `ctx.seat.seat` derived from the auth chain, not from client input (`packages/api/src/game/routes/on-game-event.ts:193,218,233`). The room registry deliberately carries full events and redacts per-recipient downstream (`rooms.ts`).
- **Authorization chain integrity:** `gamePlayerProcedure` resolves the caller's seat server-side — session user → their `game_players` row, local game → creator session covers all seats, guest → game-scoped HMAC token verified for that exact `gameId` then matched against the stored hash (`packages/api/src/trpc.ts:281-352`). A tampered guest cookie that throws on `decodeURIComponent` degrades to FORBIDDEN, not a 500 (`readCookie`, trpc.ts:249).
- **Optimistic concurrency across the move/lifecycle surface:** the move hot path and lifecycle transitions both guard on `where id = … and version = prevVersion` in a single atomic CTE; a stale/raced write affects 0 rows and surfaces as `CONFLICT` (`packages/api/src/game/state-mapping.ts:498-541`, `move-engine.ts:218-250`). The p06/p07 fix ensuring lifecycle broadcasts carry the bumped post-transition version is present and regression-tested (`lifecycle.test.ts`).
- **Error contract uniformity:** rule violations flow from the engine through `RuleViolationError` into `error.data.ruleViolation` via the tRPC error formatter (`trpc.ts:200-215`), so clients render feedback from codes, not string matching (design §Error contract).
- **Production seam (live, non-mutating):** API `/health` 200 from `railway/us-east4-eqdc4a` with `Server-Timing: app;dur=0.1`; CORS scoped to `https://sequence-online.vercel.app` with credentials and **does not echo a foreign origin** (preflight from `evil.example.com` still returns only the configured ACAO); web alias returns 200. Confirms NFR2 region/latency fix, NFR2 server-timing exposure, and NFR5 cross-origin posture remain in effect.

## Deferred Findings Ledger — Disposition

| Ledger item | Disposition | Rationale |
| ----------- | ----------- | --------- |
| Deferred Minor: physical-phone mobile smoke unperformed (automated Pixel 5 / 375px used) | **Accept-defer** | NFR3's written acceptance criterion (playable at ~375px, no horizontal scroll) is satisfied by the automated viewport pass and the Playwright mobile-375 project. Carried as a Minor caveat; run a physical-device smoke before broad playtesting. Matches prior p07-rereview disposition. |
| (Context) p07 NFR2 real-time latency blocker | **Confirmed still resolved** | Live `/health` shows `us-east4-eqdc4a` placement and `Server-Timing`/`X-Sequence-Server-Duration-Ms` headers exposed; handoff records post-fix `game.makeMove` server timing ~45.6ms. The hot-path single-load + atomic write CTE and session cache are present in code. |
| (Context) p03 I1 cross-origin cookie posture | **Confirmed still resolved** | Live CORS returns `access-control-allow-credentials: true` with `access-control-allow-origin` pinned to the single Vercel origin (foreign origins not echoed); cookie strategy `SameSite=None; Secure; HttpOnly` recorded in handoff and applied via `cookie-attributes.ts`. |

## Requirements/Design Alignment

**Evidence sources used:** `spec.md`, `design.md`, `plan.md`, `implementation.md`, `handoff.md`, `discovery.md`, the seven prior phase reviews, the git range `e50e6a6..HEAD`, the full test run, and non-mutating live endpoint checks.

### Requirements Coverage

| Requirement | Status | Notes |
| ----------- | ------ | ----- |
| FR1 Accounts & auth | implemented | Better Auth email+password, session in tRPC context, authed-only create/history; web auth screens + logout (p05 fix). |
| FR2 Game creation & settings | implemented | `create-game.ts` zod-validates counts (2/3/4/6), mode, timer steps (30s≤180, 60s beyond); immutable post-start; invite code issued. |
| FR3 Invite & join (guests) | implemented | public `preview`/`join`; game-scoped guest token issued/verified; guest cannot save. Live guest cookie round-trip recorded. |
| FR4 Lobby & team formation | implemented | setTeam/kick/randomize/start; even-team enforcement; 6p uses approved 3×2 web shape (p06 fix); alternating turn order in `create-game` engine. |
| FR5 Core game engine | implemented | Full rule catalog with named edge-case tests (corners-as-wild, double-sequence instant win, dead-card resurrection, one-eyed vs locked, no-target unplayable, >5-run choice incl. chained runs, reshuffle). Server-authoritative; illegal moves rejected by engine. |
| FR6 Real-time sync & reconnect | implemented | One multiplexed WS subscription, `tracked()` by seq, snapshot-first recovery + gap replay; Playwright reconnect spec. |
| FR7 Two play modes | implemented | tap + drag controllers over one board; same move contract (card optional); natural-over-jack auto-consume. Playwright covers both. |
| FR8 Turn timer | implemented | Persisted `turn_deadline_at`, boot rehydration, pause-on-disconnect, suspended during pending-choice; TimerService TDD. |
| FR9 Disconnect auto-save & rejoin | implemented | Presence freeze/rejoin lifecycle, +1h window, sweep of expired; integration lifecycle suite. |
| FR10 Save & exit | implemented | `save-and-exit` (version-guarded), +1wk window, dashboard resumables. |
| FR11 Concede | implemented | `concede` (version-guarded), team loss recorded, conceded team surfaced (p06 fix). |
| FR12 Game over & rematch | implemented | GameOver + rematch (same roster/settings, rotated first player); Playwright rematch spec. |
| FR13 In-game info display | implemented | PlayerRail (last-played/turn/timer), round, hand, per-team sequence count; responsive. |
| FR14 History & head-to-head | implemented | SQL-aggregation queries; local games excluded from aggregates/head-to-head; FFA-concede attribution fixed. |
| FR15 Site shell & navigation | implemented | 9 screens, screen-walk recorded (all 200). |
| FR16 Local pass-and-play | implemented | Single-device 2p, handoff hand veil, creator session covers both seats, excluded from records; Playwright pass-and-play spec. |
| NFR1 Server-authoritative integrity | implemented | Engine-enforced legality; redaction allowlist + own-hand-only snapshot; redaction unit tests assert no cross-seat card data. |
| NFR2 Real-time responsiveness (<500ms) | implemented | Live server-timing ~0.1ms idle; post-fix `game.makeMove` ~45.6ms server time; region `us-east4-eqdc4a`. |
| NFR3 Responsive design (375px) | implemented (caveat) | Automated 375px/Pixel 5 pass + Playwright mobile-375 satisfy the written criterion; physical-phone smoke deferred (Minor). |
| NFR4 Game-logic test coverage | implemented | Exhaustive co-located Vitest suite; seeded simulations; all FR5 branches covered. |
| NFR5 Security hygiene | implemented | No secrets tracked (`.env` gitignored, untracked); CORS pinned to one origin (foreign not echoed); legacy code + committed key removed from tree (operator must still revoke key in GCP — known item). |
| NFR6 Hobby-tier cost envelope | implemented | One Vercel Hobby, one Railway service, Neon direct; no paid-tier-only dependency (tier audit recorded). |
| NFR7 End-to-end type safety | implemented | `pnpm typecheck` green across 3 packages; no `any`-typed boundaries in source; AppRouter type-only. |

### Design Alignment

Implementation matches design across architecture (pure reducer + thin host), data model (jsonb single-writer rows + version column + per-game event seq), API surface (game/history routers, single multiplexed subscription, optional `card` move field), and error handling (typed rule violations, CONFLICT on version/turn, snapshot-first recovery). No design drift requiring code change was found. The only artifact-alignment items are the Minor stale-URL note in the historical p07 rereview and the documented operator follow-up to revoke the legacy GCP key in GCP (history rewrite intentionally not required once revoked, per design §Threat Mitigation).

### Extra Work (not in declared requirements)

None significant. The p07 latency work (server-timing headers, make-move CTE, session cache) maps directly to NFR2; the session cache introduces the one Medium maintainability finding above but is requirement-driven.

## Verification Commands

Commands run during this review (all green / non-mutating):

```bash
git log --oneline e50e6a6..HEAD            # 173 commits
git diff --name-only e50e6a6..HEAD         # 650 files
git check-ignore .env                       # .env ignored; not tracked
pnpm typecheck                              # 3 packages — Done
pnpm lint                                   # oxlint — warnings only (pre-existing)
pnpm format:check                           # all files formatted
set -a && . ./.env && set +a && pnpm test  # 58 files / 386 tests passed
# Non-mutating live production checks:
curl -fsS -D - https://sequence-api-production-8687.up.railway.app/health
curl -fsS -o /dev/null -w '%{http_code}' https://sequence-online.vercel.app/
curl -fsS -D - -X OPTIONS .../trpc/game.preview -H 'Origin: https://evil.example.com' ...   # foreign origin not echoed
curl -fsS -D - -X OPTIONS .../trpc/game.preview -H 'Origin: https://sequence-online.vercel.app' ...
```

To re-run game-logic rules and e2e:

```bash
pnpm --filter @sequence/game-logic test
pnpm --filter @sequence/web exec playwright test
```

## Recommended Next Step

Mark the `final` review row in `plan.md` as passed and proceed to the configured final HiLL checkpoint / PR-final workflow. Optionally file the Medium (session-cache bound) and the carried Minor (physical-phone smoke) as fast-follow tasks via `oat-project-review-receive`. Run the `oat-project-review-receive` skill to convert findings into plan tasks.
