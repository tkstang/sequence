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

## End-of-Project Distillation Queue

- OAT workflow instruction candidate: treat dispatch ceilings as maximums, not
  selected effort levels. Implementer dispatch should choose the lowest
  sufficient pinned role, bounded by the configured ceiling.
- OAT workflow instruction candidate: when a subagent returns concerns that are
  locally diagnosable, the orchestrator should fix, verify, and re-engage the
  workflow instead of stopping at the concern.
- OAT subagent prompt candidate: pinned roles currently need self-contained
  prompts because they cannot be combined with full-history forks in the
  available multi-agent tool.
- OAT subagent prompt candidate: current multi-agent spawn calls accept either
  `message` or structured `items`, not both. Use a single self-contained
  `message` for pinned OAT roles unless a future tool version supports mixed
  payloads.
- OAT subagent coordination candidate: simulator-controlling subagents need
  exclusive ownership of the booted simulator during visual or scenario
  verification. If the orchestrator also drives routes/screenshots at the same
  time, screenshots can be mislabeled or capture the wrong route/theme.
- Repo `AGENTS.md` candidate: keep Expo Router tests out of `apps/mobile/src/app`
  because route-local test files can be included in Metro/export bundles.
- Repo `AGENTS.md` candidate: after adding or changing Expo native modules,
  run the package compatibility check, rebuild the dev client, and restart
  Metro with a cleared cache before treating simulator proof as meaningful.
- Repo `AGENTS.md` candidate: for game-surface work, pair unit/export gates with
  simulator visual proof because compact layout and native runtime failures have
  repeatedly escaped static checks.
- Repo `AGENTS.md` candidate: when tests assert formatted dates or times, avoid
  hardcoding local-time strings; compute the expected label with the same
  formatter or add a `TZ=UTC` check for expiry/date UI.
- Repo `AGENTS.md` candidate: local pass-and-play privacy tests should assert
  the full hand tree is absent during handoff (`hand.dock` and card testIDs),
  not just that individual card labels are missing.
- Repo `AGENTS.md` candidate: browser-driven live scenario probes should prefer
  authoritative API/dashboard state over transient connected-count labels for
  active presence transitions, and can launch Playwright with the system Chrome
  channel when the bundled browser cache is absent.
- Repo `AGENTS.md` candidate: when testing route-level subscriptions through
  the server-side tRPC caller harness, remember that production server hooks
  such as `setPresenceHook` are not automatically wired. Tests that need those
  hooks should install a controlled hook explicitly or exercise the production
  `buildServer` path.
- Repo `AGENTS.md` candidate: presence/lifecycle work needs tests for both
  pre-commit and post-commit reconnect races. A reconnect can arrive after a
  disconnect's initial replacement check but before the freeze transaction
  commits; the disconnect path must re-evaluate presence after a durable freeze.
- Repo `AGENTS.md` candidate: repeated board children should not receive
  route-inline callbacks directly. Use stable event/ref wrappers when a parent
  must call the latest handler without invalidating every memoized cell.
- Repo `AGENTS.md` candidate: mutable layout registries consumed by Reanimated
  worklets need an explicit revision/subscription contract. React dependency
  arrays only see object identity, not internal frame mutations.
- Repo `AGENTS.md` candidate: Expo Router production builds can still bundle
  guarded dev routes. A `__DEV__` layout redirect protects runtime access but
  does not prove the modules are absent from Hermes; exclude dev routes from
  the production router context and verify the exported bundle.
- Repo `AGENTS.md` candidate: Playwright config should be explicit about its
  module format and env fallback. In this Node/Playwright toolchain, a
  TypeScript config using `module: ESNext` failed before tests with `exports is
not defined`; an explicit `.cjs` config plus `packages/api/.env` fallback made
  local DB-backed e2e reproducible.
- Repo `AGENTS.md` candidate: production smoke harnesses for active games
  should keep authoritative player WebSocket streams open instead of opening
  short-lived active-game snapshot probes. Closing a short-lived stream can
  exercise the real presence freeze path and produce artificial lifecycle
  conflicts.
- Repo `AGENTS.md` candidate: direct production Better Auth probes should use
  the deployed trusted web origin unless the real Expo auth client is driving
  the request. A bare Node signup with `Origin: sequence://` was rejected in
  production even though local mobile-origin probes worked.
- Repo `AGENTS.md` candidate: production throwaway-account smoke should reuse a
  small account pair across flows and respect the auth route's rate limiter;
  repeated signup bursts can return `429` and obscure actual game-flow results.
