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

## Codebase Patterns

- Keep route-adjacent tests out of `apps/mobile/src/app`; Expo Router can bundle
  route-local test files into Metro. Place mobile component and route tests in
  non-route test locations unless a later pattern explicitly proves otherwise.
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
- Adding or changing Expo native modules requires a dev-client rebuild before
  simulator proof. JS tests and Metro can pass while the installed native app is
  still missing modules such as `ExpoSecureStore`, `ExpoNetwork`, or
  `ExpoWebBrowser`.
- If the local API database is unavailable, a disposable Neon branch is a good
  simulator-auth substitute for mutating local verification. Use the branch's
  direct read-write host for `drizzle-kit push`; pooled hosts can conflict with
  prepared-statement behavior.

## Open Follow-Ups

- Distill general OAT dispatch and subagent lessons into future agent
  instructions after this project completes.
- Distill Expo-specific simulator/MCP lessons from
  `using-expo-mcp-learnings.md` into the requested Expo MCP skill.
