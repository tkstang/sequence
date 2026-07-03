---
oat_status: complete
oat_ready_for: oat-project-design
oat_blockers: []
oat_last_updated: 2026-07-03
oat_generated: false
oat_template: false
---

# Specification: mobile-mvp

## Phase Guardrails (Specification)

Specification is for requirements and acceptance criteria, not design/implementation details.

- Avoid concrete deliverables (specific scripts, file paths, function names).
- Keep the "High-Level Design" section to architecture shape and component boundaries only.
- If a design detail comes up, record it under **Open Questions** for `oat-project-design`.

## Problem Statement

Sequence Online shipped as a server-authoritative web MVP: a Fastify/tRPC API
on Railway, a Next.js client on Vercel, and a framework-free rules engine
shared between them. From the first planning pass, the API and game-logic were
deliberately kept portable for a second client — a React Native app — and the
recent StyleX migration of the web UI was explicitly motivated by preparing a
styling system that could extend to native. That client does not exist yet.

Playing a turn-based board game with friends is a fundamentally mobile
activity. Mobile web works, but a native app delivers what the web cannot:
home-screen presence, native gestures and animations for the board, resilient
realtime behavior across app backgrounding and flaky mobile networks, and
eventually push-driven turn alerts. This project builds that app for iOS as a
single end-to-end effort — full feature parity with the web MVP, delivered to
TestFlight — followed by open-ended iteration.

The project also carries a second, deliberate goal: establishing first-class
agentic-coding infrastructure for React Native development in this repo (MCP
servers for simulator interaction, inspection, and driving), so that this
build — and all future mobile iteration — runs with the same agent-verifiable
feedback loop the web app has via its dev playground and Playwright.

Scope boundaries: iOS is the only verified platform in v1 (Android stays
structurally supported but untested); TestFlight via EAS is the finish line
and is isolated in the final phase; the API remains the authority for all
game rules, persistence, and auth — its only changes are additive auth/config
surface for native clients.

## Goals

### Primary Goals

- Full web-parity feature set on iOS: auth, guest invite join, game creation,
  lobby, realtime gameplay (tap and drag modes), special rule flows, timers,
  lifecycle controls, local pass-and-play, game over/rematch, history, and
  in-app notification affordances.
- Robust mobile realtime: the app recovers cleanly from backgrounding,
  network drops, and app restarts without desyncing or corrupting games.
- Shared design language: a single source of truth for design tokens feeding
  both the web StyleX themes and the native app, with light/dark support on
  both.
- Agentic development loop: a coding agent can build, run, see, and drive the
  app on an iOS Simulator through committed, documented tooling.
- TestFlight distribution: external testers can install the app and play real
  multiplayer games against the production API.

### Secondary Goals

- Visual quality on iPhone-class screens that meets or beats mobile web.
- Accessibility/testability identifiers on interactive elements, seeding both
  the agent loop and a future Maestro e2e suite.
- Documentation parity: the mobile workspace is documented to the same
  standard as web and API.

## Non-Goals

- Android verification or polish (backlog `BL-260703-android-support-for-the-mobile`).
- https universal links (backlog `BL-260703-universal-links-for-game`); v1
  ships invite-code entry and app-scheme deep links only.
- OTA updates via EAS Update (backlog `BL-260703-adopt-eas-update-for-ota`).
- Maestro e2e suite (backlog `BL-260703-maestro-e2e-regression-suite`).
- Push notifications (deferred idea in discovery; promote when iterating).
- Matchmaking, chat, monetization (unchanged from web MVP posture).
- App Store public release (TestFlight is the v1 finish line).
- Web app feature changes beyond the shared-token refactor.
- Gameplay/persistence changes to the API or rules engine.

## Requirements

### Functional Requirements

**FR1: Authentication and session persistence**

- **Description:** Registered users can sign up, log in, and log out with
  email/password against the existing auth service. Sessions persist across
  app restarts using secure on-device storage.
