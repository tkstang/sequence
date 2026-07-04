---
oat_generated: true
oat_generated_at: 2026-07-04
oat_review_scope: p01-p12
oat_review_type: code
oat_review_invocation: manual
oat_project: .oat/projects/shared/mobile-mvp
---

# Code Review: p01-p12 (cf9af46..HEAD)

**Reviewed:** 2026-07-04
**Scope:** Full mobile-mvp implementation, phases 1-12 (p12 in progress; p12-t01 operator preflight blocked — not flagged)
**Files reviewed:** 252 files changed across 202 commits (apps/mobile 183, apps/web 21, packages/api 11, packages/client-state 9, packages/design-tokens 7, docs/root gate files)
**Commits:** cf9af46..HEAD (202)

## Summary

The implementation is in strong shape: all 24 in-scope requirements (FR18 excluded as in-progress) have working, tested code; the realtime timing contract matches design exactly; hand privacy, drag semantics, spotlight gating, and the violation catalog are all verified at the code level; and every root gate passes on this checkout (typecheck, lint, format, Vitest 63 files/411 tests including DB-backed API suites via `packages/api/.env`, mobile Jest 49 suites/299 tests). No critical defects were found. The most significant issues are: (1) the p11-t01 API presence-tracker rewrite is a real behavioral API change that exceeds the declared "additive-only" constraint and is missing from the Deviations table, and (2) a guest-credential staleness chain in the shared WebSocket connection that can permanently delete a valid guest token — an edge-case but destructive failure mode for FR2's durable guest identity.

Findings: 0 critical, 3 important, 4 medium, 2 minor

**Artifacts used:** spec.md, design.md, plan.md, implementation.md (including the Deviations from Plan / Design table, 16 rows), discovery.md, and direct code/git evidence throughout.

## Findings

### Critical

None

### Important

- **Unrecorded API constraint deviation: presence tracker rewrite (p11-t01)** (`packages/api/src/game/presence.ts:42-270`)
  - Issue: spec.md Constraints ("API changes are limited to additive auth/config surface for native clients") and design.md ("No other route, schema, or persistence changes") declare the API surface additive-only, but p11-t01 (commit `fcfc1f9`) rewrote presence tracking: per-seat subscription refcounting, local-game presence now marks/clears **all** seats via `playerPresenceWhere` (`presence.ts:248-253`), pre-freeze and post-freeze reconnect-race handling with extra DB reads/writes, and `on-game-event.ts:68` now **awaits** `presence.onConnect` before the first snapshot (with `server.ts:204-206` returning the promise). This changes observable behavior for existing web clients too (e.g., local-game freeze semantics, snapshot ordering). The change is defensible — it fixes real races found during NFR2 verification and is well-tested (`presence.test.ts`, 126 new lines) — but it is documented only in p11-t01 task notes, not in the Deviations from Plan / Design table, and the spec/design constraint language now conflicts with shipped reality.
  - Fix: Artifact alignment, not a code change. Add a Deviations table row for p11-t01 (source artifacts: spec.md Constraints, design.md "API server changes — additive only"; source of truth: `packages/api/src/game/presence.ts` + `presence.test.ts`), and align the spec/design constraint wording to "additive auth/config surface plus presence-correctness fixes required by NFR2".
  - Requirement: NFR2 (motivating), spec Constraints (violated as written)

