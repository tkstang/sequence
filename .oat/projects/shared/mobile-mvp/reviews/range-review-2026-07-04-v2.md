---
oat_generated: true
oat_generated_at: 2026-07-04
oat_review_scope: p01-p12
oat_review_type: code
oat_review_invocation: manual
oat_project: .oat/projects/shared/mobile-mvp
---

# Code Review: p01-p12 re-review (fix commits 8842f81..83140fc)

**Reviewed:** 2026-07-04
**Scope:** Re-review of the 9 review-fix tasks (p12-t07..p12-t15) from the prior p01-p12 range review; fix commits only plus blast radius
**Files reviewed:** 31 files across 5 commits (apps/mobile 15, packages/api 4, packages/design-tokens 5, docs 3, project artifacts 4)
**Commits:** 8842f81..83140fc (d1c7855, 00143fa, 757c074, 920ba50, 83140fc); bookkeeping commit 8202e54 consulted for the finalized Deviations rows

## Summary

All nine prior findings (I1, I2, I3, M1, M2, M3, M4, m1, m2) are **resolved**, with the fix mechanisms matching the prior review's guidance: the guest WS credential fix closes authed sockets on active-game change *and* makes FORBIDDEN cleanup non-destructive behind an HTTP `game.access` confirmation; the watchdog now re-arms in every non-live state (and after firing) while preserving the p07-t09 quiet-live reschedule; the close-before-open race aborts socket creation; the StyleX freshness guard is format-stable (oxfmt in the generator), runs in the root `pnpm test` gate, and was verified to fail on injected drift; the RSD layer is fully excised with no dangling references; and mobile chrome dimensions now flow through `native-tokens.ts` with a unit-mapping test. All scoped suites pass on this checkout (mobile Jest 33 + 27 tests, design-tokens Vitest 3, DB-backed `game.access` integration 3, mobile typecheck). Two new minor issues were introduced by the fixes: the p12-t15 typography consolidation changed two shipped values (TextField inputs are now bold; ConnectionBanner title grew 15→16), and the new `game.access` API route is not recorded in the just-realigned spec/design API-surface enumeration.

Findings: 0 critical, 0 important, 0 medium, 2 minor

**Artifacts used:** prior review (`reviews/archived/range-review-2026-07-04.md`), spec.md, design.md, plan.md (fix-task definitions p12-t07..t15), implementation.md (fix-completion notes, Deviations table, Test Results), plus direct code/git/test evidence cited below. Working-tree p12-t01 operator changes were out of scope and ignored; all code evidence read at/through commit 83140fc.

## Per-Prior-Finding Resolution