- **Acceptance Criteria:**
  - Sign up, log in, log out flows work against the production-shaped API
  - A logged-in user who force-quits and relaunches the app remains logged in
  - Authenticated tRPC queries/mutations and WS subscriptions carry the session
  - Auth failures surface clear, actionable error states
- **Priority:** P0

**FR2: Guest invite join**

- **Description:** An anonymous player can join a game by entering an invite
  code (or following an app-scheme deep link), providing a guest name, and
  receiving a game-scoped guest identity that survives app restarts for that
  game.
- **Acceptance Criteria:**
  - Invite preview shows roster/settings before joining
  - Guest join seats the player and their guest identity authorizes gameplay
    mutations and the game subscription
  - A guest who relaunches the app can return to their in-progress game
  - App-scheme deep links route to the join flow with the code prefilled
- **Priority:** P0

**FR3: Dashboard**

- **Description:** A signed-in home screen listing resumable games
  (frozen/saved) and recent finished games, with entry points to create and
  join.
- **Acceptance Criteria:**
  - Resumable and recent games render with correct status, roster, and result
  - Tapping a game navigates to the correct screen for its status
- **Priority:** P0

**FR4: Game creation**

- **Description:** A registered user can create a game with player count
  (2/3/4/6), play mode (tap/drag), optional turn timer, or a local
  pass-and-play game with an opponent name.
- **Acceptance Criteria:**
  - All settings the web create flow supports are available and validated
  - Creating a remote game lands in its lobby with a shareable invite code
  - Creating a local game goes straight into active play
- **Priority:** P0

**FR5: Lobby**

- **Description:** Live pre-game roster with team assignment, creator
  controls (kick, randomize teams, start), and invite-code sharing.
- **Acceptance Criteria:**
  - Roster updates live as players join/leave/change teams
  - Players can set their own team; the creator can set anyone's
  - Creator can kick, randomize teams, and start when the layout is legal
  - Invite code is displayed with a native share affordance
- **Priority:** P0

**FR6: Realtime gameplay (tap mode)**

- **Description:** The core play loop: render the authoritative board, hand,
  and player rail from the live subscription; in tap mode, selecting a card
  spotlights its legal targets and tapping a target submits the move.
- **Acceptance Criteria:**
  - Board, hand, chips, sequences, and turn state render from the snapshot
    and update from streamed events
  - Tap-to-reveal matches web behavior: spotlight only on card selection,
    never an automatic all-plays view
  - Placements, one-eyed/two-eyed jack plays, sequence locking, and win
    detection all render correctly
  - Moves are version-guarded; a stale submit recovers without desync
  - Opponent moves appear without user action within normal network latency
- **Priority:** P0

**FR7: Drag mode (hard mode)**

- **Description:** Drag-with-validation parity: drag a chip to the board with
  no pre-highlighting; hovering a cell shows a confirm affordance; illegal
  drops are rejected with feedback.
- **Acceptance Criteria:**
  - Drag interactions run at interactive frame rates on target hardware
  - No legal-target hints are shown in drag mode
  - Illegal drops give rule-violation feedback consistent with the web
- **Priority:** P0

**FR8: Special rule flows**

- **Description:** The >5-run sequence choice, hard-mode dead-card turn-in,
  and default-mode auto-swap surface correctly.
- **Acceptance Criteria:**
  - A pending sequence choice freezes the turn and lets the placer pick the
    five locking cells (chained choices included)
  - Hard-mode players can turn in a genuinely dead card once per turn and
    continue their turn
  - Default-mode auto-swaps render comprehensibly in the event feed/UX
- **Priority:** P0

**FR9: Turn timers**

- **Description:** Timed games show a synchronized countdown for the active
  turn; expiry (server-enforced forfeit) is reflected immediately.
- **Acceptance Criteria:**
  - Countdown reflects the server deadline, including after
    reconnect/foreground
  - Timer expiry advances the turn without client action
- **Priority:** P0

**FR10: Lifecycle controls**

- **Description:** Save & exit, concede, disconnect freeze/resume, and
  expiry states with parity semantics.
