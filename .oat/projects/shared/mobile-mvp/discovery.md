---
oat_status: complete
oat_ready_for: oat-project-design
oat_blockers: []
oat_last_updated: 2026-07-03
oat_generated: false
---

# Discovery: mobile-mvp

## Phase Guardrails (Discovery)

Discovery is for requirements and decisions, not implementation details.

- Prefer outcomes and constraints over concrete deliverables (no specific scripts, file paths, or function names).
- If an implementation detail comes up, capture it as an **Open Question** for design (or a constraint), not as a deliverable list.

## Initial Request

Build the React Native version of Sequence Online as a single end-to-end OAT
project, then iterate. Use Expo SDK 57, StyleX, and current-generation React
Native technology. Discuss and settle technology choices as part of discovery.
Additionally, set up first-class agentic-coding support for React Native
development (MCP servers for Simulator interaction/debugging, complementing
Orca computer-use for iOS Simulators).

Context: the web MVP shipped (server-authoritative Fastify/tRPC/Drizzle API,
Next.js web client, framework-free `@sequence/game-logic`), and the
`stylex-ui-refresh` project migrated the web UI from Tailwind to StyleX
explicitly to prepare for this native app. The API and rules engine were kept
portable for a future React Native client from day one; this project is that
client.

## Clarifying Questions

### Question 1: v1 scope

**Q:** What should the v1 slice of the RN app be — playable core, full web parity, or a walking skeleton?
**A:** Full web parity.
**Decision:** The project delivers everything the web MVP has: landing/auth/dashboard/create/join/history, the playable game route (lobby, board, hand, player rail, tap and drag modes), local pass-and-play with handoff, lifecycle controls (save/exit, concede, rematch), timers UI, notifications UX, and game-over flows — on mobile.

### Question 2: Platforms

**Q:** iOS-first, iOS+Android best-effort, or both verified?
**A:** iOS-first.
**Decision:** v1 ships and verifies iOS only (Simulator + physical iPhone). Android stays structurally supported by Expo but untested; verified Android support is deferred (backlog).

### Question 3: Delivery target

**Q:** Where does "end to end" finish — TestFlight, personal device, or simulator-verified?
**A:** TestFlight, phased at the very end of the project.
**Decision:** Done = installable via TestFlight (EAS Build) playing real multiplayer against the production Railway API. All EAS/App Store Connect/Apple Developer setup is isolated in the final phase so it cannot block earlier phases.

### Question 4: Styling

**Q:** React Strict DOM everywhere, hybrid RSD, Unistyles v3, or plain StyleSheet?
**A:** Hybrid RSD.
**Decision:** React Strict DOM + StyleX tokens for app chrome/screens; plain RN primitives + Reanimated/gesture-handler for the game surface (board, hand, chips, drag interactions) where RSD's native CSS subset (no grid, no keyframes) would fight us. See Solution Space.

### Question 5: Agentic tooling

**Q:** Which agent-tooling components does the project set up — Expo MCP, Argent, XcodeBuildMCP, Maestro?
**A:** Expo MCP + Argent. Maestro only if useful for development verification (delegated to agent judgment → deferred; see Deferred Ideas). XcodeBuildMCP skipped.
**Decision:** The project sets up the official Expo MCP server (remote + local `expo-mcp` dev tools: simulator screenshots, tap-by-testID, RN DevTools, logs) and Software Mansion's Argent (a11y-tree driving, React component tree, network inspection, profiling). Apple's Xcode MCP (26.3/27-beta `mcpbridge`) exposes no simulator tools to external clients as of beta 1 — re-evaluate at Xcode 27 GA (backlog). Orca computer-use complements from the session side; no repo setup needed.

### Question 6: Testing

**Q:** jest-expo, Vitest-everywhere, or minimal-unit + heavy e2e?
**A:** jest-expo.
**Decision:** Jest + jest-expo + @testing-library/react-native for the mobile workspace only; the rest of the monorepo stays on Vitest. Matches the 2026-rewrite plan ("RN component tests stay on Jest by choice") and the pattern validated in the vox-mobile-app project.

### Question 7: Design tokens