- Skill candidate: create a general OAT project execution learnings skill from
  the orchestration, verification, and codebase-pattern notes in this file; keep
  the Expo MCP-specific skill sourced from `using-expo-mcp-learnings.md`.

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
- Current multi-agent spawn payloads are mutually exclusive between `message`
  and structured `items`. A dispatch attempt with both failed before agent
  creation; retrying with the same self-contained prompt as `message` worked.
  Prefer single-message dispatch prompts for OAT implementers until the tool
  contract changes.
- Treat a booted simulator as a shared mutable resource. A p10-t06 visual pass
  showed that running a simulator-driving subagent while the orchestrator also
  captures routes can move the app between screens, change theme state, and
  create misleading screenshot labels. Assign one agent exclusive simulator
  ownership for the duration of a scenario, or keep the scenario local and use
  subagents only for read-only review/checklist work.
- Evidence-only tasks should not manufacture source commits. For p11-t07, the
  production smoke harness lived in `/tmp`, source behavior passed, and the
  durable work was the implementation evidence plus learnings. The correct OAT
  commit is the bookkeeping commit that advances tracking artifacts, not an
  empty `test(...)` source commit.
- `oat-project-review-provide` has a stricter confirmation gate than ordinary
  implementation continuation. After implementing review fixes, the
  orchestrator can update bookkeeping and mark the review row
  `fixes_completed`, but it should not launch the next independent review
  unless the user explicitly requests or confirms that review step.

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
- Direct Node production smoke can use the transitive `ws` package from pnpm's
  installed store to attach `Cookie` and `Origin` headers to tRPC WebSocket
  connections. Node's built-in `WebSocket` accepted a third constructor
  argument syntactically in this run but did not send custom headers in a local
  upgrade-server probe.
- Direct production Better Auth signup probes should use the deployed
  `WEB_ORIGIN` (`https://sequence-online.vercel.app`) unless the actual Expo
  auth plugin/client is making the request. A bare Node request with
  `Origin: sequence://` returned `403 INVALID_ORIGIN` against production, while
  the deployed web origin worked.
- Production smoke should minimize auth creates. Reuse one throwaway host/guest
  account pair across create/join/play/save/concede/timer flows; repeated
  signup attempts hit the production auth-route limiter with `429 Too many
requests` and can mask unrelated flow status.
- Active-game smoke harnesses must avoid short-lived subscription probes once
  production presence hooks are wired. Keep the real seat streams open and
  maintain client state from initial snapshots plus mutation/stream events.
  Opening a one-shot active-game snapshot and closing it can trigger
  `PlayerDisconnected`/freeze behavior, especially around save/resume
  verification.
- Save/resume has no public `resume` mutation; the public contract resumes
  saved games when the full roster reconnects through `game.onGameEvent`.
  Smoke proof should save, verify the `myGames.resumables` card, reconnect the
  required streams, then confirm an active snapshot or `PlayerReconnected`
  event/version.
- Pending sequence-choice automation should choose a contiguous five-cell
  window containing the placed chip, not blindly `slice(0, 5)`. The local API
  harness shortcut can pass for some seeded/random games, but the production
  random smoke hit `invalid-sequence-choice` until the chooser used the placed
  cell to select the window.
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
- Mutable mobile board layout maps should publish a revision when registered
  frames change. In p11-t02, a drag snapshot effect that depended only on the
  `layoutMap` object identity could miss frame updates caused by layout
  mutation or rotation; `useSyncExternalStore` over `subscribe/getRevision`
  gives React a stable way to refresh the UI-thread frame snapshot.
- Do not pass volatile route-level callbacks straight into every memoized board
  cell. In p11-t02, an inline `onCellPress` callback from the route invalidated
  the board tree during selection. A stable `useCallback` wrapper backed by a
  ref preserves the latest handler while keeping repeated cell props stable.
- Rotating the mobile board must account for its non-square portrait-card
  geometry. A raw 90-degree transform can push visual cells outside the
  drag-layer touch area and produce negative or overflow layout-map frames;
  scale 90/270-degree rotations to the existing board bounds and apply the same
  transform to registered frames.
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
- Stream-driven notification effects should establish their first-seen cursor
  from the first visible stream view, then notify only for later event seqs.
  This prevents resumed screens, initial snapshots, or replayed current state
  from firing stale haptics while preserving live turn/event feedback.
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
- Do not run DB-resetting API integration tests against the same database used
  by a live simulator scenario. During p11-t01, `presence.test.ts` used the
  configured API test database and truncated users/games while the local API and
  simulator were still pointed at that same branch, invalidating the seeded
  mobile auth session and active local games. For simulator matrices, either
  finish the simulator evidence before DB-resetting tests, point tests at an
  isolated `DATABASE_URL_TEST`, or reseed the simulator account/game after the
  test run.