- **Acceptance Criteria:**
  - Save & exit suspends a login-only game and it appears in resumables
  - Concede finishes the game with the correct outcome for all team shapes
  - A remote game freezes when a player disconnects and resumes when the
    original roster returns, with clear UI states
- **Priority:** P0

**FR11: Local pass-and-play**

- **Description:** Two-player local mode on one device: handoff interstitial
  between turns so hands stay private, with both seats controlled by the
  device owner.
- **Acceptance Criteria:**
  - Handoff screen gates each turn transition; the incoming player's hand is
    hidden until confirmed
  - Local games skip lobby, are excluded from W-L aggregates, and can save
- **Priority:** P0

**FR12: Game over and rematch**

- **Description:** A finished game shows the outcome (win/loss/concede,
  winning sequences) and offers a one-tap rematch with the same roster and
  settings.
- **Acceptance Criteria:**
  - Outcome screen matches web semantics for 2-team and 3-team games
  - Rematch navigates all connected players to the new game's lobby (or
    active state for local)
- **Priority:** P0

**FR13: History**

- **Description:** W-L record, paginated finished-games list, and
  head-to-head records.
- **Acceptance Criteria:**
  - Record, list (with pagination), and head-to-head render correctly,
    matching web semantics (local games listed but excluded from aggregates)
- **Priority:** P1

**FR14: In-app notification affordances**

- **Description:** Parity with the web app's in-app notification UX (turn
  prompts, event feedback such as opponent moves and rule violations) adapted
  to mobile idioms (toasts/haptics).
- **Acceptance Criteria:**
  - Turn changes and significant events are surfaced when the relevant screen
    is visible
  - Rule violations surface code-driven, human-readable feedback
- **Priority:** P1

**FR15: Theming**

- **Description:** Light/dark theming driven by the shared tokens: follows
  the OS by default with a persisted manual override.
- **Acceptance Criteria:**
  - System mode tracks OS appearance changes live
  - Manual override persists across restarts
  - All screens render correctly in both themes
- **Priority:** P1

**FR16: Shared design tokens**

- **Description:** A single framework-free token source consumed by both the
  web StyleX theme layer and the native app, with no web visual regression.
- **Acceptance Criteria:**
  - Web builds and renders identically (verified against the dev playground)
    after consuming the shared source
  - Native styles pull from the same source; adding a token updates both
    platforms from one edit
- **Priority:** P0

**FR17: Agentic development tooling**

- **Description:** Committed, documented agent tooling for mobile
  development: the official Expo MCP server (remote and local dev tools) and
  Argent, plus agent instructions for the mobile workspace.
- **Acceptance Criteria:**
  - From a fresh checkout, a documented setup lets a coding agent build and
    launch the app on a simulator, capture screenshots, drive the UI via
    testID/accessibility selectors, and read app logs
  - Agent instructions document the loop, commands, and conventions
  - Dev-only tooling is verifiably absent from release builds
- **Priority:** P0

**FR18: TestFlight distribution**

- **Description:** The app ships to TestFlight via EAS Build, installable by
  external testers, playing against the production API. Isolated to the final
  phase.
- **Acceptance Criteria:**
  - External testers can install from TestFlight and complete a real
    multiplayer game against production
  - A smoke checklist for TestFlight builds is documented
- **Priority:** P0

### Non-Functional Requirements

**NFR1: Hand privacy**

- **Description:** The client renders only what the redacted server stream
  provides; remote opponents' hands are never present on-device, and local
  pass-and-play hands are hidden between turns.
- **Acceptance Criteria:**
  - Remote-mode client state contains only the player's own hand
  - Handoff flow prevents shoulder-surfing the other local hand
- **Priority:** P0

**NFR2: Reconnect and lifecycle robustness**

- **Description:** Backgrounding, force-quit, network handoffs, and dead
  sockets never desync a game: the app resubscribes, recovers the snapshot,
  and resumes with a correct version.
- **Acceptance Criteria:**
  - Returning from background resumes the live stream (or re-snapshots)
    without user action
  - A move submitted with a stale version recovers gracefully (fresh
    snapshot, clear feedback, no duplicate application)
  - Dead sockets are detected and re-established within seconds
