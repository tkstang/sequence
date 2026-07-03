# Project Learnings

This file captures durable execution and codebase learnings from the
`mobile-mvp` project that are not specific to Expo MCP. Use it at the end of the
project to distill reusable skills, OAT workflow improvements, and repo-level
agent instructions.

Keep this file focused on lessons that should change future execution: OAT
workflow behavior, subagent coordination, repo conventions that were easy to
miss, verification mechanics, and implementation gotchas with durable reuse
value. Expo MCP and Argent usage details belong in
`using-expo-mcp-learnings.md`; anything broader belongs here.

## OAT Orchestration

- Keep a companion general learnings log next to any tool-specific learning
  log. For this project, `project-learnings.md` is the durable catch-all for
  OAT dispatch issues, subagent coordination lessons, repo agent-instruction
  candidates, and codebase gotchas, while `using-expo-mcp-learnings.md` stays
  focused on Expo MCP and Argent usage. This split should make end-of-project
  skill and `AGENTS.md` distillation mechanical instead of relying on chat
  history.
- Dispatch ceiling is a cap, not the default implementer effort. For implementer
  work, first classify the task (`low`, `medium`, `high`, `xhigh`), then select
  the lowest sufficient pinned role capped by the configured ceiling. A bounded
  chrome-kit task with preferred `medium` and ceiling `xhigh` should dispatch
  `oat-phase-implementer-medium`, not `oat-phase-implementer-xhigh`. Reviewer
  dispatch can still target the ceiling when the workflow calls for
  deterministic review quality.
- Resolvable subagent issues should be handled by the orchestrator without
  stopping implementation. If a subagent finishes with concerns that are
  locally diagnosable, inspect the worktree, apply the focused fix, re-run the
  relevant gates, and keep the task moving until the configured HiLL checkpoint
  or a true blocker.
- If a subagent stalls or is closed but leaves useful edits in the worktree,
  inspect those edits as candidate work rather than discarding them. Adopt,
  revise, and verify the useful portion locally, then continue.
- Pinned subagent roles cannot be combined with a full-history fork in the
  current multi-agent tool. For OAT dispatches that need a pinned role such as
  `oat-phase-implementer-medium`, send an explicit context package instead of
  using `fork_context: true`.

## Codebase Patterns

- Keep mobile route and route-adjacent tests out of `apps/mobile/src/app`
  entirely; Expo Router can bundle any `.test.*` file under the app tree into
  Metro. During p07-t08, `expo export --platform ios` failed because
  `apps/mobile/src/app/game-screen.test.tsx` imported Testing Library and
  pulled Node-only modules into the bundle; moving it to
  `apps/mobile/src/game/GameRouteScreen.test.tsx` restored export.
- Avoid `cleanup()` in the middle of a React Native route test. In the mobile
  game-screen test, mid-test cleanup followed by a second render triggered
  overlapping React `act()` warnings; use separate tests for separate route
  states, or rerender only when the mocked hook/source actually re-evaluates.
- Better Auth mobile clients need the mounted auth route, not only the API
  origin. In this repo `apiUrl` is the API origin for tRPC, while Better Auth
  REST is mounted at `/api/auth/*`; mobile auth config should normalize to
  `{apiUrl}/api/auth` before `sign-in/email`, `sign-up/email`, or
  `get-session` paths are appended.
- Expo typed routes may reject absolute auth URLs while generated route types
  lag or omit grouped auth routes. Prefer the typed-router-compatible route form
  that passes current typecheck, and use export/simulator proof to verify route
  behavior rather than assuming the visible URL path is enough.
- Treat React Strict DOM primitives as implementation details that still need
  device visual proof. In this app, native-backed chrome primitives (`View`,
  `Text`, `Pressable`, `ScrollView`) were more predictable for mobile layout
  than `html.*` wrappers when building reusable app chrome.
- When using React Native `StyleSheet` for layout, set direction explicitly on
  vertical stacks. The default flex direction differs from CSS expectations and
  can turn compact lists or headers into wide, stretched rows.
- React Strict DOM can be viable for token definition, but native-backed
  primitives were needed for the full initial chrome-kit surface: Button,
  TextField, Card, Badge, and Screen all needed native layout/control wrappers
  after simulator proof.
- tRPC React Query subscription inputs are part of the subscription key. Do not
  put a live event cursor in hook state that feeds the subscription input unless
  every event is supposed to force a resubscribe; track the cursor separately
  and move it into the input only during explicit recovery.
- On mobile foreground recovery, do not fully trust a JS-side socket state flag
  that still says `live` after backgrounding. App suspension can leave that flag
  stale, so AppState `background`/`inactive` → `active` should force
  resubscribe even when local state appears healthy.
- When adding guest access to an existing registered-user flow, review every
  route in the flow rather than only the terminal route. For the mobile join
  flow, making `/join/[code]` public was insufficient because anonymous users
  also need `/join/index` to enter an invite code; route-guard tests should
  encode the whole public subtree.
- Mobile lobby UI must render invalid intermediate team layouts, not only legal
  capacities. `game.setTeam` permits temporary overfilled teams while `game.start`
  gates legality, so fixed-capacity team slots can accidentally hide players;
  render at least `max(team capacity, seated players)` slots and cover that edge
  in tests.
- Guest-token transport must be proven on both HTTP and WebSocket paths. Mobile
  HTTP mutations can infer `gameId` from tRPC operation input, but subscriptions
  need an explicit active game context so the React Native WebSocket constructor
  can attach `sequence_guest` before opening the stream.
