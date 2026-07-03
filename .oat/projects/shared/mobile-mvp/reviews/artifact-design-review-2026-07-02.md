---
oat_generated: true
oat_generated_at: 2026-07-02
oat_review_scope: design
oat_review_type: artifact
oat_review_invocation: manual
oat_project: /Users/tstang/Code/react-native/.oat/projects/shared/mobile-mvp
---

# Artifact Review: design

**Reviewed:** 2026-07-02
**Scope:** `design.md` reviewed for completeness, clarity, implementation readiness, and alignment with upstream `spec.md` in spec-driven mode.
**Files reviewed:** 6
**Commits:** none (artifact review)

## Summary

The design is broad, structured, and mostly traceable to the 19 FRs and 7 NFRs in `spec.md`. It is not yet fully implementation-ready: the guest relaunch path does not define how the app discovers a persisted guest game after restart, and two recovery/performance acceptance criteria need concrete timing or measurement hooks before planning.

Findings: 1 critical, 2 important, 0 medium, 0 minor

## Findings

### Critical

- **Guest relaunch has no discoverable game identity path** (`.oat/projects/shared/mobile-mvp/design.md:214`)
  - Issue: FR2 requires that a guest who relaunches the app can return to their in-progress game (`spec.md:110`). The design persists a guest token keyed by game id and exposes only `saveGuestToken(gameId, token)` / `getGuestToken(gameId)` (`design.md:214`, `design.md:226`), with the data model limited to `sequence.guest.<gameId>` entries (`design.md:526`). It does not define a guest-game index, last-joined-game record, launch restoration flow, or query path that lets the app know which `game/[id]` to open after a cold start. With only a known-game lookup, the acceptance criterion is incomplete.
  - Fix: Add a designed guest resume model before planning: for example, store non-secret guest game metadata or a last-guest-game registry alongside SecureStore tokens, define startup routing and cleanup rules for finished/forbidden games, and add the relaunch verification to the FR2 mapping.
  - Requirement: FR2

### Important

- **Dead-socket recovery is not time-boxed for NFR2** (`.oat/projects/shared/mobile-mvp/design.md:301`)
  - Issue: NFR2 requires dead sockets to be detected and re-established "within seconds" (`spec.md:334`). The design names `keepAlive`, AppState resubscribe, and an inactivity watchdog, but leaves the watchdog threshold as "beyond keepAlive windows" and the test mapping as a broad scenario matrix (`design.md:301`, `design.md:718`). Without a concrete interval, missed-ack count, retry ceiling, or elapsed-time assertion, the plan cannot reliably preserve the P0 recovery target.
  - Fix: Specify the lifecycle manager timing contract: keepalive interval, missed ping/ack threshold, maximum reconnect window, connection-state transitions, and the manual/agent verification that measures recovery elapsed time for killed sockets and foreground resume.
  - Requirement: NFR2

- **Move-feedback latency acceptance is missing from NFR3 mapping** (`.oat/projects/shared/mobile-mvp/design.md:719`)
  - Issue: NFR3 has two acceptance criteria: interactive board/hand frame rates and perceived move feedback within about 300ms on a good network (`spec.md:343`, `spec.md:345`). The design maps NFR3 only to drag/event-application profiling and a device spot-check, while the error policy says there are no optimistic writes (`design.md:671`, `design.md:719`). It does not define what immediate feedback the player sees after submitting a move or how the 300ms server-echo/ack target will be measured.
  - Fix: Add a move-submit feedback design and verification target, such as a pending/submitted visual state plus haptic or disabled-card state until server echo, or explicitly commit to server-echo-only feedback and add a good-network latency measurement to Phase 11/12 verification.
  - Requirement: NFR3

### Medium

None

### Minor

None

## Requirements/Design Alignment

**Evidence sources used:**