- **Priority:** P0

**NFR3: Interaction performance**

- **Description:** The game surface feels native: gesture-driven
  interactions run smoothly on iPhone-class hardware, and move round-trips
  feel immediate on a good network.
- **Acceptance Criteria:**
  - Board/hand interactions (tap, drag, spotlight) hold interactive frame
    rates on a mid-range physical iPhone
  - Perceived move feedback (optimistic acknowledgment or server echo) within
    ~300ms on a good network
- **Priority:** P1

**NFR4: Client security posture**

- **Description:** Credentials live in secure storage; no secrets ship in
  the bundle; production traffic is TLS-only; dev tooling is excluded from
  release builds.
- **Acceptance Criteria:**
  - Session/guest credentials are stored in platform secure storage only
  - Release builds contain no dev endpoints, playground surfaces, or MCP dev
    tooling
  - Production builds speak https/wss exclusively
- **Priority:** P0

**NFR5: Testability and accessibility identifiers**

- **Description:** Interactive elements expose stable testID/accessibility
  identifiers to power the agent loop, component tests, and future e2e.
- **Acceptance Criteria:**
  - A documented identifier convention exists and is applied to interactive
    elements across screens
  - An agent can locate and tap named elements without coordinate guessing
- **Priority:** P1

**NFR6: Quality gates**

- **Description:** The mobile workspace participates in the repo's gates:
  typecheck, lint, format, and unit/component tests, all runnable at root.
- **Acceptance Criteria:**
  - Root gate commands cover the mobile workspace and pass
  - Existing web/API/game-logic gates remain green throughout
- **Priority:** P0

## Constraints

- The rules engine stays framework-free; no React/RN imports are added to it.
- The API remains the authority for auth, persistence, move validation,
  version guards, redaction, timers, and realtime; API changes are limited to
  additive auth/config surface for native clients.
- The web app must not visually or functionally regress from the shared-token
  refactor; all existing gates stay green.
- Monorepo conventions hold: Node 24, pnpm, explicit `.ts`/`.tsx` import
  extensions with `import type` (`verbatimModuleSyntax`); the mobile bundler
  must resolve the existing convention.
- Expo SDK 57 / New Architecture; dependencies stay on SDK-bundled versions.
- Styling follows the hybrid direction chosen in discovery: React Strict DOM
  + shared StyleX-compatible tokens for app chrome; plain RN primitives for
  the game surface. No Tailwind/NativeWind.
- Dev-only surfaces must be excluded from release builds.
- iOS-first: no Android-specific work beyond what Expo provides structurally.

## Dependencies

- Existing `@sequence/api` tRPC contract (type-only import) and production
  Railway deployment.
- Existing `@sequence/game-logic` rules engine and display helpers.
- Better Auth (server) and its Expo client integration.
- Expo SDK 57 toolchain (dev builds, CNG/prebuild), EAS Build for the final
  phase, Apple Developer Program membership (final phase).
- React Strict DOM for chrome styling; SDK-bundled Reanimated and
  gesture-handler for the game surface.
- Official Expo MCP server (remote + local dev tools) and Argent for the
  agent loop.
- Existing SVG card assets from the web app.

## High-Level Design (Proposed)

A new mobile app workspace joins the monorepo as a third client-facing
runtime boundary, consuming the same typed tRPC contract and rules engine the
web app uses. The app renders authoritative server state from the existing
snapshot-first subscription model and submits version-guarded mutations; no
game rules run client-side beyond legal-target previews from the shared
display helpers. A small shared token package becomes the design-language
source of truth for both web and native.

Native-specific plumbing concentrates in three places: an auth layer that
stores session/guest credentials in secure storage and attaches them to HTTP
and WebSocket transports; a realtime lifecycle layer that reconciles the
subscription with app backgrounding and mobile network churn; and a game
surface built from native primitives for gesture-driven play. App chrome
(auth, dashboard, lobby, settings, history) uses React Strict DOM with the
shared tokens; the game surface uses plain React Native components styled
from the same tokens.