- **Guest WS credential staleness across games can permanently delete a valid guest token** (`apps/mobile/src/api/ws.ts:122-128`, `apps/mobile/src/realtime/use-game-stream.ts:124-131`)
  - Issue: The Cookie header is captured once per WebSocket **connection** (at upgrade, from `getActiveGameCookieGameId()`), but the wsClient is a lazy singleton that keeps a connection alive for 30s after the last subscription (`timing.ts:12-15`) and reuses it for the next one. A guest who moves between two guest games (continue-list with 2 entries, or lingering on game A's GameOver stream then joining game B) can have game B's subscription ride a connection whose upgrade carried only game A's `sequence_guest` cookie. The server then answers `FORBIDDEN`, and `onError` in `use-game-stream.ts:128-130` treats FORBIDDEN as authoritative and calls `removeGuestGame(gameId)` — deleting game B's SecureStore token and registry entry, permanently locking the guest out of a game they legitimately joined (FR2's durable identity).
  - Fix: Two layers. (a) Ensure the WS connection carries the right credential: force a wsClient reconnect when the active game id changes (e.g., have `setActiveGameCookieGameId` close the idle wsClient when the id differs), or switch guest WS auth to `connectionParams` — the documented design fallback (design.md, tRPC client Design Decisions). (b) Make the destructive cleanup conservative: before `removeGuestGame` on a subscription-level FORBIDDEN, confirm via an HTTP call (which assembles the per-game cookie correctly per request in `client.ts:47-60`) that the guest identity is genuinely rejected.
  - Requirement: FR2, NFR2

- **Design/spec artifacts still describe RSD `html.*` chrome; shipped chrome is native-backed** (`design.md` "App chrome (RSD screens + components)"; `spec.md` Constraints "Styling follows the hybrid direction... React Strict DOM + shared StyleX-compatible tokens for app chrome")
  - Issue: The chrome kit and all chrome screens are plain React Native primitives styled from the shared palette via `useTheme()` (e.g., `apps/mobile/src/components/Button.tsx`, `src/app/join/[code].tsx`). This deviation **is** recorded and user-approved (Deviations rows p03-t07/p03-t08, "native-backed while preserving public APIs"), so this is not a code defect — but design.md's Component Design/Architecture sections and the spec Constraints bullet remain unaligned, which will mislead future contributors and the final review.
  - Fix: Artifact alignment before closeout: update design.md chrome sections and the spec Constraints bullet to the native-backed chrome + shared-tokens reality, keeping the deviation rows as provenance.
  - Requirement: FR16 (adjacent), spec Constraints

### Medium

- **Inactivity-watchdog hard ceiling does not hold in non-live states** (`apps/mobile/src/realtime/lifecycle.ts:103-137`)
  - Issue: design.md's timing contract specifies an "inactivity watchdog hard ceiling ~15s before forced teardown + resubscribe." As shipped, `scheduleWatchdog` is armed only by `markLive` (`lifecycle.ts:103-106`), and `markConnecting`/`markReconnecting`/`markError` all `clearWatchdog()` without re-arming (`:126-137`). After a transport-level `connecting`/`idle` transition, recovery depends entirely on wsLink's internal retry or the next AppState change — if a reconnect stalls or a subscription completes without error ('transport-idle'), the screen can sit in `reconnecting` indefinitely with no forced resubscribe. The p07-t09 quiet-live fix itself is sound (dead sockets are still caught: keepAlive 5s/2s flips transport state, and a silent socket death leaves the last watchdog armed → fires ≤15s → resubscribe), but the ceiling is no longer universal.
  - Fix: Re-arm the watchdog in `markConnecting`/`markReconnecting` (not just `markLive`) so every non-live state has a bounded forced-resubscribe path; keep the quiet-live reschedule branch as is.
  - Requirement: NFR2

- **No freshness guard for generated web StyleX token files** (`packages/design-tokens/scripts/write-web-stylex.ts:59-105`)
  - Issue: The accepted p03-t02 deviation makes `apps/web/src/styles/{tokens,themes}.stylex.ts` generated artifacts, but nothing detects a stale generation: editing `palette.ts`/`dimensions.ts` without running `generate:web-stylex` silently forks web from mobile — exactly the drift FR16 exists to prevent. Verified today that values are currently in sync, but the generator's raw output is not oxfmt-stable (regenerating produces a formatting-only diff), so even a naive `generate && git diff --exit-code` check would false-positive.
  - Fix: Make the generator emit format-stable output (run `oxfmt` on the two files at the end of the script), then add a gate check — either a design-tokens Vitest that regenerates to a temp dir and diffs against `apps/web/src/styles`, or a CI/root-gate step running `generate:web-stylex && git diff --exit-code apps/web/src/styles`.
  - Requirement: FR16

- **AuthedWebSocket close-before-open race leaks an untracked socket** (`apps/mobile/src/api/ws.ts:48-50,110-112,122-136`)
  - Issue: The constructor kicks off `open()` asynchronously (SecureStore cookie reads), and `close()` is `this.socket?.close(...)` — a no-op while the inner socket doesn't exist yet. If the wsClient closes the wrapper during that async gap (retry churn, lazy close), the inner socket is still created afterwards, connects authenticated, and is never closed by the client. Narrow window, but reconnect loops are precisely when it can fire, and the result is a zombie authenticated connection the client no longer controls.
  - Fix: Record a pending close (code/reason) in `close()` when `this.socket === null`; in `open()`, if a close was requested, close the freshly created socket immediately (or skip creating it) instead of attaching it.
  - Requirement: NFR2, NFR4 (hygiene)

- **FR12 acceptance criterion "rematch navigates all connected players" is unmet for non-initiators** (`packages/api/src/game/routes/rematch.ts:21-103`, `apps/mobile/src/app/game/[id].tsx:555-563`)
  - Issue: `game.rematch` publishes no event on the old game's stream and the snapshot carries no rematch pointer, so only the initiating client navigates (`router.replace` on mutation success). Other connected players stay on GameOver with no signal and must find the new lobby via the dashboard. This exactly matches web behavior (`apps/web/src/app/game/[id]/page.tsx:450` is the only navigation), so mobile meets its parity bar ("Outcome screen matches web semantics") — the spec's second FR12 criterion overstates what web ever did, and implementing it would require a new API event, which the additive-only constraint precluded.
  - Fix: Artifact alignment: reword the FR12 acceptance criterion to parity semantics (initiator navigates; others reach the new game via dashboard), or record an explicit deferral plus a backlog item for a rematch stream event (server + both clients).
  - Requirement: FR12

### Minor

- **Vestigial React Strict DOM layer: `vars.css.ts` has no consumers** (`apps/mobile/src/theme/vars.css.ts:1-88`, `apps/mobile/babel.config.js:37`, `apps/mobile/package.json:46`)
  - Issue: After the native-backed chrome deviation, nothing imports `vars.css.ts`'s `color` export; the `react-strict-dom` dependency (pinned 0.0.55) and its babel preset are retained solely for this dead file. Harmless at runtime (unimported → not bundled) but misleading and adds transform overhead.
  - Suggestion: Remove `vars.css.ts`, the `react-strict-dom` dependency, and the babel preset entry — or, if RSD is deliberately kept as a re-evaluation hook (per the p03-t08 deviation's follow-up), record that intent in a comment/README so the next audit doesn't re-flag it.

- **Mobile styles hardcode spacing/typography instead of consuming design-tokens dimension groups** (`apps/mobile/src/components/Button.tsx:66-103` and pattern-wide, e.g. `src/app/game/[id].tsx:806-925`)
  - Issue: Mobile consumes `palette` from `@sequence/design-tokens`, but `space`/`radius`/`fontSize`/`fontWeight`/`lineHeight` are consumed only by the generated web files; every mobile component hardcodes numeric equivalents. FR16's verified criterion (palette propagation) holds, but non-color tokens can drift cross-platform with no single-edit path.
  - Suggestion: Add a small native dimension mapping (px-string → number) exported from the theme layer and migrate component styles opportunistically; or record dimensions as web-only in the tokens README to bound expectations.

## Requirements/Design Alignment

**Evidence sources used:** spec.md (Requirement Index + acceptance criteria), design.md (component design, timing contract, Requirement-to-Test Mapping), plan.md (task verifications), implementation.md (task notes, Deviations table, Test Results), plus direct reads of the code and test suites cited below, and gate execution on this checkout.

### Requirements Coverage

| Requirement | Status | Notes |
| --- | --- | --- |
| FR1 | implemented | Better Auth expo client + SecureStore-only storage (`auth/client.ts:14-31`); cookie-header transport with `credentials:'omit'` (`api/client.ts:47-60`); protected routing (`app/_layout.tsx:27-43`); p04-t06 force-quit/relaunch scenario evidence; auth suites pass |
| FR2 | implemented | Preview→guest join with `returnGuestToken` (`app/join/[code].tsx:89-122`); SecureStore token + AsyncStorage registry (`auth/guest-store.ts`); login continue-list (`app/(auth)/login.tsx:43,149-170`); deep link `sequence://join/<code>` → preview only; registry cleanup on finished/NOT_FOUND/FORBIDDEN (`use-game-stream.ts:124-174`). Edge-case token-deletion risk = finding I2 |
| FR3 | implemented | Dashboard resumables/recents with status badges + per-status navigation (`features/dashboard/GameCard.tsx`); 13 dashboard tests |
| FR4 | implemented | CreateForm covers counts/mode/timer/local; remote→lobby, local→active (p06-t03 + tests) |
| FR5 | implemented | LobbyTeams: self/creator team set, kick, randomize, start gating, native `Share` (`game/LobbyTeams.tsx:114-116`); p06-t08 two-client live evidence |
| FR6 | implemented | Board/hand/rail render from `GameSnapshotView`; spotlight **only** on card selection (`GameBoard/spotlight.ts:16-36`, cleared in drag mode `app/game/[id].tsx:211-219`); version-guarded submits with no optimistic writes (`use-move-submit.ts:147-182`); stale 409 + jack plays + win verified live (p07-t09, p50 6.1ms) |
| FR7 | implemented | Reanimated/gesture-handler UI-thread drag; no pre-highlighting (hover-confirm only, `drag/DragLayer.tsx:51-65`); drag submit omits `card` (`app/game/[id].tsx:281-292`); illegal drops → violation feedback; p08-t06 hard-mode live pass |
| FR8 | implemented | SequenceChoiceSheet incl. chained choices (p08-t03/p08-t06 seeded proof); dead-card turn-in once/turn enforced server-side, `not-a-dead-card` rejection surfaced (`DeadCardControls.tsx:84-117`); auto-swap toast per event seq (`:119-128`) |
| FR9 | implemented | TimerBadge renders server deadline with local tick + re-sync on deadline/remaining change (`PlayerRail/TimerBadge.tsx:34-61`); paused uses `turnRemainingMs`; server forfeit arrives via events (p07-t09) |
| FR10 | implemented | Save & exit / concede versioned mutations (`app/game/[id].tsx:244-260`); frozen board visible-but-disabled, resume restores play; expiry copy (`SavedGameView`); p09-t07 API+mobile matrix (15+36 tests) |
| FR11 | implemented | Handoff veil removes hand dock and both hands from the render tree until confirm (`HandoffScreen.tsx:16-26`; `GameRouteScreen.test.tsx:471-521`); local resume starts behind the veil; aggregates exclusion is server-side (existing suites) |
| FR12 | partial | Outcome matrix (win/loss/concede/FFA/timer-expired) + initiator rematch navigation implemented and tested; "navigates all connected players" unmet for non-initiators — matches web parity; see finding M4 (spec alignment or deferral) |
| FR13 | implemented | Record/list/head-to-head + nextCursor pagination + local badge (`features/history/`); p10-t07 seeded simulator proof |
| FR14 | implemented | Turn/event notifications with initial-view suppression + haptics (`game/feedback/turn-notifications.ts`, route effect `app/game/[id].tsx:692-716`); catalog is compile-time-complete over all 13 `RuleViolation` codes (`client-state/src/violation-messages.ts:5-19` typed `Record<RuleViolationCode, string>`); 53 feedback tests |
| FR15 | implemented | System tracking via `Appearance` listener; manual override persisted (`sequence-theme` AsyncStorage) and applied via `setColorScheme` (`theme/theme-provider.tsx:32-66`); p10-t06 both-theme screenshot pass incl. relaunch persistence |
| FR16 | implemented | Single framework-free source (`packages/design-tokens`); web files generated (accepted deviation) and verified value-identical today; both-theme key parity compile-enforced + tested; scratch-token propagation proven (p03-t08). Gaps: no automated freshness guard (M2), native dimension tokens unused (m2) |
| FR17 | implemented | `.mcp.json` (argent + expo), `expo-mcp` dev dep, `apps/mobile/AGENTS.md` loop + testID convention; p02-t05 demo executed (Expo MCP screenshot/find/logs + Argent tap — approved deviation); dev tooling excluded from release (NFR4 evidence) |
| FR18 | partial | Phase 12 in progress by design (p12-t01 operator preflight blocked); not a finding |
| FR19 | implemented | `docs/mobile-operator-runbook.md` Sections 0-7 with Why/When/Prereqs/Steps/Verify/Troubleshooting + required/optional labels; p11-t05 structural audit passed |
| NFR1 | implemented | Redaction remains server-side (existing suites); mobile view holds only own hand — p11-t03 live remote-game store proof; handoff veil tested at tree level |
| NFR2 | implemented | Timing contract constants exactly match design (5s/2s keepAlive, 250ms→5s backoff, 15s watchdog — `realtime/timing.ts`); `lastEventId` resume + replay-window snapshot fallback proven; measured matrix within contract (restart 4391ms, foreground 1830ms, force-quit 2743ms). Residual edges: M1 (watchdog re-arm), I2 (guest WS staleness) |
| NFR3 | implemented | Instant submitting-state + haptic, no board mutation (`use-move-submit.ts`); round-trip logging with p50 (6.1ms local); p11-t02 profiler pass (no per-frame React work in drag, no BoardCell hot commits) |
| NFR4 | implemented | SecureStore-only credentials; prod config fails closed without https/wss (`app.config.ts:6-30`); dev routes excluded from prod bundle via Metro router-context override (`metro.config.js:19-35`, `src/router/ctx-production.js`) — Hermes strings audit clean; production console stripped (`babel.config.js:1-30`, applies to node_modules under Metro); no guest-token logging found |
| NFR5 | implemented | `testId()` helper + `screen.element[.qualifier]` convention documented in AGENTS.md; p10-t05 selector audit — all flows driven by testID/a11y queries with no coordinate fallback |
| NFR6 | implemented | Root gates cover mobile (`scripts/run-tests.mjs` runs Vitest workspace + mobile Jest); **re-verified on this checkout**: all gates pass (see Verification Commands) |
| NFR7 | implemented | Phases 1-11 executed agent-only (verified by evidence trail); operator steps consolidated in Phase 12 + runbook; only optional pre-P12 touchpoint is Expo MCP remote OAuth |

### Extra Work (not in declared requirements)

- `packages/api` presence tracker rewrite (p11-t01) — motivated by NFR2 but exceeds the declared additive-only API surface; see finding I1 (recording/alignment, not removal).
- `apps/web/playwright.config.ts` → `playwright.config.cjs` — gate infrastructure for the Vitest workspace split; behavior-preserving, in support of NFR6. Acceptable.
- No other unmapped work found; `/dev` playground, debug stream screen, and doc updates are all designed deliverables. `packages/game-logic` has **zero changes** in range (verified: empty diff).

## Verification Commands

Run these to verify the implementation (all executed during this review on this checkout; all passed):

```bash
git diff --stat cf9af46..HEAD -- packages/game-logic   # must be empty
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test   # Vitest 63 files/411 tests (DB-backed API suites ran via packages/api/.env fallback) + mobile Jest 49 suites/299 tests
pnpm --filter @sequence/design-tokens generate:web-stylex && git diff -- apps/web/src/styles   # currently formatting-only diff → values in sync; see finding M2, then git checkout -- apps/web/src/styles
```

Note: `pnpm build` and `pnpm --filter @sequence/web e2e` were not run in this review session; p11-t04 records both green from a clean shell.

## Recommended Next Step

Run the `oat-project-review-receive` skill to convert findings into plan tasks.