- `.oat/projects/shared/mobile-mvp/spec.md` (primary upstream requirements)
- `.oat/projects/shared/mobile-mvp/design.md` (review target)
- `.oat/projects/shared/mobile-mvp/discovery.md` (upstream decisions and constraints)
- `.oat/projects/shared/mobile-mvp/plan.md` (workflow context only)
- `.oat/projects/shared/mobile-mvp/implementation.md` (workflow context only)
- `.oat/projects/shared/mobile-mvp/state.md` (workflow state)

### Requirements Coverage

| Requirement | Status | Notes |
| ----------- | ------ | ----- |
| FR1 | covered | Auth/session design covers Better Auth Expo client, SecureStore, HTTP and WS credentials, and restart verification. |
| FR2 | partial | Guest token persistence is designed, but cold-start discovery of the guest's game is missing. See Critical finding. |
| FR3 | covered | Dashboard, resumables/recents, and navigation by status are covered. |
| FR4 | covered | Create flow settings, validation, remote lobby, and local active-game routing are covered. |
| FR5 | covered | Live lobby, team controls, creator controls, start gating, and native share are covered. |
| FR6 | covered | Snapshot rendering, tap spotlight behavior, move submission, stale-version recovery, and two-client verification are covered. |
| FR7 | covered | Gesture-layer drag mode, no pre-highlighting, hover confirm, illegal drop feedback, and profiling are covered. |
| FR8 | covered | Sequence choice, dead-card turn-in, and auto-swap surfacing are covered. |
| FR9 | covered | TimerBadge, server deadline rendering, foreground re-sync, and forfeit reflection are covered. |
| FR10 | covered | Save/concede/freeze/resume lifecycle states are covered at component, phase, and test-mapping levels. |
| FR11 | covered | Local pass-and-play handoff and privacy handling are covered. |
| FR12 | covered | Game-over outcome and rematch flows are covered. |
| FR13 | covered | History record/list/head-to-head and pagination are covered. |
| FR14 | covered | Toast/haptic event feedback and shared rule-violation catalog are covered. |
| FR15 | covered | System theme, persisted override, and both-theme verification are covered. |
| FR16 | covered | Shared raw-token package, web StyleX wrapping, native consumption, and parity checks are covered. |
| FR17 | covered | Expo MCP, local `expo-mcp`, Argent, testID conventions, and workspace agent instructions are covered. |
| FR18 | covered | Final TestFlight phase, EAS production build, external tester install, and production smoke are covered. |
| FR19 | covered | Durable operator runbook structure and operator-step inventory are covered. |
| NFR1 | covered | Server redaction reliance, local handoff privacy, and client-store inspection are covered. |
| NFR2 | partial | Recovery mechanisms are present, but the dead-socket "within seconds" target is not time-boxed. See Important finding. |
| NFR3 | partial | Drag/perf profiling is present, but the 300ms perceived move-feedback acceptance is not designed or mapped. See Important finding. |
| NFR4 | covered | SecureStore credentials, TLS-only production, and release audit for dev-surface leakage are covered. |
| NFR5 | covered | TestID/accessibility identifier convention and agent tap-by-testID demo are covered. |
| NFR6 | covered | Root gate coverage for mobile and existing workspaces is covered. |
| NFR7 | covered | Phases 1-11 are designed as agent-only, with operator steps consolidated into Phase 12 or marked optional. |

### Extra Work (not in declared requirements)

None. The new `@sequence/client-state` package and design-token extraction are mapped to the spec's shared-client-state/design-language goals and are framed as behavior-preserving web refactors.

## Verification Commands

Run these after addressing the artifact findings:

```bash
rg -n "guest|sequence.guest|last.*guest|registry|NFR2|dead socket|keepAlive|watchdog|within seconds|NFR3|300ms|move feedback" .oat/projects/shared/mobile-mvp/design.md .oat/projects/shared/mobile-mvp/spec.md
git diff -- .oat/projects/shared/mobile-mvp/design.md .oat/projects/shared/mobile-mvp/spec.md
```

## Recommended Next Step

Run the `oat-project-review-receive` skill to convert findings into artifact-alignment work before creating the implementation plan.