Agent tooling is a first-class deliverable: committed MCP configuration and
workspace agent instructions give coding agents a build → run → screenshot →
drive → inspect loop on iOS Simulators from day one.

**Key Components:**

- Mobile app workspace — screens, navigation, theming, and the game surface.
- Shared design tokens package — framework-free values consumed by web StyleX
  themes and native styles.
- Shared client-state module — the snapshot view model and event-application
  logic reused across web and mobile (extraction from the web app).
- Native auth/session layer — secure credential storage and transport
  attachment for HTTP and WS.
- Realtime lifecycle layer — subscription management across app state and
  network transitions.
- API auth extension — server-side Better Auth native-client support and
  trusted origins (additive only).
- Agent tooling configuration — MCP servers, identifiers convention, and
  workspace agent instructions.

**Alternatives Considered:**

- Separate mobile repo — rejected: the monorepo was designed for this client
  (shared types, tokens, rules engine), and a second repo would fork the
  contract.
- Sharing UI between web and native (react-native-web / RSD-everywhere) —
  rejected in discovery: share logic and tokens, not game UI; the game
  surface needs native primitives and the chrome benefits from the shared
  mental model without literal component sharing.
- Duplicating token values on native — rejected: drift risk; a shared raw
  source is cheap and was chosen in discovery.