**Q:** Shared raw-token package (with a small web refactor) or duplicate values for now?
**A:** Shared package.
**Decision:** A framework-free raw-token package (colors, spacing, radii, type scale as plain TS values) becomes the single source of truth. Web's StyleX `defineVars` wraps it; native consumes it directly. Sharing raw values rather than `.stylex.ts` files sidesteps the RSD-bundled-StyleX version-skew risk.

### Question 8: Workflow mode

**Q:** Spec-driven or quick mode?
**A:** Spec-driven.
**Decision:** Full parity + new platform + new styling system is web-mvp-sized: discovery → design (spec + design) → plan → phased implementation, HiLL checkpoint at final.

### Question 9: EAS Updates (OTA)

**Q:** Adopt OTA updates in v1 or defer?
**A:** Want it, but defer — create a backlog item.
**Decision:** Deferred to iterate phase; tracked as backlog. v1's TestFlight phase ships builds only.

### Question 10: Invite links on mobile

**Q:** Universal links in v1, or invite-code entry + app-scheme deep links?
**A:** Code entry + scheme links; universal links deferred with a backlog item.
**Decision:** v1 supports manual invite-code entry and app-scheme deep links. https universal links (tap an iMessage link → app opens to join) need apple-app-site-association served by the web deployment — deferred, tracked as backlog.

## Solution Space

The one genuinely divergent choice was the styling system; everything else had
a clear best option once researched (see Options Considered / Key Decisions).

### Approach 1: Hybrid React Strict DOM _(Recommended)_

**Description:** RSD (`react-strict-dom`) + StyleX-authored styles and shared tokens for app chrome — auth, dashboard, create/join, history, lobby, settings screens. The game surface (board, hand, chips, drag/tap interactions) is built with plain RN primitives styled from the same token package, animated with Reanimated + gesture-handler.
**When this is the right choice:** When you want the StyleX mental model and token/theme sharing with web (the explicit motivation of `stylex-ui-refresh`), but the hardest, most interaction-heavy UI shouldn't be coupled to a 0.0.x dependency, and web/native game UIs were never going to be shared anyway ("share logic, not UI" — 2026-rewrite principle).
**Tradeoffs:** Two styling idioms in one app (clear boundary mitigates); RSD is early-adopter tech — 0.0.55, one npm publish in 2026, bundled StyleX (0.15.4) trails web (0.19), CSS subset gaps on native (no grid/keyframes/calc/sticky). Production-proven at Meta (FB/IG VR apps) and cited at Zalando; Expo is the recommended RSD setup and SDK 57 satisfies its peer deps, but SDK 57-specific compatibility is unverified.

### Approach 2: RSD everywhere

**Description:** Every screen, including the game surface, in RSD.
**When this is the right choice:** Maximum web/native consistency; a team betting fully on the RSD direction.
**Tradeoffs:** The board hits `display: grid` and keyframe gaps head-on; couples the hardest UI to the least mature dependency; gesture-heavy interactions still need RN-native libs anyway.

### Approach 3: Unistyles v3 + shared raw tokens (no RSD)

**Description:** react-native-unistyles (stable since 2025-07, C++ New-Arch core, built-in adaptive light/dark themes) consuming the shared token package.
**When this is the right choice:** If RSD proves unusable — this is the designated fallback for chrome styling. Most boring-safe path that still has a real token/theme system.
**Tradeoffs:** Parallel styling mental model to web; no StyleX relationship; single-maintainer risk.

### Approach 4: Plain StyleSheet + token codegen (vox pattern)

**Description:** StyleSheet + codegen'd token module + theme context/hook, as validated in vox-mobile-app.
**When this is the right choice:** Zero-dependency-risk baseline.
**Tradeoffs:** Hand-rolled theming; no StyleX relationship; most manual work.

### Chosen Direction

**Approach:** Approach 1 — Hybrid React Strict DOM.
**Rationale:** Delivers the StyleX/token-sharing direction the repo already committed to (stylex-ui-refresh named RSD adoption as its follow-up) while containing RSD's maturity risk away from the game surface, which needs RN-native rendering and gestures regardless. Approach 3 is the pre-agreed fallback for chrome if RSD blocks.
**User validated:** Yes.

## Options Considered

### Option A: tRPC subscriptions over `wsLink` _(chosen)_

**Description:** Keep WebSocket subscriptions using tRPC v11 `wsLink` — RN's native WebSocket, `connectionParams` for auth, `keepAlive` ping/pong for dead-socket detection, exponential retry.

