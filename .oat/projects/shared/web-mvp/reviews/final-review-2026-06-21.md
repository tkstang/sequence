---
oat_generated: true
oat_generated_at: 2026-06-21
oat_review_scope: final
oat_review_type: code
oat_review_invocation: manual
oat_project: .oat/projects/shared/web-mvp
---

# Code Review: final (web-mvp)

**Reviewed:** 2026-06-21
**Scope:** final — cross-cutting / integration review of `e50e6a6ab40d83ce570f912c49debfea4601f4df..HEAD` (181 commits, 663 files), focused on the new code landed since the prior final review (`reviews/final-review-2026-06-13.md`), the deferred-ledger re-evaluation, and continued spec FR/NFR coverage. Per-phase defects already closed in p01–p07 reviews and items already dispositioned in the 2026-06-13 final review were not re-litigated.
**Files reviewed:** the seven new commits since the prior final review (concentrated in `packages/api` move hot path / auth / limiter and `apps/web` game UI), plus the affected cross-cutting seams in `packages/api`, `packages/game-logic`, and `apps/web`, and all project artifacts.
**Commits:** 181 in range (8 new since 2026-06-13: `feb38c8`, `87d84d3`, `96c9148`, `acbdec9`, `8afd6a3`, `b36afa6`, `13fba71`, plus bookkeeping).

## Summary

The web-mvp remains a complete, server-authoritative multiplayer Sequence implementation that holds up under integration scrutiny: `game-logic` stays framework-free as the single rules contract, hand/deck privacy (NFR1) is enforced uniformly at the subscription edge, the seat-authorization chain derives identity server-side, and optimistic concurrency is enforced atomically. All 387 tests pass (59 files, against the live Neon test branch); typecheck, lint (warnings only, pre-existing), and format are green. The new commits since the prior final review are predominantly clean and well-tested — the auth-error UX fix, lifecycle version-guard, concede-result preservation, card-art fix, and XFF-spoofing hardening are sound and carry regression tests.

The one area warranting attention is the NFR2 move hot-path optimization (`8afd6a3`): it introduces a raw-SQL CTE whose final `INSERT … RETURNING` has no `ORDER BY` yet the code pairs returned rows with the source `events[]` by array index (an Important latent-correctness concern on the busiest path), and it forks the move route off `gamePlayerProcedure` into a hand-rolled `resolveMoveSeat` copy of the authorization logic that has no FORBIDDEN/guest/local test coverage on the move path (a Medium maintainability + test-gap concern). The previously-deferred Medium (unbounded session-user cache) is unchanged and is re-dispositioned as accept-defer. The previously-deferred Minor (physical-phone smoke) is re-confirmed accept-defer.

**Overall recommendation: PASS with two follow-ups recommended (one Important, one Medium). No release blocker; both are safe fast-follows given MVP scale and the deliberate single-instance deploy.**

## Findings

### Critical

None

### Important