_Design-related open questions are tracked in the [Open Questions](#open-questions) section below._

## Success Metrics

- 100% of the parity feature list playable on iOS (FR1-FR15) with no
  P0-severity defects in the final review.
- A complete real multiplayer game (2+ devices/testers) played end-to-end via
  TestFlight against production.
- Session persistence verified across force-quit/restart for both registered
  users and in-game guests.
- Background → foreground recovery verified across the documented scenario
  matrix (brief background, long background, network switch, dead socket).
- Agent loop demonstrated: an agent builds, launches, screenshots, taps by
  identifier, and reads logs using only committed config and docs.
- Web visual parity after the token refactor verified in the dev playground;
  all pre-existing gates green.
- All root quality gates green including the mobile workspace.

## Requirement Index

| ID | Description | Priority | Verification | Planned Tasks |
| --- | --- | --- | --- | --- |
| FR1 | Email/password auth with persistent sessions | P0 | integration + manual: session across restart | TBD - see plan.md |
| FR2 | Guest invite join with durable game-scoped identity | P0 | manual + unit: join/preview flows | TBD - see plan.md |
| FR3 | Dashboard of resumable/recent games | P0 | unit + manual: myGames rendering | TBD - see plan.md |
| FR4 | Game creation incl. local mode | P0 | unit + manual: create flows | TBD - see plan.md |
| FR5 | Live lobby with team/creator controls | P0 | manual: multi-client lobby; unit: components | TBD - see plan.md |
| FR6 | Realtime tap-mode gameplay | P0 | unit + manual: board/hand components, live game | TBD - see plan.md |
| FR7 | Drag mode with validation feedback | P0 | manual + unit: drag interaction | TBD - see plan.md |
| FR8 | Sequence choice, dead-card turn-in, auto-swap | P0 | unit + manual: special flows | TBD - see plan.md |
| FR9 | Synchronized turn timers | P0 | unit + manual: deadline sync | TBD - see plan.md |
| FR10 | Save/concede/freeze/resume lifecycle | P0 | manual + unit: lifecycle states | TBD - see plan.md |
| FR11 | Local pass-and-play with handoff | P0 | unit + manual: handoff gating | TBD - see plan.md |
| FR12 | Game over and rematch | P0 | unit + manual: outcome + rematch | TBD - see plan.md |
| FR13 | History record/list/head-to-head | P1 | unit + manual: history screens | TBD - see plan.md |
| FR14 | In-app notification affordances | P1 | unit + manual: event feedback | TBD - see plan.md |
| FR15 | Light/dark theming from shared tokens | P1 | unit + manual: theme switching | TBD - see plan.md |
| FR16 | Shared design tokens, no web regression | P0 | unit + manual: web gates + playground parity | TBD - see plan.md |
| FR17 | Agentic tooling loop | P0 | manual: demonstrated agent loop | TBD - see plan.md |
| FR18 | TestFlight distribution | P0 | manual: external install + production smoke | TBD - see plan.md |
| NFR1 | Hand privacy on device | P0 | integration + manual: redaction and handoff | TBD - see plan.md |
| NFR2 | Reconnect/lifecycle robustness | P0 | manual: scenario matrix | TBD - see plan.md |
| NFR3 | Interaction performance | P1 | perf + manual: device spot checks | TBD - see plan.md |
| NFR4 | Client security posture | P0 | manual: release build audit | TBD - see plan.md |
| NFR5 | Testability identifiers | P1 | unit + manual: identifier convention | TBD - see plan.md |
| NFR6 | Quality gates cover mobile | P0 | manual: root gates | TBD - see plan.md |

**Notes:**

- ID: Unique requirement identifier (FR# for functional, NFR# for non-functional)
- Description: Brief 1-sentence summary of the requirement
- Priority: P0 (must have) / P1 (should have) / P2 (nice to have)
- Verification: How this will be verified — format is `method: pointer`
- Planned Tasks: Filled in during planning phase to ensure traceability

## Open Questions

- **Guest credential transport:** How the game-scoped guest credential is
  captured and attached on native (cookie-jar behavior vs an explicit,
  opt-in token return) — resolve in design/early implementation spike.
- **Client-state sharing:** Exact packaging of the shared snapshot/event
  view-model logic extracted from the web app.
- **Theme persistence store:** Which on-device store holds the non-secret
  theme preference.
- **Monitoring:** Whether v1 ships any crash reporting or defers it entirely.

## Assumptions

- Expo SDK 57 remains current through the project; no mid-project SDK jump.
- React Strict DOM works on SDK 57 (peer-satisfied; validated by early spike)
  with the Unistyles fallback pre-agreed for chrome if it blocks.
- Better Auth server/client stay version-locked and the Expo integration
  supports the separate-API topology.
- Apple Developer Program membership is available when the final phase
  starts.
- The production API requires no scaling changes for a second client type.

## Risks

- **React Strict DOM maturity:** 0.0.x dependency with a 2026 publish stall
  and native CSS gaps.
  - **Likelihood:** Medium
  - **Impact:** Medium
  - **Mitigation:** Hybrid containment; early spike; shared raw tokens; agreed
    Unistyles fallback for chrome.
- **Better Auth native rough edges:** Secure-storage and cookie-format issues
  are documented in the ecosystem; guest flow is bespoke.
  - **Likelihood:** Medium
  - **Impact:** High
  - **Mitigation:** Auth + session persistence is the first vertical slice;
    versions pinned; device testing early.
- **Bundler/monorepo friction:** Explicit-extension imports and pnpm linking
  under Metro.
  - **Likelihood:** Medium
  - **Impact:** Medium
  - **Mitigation:** Foundation phase proves shared-package imports before UI
    work; hoisted-linker escape hatch.
- **Mobile WS lifecycle:** Backgrounding and radio handoffs stress the
  subscription model beyond anything web exercised.
  - **Likelihood:** High
  - **Impact:** Medium
  - **Mitigation:** Keepalive, app-state-driven resubscribe, snapshot-first
    recovery already server-supported; explicit scenario matrix in testing.
- **Scope size:** Full parity is web-mvp-scale; a single project risks drag.
  - **Likelihood:** Medium
  - **Impact:** Medium
  - **Mitigation:** Phases ordered to produce a playable core early; TestFlight
    isolated at the end; deferred items already carved off to backlog.

## References

- Discovery: `discovery.md`
- Architecture: `docs/architecture.md`
- API contract: `docs/api-reference.md`
- Rules engine: `docs/game-logic-reference.md`
- Styling system: `docs/styling.md`
- Configuration: `docs/configuration.md`
- Research briefs: brainstorm session 2026-07-02 (Expo SDK 57 stack, StyleX/RSD
  on native, agentic iOS tooling) — summarized in `discovery.md`