- Route-level subscription tests that use `h.caller(...).game.onGameEvent(...)`
  do not instantiate `buildServer`, so production module hooks wired from
  `server.ts` are absent unless the test sets them itself. During p11-t01, a
  first regression expected local presence to be updated by the production
  `PresenceTracker`, but the harness intentionally mounted only the router; the
  correct route regression installed an async `setPresenceHook` and asserted the
  first snapshot waited for that hook.
- Presence freeze/resume has a second race after the early replacement check.
  A replacement subscription can connect while the disconnect path is already
  committing the freeze; in that timing, `markConnected` observes the game as
  still active and cannot resume it. The disconnect path should publish the
  freeze, then call the normal resume check once the freeze is durable so the
  existing live presence can immediately append `PlayerReconnected` and restore
  `active`.
- Local pass-and-play handoff state should follow the server stream's
  `currentSeat`, with local `revealedSeat`/handoff state only controlling
  whether the hand is veiled. Privacy tests should assert no `CardHand` subtree
  renders during the veil; public last-move copy may mention the played card,
  so hand privacy should be checked through hand testIDs and card-face absence.

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
- After native Worklets/Reanimated/Gesture Handler changes, stale Metro bundles
  can crash a rebuilt dev client with low-level JSI assertions even when the
  native build is correct. Restart Metro with `--clear`, relaunch the dev
  client, and verify a fresh bundle load before diagnosing the native layer.
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
- For simulator scenario tasks, seeding a game for the account already signed
  into the dev client can avoid fragile manual auth while still proving the real
  mobile route, session, stream, and API authorization path. Pair that with
  public tRPC mutations and DB assertions so the evidence separates UI route
  proof from server-contract proof.
- When capturing web evidence against an already-running dev server, match the
  browser URL and auth-cookie origin to the server's configured API origin. The
  web client defaults to `http://localhost:3001`; injecting cookies for
  `127.0.0.1:3001` while visiting `localhost:3000` leaves the page stuck in a
  loading state even though the same cookie value is otherwise valid.
- Browser-driven lifecycle probes should assert authoritative state when
  possible. In p09-t07, closing a second web client correctly froze the game,
  but the active page's `1/2 connected` label was not a reliable initial
  assertion because connect events do not publish standalone active-state
  snapshots; polling `game.myGames` for `frozen` and then for resumable removal
  after reconnect was the stable contract proof.
- If Playwright's bundled browser cache is missing on a machine with system
  Chrome installed, a temporary scenario script can use
  `chromium.launch({ channel: "chrome" })` instead of stopping to download
  browsers. Record that as an environment workaround, not a product behavior.
- Expiry/date UI tests should not pin a local timezone unless the component does.
  During p09-t02, a saved-game test passed locally with Central-time copy but
  failed under `TZ=UTC`; compute the expected `Intl.DateTimeFormat` label in the
  test or run a UTC check when adding date/time assertions.
- For React Native game-surface perf passes, pair profiler output with a
  deterministic render-count regression. Argent/React DevTools can identify
  hot commits, but tests such as "only the changed board cell re-renders" and
  "parent callback identity does not re-render cells" make the memo contract
  durable across future route changes.
- For release-audit checks, treat "route is not reachable" and "route is not in
  the production bundle" as separate claims. During p11-t03, `expo export`
  proved that the guarded `/dev` route files still appeared in the Hermes bundle
  until Metro resolved `expo-router/_ctx` to a production-only `require.context`
  that excludes `./dev/*`.
- For full gate sweeps, verify that optional DB-backed gates actually see
  `DATABASE_URL_TEST` rather than silently skipping. During p11-t04, root tests
  and Playwright both needed explicit `packages/api/.env` fallback loading so a
  clean shell without root `.env` could run DB-backed API integration and web
  e2e gates instead of silently skipping or requiring manual env exports.

## Open Follow-Ups

- Distill general OAT dispatch and subagent lessons into future agent
  instructions after this project completes, using `project-learnings.md` as
  the source log.
- Distill Expo-specific simulator/MCP lessons from
  `using-expo-mcp-learnings.md` into the requested Expo MCP skill.