| Prior finding | Fix task | Commit | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| I1 — unrecorded presence-tracker API deviation | p12-t07 | d1c7855 | **resolved** | spec.md scope/Constraints/solution wording now reads "additive auth/config surface plus presence-correctness fixes required by NFR2" (spec.md:43-48, 399-402, 466-470); design.md section retitled "API server changes — native support + presence correctness" with the narrowed-constraint decision recorded (design.md:260-296); durable Deviations row `p01-p12/I1` present at 83140fc (implementation.md Deviations table) and finalized with commit hash in 8202e54 |
| I2 — guest WS credential staleness → destructive removeGuestGame | p12-t08 | 00143fa | **resolved** | Layer (a): `closeAuthedWebSocketsForCredentialChange()` (`apps/mobile/src/api/ws.ts:46-50`, `:143-145`) closes all live authed sockets; `useGameStream` invokes it when the active game id changes and on cleanup (`apps/mobile/src/realtime/use-game-stream.ts:104-118`), and the cookie effect is declared before `useSubscription`, so it runs before the transport connects. Layer (b): FORBIDDEN no longer deletes directly — `removeGuestGameIfAccessRejected` confirms over HTTP via `game.access` (per-request cookie assembly) before `removeGuestGame` (`use-game-stream.ts:120-129`, `:142-153`); NOT_FOUND stays immediate. Server side: read-only `game.access` on `gamePlayerProcedure` (`packages/api/src/game/routes/access.ts:12-19`). Tests: ws.test.ts credential-change close + pending-close; use-game-stream.test.tsx FORBIDDEN-pass-keeps-entry / FORBIDDEN-confirmed-removes / NOT_FOUND-immediate + close-call assertions; access.test.ts host/guest/no-seat (DB-backed, ran green) |
| I3 — stale RSD chrome wording in spec/design | p12-t09 | d1c7855 | **resolved** | design.md overview, Key Components, directory tree, token consumers, ThemeProvider, and "App chrome (native-backed screens + components)" sections rewritten to the native-backed reality with RSD kept as explicit provenance (design.md:13-19, 84-129, 409-441); spec Constraints/Dependencies/solution approach aligned (spec.md:407-413, 429-431, 445-452); RSD risk row replaced with a re-evaluation risk; Deviations row `p01-p12/I3` present |
| M1 — watchdog hard ceiling not re-armed outside live | p12-t10 | 00143fa | **resolved** | `markConnecting`/`markError`/`markReconnecting` and `checkLiveness` now call `scheduleWatchdog()` (`apps/mobile/src/realtime/lifecycle.ts:122-139`); the watchdog re-arms itself after firing (`:100`); the quiet-live reschedule branch is preserved (`:94-96`); `stop()` still clears (`:159-163`). Tests cover the ceiling in all three non-live states plus repeated re-arm firing twice across 2× the window. Note: each transition resets the timer, so the ceiling is per-quiet-period rather than absolute — this matches the prior finding's requested fix (transitions imply an actively-retrying transport) |
| M2 — no freshness guard for generated web StyleX files | p12-t11 | 757c074 | **resolved** | Generator extracted to `packages/design-tokens/scripts/web-stylex-files.ts` and made format-stable by running oxfmt on output (`:114-116`, `:130`); freshness test `packages/design-tokens/src/web-stylex.test.ts:14-31` regenerates to a temp dir and byte-compares committed files; it runs in the root `pnpm test` gate (vitest.workspace.ts includes `packages/*`). Verified green on this checkout **and** verified it fails when drift is injected (mutated `apps/web/src/styles/tokens.stylex.ts`, test failed, file restored) |
| M3 — AuthedWebSocket close-before-open leak | p12-t12 | 00143fa | **resolved** | `close()` records `pendingClose` even when the inner socket doesn't exist (`apps/mobile/src/api/ws.ts:132-141`); `open()` aborts before constructing the inner socket when a close was requested (`:161-164`); `readyState` reports CLOSED during that window (`:71-76`); registry entries are dropped on close/inner-close (`:134`, `:170-172`). Test: "does not create an inner socket after close is requested during async credential loading" asserts zero constructed sockets |
| M4 — FR12 "rematch navigates all connected players" overstated | p12-t13 | d1c7855 | **resolved** | FR12 acceptance reworded to web parity: initiator navigates, other players reach the new game from the dashboard (spec.md:226-232); design Requirement-to-Test Mapping FR12 row updated to "rematch parity" semantics; Deviations row `p01-p12/M4` records the disposition with a future API/event enhancement noted |
| m1 — vestigial RSD layer (`vars.css.ts`) | p12-t14 | 920ba50 | **resolved** | `apps/mobile/src/theme/vars.css.ts` deleted; `react-strict-dom` removed from package.json + pnpm-lock; babel preset entry removed (`apps/mobile/babel.config.js:35`, reanimated plugin retained); jest transpile entries for RSD/StyleX removed; docs updated (architecture.md, development.md, testing.md, design-tokens README); design dependency list pruned. Grep confirms zero `react-strict-dom`/`vars.css` references in mobile source/config; mobile typecheck and component suites pass |
| m2 — mobile hardcodes dimension tokens | p12-t15 | 83140fc | **resolved** | `apps/mobile/src/theme/native-tokens.ts` maps shared `space`/`radius`/`fontSize`/`fontWeight` to RN numbers with throwing px/rem parsers (`:6-21`) and centralizes native-only exceptions (`nativeChromeSize`, `nativeTypography`, `nativeShadow`); all 6 chrome-kit components migrated; design-tokens README documents the mapping and bounds expectations; `native-tokens.test.ts` guards the token↔number correspondence. Game-surface literals remain, consistent with the accepted "migrate opportunistically + bound expectations" fix guidance. (One value-drift defect introduced — see new Minor finding below) |

## Findings

### Critical

None

### Important

None

### Medium

None

### Minor