**Pros:**

- Zero polyfills; the Fastify API already serves WS subscriptions
- `connectionParams` cleanly carries the Better Auth session cookie
- keepAlive suits flaky mobile networks

**Cons:**

- tRPC's web-recommended direction is SSE (`httpSubscriptionLink`)
- Known issue: server-side subscription close can leave client `pending` (trpc#6962) — needs AppState-driven resubscribe handling

**Chosen:** A (over SSE, which requires three polyfills on RN with documented backgrounding-reconnect bugs).

**Summary:** wsLink is the pragmatic RN transport given the API's existing WS support; SSE polyfill fragility on RN settles it.

### Option B: Data-layer integration — `@trpc/tanstack-react-query` _(chosen)_

**Description:** The mobile client uses tRPC v11's current TanStack React Query integration (`queryOptions`-style) + TanStack Query v5. The web app keeps its existing client untouched; migrating web to the new integration is optional future work, not this project.

**Summary:** New surface adopts the current recommended integration; no forced churn on web.

### Option C: Agent-tooling composition

- **Expo MCP (official)** — chosen. Remote: docs/deps/EAS monitoring. Local (`expo-mcp`, SDK 54+): simulator screenshots, tap-by-testID, RN DevTools access, app logs. Plus Expo agent skills / generated agent instructions.
- **Argent (@swmansion/argent)** — chosen. A11y-tree tap/swipe/type, deep links, view hierarchy, React component tree, network inspection, React+native profiling (needs dev build). The React-aware layer nothing from Apple covers.
- **XcodeBuildMCP (Sentry)** — skipped; largely redundant with Expo MCP + `xcrun simctl` for a managed Expo app. Adopt later only if native-layer debugging (LLDB) demands it.
- **Apple Xcode MCP (`xcrun mcpbridge`)** — not adopted now: as of Xcode 27 beta 1 it exposes the same 20 tools as 26.3 to external clients (no simulator control/screenshots/a11y tree; requires Xcode open + macOS 26.4). In-IDE agents in Xcode 27 do get simulator driving; whether it reaches `mcpbridge` at GA (~Sept 2026) is the open item — re-evaluate then (backlog).
- **Maestro** — deferred to iterate (backlog): during the build, interactive agent verification via Expo MCP/Argent covers development verification; Maestro earns its place as the stable-UI regression gate, mirroring how Playwright landed on web.
- **Orca computer-use** — session-side complement (drives the Simulator window directly); no repo setup required.

## Key Decisions

1. **Platform target:** Expo SDK 57 (RN 0.86, React 19.2), New Architecture (mandatory since SDK 55), iOS-first; Android deferred.
2. **App location:** `apps/mobile` workspace in the existing pnpm monorepo, as the 2026-rewrite target architecture always planned.
3. **Dev workflow:** development builds + CNG/prebuild (native dirs are build artifacts, gitignored); local `expo run:ios` for iteration (SDK 56 precompiled XCFrameworks ≈ 1-min clean builds); EAS Build only in the final TestFlight phase. Expo Go is not a target (unreliable on the App Store for SDK 55+; Better Auth needs SecureStore config anyway).
4. **Navigation:** expo-router (SDK-versioned).
5. **React Compiler:** enabled (stable v1.0; default in new Expo templates).
6. **Data layer:** tRPC v11 via `@trpc/tanstack-react-query` + TanStack Query v5; subscriptions over `wsLink` (see Option A). Web client untouched.
7. **Auth:** Better Auth `expo()` server plugin + `@better-auth/expo` client with expo-secure-store; session cookie manually attached to tRPC HTTP headers and WS `connectionParams`; `trustedOrigins` (app scheme) configured on the API. Session persistence validated on device/simulator very early — it is Better Auth's roughest edge.
8. **Styling:** hybrid RSD (see Chosen Direction); shared framework-free raw-token package feeding web `defineVars` and native styles; light/dark theming on native via RSD `css.defineVars`/`createTheme` with `prefers-color-scheme` defaults, matching web's layered model.
9. **Game surface rendering:** RN views + react-native-svg (reusing existing SVG card assets), Reanimated 4.5 + gesture-handler 2.32 (SDK-bundled versions; GH v3 hook-API migration waits for the SDK that bundles it). No Skia unless the board demands it.
10. **Testing:** jest-expo + @testing-library/react-native in the mobile workspace; monorepo root continues to orchestrate Vitest elsewhere. Game rules remain covered by `@sequence/game-logic`'s existing Vitest suite — the mobile app renders authoritative server state and previews legal targets, same as web.
11. **Lint/format:** oxlint + oxfmt, consistent with the monorepo root (and the vox reference app).
12. **Server authority unchanged:** `packages/api` remains the authority for auth, persistence, move validation, version guards, redaction, timers, and realtime; the mobile client renders snapshots + streamed events (the `GameSnapshotView`/`applyStreamItem` model proved on web).
13. **Agentic tooling is project scope:** Expo MCP + Argent configured as an early phase with committed repo config and agent instructions, so the rest of the build gets the screenshot/tap/inspect loop.
14. **Delivery:** TestFlight via EAS as the final, isolated phase.

## Constraints

- `@sequence/game-logic` stays framework-free — no React/RN imports added to it.
- The API's only changes are auth-plugin/config surface (Better Auth `expo()` plugin, `trustedOrigins`, any cookie-mode nuance) — no gameplay or persistence changes.
- The web app must not regress: the token-package refactor keeps `apps/web` visual output identical (verifiable via the `/dev` playground) and all existing root gates green.
- Monorepo conventions hold: Node 24, pnpm, explicit `.ts`/`.tsx` import extensions + `import type` (`verbatimModuleSyntax`) — Metro must be configured to resolve this convention (open question/spike).
- Dev-only tooling (playgrounds, MCP dev tools) must not ship in release builds — same discipline as web's `/dev` guard.
- No Tailwind/NativeWind — the repo standardized on StyleX/tokens.

## Success Criteria

- Full web-parity feature set playable on iOS: auth (email/password), guest invite join, create/join/lobby, realtime remote play, local pass-and-play with handoff, tap + drag play modes, dead-card turn-in, sequence-choice flow, timers, save/exit, concede, rematch, game over, history, notifications UX.
- Realtime robustness on mobile: reconnect/resubscribe recovery across app background/foreground and network drops (snapshot-first recovery, version-guarded moves — no desyncs).
- Session persists across app restarts (SecureStore-backed cookie) for registered users and game-scoped guests.
- Light/dark themes from shared tokens; visual quality on iPhone-class screens meets or beats mobile web.
- Agentic loop demonstrably works: an agent can build/run the app on a Simulator, capture screenshots, drive the UI (tap-by-testID/a11y tree), and read logs/component tree via the committed MCP setup.
- Quality gates green: typecheck, oxlint, oxfmt, jest-expo suite, plus existing root gates for touched packages.
- Final phase: TestFlight build installable by external testers, playing against the production API; smoke checklist documented.
- Documentation updated (docs/ map, mobile workspace README/AGENTS.md, configuration reference).

## Out of Scope

- Android verification/polish (backlog: deferred from iOS-first decision).
- https universal links (backlog).
- EAS Updates / OTA (backlog).
- Maestro e2e suite (backlog).
- Push notifications ("your turn" alerts) — see Deferred Ideas.
- Matchmaking, chat, monetization (unchanged from web MVP posture).
- Web app feature changes beyond the token-package refactor.
- App Store public release (TestFlight is the v1 finish line).

## Deferred Ideas

- **Push notifications** — turn-based multiplayer naturally wants "your turn" pushes; requires APNs setup + server-side send infrastructure. Deliberately not in v1; promote to backlog when iterating.
- **Maestro e2e** (backlogged) — post-parity regression gate, analog of web's Playwright.
- **EAS Updates** (backlogged) — OTA JS/asset updates; Hermes bytecode diffing makes updates small.
- **Universal links** (backlogged) — needs AASA file on the web deployment.
- **Android support** (backlogged) — Expo keeps it structurally close.
- **Xcode 27 MCP re-evaluation at GA** (backlogged) — if `mcpbridge` gains simulator tools, retire overlapping pieces.
- **`@trpc/tanstack-react-query` migration for web** — optional consistency cleanup, not scheduled.

## Open Questions

Design-phase (spec/design must resolve):

- **Offline/reconnect UX:** AppState-driven resubscribe + snapshot refresh on foreground; how moves fail/retry during brief disconnects (turn-based lowers stakes; still needs a deliberate call — carried over from the original 2026-rewrite open question). Mitigation for tRPC wsLink stuck-`pending` issue (#6962).
- **Metro + repo import convention:** verify Metro resolves `@sequence/game-logic`'s explicit-`.ts`-extension imports (package exports / sourceExts config); spike early.
- **pnpm linking mode:** isolated node_modules vs `nodeLinker: hoisted` escape hatch for the Expo workspace; SDK 56+ supports pnpm global virtual stores.
- **Env/app variants:** local-API vs production-API targeting (scheme naming, app.config env model — vox's staging/production variant pattern as reference; Sequence has no staging API today).
- **Mobile dev playground:** does a `/dev`-equivalent (fixture-driven component playground route) earn its place for the agent loop, reusing web's `game-fixtures` shapes?
- **Board interaction parity on touch:** tap-to-reveal + drag-with-validation ergonomics on small screens; spotlight affordance translation; board rotation; 6-player/3-team layout on phone.
- **Pass-and-play handoff UX** on a single phone (port of web's handoff interstitial).
- **MCP config placement:** what's committed (`.mcp.json`, agent instructions, Expo agent skills) vs user-local; how `expo-mcp`'s requires-dev-server constraint integrates into the workflow.
- **RSD specifics:** version pinning strategy; `data-layoutconformance` root setup; confirm RSD 0.0.55 on SDK 57 (peer-satisfied but unverified) — early spike alongside the auth spike.
- **Guest cookie flow on native:** game-scoped guest tokens are httpOnly cookies on web — confirm the SecureStore/manual-header path covers guests, not just registered sessions.

## Assumptions

- Expo SDK 57 remains the current stable through the project; no mid-project SDK migration.
- RSD 0.0.55 works on SDK 57/New Arch (peer ranges satisfied; Meta production usage on native) — validated by an early spike, with Unistyles v3 as the agreed chrome fallback.
- Better Auth server/client versions stay in lockstep and the Expo plugin supports our separate-Fastify-API topology (documented pattern).
- Apple Developer Program membership is available when the final phase starts.
- The production API needs no scaling changes for a second client type.

## Risks

- **React Strict DOM maturity:** 0.0.x, single 2026 npm publish, StyleX version skew vs web, native CSS gaps.
  - **Likelihood:** Medium — **Impact:** Medium
  - **Mitigation Ideas:** Hybrid containment (game surface unaffected); shared raw tokens (not shared `.stylex` files); early spike; Unistyles fallback pre-agreed.
- **Better Auth Expo plugin rough edges:** SecureStore key-format/oversized-token issues, cookie-header formatting, guest-cookie unknowns.
  - **Likelihood:** Medium — **Impact:** High (blocks everything downstream of auth)
  - **Mitigation Ideas:** Auth + session persistence spike as the first vertical slice; pin versions; test on device early.
- **Monorepo/Metro integration friction:** `.ts`-extension imports, pnpm isolated linking, dual test runners.
  - **Likelihood:** Medium — **Impact:** Medium
  - **Mitigation Ideas:** Foundation phase proves game-logic + tRPC client imports compile/run before any UI work; hoisted-linker escape hatch.
- **WS lifecycle on mobile:** background/foreground and radio handoffs stress the subscription model in ways web never did.
  - **Likelihood:** High (it will happen) — **Impact:** Medium
  - **Mitigation Ideas:** keepAlive + AppState resubscribe + snapshot-first recovery already designed server-side; make reconnect UX an explicit design topic.
- **Agent-tooling immaturity:** expo-mcp local tools are new; Argent needs a dev build; Xcode 27 landscape shifting.
  - **Likelihood:** Medium — **Impact:** Low (fallbacks: simctl screenshots, Orca computer-use)
  - **Mitigation Ideas:** Treat tooling phase as best-effort with documented fallbacks; re-evaluate at Xcode 27 GA.

## Next Steps

Spec-driven mode: continue to `oat-project-design`, which confirms requirements
and produces both `spec.md` and `design.md`. Suggested design-phase inputs: this
document, `docs/architecture.md`, the web-mvp and stylex-ui-refresh project
summaries, and the brainstorm research briefs (Expo SDK 57 stack, StyleX/RSD on
native, agentic iOS tooling — captured 2026-07-02).