- **Move hot-path broadcast pairs `RETURNING` rows with source events by array index, relying on undocumented Postgres ordering** (`packages/api/src/game/state-mapping.ts:558-571`, consumed at `packages/api/src/game/move-engine.ts:248-264`)
  - Issue: `persistGameStateAndAppendEvents` builds the appended-events result with `rows.map((row, index) => ({ seq: row.seq, …, payload: events[index]! }))`. The `rows` come from a single `INSERT INTO game_events … SELECT … RETURNING seq, type, actor_seat` with **no `ORDER BY`**. PostgreSQL does not guarantee that `RETURNING` rows are returned in the order of the source `SELECT`/`VALUES`. If the engine returns more than one row in a non-source order (a single move commonly emits ChipPlaced + CardDrawn + TurnAdvanced, and a sequence move adds SequenceCompleted/GameWon), the code pairs `row.seq` (e.g. the seq computed for `ord=2`) with `events[index]` (the first event's payload). The broadcast loop then publishes that event's `payload` under the wrong `seq`. Because `seq` is the `tracked()` subscription resume cursor, a mispaired `seq`↔payload can corrupt gap-replay ordering and the per-game event identity for a reconnecting client. This is the production hot path (`game.makeMove`) — the most-exercised write in the system. The generic `appendEvents` path used elsewhere (concede/save/lobby) does not have this issue because it assigns `seq` in JS in the same order it maps payloads (`state-mapping.ts:470-490`).
  - Fix: make the pairing order-independent. Either add `order by seq` to the final `RETURNING`-producing select and continue to pair by position, or (cleaner) drop the dependence on returned-row order entirely by computing each event's `seq = base + ord` deterministically in JS (you already control `ord` = `index + 1`) and use the returned rows only to confirm the row count / conflict, mapping `seq`/`payload`/`actorSeat` straight from the source `events[]` array. The latter removes the reliance on Postgres ordering semantics on the busiest path.
  - Requirement: FR6 (real-time sync — `tracked()` seq cursor correctness), NFR2 (the optimization that introduced this).

### Medium

- **`resolveMoveSeat` duplicates the `gamePlayerProcedure` authorization chain on the move route with no FORBIDDEN/guest/local test coverage for the move path** (`packages/api/src/game/routes/make-move.ts:99-125`)
  - Issue: `8afd6a3` changed `makeMoveRoute` from `gamePlayerProcedure` to `publicProcedure` and inlined a `resolveMoveSeat` that re-implements the seat-resolution chain (local-creator → registered user → guest token + hash) so the route can authorize from the same joined load that builds `GameState` (an NFR2 round-trip reduction). I verified line-by-line that `resolveMoveSeat` faithfully mirrors `resolveSeat` in `packages/api/src/trpc.ts:291-352` — same resolution order, same guest verify+hash match, same local-creator currentSeat-or-lowest fallback — so there is no correctness/security divergence today. The concern is twofold: (1) this is now a **second copy** of the most security-sensitive authorization logic in the codebase that must be kept in sync with `trpc.ts` by hand; a future change to one is easy to miss in the other. (2) The canonical chain is covered by `trpc-game-middleware.test.ts` (7 tests incl. FORBIDDEN-for-non-participant, guest-hash-mismatch, malformed-cookie→FORBIDDEN, local-creator-both-seats), but the **make-move copy** is only exercised on the registered-user branch by the existing `make-move.test.ts` (legal move + out-of-turn joiner). There is no test asserting `makeMove` returns FORBIDDEN for a non-participant cookie, nor that the guest-token and local-creator branches authorize correctly through the rewritten public-procedure route.
  - Fix: prefer extracting the seat-resolution logic into a single shared helper consumed by both `gamePlayerProcedure` (taking a fresh load) and the move hot path (taking the preloaded `LoadedGameState`), eliminating the duplication. At minimum, add make-move integration tests for the FORBIDDEN-non-participant, guest, and local-creator branches so a future drift in the copy is caught. Low effort; not a release blocker because the copy is currently faithful and the user path is covered.
  - Requirement: NFR1 (authorization integrity), NFR5 (authz rejections).

- **Unbounded session-user cache map (carried deferred Medium — unchanged)** (`packages/api/src/trpc.ts:69-109`, cleared at `packages/api/src/server.ts` on auth mutations)
  - Issue: `sessionUserCache` is a process-global `Map` keyed on the full `Cookie` header string with a 10s TTL. Entries are evicted lazily only on the next lookup of that exact cookie or wholesale via `clearSessionUserCache` on any auth mutation. A stream of distinct cookies on `/trpc` requests (e.g. rotated/garbage cookies) is never proactively swept, so the map can grow between auth mutations on the long-lived single instance. Correctness and privacy are fine (short TTL; logout/revocation clears the whole map), so this is a slow-leak maintainability concern, not a security/correctness defect. The code is unchanged since the 2026-06-13 final review flagged it. Notably, the sibling rate-limit map in `rate-limit-middleware.ts:73-80` does opportunistically sweep drained keys — the same pattern would bound this cache.
  - Fix: bound the cache (cap entry count with FIFO/LRU eviction, or sweep expired entries opportunistically on write, mirroring the limiter's sweep). Low effort; safe to defer to a fast-follow given MVP traffic and the deliberate single-instance deploy.
  - Disposition: **accept-defer** (re-confirmed). See ledger table.

### Minor

- **Physical-phone mobile smoke unperformed (carried deferred Minor)** (`.oat/projects/shared/web-mvp/handoff.md`)
  - Issue: the production 375px pass used an automated Pixel 5 / 375px viewport, not a real device. NFR3's written acceptance criterion is "complete game playable on a ~375px-wide viewport without horizontal scrolling" (`spec.md:201`, `spec.md:205`), which the automated pass satisfies; the Playwright suite additionally exercises a mobile-375 project (`apps/web/e2e/pass-and-play.spec.ts`). The recent `feb38c8` card-art fix (board sizing via `min(92vw, 680px, max(320px, calc(100dvh - 25rem)))` and `object-contain`) further improved small-viewport fit but was itself verified by deploy observation, not a physical-device pass.
  - Suggestion: **Accept-defer.** The written NFR3 criterion is met; run one physical-device smoke before broad operator playtesting and append the result to `handoff.md`. Re-confirms the prior disposition; not a release blocker.

- **Anonymous invite traffic shares a single global rate-limit bucket (deliberate, documented)** (`packages/api/src/game/game.router.ts:33-41`)
  - Issue: `b36afa6` set production `TRUST_PROXY=false` (Railway was observed forwarding spoofable XFF) and changed `joinPreviewLimiter` so all unauthenticated `preview`/`join` callers share `'anonymous:join-preview'` (authenticated callers still key by user id). This correctly prevents an attacker from rotating forged XFF to evade the limit, but it means one noisy anonymous client can exhaust the shared 30/min budget for all anonymous invite traffic (a self-DoS surface on the public join path). The tradeoff is explicitly documented in the code comment and is the safer of the two failure modes (throttling > enumeration bypass) at friend-group scale.
  - Suggestion: leave as-is for MVP; the comment captures the rationale. If anonymous join volume ever grows, revisit keying on a trusted edge identifier once the proxy topology is verified to overwrite (not append) client XFF.

## Cross-Cutting / Integration Assessment

Verified end-to-end for the new code, with prior-review seams re-confirmed unchanged:

- **NFR1 privacy preserved through the new hot path:** `executeMoveFromLoadedState` loads all hands via `loadGameStateWithPlayers` but broadcasts through the same `rooms.publish` → per-recipient `redactEvent` seam as the original `executeMove` (`move-engine.ts:209-268`); the redaction allowlist and own-hand-only snapshot in `shared/realtime/redaction.ts` are untouched. The new load assembling `GameState` from a joined query stays server-side; only redacted events leave.
- **Optimistic concurrency intact on the new CTE:** `persistGameStateAndAppendEvents` guards `update games … where id = … and version = prevVersion`; on a lost race the `updated_game` CTE returns 0 rows, which cascades to 0 inserted events (the insert `SELECT`s `from event_values, current_seq, updated_game`), and the empty `rows` triggers `VersionConflictError` → `CONFLICT` (`state-mapping.ts:534-561`). The `make-move.test.ts` concurrent-double-submit race test passes against the live branch.
- **Lifecycle version-guard correctness (`96c9148`):** concede/save-and-exit now take a client `version` and feed it to `persistLifecycleTransition`; a racing move that bumped the version makes the transition lose cleanly as CONFLICT (`concede.ts:64-88`, `save-and-exit.ts`). The web client passes `state.version` (`page.tsx`). Regression-tested in `lifecycle.test.ts`.
- **Auth-error initial-load UX (`87d84d3`):** a pre-snapshot `onGameEvent` UNAUTHORIZED/FORBIDDEN now renders an actionable "Game unavailable" state with login/dashboard actions instead of an indefinite loading + generic banner; `showOverlay && !showInitialLoadError` correctly suppresses the connection banner on the hard-error path. Regression-tested in `page.test.tsx`.
- **Authorization chain (canonical):** `trpc-game-middleware.test.ts` (7 tests) confirms `gamePlayerProcedure` resolves user/guest/local-creator seats and returns FORBIDDEN (not 500) for non-participants and malformed cookies — all green. (The move-route copy is the subject of the Medium finding above.)
- **NFR5 secret hygiene:** no secrets tracked — `.env` is gitignored and not in the index; `.env.example` uses placeholders (`BETTER_AUTH_SECRET=change-me`, empty token fields). The legacy committed GCP key remains removed from the tree (operator must still revoke in GCP — known handoff item).

## Deferred Findings Ledger — Disposition

| Ledger item | Disposition | Rationale |
| ----------- | ----------- | --------- |
| **[Medium]** Session-cache introduced for NFR2 move latency is unbounded/maintainability concern (`trpc.ts` recent-session lookup cache) — source `reviews/final-review-2026-06-13.md`. Re-evaluate whether now bounded/acceptable. | **Accept-defer** (re-confirmed) | The cache is **unchanged** since the prior review — still keyed on the full cookie string with a 10s TTL and lazy/wholesale eviction; not bounded. It remains a correctness/privacy-safe slow-leak on the single always-on Railway instance, not a defect. Re-filed as a Medium follow-up above with a concrete bounding fix (mirror the limiter's opportunistic sweep). Not a release blocker at MVP scale. |
| **[Minor]** Physical-phone mobile smoke unperformed (automated Pixel 5 / 375px used). Prior disposition: accept-defer. Confirm still acceptable. | **Accept-defer** (re-confirmed) | NFR3's written acceptance criterion (playable at ~375px, no horizontal scroll) is satisfied by the automated viewport pass and the Playwright mobile-375 project; the new `feb38c8` card-art/board-sizing fix further improves small-viewport fit. Carried as a Minor caveat; run a physical-device smoke before broad playtesting and append to `handoff.md`. Matches prior disposition. |

## Requirements/Design Alignment

**Evidence sources used:** `spec.md`, `design.md`, `plan.md`, `implementation.md`, `reviews/final-review-2026-06-13.md`, the seven prior phase reviews, the git range `e50e6a6..HEAD` (focused on the 8 new commits), the full test run (387/387 green), and non-mutating local gates (typecheck/lint/format).

### Requirements Coverage

All FR/NFR coverage from the 2026-06-13 final review remains in effect (re-verified at the seam level, not re-litigated task-by-task). Deltas from the new code:

| Requirement | Status | Notes (new-code delta) |
| ----------- | ------ | ----- |
| FR6 Real-time sync & reconnect | implemented (see Important) | Snapshot-first + gap replay unchanged; the new move-hot-path CTE introduces the `RETURNING`-order seq-pairing concern (Important) on the broadcast cursor — latent, not yet observed. |
| FR11 Concede | implemented | `13fba71` preserves the conceded result into GameOver; `96c9148` version-guards the concede transition. Both tested. |
| FR13 In-game info display | implemented | `feb38c8` `object-cover`→`object-contain` prevents card-art cropping on board/hand/rail; board max-width now adapts to dynamic viewport height. |
| NFR1 Server-authoritative integrity | implemented (see Medium) | Privacy/redaction seam unchanged through the new hot path; move-route authz now duplicated (Medium test-gap) but currently faithful. |
| NFR2 Real-time responsiveness (<500ms) | implemented | Move hot path collapsed to one joined load + one atomic write CTE; prior review recorded post-fix server timing well under target. The CTE carries the Important seq-pairing concern. |
| NFR3 Responsive design (375px) | implemented (caveat) | Automated 375px + Playwright mobile-375 satisfy the written criterion; `feb38c8` improves fit; physical-phone smoke deferred (Minor). |
| NFR5 Security hygiene | implemented | `b36afa6` hardens against forged-XFF rate-limit evasion (TRUST_PROXY default off; anonymous shared bucket — Minor tradeoff). No secrets tracked. |

### Design Alignment

The new code stays within the design contract. The move hot path is a permitted optimization — design §Performance explicitly allows raw SQL on hot paths and §Data Flow describes "persist changed fields + append events (same transaction, version guard)"; the single-statement CTE satisfies the version-guard-and-atomicity intent. The one design-relevant nuance is that `executeMoveFromLoadedState` performs the joined load **outside** any explicit transaction and relies on the single write-CTE for atomicity (the original `executeMove` wrapped load+write in one `db.transaction`). This is correct because the version guard lives in the write and a stale read only yields CONFLICT — no artifact change required. No design drift requiring a code change was found beyond the findings above.

### Extra Work (not in declared requirements)

None significant. All new commits map to NFR2 (hot path, session cache), NFR3/FR13 (card art), NFR5 (XFF hardening), FR6/FR11 (auth-error UX, lifecycle version guard, concede result).

## Verification Commands

Commands run during this review (all green / non-mutating):

```bash
git log --oneline e50e6a6..HEAD                 # 181 commits (8 new since 2026-06-13)
git show --stat feb38c8 87d84d3 96c9148 acbdec9 8afd6a3 b36afa6 13fba71
pnpm typecheck                                  # 3 packages — Done
pnpm lint                                       # oxlint — warnings only (pre-existing)
pnpm format:check                               # all 192 files formatted
set -a && . ./.env && set +a && pnpm test       # 59 files / 387 tests passed (Neon test branch)
git ls-files | grep -iE '\.env$|service.*key|secret'   # no tracked secrets (only .env.example)
git ls-files --error-unmatch .env               # .env not tracked
```

To re-run the targeted suites:

```bash
pnpm --filter @sequence/api exec vitest run src/game/routes/make-move.test.ts
pnpm --filter @sequence/api exec vitest run src/trpc-game-middleware.test.ts
pnpm --filter @sequence/web exec playwright test
```

## Recommended Next Step

Mark the `final` review row in `plan.md` for 2026-06-21 and proceed to the configured final HiLL checkpoint / PR-final workflow. File the Important (move hot-path `RETURNING`-order seq pairing) as a fast-follow before heavier real-time use, and the Medium follow-ups (shared/tested move-route authz; bound the session cache) via `oat-project-review-receive`. The two carried ledger items are re-dispositioned accept-defer. Run the `oat-project-review-receive` skill to convert findings into plan tasks.