- **p12-t15 typography consolidation changed two shipped values** (`apps/mobile/src/components/TextField.tsx:84`, `apps/mobile/src/components/ConnectionBanner.tsx:119`)
  - Issue: Reusing `nativeTypography.buttonLabel` (fontSize 16, fontWeight '700', lineHeight 20) where the pre-migration styles differed introduced unintended visual changes in a value-preserving chore: TextField's input text was `fontSize: 16, lineHeight: 20` with **regular** weight (920ba50:`TextField.tsx` styles.root) and is now bold across every text input (login, signup, create, join); ConnectionBanner's title was `fontSize: 15, fontWeight: '700', lineHeight: 20` and is now fontSize 16. All other migrated values were verified drift-free (Button, Badge, Card, Screen).
  - Suggestion: Add dedicated `nativeTypography` entries — e.g. `textInput: { fontSize: nativeFontSize.md, lineHeight: 20 }` (no weight) and `bannerTitle: { fontSize: nativeFontSize.mdMinus, fontWeight: nativeFontWeight.bold, lineHeight: 20 }` — and use them in TextField/ConnectionBanner; or spread only the intended keys. Cheap fix; worth landing before the p12 TestFlight build so the distributed UI matches the p10 simulator evidence.

- **New `game.access` route is not recorded in the just-realigned API-surface artifacts** (`packages/api/src/game/routes/access.ts:12-19`, `packages/api/src/game/game.router.ts:42`)
  - Issue: p12-t08 added a new tRPC route (read-only seat check on `gamePlayerProcedure`) to support conservative guest cleanup. The route is well-scoped, additive, and integration-tested, but design.md's "API server changes" enumeration (items 1-3, updated in the same fix cycle by d1c7855) and the Deviations table do not mention it, and p12-t08's plan Files list declared only `apps/mobile` modifications. This is the same artifact-drift class (undeclared API-surface growth) that I1 just remediated, at much smaller scale.
  - Suggestion: Artifact alignment only — add `game.access` to design.md's API server changes list (additive, read-only, authorization owned by `gamePlayerProcedure`) and/or a Deviations row for p12-t08 noting the API-side scope extension. No code change needed.

## Requirements/Design Alignment

**Evidence sources used:** prior review artifact (finding definitions), spec.md + design.md at d1c7855 and HEAD, plan.md fix tasks p12-t07..t15, implementation.md (Deviations rows p01-p12/I1/I3/M4, Phase 12 test-results row, fix-completion notes), full diffs of all 5 fix commits, current file reads, and scoped test/typecheck execution.

### Requirements Coverage (re-review scope only)

| Requirement | Status | Notes |
| --- | --- | --- |
| FR2 | implemented | The destructive edge case (I2) is closed: credential-scoped sockets reset on active-game change and FORBIDDEN cleanup requires HTTP confirmation; layered unit + DB-backed integration coverage |
| FR12 | implemented | Acceptance criterion aligned to web-parity semantics (M4); shipped behavior unchanged and matching web |
| FR16 | implemented | Freshness guard closes the M2 gap; dimension tokens now bounded via native-tokens mapping (m2); minor value drift noted above |
| NFR2 | implemented | Watchdog ceiling now holds in all non-live states (M1); close-before-open race closed (M3); timing contract constants untouched |
| Spec Constraints | aligned | Additive-only wording narrowed to shipped reality (I1); chrome wording native-backed (I3); residual gap: `game.access` unrecorded (new Minor) |

### Extra Work (not in declared requirements)

- `packages/api/src/game/routes/access.ts` + router registration — needed by the accepted I2 fix design but exceeded p12-t08's declared file scope and is unrecorded in artifacts; captured as the second Minor finding (artifact alignment, not removal).
- No other unmapped work: d1c7855/920ba50 are artifact/doc-only beyond the declared removals, and 757c074/83140fc stay within their tasks' file boundaries. `packages/game-logic` and `packages/client-state` have zero changes in range (verified via commit stats).

## Verification Commands

All executed during this review on this checkout; all passed:

```bash
pnpm --filter @sequence/mobile exec jest src/api/ws.test.ts src/realtime/lifecycle.test.ts src/realtime/use-game-stream.test.tsx src/theme/native-tokens.test.ts --runInBand   # 33 tests pass
pnpm --filter @sequence/mobile exec jest src/components src/theme --runInBand   # 27 tests pass (token-migration blast radius)
pnpm --filter @sequence/design-tokens exec vitest run   # 3 tests pass incl. freshness guard; guard verified to FAIL on injected token drift
cd packages/api && pnpm exec vitest run src/game/routes/access.test.ts   # 3 DB-backed tests pass (needs DATABASE_URL_TEST / packages/api/.env)
pnpm --filter @sequence/mobile typecheck   # pass
```

Root gates were not re-run in this session; implementation.md's Phase 12 test-results row records the full gate matrix green post-fixes (65 Vitest files / 415 tests, 50 mobile suites / 310 tests).

## Recommended Next Step

Run the `oat-project-review-receive` skill to convert findings into plan tasks.