- Board-scale card rendering should memoize by semantic card value, not only by
  object identity. Game surfaces often allocate fresh `{rank, suit}` objects
  while representing the same card; `CardFace` should compare `rank`, `suit`,
  `size`, `style`, and `testID` so SVG faces do not repaint across equal-value
  rerenders.
- Mobile board layout maps should store board-local frames computed from the
  board grid, not row-local `onLayout` values from individual cell parents.
  The Sequence board uses portrait card-aspect cells, so frame registration and
  visual sizing must use the same card aspect ratio to keep future drag
  hit-testing aligned with what the player sees.
- Spotlight UI should be gated on a non-empty `validPlacements` target set, not
  just on "a card is selected". This preserves web parity and avoids dimming
  the entire board when a dead card or otherwise unplayable selected card has no
  legal targets.
- Dead-card hand affordances should stay hard-mode focused. Tap mode auto-swaps
  dead cards through the event stream, while drag mode needs visible badges and
  a turn-in control; nested turn-in controls should stop press propagation so
  turning in a card does not also toggle selected-card state.
- Mobile timers should treat the server deadline as the only source of truth.
  On deadline prop changes, reset the local clock baseline immediately; on
  expiry, clamp the display to `0:00` and wait for the stream to reflect any
  server-side forfeit instead of triggering client-side expiry behavior.
- Do not use a quiet subscription as proof that a mobile realtime connection is
  stale. During p07-t09, the mobile inactivity watchdog unconditionally
  resubscribed after 15 seconds without stream items; the aborted subscription
  hit the API presence `onDisconnect` hook and froze otherwise healthy active
  games. Watchdogs should check the transport state and resubscribe only when
  it is no longer live; quiet turns are normal gameplay, not disconnects.
- Simulator visual proof can catch compact playground regressions that unit
  tests and `expo export` miss. During p07-t08, the game-surface stories built
  and bundled successfully, but screenshots showed full hand fans clipping in
  narrow story cards and absolute player-rail status labels overlapping seat
  text. Prefer compact representative fixture data for previews and normal
  layout-flow status rows over absolute overlays inside small repeated cards.

## Verification Mechanics

- Use zsh arrays for simulator route sweeps. A scalar like
  `routes="index button ..."` will not split the way bash does under default
  zsh settings and can create bad screenshot filenames.
- Scratch-token propagation checks should run the web StyleX generator and then
  `oxfmt` the generated web token files before checking the diff. The generator
  writes valid values, while the formatter restores the repo's canonical quote
  style.
- Adding native/mobile-aware packages to the API can legitimately expand
  `pnpm-lock.yaml` with optional Expo peer snapshots when the monorepo already
  contains the mobile workspace. Review that the dependency boundary is correct
  before treating a large lockfile delta as suspicious.
- Better Auth's Expo client storage contract is synchronous (`getItem` returns
  `string | null`, `setItem` returns any), and Expo SecureStore SDK 57 provides
  matching sync methods in addition to the async API. Verify the package
  contract from installed types before swapping to async storage methods.
- The mobile cookie transport is intentionally explicit: Better Auth's Expo
  `getCookie()` feeds the tRPC `Cookie` header and native fetch uses
  `credentials: "omit"` to avoid relying on platform cookie jars. Guest-token
  lookup stays stubbed in `api/cookies.ts` until the planned guest store task.
- `@better-auth/expo` declares runtime peers that the app must install
  directly. Missing `expo-network` produced a simulator redbox only when the
  auth client initialized; install both `expo-network` and `expo-web-browser`
  for the plugin and add the `expo-web-browser` config plugin manually when
  using dynamic `app.config.ts`.
- After adding an Expo package, run Expo's compatibility check for the exact
  package, not just package-manager install/typecheck. In this project,
  `expo-haptics@~15.0.8` installed and typed but `expo install
  expo-haptics --check` reported it incompatible with Expo SDK 57; the
  compatible spec was `expo-haptics@~57.0.0`.
- Adding or changing Expo native modules requires a dev-client rebuild before
  simulator proof. JS tests and Metro can pass while the installed native app is
  still missing modules such as `ExpoSecureStore`, `ExpoNetwork`, or
  `ExpoWebBrowser`.
- If the local API database is unavailable, a disposable Neon branch is a good
  simulator-auth substitute for mutating local verification. Use the branch's
  direct read-write host for `drizzle-kit push`; pooled hosts can conflict with
  prepared-statement behavior.
- Opening Safari or another app in the simulator does not necessarily suspend a
  dev-client React Native JS subscription. To verify stale-cursor replay or
  snapshot fallback deterministically, add an explicit debug cursor control
  such as `/dev/stream?lastEventId=1` instead of relying on wall-clock
  background time.
- Passing a focused database-backed integration suite is not enough for API
  route tasks; run the scoped package typecheck afterward. A p06-t01 test helper
  passed at runtime but failed `tsgo` because cookie parsing produced
  `string | undefined` in a `.find()` callback.
- For simulator deep-link proof, clearly separate route/UI evidence from
  backend-contract evidence. A temporary local mock can prove
  `sequence://join/<code>` reaches the intended Expo Router screen and renders
  route-derived UI, but it should not be described as a real API-backed invite
  lookup unless the API/database environment is actually running.

## Open Follow-Ups

- Distill general OAT dispatch and subagent lessons into future agent
  instructions after this project completes, using `project-learnings.md` as
  the source log.
- Distill Expo-specific simulator/MCP lessons from
  `using-expo-mcp-learnings.md` into the requested Expo MCP skill.
