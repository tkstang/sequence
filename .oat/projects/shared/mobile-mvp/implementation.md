---
oat_status: in_progress
oat_ready_for: null
oat_blockers:
  - task_id: p12-t01
    reason: 'Operator account/setup required: Expo CLI is not logged in, EAS CLI is not installed, EXPO_TOKEN/App Store Connect API env vars are unset, and pnpm dlx eas-cli is blocked by ignored-build approval.'
    since: 2026-07-04
oat_last_updated: 2026-07-04
oat_current_task_id: p12-t01
oat_generated: false
---

# Implementation: mobile-mvp

**Started:** 2026-07-03
**Last Updated:** 2026-07-04

> This document is used to resume interrupted implementation sessions.
>
> Conventions:
>
> - `oat_current_task_id` always points at the **next plan task to do** (not the last completed task).
> - When all plan tasks are complete, set `oat_current_task_id: null`.
> - Reviews are **not** plan tasks. Track review status in `plan.md` under `## Reviews` (e.g., `| final | code | passed | ... |`).
> - Keep phase/task statuses consistent with the Progress Overview table so restarts resume correctly.
> - Before running the `oat-project-pr-final` skill, ensure `## Final Summary (for PR/docs)` is filled with what was actually implemented.

## Progress Overview

| Phase    | Status      | Tasks | Completed |
| -------- | ----------- | ----- | --------- |
| Phase 1  | completed   | 8     | 8/8       |
| Phase 2  | completed   | 5     | 5/5       |
| Phase 3  | completed   | 8     | 8/8       |
| Phase 4  | completed   | 7     | 7/7       |
| Phase 5  | completed   | 7     | 7/7       |
| Phase 6  | completed   | 8     | 8/8       |
| Phase 7  | completed   | 9     | 9/9       |
| Phase 8  | completed   | 6     | 6/6       |
| Phase 9  | completed   | 7     | 7/7       |
| Phase 10 | completed   | 7     | 7/7       |
| Phase 11 | completed   | 7     | 7/7       |
| Phase 12 | in_progress | 15    | 9/15      |

**Total:** 88/94 tasks completed

---

## Phase 1: Foundation

**Status:** completed
**Started:** 2026-07-03

### Phase Summary

**Outcome (what changed):**

- Added the Expo SDK 57 `@sequence/mobile` workspace with Expo Router,
  TypeScript, Metro/Babel wiring, Jest, and root gate participation.
- Proved the monorepo seams by exporting a route that consumed
  `@sequence/game-logic` runtime data and the type-only `AppRouter` contract.
- Installed and launched the iOS development build on the simulator.
- Added the minimal mobile tRPC HTTP client and home-screen `health.ping`
  smoke status.
- Documented the mobile workspace stub and removed the temporary import spike
  route.

**Key files touched:**

- `apps/mobile/` - new Expo app workspace, config, route tree, tests, README,
  and dev-client dependency.
- `scripts/run-tests.mjs` / `vitest.workspace.ts` - root test orchestration
  includes mobile Jest and excludes mobile from Vitest collection.
- `pnpm-lock.yaml` - mobile workspace dependencies.

**Verification:**

- Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`
- Result: pass during p01-t05 with mobile included in the root gates.
- Run: `pnpm --filter @sequence/mobile test && pnpm --filter @sequence/mobile typecheck`
- Result: pass after p01-t08.
- Run: simulator launches/screenshots for p01-t06 and p01-t07.
- Result: pass; screenshots `/tmp/p01-t06-boot-home.png` and
  `/tmp/p01-t07-health-ping.png`.

**Notes / Decisions:**

- Expo CLI's simulator activation path can fail without `osascript` assistive
  access; direct `simctl launch --initialUrl` is the reliable simulator proof.
- Route-local tests under `src/app` are unsafe with Expo Router and now live
  outside the route tree.
- `p01-t07` local API smoke could not use `@sequence/api dev` because
  `packages/api/.env` was absent; simulator evidence used the documented
  production API origin while committed defaults remain localhost.

### Task p01-t01: Scaffold @sequence/mobile Expo workspace

**Status:** completed
**Commit:** fe544ee

**Outcome (required when completed):**

- Added the Expo SDK 57 `@sequence/mobile` workspace with Expo Router entry,
  `src/app` route root, Sequence Online app identity, scheme, and iOS bundle id.
- The placeholder home screen renders "Sequence Online" and Expo public config
  resolves with React Compiler enabled.

**Files changed:**

- `apps/mobile/package.json` - Expo SDK 57 workspace manifest, scripts, and
  runtime dependencies.
- `apps/mobile/app.config.ts` - app identity, scheme, iOS bundle id, router
  plugin, and React Compiler experiment.
- `apps/mobile/tsconfig.json` - initial Expo TypeScript config.
- `apps/mobile/src/app/_layout.tsx` - Expo Router stack root.
- `apps/mobile/src/app/index.tsx` - placeholder home route.
- `apps/mobile/.gitignore` - CNG native artifacts ignored.
- `pnpm-lock.yaml` - resolved mobile workspace dependencies.

**Verification:**

- Run: `pnpm install && pnpm --filter @sequence/mobile exec expo config --type public | head -20`
- Result: pass. Public config resolves SDK 57 and scheme `sequence`; targeted
  follow-up confirmed bundle id `com.tkstang.sequenceonline`.

**Notes / Decisions:**

- Jest-specific dev dependencies are deferred to p01-t04 to avoid introducing
  test-tool peer noise before the Jest setup task.

**Issues Encountered:**

- Expo SDK 57 companion modules use SDK-major package versions; adjusted the
  scaffold manifest to the registry-backed SDK 57 line.

---

### Task p01-t02: {Task Name}

**Status:** completed
**Commit:** 2890e84

**Outcome:**

- Mobile now has Expo Metro defaults, a Babel config using only
  `babel-preset-expo`, and TypeScript wired through the repo base config with
  React Native JSX settings.

**Files changed:**

- `apps/mobile/metro.config.js` - Expo Metro default config.
- `apps/mobile/babel.config.js` - Expo Babel preset.
- `apps/mobile/tsconfig.json` - repo base TypeScript config plus mobile JSX.
- `apps/mobile/package.json` - workspace format script covers new config files.

**Verification:**

- Run: `pnpm --filter @sequence/mobile typecheck && pnpm --filter @sequence/mobile lint && pnpm format:check`
- Result: pass.

**Notes / Decisions:**

- Root `oxlint`/`oxfmt` scripts already cover `apps/mobile` through the root
  `apps` glob, so no root config changes were needed for this task.

---

### Task p01-t03: Shared-import spike — game-logic + AppRouter under Metro

**Status:** completed
**Commit:** dac6545

**Outcome:**

- Added a temporary Expo Router spike route that imports board data from
  `@sequence/game-logic` and type-checks the `AppRouter` contract import from
  `@sequence/api`.
- Confirmed Metro can export the app with the repo's explicit `.ts` package
  imports without a resolver shim.

**Files changed:**

- `apps/mobile/package.json` - added workspace dependencies on
  `@sequence/game-logic` and `@sequence/api`.
- `apps/mobile/src/app/spike.tsx` - temporary import spike route rendering
  board dimensions and position count.
- `pnpm-lock.yaml` - linked the new workspace dependencies for mobile.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/mobile-export-spike`
- Result: pass. iOS bundle exported to `/tmp/mobile-export-spike`; no Metro
  resolve shim required.

**Notes / Decisions:**

- The spike route remains temporary and is scheduled for removal in p01-t08.

---

### Task p01-t04: jest-expo + Testing Library setup

**Status:** completed
**Commit:** 8d0205f

**Outcome:**

- Added `jest-expo` and React Native Testing Library coverage for the mobile
  home screen.
- Configured Jest to transform Expo, React Native, React Strict DOM, StyleX,
  and workspace packages needed by the mobile app.
- Added React Native test-environment shims and explicit Jest TypeScript
  globals so the mobile typecheck, lint, format, and test commands stay green.

**Files changed:**

- `apps/mobile/jest.config.js` - Expo Jest preset and transform allow-list for
  monorepo/mobile dependencies.
- `apps/mobile/src/test/setup.ts` - React Native/Jest environment shims and
  Testing Library configuration.
- `apps/mobile/src/app/index.test.tsx` - first component test for the home
  screen.
- `apps/mobile/tsconfig.json` - Jest globals for mobile test files.
- `apps/mobile/package.json` - mobile Jest and Testing Library dev
  dependencies.
- `package.json` - pnpm peer rule accepting the Expo SDK 57 `jest-expo` peer
  range while resolving the RN 0.86 Jest preset.
- `pnpm-lock.yaml` - resolved Jest dependency graph.

**Verification:**

- Run: `pnpm install`
- Result: pass; no React Native/Jest preset peer warning after the pnpm peer
  rule.
- Run: `pnpm --filter @sequence/mobile exec jest src/app/index.test.tsx --runInBand --detectOpenHandles`
- Result: pass, 1 test.
- Run: `pnpm --filter @sequence/mobile typecheck && pnpm --filter @sequence/mobile lint && pnpm --filter @sequence/mobile format && pnpm --filter @sequence/mobile test`
- Result: pass.

**Notes / Decisions:**

- React Native 0.86 declares `@react-native/jest-preset@0.86.0`; `jest-expo`
  57 still advertises `^0.85.0`. The installed graph uses the RN 0.86 preset,
  with a pnpm allowed-version rule for the lagging `jest-expo` peer range.

---

### Task p01-t05: Root gate integration

**Status:** completed
**Commit:** 95f1aca

**Outcome:**

- Root `pnpm test` now runs the existing Vitest workspace first and then the
  mobile Jest suite as a separate visible `@sequence/mobile` step.
- Vitest workspace discovery excludes `apps/mobile` because that workspace is
  owned by `jest-expo`.
- Existing root typecheck, lint, and format gates already cover the mobile
  workspace through the root package scripts.

**Files changed:**

- `scripts/run-tests.mjs` - orchestrates Vitest plus mobile Jest and preserves
  non-zero exit propagation for either runner.
- `vitest.workspace.ts` - narrows Vitest projects to `packages/*` and
  `apps/web` so mobile test files are not collected by Vitest.

**Verification:**

- Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`
- Result: pass. Output showed mobile typecheck in the recursive typecheck and
  a dedicated `[tests] @sequence/mobile Jest` step with 1 passing test.

**Notes / Decisions:**

- No root `package.json` script changes were required: typecheck already uses
  `pnpm -r`, lint/format already scan `apps`, and `pnpm test` delegates to
  `scripts/run-tests.mjs`.

---

### Task p01-t06: First dev build boots on the simulator

**Status:** completed
**Commit:** 5911833

**Outcome:**

- Added `expo-dev-client` to the mobile workspace and refreshed the lockfile.
- Ran CNG prebuild/build flow for the iOS simulator; generated native output
  remains ignored and untracked.
- Relocated the home route Jest test out of `src/app` after the dev build
  surfaced that Expo Router was bundling the route-local test file.
- Verified the installed development build launches on iPhone 17 Pro simulator
  and renders the home route.

**Files changed:**

- `apps/mobile/package.json` - adds `expo-dev-client`.
- `pnpm-lock.yaml` - records the dev-client dependency graph.
- `apps/mobile/.gitignore` - keeps Expo-generated `expo-env.d.ts` ignored with
  the generated native folders.
- `apps/mobile/tsconfig.json` - includes Expo's generated env declaration when
  present.
- `apps/mobile/src/test/index.test.tsx` - keeps the home-screen component test
  out of the Expo Router route tree.

**Verification:**

- Run: `pnpm --filter @sequence/mobile ios`
- Result: native build/install succeeded and Xcode reported `Build Succeeded`;
  Expo then exited non-zero because its Simulator activation path calls
  `osascript`, which still lacks assistive access in this shell.
- Run: `pnpm --filter @sequence/mobile exec expo start --dev-client --host localhost --port 8081`
- Result: Metro served the dev-client bundle.
- Run: `xcrun simctl launch --terminate-running-process 3F87B084-DD33-41D5-B4F5-88DA77989607 com.tkstang.sequenceonline --initialUrl 'exp+sequence-online://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081%3FdisableOnboarding%3D1&disableOnboarding=1'`
- Result: launched the installed dev build directly against Metro.
- Run: `xcrun simctl io 3F87B084-DD33-41D5-B4F5-88DA77989607 screenshot /tmp/p01-t06-boot-home.png`
- Result: pass; screenshot shows the mobile home route rendering
  "Sequence Online".
- Run: `git status --porcelain | grep -c apps/mobile/ios`
- Result: `0` output, confirming `apps/mobile/ios/` is not tracked.
- Run: `pnpm --filter @sequence/mobile typecheck && pnpm --filter @sequence/mobile lint && pnpm --filter @sequence/mobile format && pnpm --filter @sequence/mobile test`
- Result: pass.

**Notes / Decisions:**

- The Expo CLI's `openurl` path creates an iOS "Open in Sequence Online?"
  confirmation prompt. The dev launcher supports `--initialUrl`, so simulator
  proof used `simctl launch --initialUrl` after the native build installed.
- Route-local `*.test.tsx` files are unsafe under the Expo Router `src/app`
  tree because Metro's route context can collect them. Mobile route tests now
  live under `src/test`.

---

### Task p01-t07: health.ping screen via minimal tRPC client

**Status:** completed
**Commit:** e463438

**Outcome:**

- Added a minimal HTTP-only tRPC client for mobile using the shared
  `AppRouter` type contract, TanStack Query, and `credentials: 'omit'`.
- Wired the Expo Router root through QueryClient + tRPC providers.
- Added Expo config `extra.apiUrl` / `extra.wsUrl` defaults and a tested env
  resolver.
- Updated the home route to render `health.ping` status at `testID`
  `home.ping`.

**Files changed:**

- `apps/mobile/src/api/client.ts` - tRPC/TanStack client helpers and provider
  exports.
- `apps/mobile/src/api/env.ts` - Expo Constants extra resolver with localhost
  defaults.
- `apps/mobile/src/api/env.test.ts` - scoped Jest coverage for default and
  configured API endpoints.
- `apps/mobile/src/app/_layout.tsx` - QueryClient/tRPC providers around the
  route stack.
- `apps/mobile/src/app/index.tsx` - safe-area home route rendering the ping
  result.
- `apps/mobile/src/test/index.test.tsx` - home route component test updated
  for the ping state.
- `apps/mobile/app.config.ts` - mobile API URL extras.
- `apps/mobile/package.json` / `pnpm-lock.yaml` - tRPC and React Query deps.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/api/env.test.ts`
- Result: pass, 2 tests.
- Run: `pnpm --filter @sequence/mobile typecheck && pnpm --filter @sequence/mobile lint && pnpm --filter @sequence/mobile test && pnpm format:check`
- Result: pass.
- Run: `curl -sS -f 'https://sequence-api-production-8687.up.railway.app/trpc/health.ping'`
- Result: pass, returned `{"pong":true}`.
- Run: `EXPO_PUBLIC_API_URL=https://sequence-api-production-8687.up.railway.app EXPO_PUBLIC_WS_URL=wss://sequence-api-production-8687.up.railway.app pnpm --filter @sequence/mobile exec expo start --dev-client --host localhost --port 8081`, then `xcrun simctl launch --terminate-running-process 3F87B084-DD33-41D5-B4F5-88DA77989607 com.tkstang.sequenceonline --initialUrl 'exp+sequence-online://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081%3FdisableOnboarding%3D1&disableOnboarding=1'`
- Result: pass. Metro logged successful `health.ping` query responses; screenshot
  `/tmp/p01-t07-health-ping.png` shows "pong: true".

**Notes / Decisions:**

- The actual local API dev server was not runnable in this checkout because
  `packages/api/.env` is absent and no `DATABASE_URL`/`DATABASE_URL_TEST`
  exists in the shell. Simulator evidence used the documented production API
  origin; the committed app defaults remain the planned localhost endpoints.

---

### Task p01-t08: Workspace doc stubs + spike cleanup

**Status:** completed
**Commit:** 3d61683

**Outcome:**

- Added the initial `apps/mobile/README.md` with purpose, commands, API config,
  and early development notes.
- Removed the temporary `src/app/spike.tsx` import spike route now that the
  monorepo import proof is recorded.

**Files changed:**

- `apps/mobile/README.md` - mobile workspace quick reference and dev workflow
  pointer.
- `apps/mobile/src/app/spike.tsx` - deleted temporary proof route.

**Verification:**

- Run: `pnpm --filter @sequence/mobile test && pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `test ! -e apps/mobile/src/app/spike.tsx`
- Result: pass; spike route removed.

**Notes / Decisions:**

- Full mobile docs remain planned for p11-t06; this README is intentionally a
  Phase 1 stub.

---

## Phase 2: Agent Tooling

**Status:** completed
**Started:** 2026-07-03

### Task p02-t01: MCP configuration + expo-mcp local tools

**Status:** completed
**Commit:** 0e51aa5
**Fix Commit:** 3e5b0c1

**Outcome:**

- Added project MCP config entries for the official remote Expo MCP server and
  Argent while preserving the existing Neon MCP entry.
- Added `expo-mcp` as a mobile dev dependency and confirmed the installed
  local server exposes screenshot, tap-by-testID, view inspection, log
  collection, RN DevTools, and router sitemap tools.
- Verified the running simulator app through the local Expo MCP stdio server
  and captured a screenshot returned by `automation_take_screenshot`.

**Files changed:**

- `.mcp.json` - adds `expo` HTTP and `argent` stdio MCP servers.
- `apps/mobile/package.json` - adds `expo-mcp` to mobile dev dependencies.
- `pnpm-lock.yaml` - records the Expo MCP dependency graph.

**Verification:**

- Run: `pnpm --filter @sequence/mobile add -D expo-mcp@^0.2.4`
- Result: pass; dependency installed and lockfile updated.
- Run: `pnpm install`
- Result: pass; lockfile current. pnpm reported the existing ignored
  `unrs-resolver` build-script warning.
- Run: `pnpm --filter @sequence/mobile exec expo-mcp --help`
- Result: pass; CLI exposes `--dev-server-url`, `--root`, `--app-id`,
  `--platform`, and `--collect-logs`.
- Run: Expo dev server on port 8081, direct `simctl launch --initialUrl`, then
  MCP stdio `initialize` / `tools/list` / `tools/call` for
  `automation_take_screenshot`.
- Result: pass; tool list contained `automation_find_view`,
  `automation_take_screenshot`, `automation_tap`, `collect_app_logs`,
  `expo_router_sitemap`, and `open_devtools`. Screenshot evidence:
  `/tmp/p02-t01-expo-mcp-screenshot.jpg`.
- Run: Argent MCP stdio `initialize` / `tools/list` with
  `npx -y @swmansion/argent mcp`.
- Result: pass; server reported `argent` v0.14.0 and 69 tools, including
  `screenshot`, `gesture-tap`, `describe`, `native-describe-screen`, and
  `debugger-log-registry`.

**Notes / Decisions:**

- The root `.mcp.json` already existed for Neon; this task preserved it and
  added only the planned mobile agent-loop servers.
- The current Argent CLI requires the `mcp` subcommand to start its stdio MCP
  server, so the committed config uses `npx -y @swmansion/argent mcp`.
- The first screenshot attempt timed out, then a second attempt reported
  `No booted simulator devices found` after the simulator had shut down. After
  rebooting the iPhone 17 Pro simulator and relaunching the dev build, the MCP
  screenshot tool succeeded.
- `packages/api/.env` is absent in this checkout, so the screenshot shows the
  expected local `health.ping` connection error. This does not affect the
  p02-t01 MCP tool proof.

---

### Task p02-t02: testID convention + identifier helper

**Status:** completed
**Commit:** 24b317b

**Outcome:**

- Added the `screen.element[.qualifier]` testID helper with a typed screen-name
  union and empty-segment validation.
- Added focused Jest coverage for convention formatting and rejected empty
  segments.
- Retrofitted the home `health.ping` status to use the helper while preserving
  the `home.ping` value, and extended the home test to assert the testID.

**Files changed:**

- `apps/mobile/src/test/test-ids.ts` - testID helper and screen-name union.
- `apps/mobile/src/test/test-ids.test.ts` - convention coverage.
- `apps/mobile/src/app/index.tsx` - `home.ping` now comes from the helper.
- `apps/mobile/src/test/index.test.tsx` - asserts the home ping testID.

**Verification:**

- RED run: `pnpm --filter @sequence/mobile exec jest src/test/test-ids.test.ts`
- Result: failed as expected because `./test-ids.ts` did not exist.
- GREEN run: `pnpm --filter @sequence/mobile exec jest src/test/test-ids.test.ts src/test/index.test.tsx`
- Result: pass, 2 suites / 3 tests.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile format`
- Result: pass/format applied; scoped Jest rerun passed afterward.

**Notes / Decisions:**

- Route-local tests remain outside `src/app`; the new convention tests live
  under `src/test`.

---

### Task p02-t03: apps/mobile/AGENTS.md - the agent loop

**Status:** completed
**Commit:** 3b3b5c2

**Outcome:**

- Added mobile-specific agent instructions documenting the build, launch,
  screenshot, testID drive, and log-inspection loop for simulator work.
- Documented local Expo MCP and Argent tool names, the optional remote Expo MCP
  OAuth boundary, `simctl` / Orca fallbacks, dev-build requirements, generated
  artifact guardrails, and mobile import/testID conventions.
- Added `apps/mobile/CLAUDE.md` as a symlink to `AGENTS.md`.

**Files changed:**

- `apps/mobile/AGENTS.md` - mobile command reference, FR17 agent loop, MCP
  tool names, fallbacks, testID convention, and guardrails.
- `apps/mobile/CLAUDE.md` - symlink to the shared mobile agent instructions.

**Verification:**

- Run: `pnpm format:check`
- Result: pass.
- Run: manual read-through against the design's Agent Tooling section.
- Result: pass; every FR17 deliverable has a documented command/tool path,
  including screenshot, testID drive, logs, Argent inspection, and fallbacks.

**Notes / Decisions:**

- The instructions explicitly keep Expo MCP, Argent, simulator artifacts, and
  screenshots out of shipped runtime surfaces.

---

### Task p02-t04: Operator runbook scaffold

**Status:** completed
**Commit:** 4a927c1

**Outcome:**

- Added the durable mobile operator runbook with Sections 0-7 scaffolded in
  the required Why / When / Prerequisites / Steps / Verify /
  Troubleshooting shape.
- Authored Section 0 for local machine setup and Section 1 for Expo account
  plus optional remote MCP OAuth.
- Marked Sections 2-7 as authored by the phase that discovers the need and
  executed in Phase 12.
- Linked the runbook from the docs index Operations section.

**Files changed:**

- `docs/mobile-operator-runbook.md` - new mobile operator runbook.
- `docs/index.md` - Operations link for the new runbook.

**Verification:**

- Run: `pnpm format:check`
- Result: pass.
- Run: `test -f docs/mobile-operator-runbook.md && rg -n "mobile-operator-runbook.md|## 0\\. Local Machine Setup|## 1\\. Expo Account|## 7\\. Production Smoke" docs/index.md docs/mobile-operator-runbook.md`
- Result: pass; the runbook exists, the index link is present, and the first,
  second, and final sections are discoverable.

**Notes / Decisions:**

- Phase 12 remains the execution point for Apple, EAS signing, TestFlight,
  physical-device, and production smoke operator work.

---

### Task p02-t05: FR17 agent-loop demo + evidence

**Status:** completed
**Commit:** 92dd239

**Outcome:**

- Executed the documented FR17 agent loop against the installed iOS dev build
  and running Metro server with `EXPO_UNSTABLE_MCP_SERVER=1`.
- Verified Expo MCP local automation through stdio for tool discovery,
  screenshot capture, `home.ping` view inspection, and app log collection.
- Verified Argent MCP as the native fallback for iOS accessibility-tree reads
  and tap execution when Expo MCP `automation_tap` was not reliable.
- Captured project-specific Expo MCP / Argent learnings for later skill
  distillation.

**Files changed:**

- `apps/mobile/AGENTS.md` - updates the documented agent loop with local MCP
  enablement, one-shot log collection, direct stdio framing, deep-link prompt
  avoidance, and Argent native-devtools launch requirements.
- `.oat/projects/shared/mobile-mvp/references/using-expo-mcp-learnings.md` -
  running learnings log for the later Expo MCP skill.

**Verification:**

- Run: `EXPO_UNSTABLE_MCP_SERVER=1 EXPO_PUBLIC_API_URL=https://sequence-api-production-8687.up.railway.app EXPO_PUBLIC_WS_URL=wss://sequence-api-production-8687.up.railway.app pnpm --filter @sequence/mobile exec expo start --dev-client --host localhost --port 8081`
- Result: pass; Metro served the app and logged successful `health.ping`
  query responses.
- Run: `xcrun simctl launch --terminate-running-process 3F87B084-DD33-41D5-B4F5-88DA77989607 com.tkstang.sequenceonline --initialUrl ...`
- Result: pass; the dev client launched without operator input.
- Run: Expo MCP stdio `tools/list` / `automation_take_screenshot`.
- Result: pass; tool list exposed `automation_find_view`,
  `automation_take_screenshot`, `automation_tap`, `collect_app_logs`,
  `expo_router_sitemap`, and `open_devtools`; screenshot evidence:
  `/tmp/p02-t05-expo-mcp-screenshot.jpg`.
- Run: Expo MCP stdio `automation_find_view` for `home.ping`.
- Result: pass; returned `exists: true`, `is_hittable: true`, and label
  `pong: true`.
- Run: Expo MCP stdio `collect_app_logs` with `sources:
["js_console","native_ios"]`.
- Result: pass; returned markdown-formatted CDP and iOS simulator log sections.
- Run: Expo MCP stdio `automation_tap` for `home.ping`.
- Result: tool gap; direct invocation returned `Cannot read properties of
undefined (reading 'bundleIdentifier')`; the `pnpm exec` retry timed out and
  then returned `Unexpected end of JSON input` during cleanup.
- Run: `npx -y @swmansion/argent tools`; Argent MCP `list-devices`,
  `describe`, `boot-device`, `launch-app`, `open-url`,
  `native-describe-screen`, and `gesture-tap`.
- Result: pass; Argent reported v0.14.0 / 69 tools, found the iPhone 17 Pro,
  read the visible accessibility tree, injected native devtools after an
  Argent boot/launch, returned `native-describe-screen` `status: ok` with
  `pong: true`, and tapped the normalized `pong: true` point.
- Run: `pnpm format:check`
- Result: pass.

**Notes / Decisions:**

- The Expo MCP screenshot/find/log criteria are satisfied by local MCP tool
  calls. The tap criterion is satisfied through the approved Argent fallback
  because Expo MCP `automation_tap` is currently unreliable on this host.
- Argent native tools need an Argent-managed boot/launch path for native
  devtools injection; launching outside Argent can leave
  `native-describe-screen` in `restart_required`.
- The `open-url` path can surface the iOS "Open in Sequence Online?"
  confirmation prompt, so the AGENTS fallback now prefers
  `simctl launch --initialUrl` for prompt-free startup.
- The new `using-expo-mcp-learnings.md` reference will be distilled into an
  Expo MCP skill at the end of the project.

---

## Phase 3: Tokens, Theming, Chrome Kit

**Status:** completed
**Started:** 2026-07-03

### Phase Summary

**Outcome (what changed):**

- Added framework-free design tokens, generated web StyleX token/theme files
  from them, and wired mobile RSD token vars to the same palette source.
- Verified the React Strict DOM token bridge on the iOS simulator in both
  light and dark schemes, then added persisted mobile theme mode support.
- Built the first mobile chrome kit surface: Button, TextField, Card, Badge,
  and Screen, plus a dev-only playground with list/detail stories and theme
  toggle.
- Device visual proof moved layout-sensitive chrome components to native-backed
  React Native primitives while preserving their public APIs.
- Proved token propagation by introducing and reverting a scratch token: an
  incomplete token failed dark-palette parity, and the completed scratch token
  passed through mobile vars, web StyleX generation, and mobile/web typechecks.

**Key files touched:**

- `packages/design-tokens/` - source palette and dimension tokens plus web
  StyleX generator.
- `apps/web/src/styles/tokens.stylex.ts` /
  `apps/web/src/styles/themes.stylex.ts` - generated web token consumers.
- `apps/mobile/src/theme/` - full mobile token vars and persisted theme
  provider.
- `apps/mobile/src/components/` - initial chrome-kit primitives and tests.
- `apps/mobile/src/app/dev/` / `apps/mobile/src/dev/` - dev-only kit
  playground and story registry.

**Verification:**

- Run: design-token Vitest, web build/test/typecheck, mobile Jest/typecheck/
  lint/format, Expo iOS rebuild for AsyncStorage, simulator visual screenshots
  for the RSD spike, dev playground, and every kit story in light/dark mode.
- Result: pass. Phase 3 screenshot evidence includes `/tmp/p03-t03-*`,
  `/tmp/p03-t07-*`, and `/tmp/p03-t08-{light,dark}-{index,button,text-field,card,badge,screen}.png`.

**Notes / Decisions:**

- RSD remains useful for token vars, but the initial mobile chrome-kit
  component implementations are native-backed for predictable iOS layout and
  control behavior.
- Route tests stay outside `src/app` because Expo Router can bundle route-local
  tests into Metro.

### Task p03-t01: packages/design-tokens

**Status:** completed
**Commit:** d2395ed
**Fix Commit:** 6d3da25

**Outcome:**

- Added the framework-free `@sequence/design-tokens` workspace package.
- Extracted the web light/dark palette and dimensional token values into raw
  TypeScript exports without importing StyleX, React, DOM, Expo, or native
  runtime code.
- Added Vitest coverage for light/dark palette key parity and expected
  dimension-group exports.

**Files changed:**

- `packages/design-tokens/package.json` - package manifest, exports, and test
  script.
- `packages/design-tokens/src/index.ts` - public exports.
- `packages/design-tokens/src/palette.ts` - light/dark color tokens and
  `ColorToken` union.
- `packages/design-tokens/src/dimensions.ts` - spacing, radius, shadow,
  typography, and z-index values.
- `packages/design-tokens/src/palette.test.ts` - parity and dimension tests.
- `pnpm-lock.yaml` - workspace package entry.

**Verification:**

- Run: `pnpm --filter @sequence/design-tokens exec vitest run src/palette.test.ts`
- Result: pass, 1 file / 2 tests.

**Notes / Decisions:**

- `6d3da25` removes a token-test lint warning after the initial package commit.

---

### Task p03-t02: Web consumes design-tokens (value-identical)

**Status:** completed
**Commit:** 1ef4f5d

**Outcome:**

- Refactored web token/theme generation to source values from
  `@sequence/design-tokens`.
- Added a design-token script that writes the StyleX token/theme files from the
  framework-free package, preserving the existing web token values exactly.
- Added the web workspace dependency on `@sequence/design-tokens`.

**Files changed:**

- `packages/design-tokens/scripts/write-web-stylex.ts` - writes generated web
  StyleX token/theme files from raw tokens.
- `packages/design-tokens/package.json` - adds `generate:web-stylex` script and
  `tsx` dev dependency.
- `apps/web/src/styles/tokens.stylex.ts` - generated StyleX vars.
- `apps/web/src/styles/themes.stylex.ts` - generated light/dark themes.
- `apps/web/package.json` - depends on `@sequence/design-tokens`.
- `pnpm-lock.yaml` - dependency graph updates.

**Verification:**

- Run: `pnpm --filter @sequence/web build`
- Result: pass; Next compiled successfully and produced the expected routes.
- Run: `pnpm --filter @sequence/web test`
- Result: pass, 23 files / 103 tests.
- Run: `pnpm typecheck`
- Result: pass across `packages/game-logic`, `packages/api`, `apps/mobile`,
  and `apps/web`.
- Run: Playwright screenshots of `/dev` via system Chrome at
  `http://127.0.0.1:3002/dev`.
- Result: pass; screenshots captured:
  `/tmp/p03-t02-web-dev-light.png` and `/tmp/p03-t02-web-dev-dark.png`.

**Notes / Decisions:**

- The StyleX compiler path uses the plan's codegen contingency rather than
  direct cross-package static imports; raw values remain sourced from
  `@sequence/design-tokens`.

---

### Task p03-t03: RSD spike + sign-off gate

**Status:** completed
**Commit:** 7bb701d
**Gate:** PASS

**Outcome:**

- Added the minimal React Strict DOM spike route at `/rsd-spike`.
- Added RSD `css.defineVars` wrapping light/dark values from
  `@sequence/design-tokens`.
- Added the RSD Babel preset for native and pinned `react-strict-dom` at
  `0.0.55`.
- Verified the RSD surface renders on the iOS simulator and dark values apply
  when the simulator appearance flips.

**Files changed:**

- `apps/mobile/babel.config.js` - adds `react-strict-dom/babel-preset`.
- `apps/mobile/package.json` - adds `@sequence/design-tokens` and
  `react-strict-dom`.
- `apps/mobile/src/app/rsd-spike.tsx` - temporary RSD spike route.
- `apps/mobile/src/theme/vars.css.ts` - minimal RSD variable wrapper.
- `pnpm-lock.yaml` - dependency graph updates.

**Verification:**

- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: Metro LAN dev server with production health override, existing installed
  dev client, `xcrun simctl launch --initialUrl`, `sequence://rsd-spike`, and
  `xcrun simctl ui ... appearance light|dark`.
- Result: pass; RSD route renders, and light/dark screenshots show token values
  changing. Evidence:
  `/tmp/p03-t03-rsd-light-clean.png` and
  `/tmp/p03-t03-rsd-dark-clean.png`.

**Notes / Decisions:**

- The initial inherited `pnpm --filter @sequence/mobile ios` process ran for
  over 20 minutes without completing and was terminated. Because p03-t03 only
  changes JS/Babel/runtime package inputs and the dev client was already
  installed, verification used the installed dev build plus Metro LAN mode.
- Metro LAN mode with the host IP was required for this simulator pass;
  `127.0.0.1` / `localhost` dev-client URLs failed to connect from the iOS
  runtime in this run.
- The first RSD render emitted a runtime warning for `flex: 1` without a flex
  parent; the route now uses `minHeight: '100%'`, and the clean screenshot pass
  had no RSD runtime errors.

---

### Task p03-t04: Full token vars + ThemeProvider + useTheme

**Status:** completed
**Commit:** a0ca075

**Outcome:**

- Replaced the temporary RSD spike variables with a full light/dark
  `css.defineVars` wrapper sourced from `@sequence/design-tokens`.
- Added a mobile `ThemeProvider` and `useTheme()` hook that expose
  `{ mode, setMode, scheme, colors }` with a safe provider-less fallback.
- Persisted the theme mode under `sequence-theme`, wired native appearance
  overrides for explicit light/dark modes, and kept `system` mode synced to
  `Appearance` changes.
- Wrapped the Expo Router stack in the theme provider and removed the temporary
  `/rsd-spike` route.

**Files changed:**

- `apps/mobile/src/theme/vars.css.ts` - full token variable wrapper.
- `apps/mobile/src/theme/theme-provider.tsx` - persisted provider and native
  appearance bridge.
- `apps/mobile/src/theme/use-theme.ts` - theme context, types, storage key, and
  fallback hook behavior.
- `apps/mobile/src/theme/theme-provider.test.tsx` - provider persistence,
  override, system-follow, and fallback tests.
- `apps/mobile/src/app/_layout.tsx` - wraps the app in `ThemeProvider`.
- `apps/mobile/src/app/rsd-spike.tsx` - removed after RSD sign-off.
- `apps/mobile/package.json` / `pnpm-lock.yaml` - AsyncStorage dependency.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/theme/theme-provider.test.tsx`
- Result: pass, 1 file / 4 tests.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile test`
- Result: pass, 4 suites / 9 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile exec expo run:ios --no-bundler --device 3F87B084-DD33-41D5-B4F5-88DA77989607`
- Result: pass; native rebuild succeeded and included
  `Pods/AsyncStorage-AsyncStorage_resources`.

**Notes / Decisions:**

- React Native 0.86 types `ColorSchemeName` as `light | dark | unspecified`;
  returning to system mode therefore calls
  `Appearance.setColorScheme('unspecified')`.

---

### Task p03-t05: Chrome kit — Button + TextField

**Status:** completed
**Commit:** 9444737

**Outcome:**

- Added the first RSD chrome-kit primitives: `Button` and `TextField`.
- `Button` supports primary, secondary, and destructive variants, small/medium/
  large sizes, disabled behavior, testID passthrough, and press handling.
- `TextField` supports small/medium/large sizes, disabled behavior, testID
  passthrough, controlled/default values, placeholder text, and `onChangeText`.
- Tests cover render behavior, handler invocation, disabled states, and
  styling-agnostic public API acceptance.

**Files changed:**

- `apps/mobile/src/components/Button.tsx` - RSD button primitive over token
  vars.
- `apps/mobile/src/components/Button.test.tsx` - public API and interaction
  coverage.
- `apps/mobile/src/components/TextField.tsx` - RSD text input primitive over
  token vars.
- `apps/mobile/src/components/TextField.test.tsx` - public API and interaction
  coverage.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/components/Button.test.tsx src/components/TextField.test.tsx`
- Result: pass, 2 suites / 8 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.

**Notes / Decisions:**

- The components intentionally use the RSD web-shaped props (`data-testid`,
  `onClick`, `onChange`) and rely on the RSD native adapter for testID,
  press, and text-input mappings.
- Dispatch note: this task was delegated to `oat-phase-implementer-xhigh`
  because the orchestrator incorrectly treated the project dispatch ceiling as
  the selected implementer effort. The selected effort should have been
  `medium` for this bounded task. The code result is accepted, but future
  implementer dispatches should select the lowest sufficient effort capped by
  the ceiling.

---

### Task p03-t06: Chrome kit — Card, Badge, Screen scaffold

**Status:** completed
**Commit:** b5214b2

**Outcome:**

- Added RSD chrome-kit `Card`, `Badge`, and safe-area-aware `Screen`
  primitives.
- `Card` supports surface variants, raised elevation, children rendering, and
  testID passthrough.
- `Badge` supports neutral, accent, saved/frozen, and team-color variants plus
  small/medium/large sizes and testID passthrough.
- `Screen` provides a safe-area root, optional header slot, static content mode,
  and a scroll mode backed by React Native `ScrollView`.

**Files changed:**

- `apps/mobile/src/components/Card.tsx` / `Card.test.tsx` - card primitive and
  tests.
- `apps/mobile/src/components/Badge.tsx` / `Badge.test.tsx` - badge primitive
  and tests.
- `apps/mobile/src/components/Screen.tsx` / `Screen.test.tsx` - screen scaffold
  and tests.
- `apps/mobile/src/test/setup.ts` - adds the RN 0.86 `KeyboardObserver` mock
  required by `ScrollView` in Jest.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/components`
- Result: pass, 5 suites / 15 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.

**Notes / Decisions:**

- The subagent's first `Screen` scroll path used an RSD `div` with
  `overflow: scroll`; the orchestrator tightened it to a native `ScrollView`
  before accepting the task.
- Rendering `ScrollView` under Jest on RN 0.86 requires a `KeyboardObserver`
  TurboModule mock on iOS. The setup change keeps the component test using the
  real native primitive rather than a local test mock.

---

### Task p03-t07: Dev playground scaffold + kit stories

**Status:** completed
**Commit:** de17181
**Fix Commit:** f28fae6

**Outcome:**

- Added the dev-only `/dev` playground route group with a production-mode route
  guard, story list, story detail route, kit fixture registry, and in-playground
  theme toggle.
- Added fixtures for Button, TextField, Card, Badge, and Screen so the chrome
  kit can be inspected from a running development build.
- Moved the production-mode route guard test out of `src/app` after Metro
  proved route-local tests can be bundled by Expo Router during dev-client
  startup.
- Stabilized the visual playground by switching layout-sensitive app chrome
  primitives and route wrappers to native-backed `View` / `Text` / `Pressable`
  / `ScrollView` surfaces while keeping the public component APIs intact.

**Files changed:**

- `apps/mobile/src/app/dev/_layout.tsx` - development-only route guard and
  stack registration.
- `apps/mobile/src/app/dev/index.tsx` - kit playground story list and theme
  toggle.
- `apps/mobile/src/app/dev/[story].tsx` - kit story detail route and fixtures.
- `apps/mobile/src/dev/stories.ts` - chrome-kit story registry.
- `apps/mobile/src/dev/dev-layout.test.tsx` - production-mode route guard test.
- `apps/mobile/src/components/Button.tsx` - native-backed button visual
  implementation.
- `apps/mobile/src/components/Card.tsx` - native-backed card visual
  implementation.
- `apps/mobile/src/components/Screen.tsx` - native-backed screen and header
  scaffold.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/components src/dev/dev-layout.test.tsx`
- Result: pass, 6 suites / 16 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: Metro LAN dev server, `xcrun simctl openurl booted "sequence:///dev"`,
  and simulator screenshots.
- Result: pass. Evidence:
  `/tmp/p03-t07-dev-playground-accepted.png` and
  `/tmp/p03-t07-dev-story-button-final.png`.

**Notes / Decisions:**

- Metro startup failed when the `_layout` test lived in `src/app/dev` because
  Expo Router bundled the route-local test and pulled in Testing Library's Node
  stdlib imports. The test now lives under `src/dev`.
- Simulator proof showed RSD `html.button` and route/card wrappers producing
  oversized or stretched native layouts. `Button`, `Card`, `Screen`, and the
  dev routes now use native layout primitives with theme-token colors.
- `simctl io booted screenshot` wrote the target PNGs and then hung; evidence
  files were valid after interrupting the command.

---

### Task p03-t08: Both-scheme visual verification

**Status:** completed
**Commit:** b2083f8

**Outcome:**

- Captured light and dark simulator screenshots for the dev playground index
  and every chrome-kit story route.
- Fixed the visual issues surfaced by that sweep by moving `TextField` and
  `Badge` to native-backed React Native primitives with theme-token colors.
- Updated TextField tests to use native `changeText` interaction and assert
  native disabled state.
- Proved FR16 token propagation with a scratch token that was reverted before
  committing: incomplete light-only coverage failed dark-palette parity, then
  completed light/dark + mobile vars + web StyleX generation passed mobile and
  web typechecks.

**Files changed:**

- `apps/mobile/src/components/TextField.tsx` - native `TextInput` backed
  implementation with theme-token colors and placeholder/disabled handling.
- `apps/mobile/src/components/TextField.test.tsx` - native change and disabled
  assertions.
- `apps/mobile/src/components/Badge.tsx` - native `View` / `Text` backed badge
  implementation with theme-token colors.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/components`
- Result: pass, 5 suites / 15 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm --filter @sequence/web typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/design-tokens exec vitest run src/palette.test.ts`
- Result: pass, 1 file / 2 tests.
- Run: `pnpm format:check`
- Result: pass.
- Run: light/dark simulator screenshot sweep over `sequence:///dev`,
  `sequence:///dev/button`, `sequence:///dev/text-field`,
  `sequence:///dev/card`, `sequence:///dev/badge`, and
  `sequence:///dev/screen`.
- Result: pass. Evidence:
  `/tmp/p03-t08-light-index.png`,
  `/tmp/p03-t08-light-button.png`,
  `/tmp/p03-t08-light-text-field.png`,
  `/tmp/p03-t08-light-card.png`,
  `/tmp/p03-t08-light-badge.png`,
  `/tmp/p03-t08-light-screen.png`,
  `/tmp/p03-t08-dark-index.png`,
  `/tmp/p03-t08-dark-button.png`,
  `/tmp/p03-t08-dark-text-field.png`,
  `/tmp/p03-t08-dark-card.png`,
  `/tmp/p03-t08-dark-badge.png`,
  `/tmp/p03-t08-dark-screen.png`.

**Notes / Decisions:**

- The p03-t08 subagent stalled, but it left useful partial `TextField` and
  `Badge` native-backed edits. The orchestrator inspected, adopted, completed,
  and verified them locally.
- The scratch-token proof was not committed; the committed tree has no scratch
  token drift.

---

## Phase 4: Auth Vertical Slice

**Status:** completed
**Started:** 2026-07-03

### Task p04-t01: API — Better Auth expo() plugin + trustedOrigins

**Status:** completed
**Commit:** eb58299

**Outcome:**

- Added the Better Auth Expo plugin to the API auth configuration.
- Extended trusted origins so the native `sequence://` scheme is always
  trusted, while the Expo development `exp://**` wildcard is allowed only
  outside production.
- Added focused config coverage for plugin registration and production versus
  non-production trusted-origin behavior.

**Files changed:**

- `packages/api/src/user/auth.ts` - registers `expo()` and computes native/dev
  trusted origins.
- `packages/api/src/user/auth-expo.test.ts` - focused Better Auth Expo config
  tests.
- `packages/api/package.json` - adds `@better-auth/expo`.
- `pnpm-lock.yaml` - resolves the new API dependency.

**Verification:**

- Run: `pnpm --filter @sequence/api exec vitest run src/user/auth-expo.test.ts`
- Result: pass, 1 file / 3 tests. Subagent recorded the expected RED failure
  before implementation.
- Run: `pnpm --filter @sequence/api test`
- Result: pass in subagent run, 53 passed / 110 skipped; DB-backed suites
  skipped because `DATABASE_URL_TEST` was absent.
- Run: `pnpm --filter @sequence/api typecheck`
- Result: pass.
- Run: `pnpm lint`
- Result: pass with existing warnings only.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass in subagent run.

**Notes / Decisions:**

- `DATABASE_URL_TEST` was absent, so the plan's Neon-backed integration path
  could not execute on this machine. The focused config test is non-skipped and
  covers the required p04-t01 behavior.
- `pnpm-lock.yaml` changed substantially because adding `@better-auth/expo`
  records optional Expo peer snapshots from the existing mobile workspace; the
  dependency boundary remains the task-declared API package addition.

---

### Task p04-t02: Mobile auth client + SecureStore session

**Status:** completed
**Commit:** 24088c1

**Outcome:**

- Added the mobile Better Auth client using `createAuthClient` and the Better
  Auth Expo client plugin.
- Wired Better Auth session storage to Expo SecureStore with a stable
  `sequence.auth` prefix and Expo-supported key names.
- Exported `authClient`, `useSession`, `signIn`, `signUp`, `signOut`, and
  `getCookie` for later auth screens and tRPC cookie-header transport.
- Added focused tests for plugin configuration, env-derived base URL, and
  SecureStore key compatibility.

**Files changed:**

- `apps/mobile/src/auth/client.ts` - Better Auth Expo client and SecureStore
  storage adapter.
- `apps/mobile/src/auth/client.test.ts` - client configuration and key-format
  tests.
- `apps/mobile/package.json` - adds `better-auth`, `@better-auth/expo`, and
  `expo-secure-store`.
- `pnpm-lock.yaml` - resolves the new mobile auth dependencies.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/auth/client.test.ts`
- Result: pass, 1 suite / 3 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.

**Notes / Decisions:**

- Better Auth's Expo client storage contract is synchronous, and Expo
  SecureStore SDK 57 provides matching sync `getItem` / `setItem` methods.
- The API and mobile workspaces are now both pinned to Better Auth
  `1.6.18`.

---

### Task p04-t03: Cookie-header transport in tRPC client

**Status:** completed
**Commit:** 4d3e24c

**Outcome:**

- Added `buildCookieHeader()` for explicit native `Cookie` header assembly
  from the Better Auth Expo session cookie and, when available, a game-scoped
  guest token.
- Added the temporary guest-token lookup stub that p06-t05 will replace with
  the SecureStore-backed guest store.
- Wired the mobile tRPC HTTP batch link to send the assembled `Cookie` header
  while keeping native fetch on `credentials: 'omit'`.
- Added coverage for session-only cookies, merged guest cookies, absent
  credentials, and the guest-token stub.

**Files changed:**

- `apps/mobile/src/api/cookies.ts` - explicit cookie-header helper and guest
  token lookup stub.
- `apps/mobile/src/api/cookies.test.ts` - cookie-header behavior tests.
- `apps/mobile/src/api/client.ts` - tRPC HTTP link now injects the explicit
  cookie header and keeps `credentials: 'omit'`.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/api/cookies.test.ts`
- Result: pass, 1 suite / 4 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.

**Notes / Decisions:**

- Design calls for explicit cookie-header transport over relying on native
  cookie jars; this task keeps that boundary in `apps/mobile/src/api`.
- Guest-token persistence remains intentionally stubbed until p06-t05.

---

### Task p04-t04: Login/signup/logout + protected routing

**Status:** completed
**Commit:** e6d202a
**Fix Commit:** d97bf0d

**Outcome:**

- Added login and signup route screens backed by the Better Auth mobile client.
- Added protected root routing so authenticated sessions see the home route and
  unauthenticated sessions see the auth routes.
- Added signed-in home-screen session copy and logout behavior.
- Hardened the integration after review by pointing the Better Auth client at
  the API's mounted `/api/auth` route, moving route tests out of `src/app`,
  and adding secure native password-entry passthrough to `TextField`.

**Files changed:**

- `apps/mobile/src/app/(auth)/login.tsx` - login form, validation, error
  rendering, and auth-client submit flow.
- `apps/mobile/src/app/(auth)/signup.tsx` - signup form, validation, error
  rendering, and auth-client submit flow.
- `apps/mobile/src/app/_layout.tsx` - session-gated protected route groups.
- `apps/mobile/src/app/index.tsx` - signed-in session card and logout action.
- `apps/mobile/src/auth/client.ts` / `client.test.ts` - Better Auth base URL
  normalization to `/api/auth`.
- `apps/mobile/src/auth/login-screen.test.tsx` /
  `signup-screen.test.tsx` - auth route tests kept outside the route tree.
- `apps/mobile/src/test/root-layout.test.tsx` / `index.test.tsx` - protected
  routing and logout coverage outside the route tree.
- `apps/mobile/src/components/TextField.tsx` / `TextField.test.tsx` - secure
  text-entry passthrough for password inputs.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/auth/client.test.ts src/auth/login-screen.test.tsx src/auth/signup-screen.test.tsx src/components/TextField.test.tsx src/test/root-layout.test.tsx src/test/index.test.tsx --runInBand`
- Result: pass, 6 suites / 21 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p04-t04`
- Result: pass; iOS bundle exported to
  `/tmp/sequence-mobile-export-p04-t04`.

**Notes / Decisions:**

- Better Auth appends endpoint paths to `baseURL`; because the API mounts
  Better Auth under `/api/auth/*`, the mobile client must use
  `{apiUrl}/api/auth` rather than the tRPC API origin alone.
- The auth route tests were moved out of `src/app` to preserve the Expo Router
  route-tree rule proven in Phase 3.
- Expo's generated typed-route declaration currently accepts the relative auth
  navigation strings used here; the export smoke confirms the route tree still
  bundles cleanly.

---

### Task p04-t05: Session probe + central error policy

**Status:** completed
**Commit:** a64c521

**Outcome:**

- Added a central tRPC error-policy mapper for auth, participation, backoff,
  conflict/refetch, and game-rule violation cases.
- Wired the signed-in home screen to probe `health.me`, render the probed user
  email when available, and redirect to login when the probe returns
  `UNAUTHORIZED`.
- Added focused mapper tests and off-route home-screen tests for the session
  probe, unauthorized redirect, ping status, and logout behavior.

**Files changed:**

- `apps/mobile/src/api/error-policy.ts` - central tRPC error-to-action mapper.
- `apps/mobile/src/api/error-policy.test.ts` - unit coverage for every planned
  mapping.
- `apps/mobile/src/app/index.tsx` - `health.me` query, unauthorized redirect,
  and probed-user session display.
- `apps/mobile/src/test/index.test.tsx` - home-screen probe, redirect, ping,
  and logout coverage outside the route tree.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/api/error-policy.test.ts src/test/index.test.tsx --runInBand`
- Result: pass, 2 suites / 8 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass in subagent run.

**Notes / Decisions:**

- `health.me` is now the preferred source for the displayed signed-in user;
  the Better Auth session hook remains a fallback while the probe is pending or
  unavailable.
- Non-auth error-policy actions are mapped now and intentionally consumed by
  future game/realtime screens in later phases.

---

### Task p04-t06: Session persistence scenario (simulator)

**Status:** completed
**Commit:** 8d260e3

**Outcome:**

- Verified the mobile auth persistence path on the iPhone 17 Pro simulator
  against a local API pointed at a disposable Neon branch.
- Signed up a throwaway user, confirmed the home route rendered the
  `health.me` email and `health.ping` result, terminated the app, relaunched,
  and confirmed the session remained authenticated without a spinner-block.
- Logged out through the mobile UI, confirmed the login route returned, then
  terminated and relaunched again to verify the cleared session stayed logged
  out.
- Fixed the simulator-only runtime redbox from missing Better Auth Expo peer
  dependencies by installing `expo-network` and `expo-web-browser`, adding the
  `expo-web-browser` config plugin, and rebuilding the dev client.
- Deleted the disposable Neon branch after evidence capture.

**Files changed:**

- `apps/mobile/package.json` - installs the Better Auth Expo runtime peers
  `expo-network` and `expo-web-browser`.
- `apps/mobile/app.config.ts` - registers the `expo-web-browser` config plugin
  required by dynamic Expo config.
- `pnpm-lock.yaml` - resolves the added Expo SDK 57 modules.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - captures
  non-Expo-MCP project lessons from p04-t06.
- `.oat/projects/shared/mobile-mvp/references/using-expo-mcp-learnings.md` -
  captures simulator/Argent/Expo MCP lessons and evidence paths from p04-t06.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/auth/client.test.ts src/test/root-layout.test.tsx src/test/index.test.tsx --runInBand`
- Result: pass, 3 suites / 9 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo run:ios --no-bundler --device 3F87B084-DD33-41D5-B4F5-88DA77989607`
- Result: pass; rebuilt dev client included `ExpoNetwork` and
  `ExpoWebBrowser` pods. Xcode emitted the existing duplicate `-lc++` and Expo
  Dev Launcher script dependency warnings only.
- Run: simulator scenario via local API + Metro LAN dev-client URL.
- Result: pass. Evidence:
  `/tmp/p04-t06-signed-in.png`, `/tmp/p04-t06-after-restart.png`,
  `/tmp/p04-t06-after-logout.png`,
  `/tmp/p04-t06-after-logout-relaunch.png`,
  `/tmp/p04-t06-after-peer-fix.json`,
  `/tmp/p04-t06-after-logout-2.json`, and
  `/tmp/p04-t06-after-logout-relaunch.json`.

**Notes / Decisions:**

- `packages/api/.env`, root `.env`, `DATABASE_URL_TEST`, a local Postgres
  daemon, and Docker were unavailable, so the local API used a disposable Neon
  branch for the simulator auth flow.
- The disposable Neon branch schema was applied with `drizzle-kit push` against
  the branch's direct read-write host, then the branch was deleted after the
  scenario.
- `@better-auth/expo` imports `expo-network` during auth-client setup and can
  dynamically import `expo-web-browser` for browser flows; both are installed
  explicitly in the mobile workspace.
- `expo start --dev-client --host localhost` listened on IPv6 loopback only
  during this run; `--host lan` with the Mac's LAN IP was the reliable simulator
  bundle route.

---

### Task p04-t07: Phase gate sweep + configuration docs

**Status:** completed
**Commit:** dc3fde7

**Outcome:**

- Documented the mobile Expo public API URL model in the canonical
  configuration reference.
- Added mobile variable rows for `EXPO_PUBLIC_API_URL` and
  `EXPO_PUBLIC_WS_URL`, including their `extra.apiUrl` / `extra.wsUrl`
  defaults and runtime use.
- Updated the mobile operator runbook with an auth-slice simulator reminder to
  choose the API endpoint before starting Metro and to rebuild the dev client
  after native auth peer/config plugin changes.
- Ran the full root Phase 4 gate sweep through the delegated OAT implementer.

**Files changed:**

- `docs/configuration.md` - mobile env variable reference and mobile API URL
  section.
- `docs/mobile-operator-runbook.md` - auth-slice simulator setup and native
  module rebuild troubleshooting notes.

**Verification:**

- Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`
- Result: pass in delegated p04-t07 run. `pnpm lint` emitted existing warnings
  only; mobile Jest emitted the existing Watchman recrawl warning only.

**Notes / Decisions:**

- The mobile env variables are documented as public Expo config values, not
  secrets.
- The Better Auth mobile client is documented as appending `/api/auth` itself,
  so operators configure only the API origin in `EXPO_PUBLIC_API_URL`.

---

## Phase 5: Realtime Plumbing + Client-State Extraction

**Status:** completed
**Started:** 2026-07-03

### Phase Summary

**Outcome (what changed):**

- Extracted shared framework-free client state into `@sequence/client-state`
  and moved the web game route onto that package.
- Added mobile cookie-authenticated WebSocket subscriptions with shared
  keepalive, retry, lazy-close, and inactivity-watchdog timing constants.
- Added the mobile `useGameStream()` hook with snapshot-first projection,
  explicit cursor-based recovery, AppState foreground recovery, lifecycle
  logging, and a 15s watchdog.
- Added a reusable connection banner and `/dev/stream` debug route for live
  raw stream and lifecycle verification.
- Verified two-client web/mobile realtime, API restart recovery,
  foreground recovery, and stale-cursor snapshot fallback beyond the replay
  window.

**Key files touched:**

- `packages/client-state/` - shared reducer, fixtures, and rule-violation
  message catalog.
- `apps/mobile/src/api/client.ts` / `ws.ts` / `cookies.ts` - explicit cookie
  WebSocket and HTTP transport plumbing.
- `apps/mobile/src/realtime/` - stream hook, lifecycle manager, and timing
  constants.
- `apps/mobile/src/components/ConnectionBanner.tsx` and
  `apps/mobile/src/app/dev/stream.tsx` - debug and connection UI surfaces.

**Verification:**

- Run: `pnpm --filter @sequence/client-state test`; `pnpm --filter @sequence/web test`; `pnpm --filter @sequence/web typecheck`; `pnpm --filter @sequence/web build`; `pnpm typecheck`.
- Result: pass during p05-t02.
- Run: targeted mobile realtime/component Jest suites, mobile typecheck/lint,
  and `pnpm format:check`.
- Result: pass across p05-t03 through p05-t07.
- Run: local API + web + Metro LAN + iOS dev-client p05-t07 scenario.
- Result: pass; measured recovery was within contract and stale-cursor
  snapshot fallback was proven with `lastEventId=1`.

**Notes / Decisions:**

- Simulator backgrounding through non-UI controls did not suspend dev-client JS
  strongly enough to leave a stale cursor, so p05-t07 added an explicit
  dev-stream stale-cursor control to exercise that recovery path.

### Task p05-t01: Extract @sequence/client-state

**Status:** completed
**Commit:** 6e74bcc

**Outcome:**

- Added the framework-free `@sequence/client-state` workspace package for
  shared game-view state projection.
- Copied the web route's snapshot/event reducer, screen routing helper, and
  representative fixtures into the package without changing web consumption
  yet.
- Added a shared rule-violation message catalog with coverage for all 13
  current `RuleViolation['code']` variants from `@sequence/game-logic`.
- Exported the view-state helpers, fixtures, and violation-message utilities
  from the package root for upcoming web and mobile consumers.

**Files changed:**

- `packages/client-state/package.json` / `tsconfig.json` - new workspace
  package configuration.
- `packages/client-state/src/game-state.ts` / `game-state.test.ts` - shared
  snapshot/event view-state projection and tests.
- `packages/client-state/src/fixtures.ts` - representative game-state fixtures
  adapted from the web dev playground.
- `packages/client-state/src/violation-messages.ts` /
  `violation-messages.test.ts` - shared rule-violation message catalog and
  exhaustive coverage tests.
- `packages/client-state/src/index.ts` - package exports.
- `pnpm-lock.yaml` - adds the new workspace importer.

**Verification:**

- Run: `pnpm --filter @sequence/client-state exec vitest run`
- Result: pass, 2 files / 10 tests.
- Run: `pnpm --filter @sequence/client-state typecheck`
- Result: pass.
- Run: `pnpm exec oxlint packages/client-state`
- Result: pass.
- Run: `pnpm exec oxfmt --check packages/client-state`
- Result: pass in delegated p05-t01 run.
- Run: `rg -n "from ['\"](react|next|fastify|drizzle|postgres|@trpc|@tanstack|@/|\\.\\./\\.\\./apps|document|window|fetch)" packages/client-state -S`
- Result: no matches.

**Notes / Decisions:**

- Web imports intentionally remain unchanged until p05-t02, which owns web
  consumption and deletion of the old web-local files.
- `@sequence/client-state` depends only on `@sequence/game-logic` at runtime.

---

### Task p05-t02: Web consumes client-state

**Status:** completed
**Commit:** 87271e2

**Outcome:**

- Added `@sequence/client-state` as a web workspace dependency.
- Updated the web game route, game components, controllers, tests, and dev
  playground to import shared view-state types, fixtures, and
  `ruleViolationMessage()` from `@sequence/client-state`.
- Removed the now-duplicated web-local `game-state.ts`,
  `game-state.test.ts`, and `game-fixtures.ts` files.
- Preserved the web fixture smoke test as a web integration check over the
  shared package fixtures plus web dead-card controller behavior.

**Files changed:**

- `apps/web/package.json` / `pnpm-lock.yaml` - web now depends on
  `@sequence/client-state`.
- `apps/web/src/app/game/[id]/page.tsx` - imports shared stream reducer,
  screen routing, view-state types, and rule-violation message helper.
- `apps/web/src/app/game/[id]/components/**` - imports shared view-state types
  and fixtures from the package.
- `apps/web/src/app/dev/_playground/stories.tsx` - imports shared game
  fixtures for the development playground.
- Deleted `apps/web/src/app/game/[id]/components/game-state.ts`,
  `game-state.test.ts`, and `game-fixtures.ts`.

**Verification:**

- Run: `pnpm --filter @sequence/client-state test`
- Result: pass, 2 files / 10 tests.
- Run: `pnpm --filter @sequence/web test`
- Result: pass, 22 files / 95 tests.
- Run: `pnpm --filter @sequence/web typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/web build`
- Result: pass in delegated p05-t02 run.
- Run: `pnpm typecheck`
- Result: pass in delegated p05-t02 run.
- Run: `pnpm format:check`
- Result: pass in delegated p05-t02 run.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- The initial delegated web build caught a stale `/dev` playground fixture
  import; the final commit updates it to `@sequence/client-state`.
- The old package-local reducer tests now live under `packages/client-state`;
  web keeps only the fixture/controller integration smoke.

---

### Task p05-t03: AuthedWebSocket + wsLink split transport

**Status:** completed
**Commit:** 3c20b66
**Fix Commit:** 2c3cd91

**Outcome:**

- Added mobile `splitLink` transport so tRPC subscriptions use `wsLink` while
  queries and mutations continue through `httpBatchLink`.
- Added an `AuthedWebSocket` ponyfill that resolves the explicit Better Auth /
  guest cookie header via `buildCookieHeader()` and passes it as the React
  Native WebSocket options argument.
- Added shared mobile WebSocket timing constants for keepalive, lazy close, and
  reconnect backoff.
- Hardened WebSocket URL construction so `EXPO_PUBLIC_WS_URL` values with a
  trailing slash still produce a single `/trpc` suffix.

**Files changed:**

- `apps/mobile/src/api/client.ts` - split subscriptions to `wsLink`, preserving
  explicit-cookie HTTP behavior for queries/mutations.
- `apps/mobile/src/api/ws.ts` / `ws.test.ts` - authed WebSocket ponyfill,
  WebSocket client options, URL normalization, and timing-contract tests.
- `apps/mobile/src/realtime/timing.ts` - WebSocket keepalive, lazy, and retry
  constants.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/api/ws.test.ts --runInBand`
- Result: pass, 1 suite / 6 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.

**Notes / Decisions:**

- tRPC's WebSocket client uses `addEventListener`, so the authed wrapper queues
  listeners while awaiting `buildCookieHeader()` and attaches them once the
  underlying native WebSocket is constructed.
- The timing contract is centralized under `apps/mobile/src/realtime/timing.ts`
  for later lifecycle/watchdog work.

---

### Task p05-t04: useGameStream with snapshot-first event application

**Status:** completed
**Commit:** 73f1469
**Fix Commit:** 060493f

**Outcome:**

- Added a mobile `useGameStream()` hook that subscribes to
  `game.onGameEvent` and applies stream snapshots/events through the shared
  `@sequence/client-state` reducer.
- The hook exposes the projected `GameViewState`, connection state, latest
  applied event sequence, and an explicit `resubscribe()` recovery action.
- The stream state initializes from snapshots before applying incremental
  events, including tRPC's `{ data }` subscription payload wrapper shape.
- Hardened cursor handling so the latest event sequence is tracked without
  changing the live subscription key on every received event.

**Files changed:**

- `apps/mobile/src/realtime/use-game-stream.ts` - stream subscription hook,
  snapshot/event reducer bridge, connection-state mapping, cursor tracking, and
  explicit resubscribe action.
- `apps/mobile/src/realtime/use-game-stream.test.tsx` - hook coverage for
  snapshot initialization, event application, connection states, wrapped
  subscription payloads, and explicit resubscription.
- `apps/mobile/package.json` / `pnpm-lock.yaml` - mobile now depends on
  `@sequence/client-state`.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/realtime/use-game-stream.test.tsx --runInBand`
- Result: pass, 1 suite / 5 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.

**Notes / Decisions:**

- tRPC's React Query subscription hook keys the subscription by input. Keeping
  `lastEventId` as regular React state in that input would resubscribe on every
  event; the accepted implementation stores the live cursor in a ref and only
  moves it into the subscription input when recovery explicitly requests it.

---

### Task p05-t05: AppState lifecycle + inactivity watchdog

**Status:** completed
**Commit:** 6a4c8ce
**Fix Commit:** 1826565

**Outcome:**

- Added a reusable realtime lifecycle manager for AppState foreground checks,
  connection-state transitions, inactivity watchdog scheduling, and forced
  resubscribe reasons.
- Wired `useGameStream()` into that lifecycle manager so subscription start,
  stream items, transport connecting/idle states, and subscription errors feed
  one connection-state source.
- Added a console-backed shared mobile logger that emits timestamped lifecycle
  state transitions for later NFR2 recovery-time measurement.
- Added the 15s inactivity watchdog timing constant, matching the design's
  two-missed-keepalive hard ceiling.
- Hardened foreground recovery so a background→active transition forces
  resubscribe even when the local socket flag still reports `live`.

**Files changed:**

- `apps/mobile/src/realtime/lifecycle.ts` / `lifecycle.test.ts` - lifecycle
  manager, AppState liveness checks, watchdog behavior, transition logging,
  and fake-timer coverage.
- `apps/mobile/src/realtime/use-game-stream.ts` /
  `use-game-stream.test.tsx` - lifecycle integration and quieted hook-test
  logger output.
- `apps/mobile/src/realtime/timing.ts` - inactivity watchdog ceiling.
- `apps/mobile/src/lib/logger.ts` - shared console-backed logger.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/realtime/lifecycle.test.ts src/realtime/use-game-stream.test.tsx --runInBand`
- Result: pass, 2 suites / 9 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.

**Notes / Decisions:**

- Foreground recovery treats the prior AppState transition as authoritative:
  after backgrounding, the lifecycle resubscribes even if the JS-side socket
  flag still says `live`, because mobile suspension can leave that flag stale.

---

### Task p05-t06: Connection banners + debug event feed

**Status:** completed
**Commit:** e33ef1b

**Outcome:**

- Added a `ConnectionBanner` chrome component that renders nothing while live
  and shows clear connecting, reconnecting, or error copy for degraded stream
  states.
- The banner exposes the planned stable testID
  `game.connection.banner`.
- Added a development-only `/dev/stream` route that accepts a game id,
  subscribes to raw `game.onGameEvent` items, and renders recent timestamped
  stream payloads for agent debugging.

**Files changed:**

- `apps/mobile/src/components/ConnectionBanner.tsx` /
  `ConnectionBanner.test.tsx` - connection-state banner and tests.
- `apps/mobile/src/app/dev/stream.tsx` - raw event stream debug route.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/components/ConnectionBanner.test.tsx --runInBand`
- Result: pass, 1 suite / 2 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.

**Notes / Decisions:**

- The debug stream screen remains under the development-only `/dev` route
  group and does not add route-local tests under `src/app`.

---

### Task p05-t07: Two-client live + recovery-time verification

**Status:** completed
**Commit:** 0111bb5
**Fix Commits:** c4a9033, e5a5c97
**Evidence Update:** 50664e7

**Outcome:**

- Ran the local API, web client, Metro LAN dev server, and installed iOS dev
  client against a disposable local Postgres database.
- Created a web game, signed the simulator into the same local account, and
  subscribed from mobile on `/dev/stream?gameId=...` with the mounted
  lifecycle stream hook.
- Verified live two-client traffic: the web client received
  `game.onGameEvent` subscription traffic through join/start, and the mobile
  debug stream received snapshot/event ids through `5` after the second player
  joined and the host started the game.
- Measured API process kill/restart recovery from lifecycle logs:
  detection after kill was `4.106s`, recovery from restart command was
  `8.548s`, and recovery from actual API listen was `1.626s`.
- Measured background/foreground recovery using non-UI simulator controls:
  foreground command to `app-active` lifecycle transition was `0.898s`, and
  foreground command to `live` was `0.953s`.
- Verified beyond-replay-window snapshot fallback with the stale-cursor debug
  route: after generating `502` successful `game.setTeam` events beyond a
  requested `lastEventId=1`, launching
  `/dev/stream?gameId=...&lastEventId=1` returned a snapshot payload as the
  first recovery item and the lifecycle-backed stream entered `live`.

**Evidence / excerpts:**

- Primary game id: `4774572d-d49b-48df-b42c-5b366d7d2534`; replay-window
  attempt game id: `8aee3a09-401a-497e-a93b-413633a81399`.
- Scratch evidence files: `/tmp/p05-t07-summary.json`,
  `/tmp/p05-t07-web-created-lobby.png`,
  `/tmp/p05-t07-mobile-initial-stream.png`,
  `/tmp/p05-t07-web-after-start.png`,
  `/tmp/p05-t07-mobile-after-start.png`,
  `/tmp/p05-t07-mobile-after-foreground.png`,
  `/tmp/p05-t07-mobile-replay-window.png`,
  `/tmp/p05-t07-replay-summary.json`,
  `/tmp/p05-t07-replay-window-proof.png`.
- Setup/driver commands included `pnpm --filter @sequence/api dev`,
  `pnpm --filter @sequence/web dev --hostname 127.0.0.1 --port 3000`,
  `pnpm --filter @sequence/mobile exec expo start --dev-client --host lan`,
  Playwright over system Chrome, and `xcrun simctl openurl` /
  `xcrun simctl launch` for simulator background/foreground.

Sanitized lifecycle excerpts:

```text
2026-07-03T19:22:47.887Z realtime.connection_state live
  reason=subscription-started game=4774572d...
mobile raw/lifecycle stream received ids 1..5 after guest join and game.start
web game.start mutation completed in 122ms with game.onGameEvent traffic

2026-07-03T19:24:10.631Z API process killed
2026-07-03T19:24:14.737Z realtime.connection_state reconnecting
  reason=transport-connecting detection=4.106s
2026-07-03T19:24:24.130Z API restart command issued
2026-07-03T19:24:31.052Z API listening again
2026-07-03T19:24:32.678Z realtime.connection_state live
  reason=subscription-started restart_to_live=8.548s listen_to_live=1.626s

2026-07-03T19:25:29.409Z simulator foreground launch
2026-07-03T19:25:30.307Z realtime.connection_state reconnecting
  reason=app-active foreground_to_detection=0.898s
2026-07-03T19:25:30.362Z realtime.connection_state live
  reason=subscription-started foreground_to_live=0.953s

2026-07-03T19:29:28.726Z replay-window attempt backgrounded via Safari
2026-07-03T19:29:30.003Z generated 502 successful setTeam events
2026-07-03T19:29:32.454Z realtime.connection_state reconnecting
  reason=app-active
subscription input lastEventId=505; latest card kind=event seq=505

2026-07-03T19:36:40.906Z stale-cursor proof generated 502 setTeam events
2026-07-03T19:41:24.292Z subscription input lastEventId=1
2026-07-03T19:41:24.383Z realtime.connection_state live
  reason=subscription-started
2026-07-03T19:41:24.422Z first raw recovery item id=504 kind=snapshot
```

**Verification:**

- Run:
  `pnpm --filter @sequence/mobile exec jest src/realtime/use-game-stream.test.tsx src/components/ConnectionBanner.test.tsx --runInBand`
- Result: pass, 2 suites / 8 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- The API restart and 10s background/foreground measurements are within the
  p05-t07 contracts.
- The first replay-window attempt confirmed that non-UI simulator backgrounding
  did not suspend dev-client JS subscriptions enough to leave a stale cursor.
  The follow-up stale-cursor debug route then proved the server/client snapshot
  fallback directly with `lastEventId=1` and a snapshot recovery payload.
- While idle, the lifecycle watchdog currently resubscribes about every 15s
  even when the raw debug subscription remains open. Each observed watchdog
  resubscribe recovered in under `0.1s`; this is useful reviewer context but
  did not block the measured recovery checks.

---

## Phase 6: Dashboard, Create, Join, Lobby

**Status:** completed
**Started:** 2026-07-03

### Phase Summary

**Outcome (what changed):**

- Added the mobile dashboard over `game.myGames`, including resumable/recent
  cards, empty states, pull-to-refresh, create/join actions, and status-aware
  game navigation.
- Added signed-in create-game, join-by-code, preview, registered join, guest
  join, app-scheme deep-link, and guest continue-list flows.
- Added mobile guest identity persistence with SecureStore-backed game tokens,
  AsyncStorage registry metadata, explicit HTTP/WebSocket cookie transport, and
  stream-driven guest registry cleanup.
- Added the live mobile lobby branch with roster/team rendering, native invite
  sharing, creator-only kick/randomize/start controls, start gating, and
  public game route access enforced by API/stream participant checks.
- Completed local API/web/mobile multi-client verification for FR2-FR5,
  including guest deep-link join, live roster/control propagation, start-gate
  proof, and relaunch continue-list recovery.

**Key files touched:**

- `apps/mobile/src/app/index.tsx` - dashboard route.
- `apps/mobile/src/app/create.tsx` - create-game route.
- `apps/mobile/src/app/join/index.tsx` /
  `apps/mobile/src/app/join/[code].tsx` - join entry, preview, registered
  join, guest join, and scheme deep-link handling.
- `apps/mobile/src/app/game/[id].tsx` - live game route and lobby branch.
- `apps/mobile/src/auth/guest-store.ts` - guest token and registry storage.
- `apps/mobile/src/api/client.ts`, `cookies.ts`, `ws.ts` - explicit Better
  Auth and guest-token cookie transport for HTTP and WebSocket paths.
- `apps/mobile/src/game/LobbyTeams.tsx` - native lobby roster/control surface.

**Verification:**

- Unit/integration suites for API guest join, mobile dashboard, create, join,
  guest store/cookies, stream registry behavior, lobby rendering, and transport
  cookie coverage all passed.
- Mobile typecheck/lint, root format check, and whitespace checks passed for
  every Phase 6 implementation task.
- Simulator/manual evidence captured for scheme deep links and p06-t08
  multi-client local API/web/mobile lobby verification.

**Notes / Decisions:**

- `/game/[id]` remains public in Expo Router so guest-token participants can
  cold-start back into a game; API game-player procedures and stream errors
  remain the access authority.
- p06-t08 proved start gating by showing disabled/illegal and enabled/legal
  lobby states. It did not click through into active gameplay; Phase 7 owns the
  playable active-game surface.

---

### Task p06-t01: API — game.join returnGuestToken flag

**Status:** completed
**Commit:** c2f08a3
**Fix Commit:** 2b68ed7

**Outcome:**

- Extended `game.join` input with an optional `returnGuestToken` flag.
- Anonymous guest joins still issue the httpOnly `sequence_guest` cookie and
  store only the token hash server-side.
- When a guest join opts into `returnGuestToken: true`, the response includes
  the raw guest token matching the cookie value so mobile can persist it.
- Guest joins without the flag and registered joins with the flag do not include
  `guestToken` in the response.

**Files changed:**

- `packages/api/src/game/routes/join-game.ts` - additive input flag and
  conditional response field.
- `packages/api/src/game/routes/join-game.test.ts` - integration coverage for
  opt-in guest token return, default no-token response, registered no-token
  response, and type-safe Set-Cookie parsing.

**Verification:**

- Run: `pnpm --filter @sequence/api exec vitest run src/game/routes/join-game.test.ts`
- Result: pass, 1 file / 11 tests with `DATABASE_URL_TEST` set to a disposable
  local Postgres database.
- Run: `pnpm --filter @sequence/api typecheck`
- Result: pass after the test helper type fix.
- Run: `pnpm lint`
- Result: pass with existing warnings only.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- The disposable local Postgres container was stopped and removed after
  verification.
- The raw guest token is never logged and remains opt-in because it is only
  needed by the mobile guest-token persistence path.

---

### Task p06-t02: Dashboard screen

**Status:** completed
**Commit:** b0ef411

**Outcome:**

- Replaced the signed-in placeholder home screen with a dashboard backed by
  `game.myGames.queryOptions()`.
- Added native dashboard cards for resumable and recent games with status,
  roster, round/result metadata, and stable testIDs
  `dashboard.resumable.<id>` / `dashboard.recent.<id>`.
- Added dashboard actions for create and join flows, logout in the header,
  unauthorized redirect handling, empty states, and pull-to-refresh via
  `myGames.refetch()`.
- Dashboard navigation now sends non-finished games to `/game/<id>` and
  finished games to `/game/<id>?view=game-over`.

**Files changed:**

- `apps/mobile/src/app/index.tsx` - dashboard route, query binding,
  pull-to-refresh, actions, navigation, and logout handling.
- `apps/mobile/src/features/dashboard/GameCard.tsx` /
  `GameCard.test.tsx` - reusable native game card and display/press coverage.
- `apps/mobile/src/features/dashboard/DashboardScreen.test.tsx` - route-level
  dashboard behavior tests outside `src/app`.
- `apps/mobile/src/test/index.test.tsx` - updated home smoke coverage for the
  dashboard shell.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/features/dashboard src/test/index.test.tsx --runInBand`
- Result: pass, 3 suites / 13 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.

**Notes / Decisions:**

- Dashboard tests remain outside `src/app` to preserve the Expo Router
  route-tree guardrail.

---

### Task p06-t03: Create screen

**Status:** completed
**Commit:** 64686b0

**Outcome:**

- Added the signed-in create-game route backed by `game.create`.
- Added a native create form with player count, play mode, turn timer, and
  pass-and-play settings that mirror the web/API option set.
- Local pass-and-play creation forces two players and validates a trimmed
  opponent name between 1 and 40 characters.
- Successful creates route to `/game/<id>`, where the later game route will
  render the lobby or active branch based on the returned game status.

**Files changed:**

- `apps/mobile/src/app/create.tsx` - route-level mutation binding, create
  error handling, and post-create navigation.
- `apps/mobile/src/features/create/CreateForm.tsx` /
  `CreateForm.test.tsx` - create settings form, timer option helper, local
  validation, and form behavior coverage.
- `apps/mobile/src/features/create/CreateScreen.test.tsx` - route-level
  create mutation and navigation tests outside `src/app`.
- `apps/mobile/src/app/_layout.tsx` /
  `apps/mobile/src/test/root-layout.test.tsx` - protected route registration
  for the signed-in create screen.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/features/create src/test/root-layout.test.tsx --runInBand`
- Result: pass, 3 suites / 8 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- Current mobile navigation already treats lobby and active games as status
  branches of `/game/<id>`, matching the dashboard route behavior. The concrete
  lobby branch is planned for p06-t07.
- The mobile local toggle uses the task wording literally: enabling local
  forces the player count back to two. Selecting another player count while
  local is enabled turns local mode back off, matching the web constraint that
  local games cannot be non-2-player games.

---

### Task p06-t04: Join flow — code entry + preview + registered join

**Status:** completed
**Commit:** bd5ebda

**Outcome:**

- Added signed-in join routes for invite-code entry and invite preview.
- Code entry validates non-empty input and normalizes lower-case pasted codes
  with spaces or hyphens before routing to the preview screen.
- Preview uses `game.preview.queryOptions()` and renders invite settings,
  roster rows, host/guest markers, and friendly unavailable states for unknown,
  full, started, and local games.
- Registered-user join uses `game.join.mutationOptions()` and navigates to
  `/game/<id>` on success.

**Files changed:**

- `apps/mobile/src/app/join/index.tsx` - invite-code entry route.
- `apps/mobile/src/app/join/[code].tsx` - preview query, registered join
  mutation, unavailable states, and navigation.
- `apps/mobile/src/features/join/PreviewCard.tsx` /
  `JoinScreen.test.tsx` - preview card, invite-code normalization helper, and
  route behavior tests outside `src/app`.
- `apps/mobile/src/app/_layout.tsx` /
  `apps/mobile/src/test/root-layout.test.tsx` - protected join route
  registration for signed-in users.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/features/join src/test/root-layout.test.tsx --runInBand`
- Result: pass, 2 suites / 11 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- p06-t04 intentionally implements the registered-user join path only. Guest
  join persistence, guest store, and continue-list behavior remain p06-t05
  scope.
- The join and preview routes are signed-in protected for this task; p06-t05
  can loosen or split route protection when guest join support lands.

---

### Task p06-t05: Guest join + guest store/registry + continue-list

**Status:** completed
**Commit:** 6c7c5bc
**Fix Commit:** ac2a3ee

**Outcome:**

- Added the mobile guest identity store with SecureStore-backed raw tokens
  keyed as `sequence.guest.<gameId>` and an AsyncStorage registry under
  `sequence-guest-games`.
- Un-stubbed mobile guest-token cookie lookup so game-scoped tRPC calls and
  subscriptions can send `sequence_guest` alongside any Better Auth cookie.
- Added anonymous guest join support on the invite preview route using
  `returnGuestToken: true`; successful guest joins store token + registry
  metadata before routing to `/game/<id>`.
- Added a login-screen continue list from the guest registry with stable
  `auth.guest.continue.<gameId>` testIDs.
- Wired guest registry status updates and cleanup into `useGameStream` for
  status changes, finished games, and `NOT_FOUND` / `FORBIDDEN` stream errors.
- Made the entire mobile join subtree public so signed-out guests can both
  enter invite codes and open invite preview routes.

**Files changed:**

- `apps/mobile/src/auth/guest-store.ts` /
  `guest-store.test.ts` - SecureStore token helpers, AsyncStorage registry,
  ordering, removal, and status-update coverage.
- `apps/mobile/src/api/cookies.ts` / `cookies.test.ts` - real guest-token
  lookup and cookie-header coverage.
- `apps/mobile/src/app/join/[code].tsx` /
  `apps/mobile/src/features/join/JoinScreen.test.tsx` - guest name path,
  token request/storage, and guest-join tests.
- `apps/mobile/src/app/(auth)/login.tsx` /
  `apps/mobile/src/auth/login-screen.test.tsx` - cold-start continue-list UI
  and navigation coverage.
- `apps/mobile/src/realtime/use-game-stream.ts` /
  `use-game-stream.test.tsx` - guest registry status updates and cleanup.
- `apps/mobile/src/app/_layout.tsx` /
  `apps/mobile/src/test/root-layout.test.tsx` - public join subtree route
  registration.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/auth/guest-store.test.ts src/auth/login-screen.test.tsx src/features/join src/api/cookies.test.ts src/test/root-layout.test.tsx src/realtime/use-game-stream.test.tsx --runInBand`
- Result: pass, 6 suites / 34 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- Guest stream cleanup is wired where current code has the necessary context:
  `useGameStream` updates registry status and removes entries on finished,
  `NOT_FOUND`, and `FORBIDDEN`. The concrete `/game/[id]` route that mounts the
  hook is still planned for p06-t07/p07.
- The orchestrator added the follow-up fix commit because exposing only
  `/join/[code]` was not enough for FR2; anonymous users also need
  `/join/index` to enter an invite code.

---

### Task p06-t06: Scheme deep links

**Status:** completed
**Commit:** e70d449

**Outcome:**

- Hardened the `join/[code]` route so the untrusted route/deep-link parameter
  is used only for `game.preview`.
- Registered-user and guest join mutations now use the server-returned
  `preview.inviteCode` rather than reusing the raw route parameter.
- Added feature-level coverage proving join mutations use the preview invite
  code.
- Verified `sequence://join/<code>` opens the Expo Router join preview route in
  the installed dev client.

**Files changed:**

- `apps/mobile/src/app/join/[code].tsx` - join mutation invite-code source
  hardened to the preview response.
- `apps/mobile/src/features/join/JoinScreen.test.tsx` - route-param hardening
  coverage.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/features/join --runInBand`
- Result: pass, 1 suite / 11 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.
- Run: `xcrun simctl openurl booted "sequence://join/TESTCODE"`
- Result: pass, exit 0; screenshot
  `/tmp/p06-t06-sequence-join-testcode-preview.png`.
- Run: simulator garbage-code deep-link proof.
- Result: unknown-code state screenshot
  `/tmp/p06-t06-sequence-join-garbage-unknown.png`.

**Notes / Decisions:**

- Simulator proof used a temporary local mock `game.preview` endpoint because
  the local API/database environment was unavailable. This proves scheme
  routing and join-preview UI rendering, not a real API-backed invite lookup.
  API-backed preview/join behavior is covered by earlier p06 API/mobile tests.
- The garbage-code screenshot includes a development error toast from the
  mocked failed query; the app body still renders the expected unknown-code
  state.

---

### Task p06-t07: Lobby screen + controls + share

**Status:** completed
**Commit:** bddfa59
**Fix Commit:** 8099ab9

**Outcome:**

- Added the mobile `/game/[id]` route with live `useGameStream()` binding,
  lobby-status rendering, mutation error-policy copy, and placeholders for
  active, finished, frozen, and saved states.
- Added the native `LobbyTeams` surface with invite-code summary, team roster
  bands, current-player team switching, host kick/randomize/start controls,
  start gating, turn-order copy, and native `Share` invite handling.
- Supported 2-, 3-, 4-, and 6-player lobby layouts, including 6-player
  three-team rendering.
- Preserved visibility for invalid intermediate team layouts by rendering
  over-capacity teams instead of hiding extra seated players while start
  remains gated until the roster is legal.
- Registered `/game/[id]` as a public route for guest continuity; server-side
  participant checks and stream errors remain the authority for access.

**Files changed:**

- `apps/mobile/src/app/game/[id].tsx` - live game route, lobby branch, mutation
  wiring, connection banner, error copy, and deferred non-lobby placeholders.
- `apps/mobile/src/game/LobbyTeams.tsx` /
  `LobbyTeams.test.tsx` - native lobby component, share action, roster/control
  coverage, 6-player layout coverage, and over-capacity roster regression.
- `apps/mobile/src/app/_layout.tsx` - public game route registration.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/game/LobbyTeams.test.tsx --runInBand`
- Result: pass, 1 suite / 5 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- The active, finished, frozen, and saved game surfaces are intentionally
  placeholders in this task; Phase 7 and Phase 9 own the playable/game-over
  surfaces.
- The game route stays public in Expo Router so guest-token participants can
  cold-start back into a game. Unauthorized access still fails through the
  tRPC game-player procedure and `useGameStream` cleanup path.

---

### Task p06-t08: Multi-client lobby verification

**Status:** completed
**Commit:** c75ee97
**Fix Commit:** 7f875d1

**Outcome:**

- Ran the p06-t08 local scenario with disposable local Postgres, local API,
  local web, Metro, and the iOS dev client.
- Verified a web-created remote lobby, mobile guest deep-link preview/join,
  mobile guest registry persistence, relaunch continue-list display, and return
  to the guest lobby.
- Verified live web/mobile lobby propagation for join, team change, kick, and
  randomize flows.
- Verified start gating by capturing an illegal/incomplete lobby before the
  legal layout and a full randomized legal layout where web showed enabled
  `Start game`.
- Fixed the scenario-discovered guest stream auth bug: mobile WebSocket streams
  now attach the game-scoped `sequence_guest` token using active game context,
  and HTTP cookie headers infer `gameId` from tRPC operation input when
  available.

**Files changed:**

- `apps/mobile/src/api/client.ts` /
  `client.test.ts` - game-id inference for HTTP cookie headers.
- `apps/mobile/src/api/cookies.ts` /
  `cookies.test.ts` - active game cookie context helpers.
- `apps/mobile/src/api/ws.ts` /
  `ws.test.ts` - guest cookie attachment for React Native WebSocket streams.
- `apps/mobile/src/realtime/use-game-stream.ts` /
  `use-game-stream.test.tsx` - active game context lifecycle and coverage.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - captured
  the WebSocket guest-cookie learning.

**Verification:**

- Run: `pnpm --filter @sequence/api exec vitest run src/game/routes/join-game.test.ts src/game/routes/lobby.test.ts`
- Result: pass, 2 files / 21 tests with disposable local Postgres.
- Run: `pnpm --filter @sequence/mobile exec jest src/api/client.test.ts src/api/cookies.test.ts src/api/ws.test.ts src/realtime/use-game-stream.test.tsx --runInBand`
- Result: pass, 4 suites / 25 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Scenario evidence:**

- `/tmp/p06-t08-web-created-lobby.png` - web host created a remote 4-player
  lobby.
- `/tmp/p06-t08-web-after-host-team-change.png` - host team change visible on
  web.
- `/tmp/p06-t08-mobile-deeplink-preview.png` - mobile deep-link preview with
  invite code.
- `/tmp/p06-t08-mobile-lobby-after-guest-join.png` - mobile guest joined and
  entered the live lobby.
- `/tmp/p06-t08-web-lobby-after-mobile-guest.png` - web reflects the mobile
  guest join.
- `/tmp/p06-t08-mobile-lobby-full-before-randomize.png` and
  `/tmp/p06-t08-web-lobby-full-before-randomize.png` - full lobby before
  randomize/start-gate proof.
- `/tmp/p06-t08-web-after-kick.png` and
  `/tmp/p06-t08-mobile-after-web-kick.png` - web kick reflected on mobile.
- `/tmp/p06-t08-web-after-randomize.png` and
  `/tmp/p06-t08-mobile-after-randomize.png` - randomize reflected across
  clients; web shows enabled `Start game` for the legal full layout.
- `/tmp/p06-t08-mobile-relaunch-continue-list.png` - guest relaunch continue
  list with stored guest games.
- `/tmp/p06-t08-orchestrator-current.png` - orchestrator-confirmed guest return
  from continue-list to the live lobby.

**Notes / Decisions:**

- The scenario script exited after tapping guest row text instead of the
  `Continue` button; the continue-list screenshot shows the correct buttons,
  and the orchestrator follow-up screenshot confirms return to the lobby.
- The scenario did not click `Start game`. FR5's Phase 6 mapping requires
  start gated on legal layout, which the disabled/illegal and enabled/legal
  evidence covers; active gameplay transition remains Phase 7 scope.
- The disposable local database was reset by the final API verification suite,
  but the p06-t08 screenshots remain as the durable scenario evidence.

---

## Phase 7: Game Surface — Core Play (Tap Mode)

**Status:** completed
**Started:** 2026-07-03

### Phase Summary

**Outcome (what changed):**

- Started the playable game-surface phase by adding the mobile SVG card asset
  pipeline and reusable `CardFace` component.
- The board and hand tasks can now render the same 52 card faces used by the
  web app through `react-native-svg` and the Expo Metro SVG transformer.
- Added a development-only card-grid route for visual sanity checks while
  keeping the dev route guarded by the existing `__DEV__` layout.
- Added the mobile `GameBoard` grid with memoized card cells, team chip
  overlays, locked-sequence treatment, and a board-local layout map for later
  drag hit-testing.
- Added selection-gated GameBoard spotlight targeting backed by
  `validPlacements`, with dim/target overlays for selected-card legal targets.
- Added the mobile `CardHand` with card-face rendering, controlled and
  uncontrolled selection, hard-mode dead-card badges, and drag-mode turn-in
  affordances.
- Added `PlayerRail` and `TimerBadge` for active-game player state, current
  turn highlight, connection state, sequence counts, round display, and
  server-deadline timer countdown.
- Added a version-guarded mobile move-submission hook with pending state,
  haptic feedback, conflict/violation messages from the shared client-state
  catalog, and development round-trip timing logs.
- Assembled the active mobile game route with `PlayerRail`, `GameBoard`,
  `CardHand`, turn banner, controls copy, and tap-mode card-to-cell submission.
- Added development playground stories for the game board, card hand, and
  player rail across empty, active, spotlight, locked-sequence, opponent-turn,
  dead-card, and 6-player states.
- Verified a full tap-mode game loop against the local API with mobile/web
  clients, timed turns, two-eyed and one-eyed jack plays, auto-draw, stale
  version recovery, sequence locks, and final win state.
- Fixed two p07-t09 verification findings: mobile auth email fields now preserve
  lowercase input, and quiet live realtime subscriptions no longer resubscribe
  and trigger false presence disconnects during normal turns.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/game/cards/CardFace.test.tsx --runInBand`
- Result: pass, 1 suite / 55 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p07-t01`
- Result: pass in the implementing subagent run.
- Run: `pnpm --filter @sequence/mobile exec expo run:ios --no-bundler --device 3F87B084-DD33-41D5-B4F5-88DA77989607`
- Result: pass in the implementing subagent run.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/GameBoard --runInBand`
- Result: pass, 2 suites / 9 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/GameBoard/spotlight.test.ts src/game/GameBoard --runInBand`
- Result: pass, 3 suites / 14 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/CardHand --runInBand`
- Result: pass, 1 suite / 7 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/PlayerRail --runInBand`
- Result: pass, 2 suites / 4 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/use-move-submit.test.ts src/game/feedback/toasts.test.ts --runInBand`
- Result: pass, 2 suites / 19 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile exec expo install expo-haptics@~57.0.0 --check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx src/game/CardHand src/game/GameBoard --runInBand`
- Result: pass, 5 suites / 27 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx src/dev/stories.test.ts src/game/PlayerRail/PlayerRail.test.tsx src/game/CardHand src/game/GameBoard --runInBand`
- Result: pass, 7 suites / 31 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p07-t08-final3`
- Result: pass.
- Run: simulator story screenshot sweep in dark and light appearances.
- Result: pass. Evidence:
  `/tmp/p07-t08-game-board.png`, `/tmp/p07-t08-game-hand-fixed.png`,
  `/tmp/p07-t08-game-rail-fixed.png`, `/tmp/p07-t08-game-board-light.png`,
  `/tmp/p07-t08-game-hand-light.png`, and
  `/tmp/p07-t08-game-rail-light.png`.
- Run: local API/web/mobile p07-t09 deterministic game verification.
- Result: pass. Deterministic game
  `3fc7917c-862d-45a0-90e6-380a7335eb87` completed with `GameWon` for team 1,
  stale version rejection returned `409 CONFLICT`, two-eyed jack `JD` and
  one-eyed jack `JS` paths both emitted expected events, auto-draw updated the
  hand, locked sequence cells were present in the final board, and move
  round-trip p50 was `6.1ms`. Additional subagent run
  `e6fa8ecf-4839-41a6-b2bf-30b18e64f7ad` recorded p50 `3.35ms`.
- Run: web/mobile visual proof for p07-t09.
- Result: pass. Evidence:
  `/tmp/p07-t09-web-active.png`, `/tmp/p07-t09-web-final.png`,
  `/tmp/p07-t09-mobile-initial.png`, `/tmp/p07-t09-mobile-final.png`, and
  `/tmp/p07-t09-mobile-active.png`. The mobile active proof stayed active past
  the previous 15s watchdog failure point and exposed `game.timer` with
  `2:00`, player rail, board cells, and hand card testIDs in the accessibility
  tree.
- Run: `pnpm --filter @sequence/mobile exec jest src/components/TextField.test.tsx src/auth/login-screen.test.tsx src/auth/signup-screen.test.tsx --runInBand`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec jest src/realtime/lifecycle.test.ts src/realtime/use-game-stream.test.tsx --runInBand`
- Result: pass, 2 suites / 15 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p07-t09`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- The subagent did not capture a usable card-grid screenshot because Metro was
  not reachable on port 8081 during the visual pass; the card route remains
  available at `/dev/cards` for the later game-surface story and screenshot
  tasks.
- The orchestrator added the follow-up fix commit because board-scale callers
  often allocate fresh `{rank, suit}` objects while representing the same card;
  `CardFace` now skips equal-value SVG rerenders.
- The orchestrator added the p07-t02 follow-up fix commit because square cells
  would crop portrait card SVGs and row-local cell `onLayout` values would not
  support reliable board-level hit-testing. Board cell sizing and layout-map
  frames now share the card aspect ratio.
- The orchestrator added the p07-t03 follow-up fix commit because spotlight
  should activate only when `validPlacements` returns at least one target,
  preserving web parity for dead or otherwise unplayable selected cards.
- The orchestrator added the p07-t04 follow-up fix commit because dead-card
  badges and turn-in controls belong to hard/drag mode, and nested turn-in
  presses should not also toggle selected-card state.
- The orchestrator added the p07-t05 follow-up fix commit so inactive turn and
  connected/offline markers do not render as hidden-but-queryable text; only
  visible rail status badges are mounted.
- The orchestrator added the p07-t06 follow-up fix commit because the initial
  `expo-haptics@~15.0.8` install was not compatible with Expo SDK 57 according
  to Expo's compatibility check; `expo-haptics@~57.0.0` is now installed.
- The orchestrator added the p07-t07 follow-up fix commit to remove overlapping
  `act()` warnings from the route tests and ensure a disabled `CardHand` also
  disables nested dead-card turn-in controls.
- The orchestrator added p07-t08 follow-up fix commits to keep route tests out
  of the Expo Router app tree, compact hand story previews to fit iPhone-width
  story cards, and move PlayerRail status labels into normal layout flow after
  simulator screenshots exposed visual clipping/overlap.
- The p07-t09 full-game pass exposed that `TextField` did not forward native
  email keyboard/capitalization props; login and signup email fields now set
  `autoCapitalize="none"`, disable autocorrect, and request the email keyboard.
- The p07-t09 mobile visual pass exposed that the 15s realtime watchdog treated
  a quiet but live subscription as stale. The watchdog now checks transport
  state before reconnecting so normal quiet turns do not fire the API presence
  disconnect path and freeze games.

### Task p07-t01: SVG card pipeline

**Status:** completed
**Commit:** fa42027
**Fix Commit:** 08645c8

**Outcome:**

- Added `react-native-svg` support for imported SVG card faces in the mobile
  Expo workspace.
- Copied the 52 face SVGs, 2 card backs, and attribution file into the mobile
  asset tree.
- Added `CardFace`, `CARD_FACE_CODES`, and card-to-asset helpers for all 52
  rank/suit combinations.
- Memoized `CardFace` by semantic card value, size, style, and testID so equal
  cards do not repaint their SVG face when callers pass fresh card objects.
- Added a development-only `/dev/cards` route that renders the full face grid.

**Files changed:**

- `apps/mobile/src/game/cards/CardFace.tsx` /
  `CardFace.test.tsx` - card asset map, reusable card face component, and 55
  focused tests.
- `apps/mobile/src/assets/cards/` - copied SVG card assets and attribution.
- `apps/mobile/src/types/svg.d.ts` - SVG module declaration.
- `apps/mobile/metro.config.js` - Expo SVG transformer wiring.
- `apps/mobile/package.json` / `pnpm-lock.yaml` - SVG runtime and transformer
  dependencies.
- `apps/mobile/src/app/dev/cards.tsx` - development-only card grid route.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - captured
  the board-scale card memoization learning.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/game/cards/CardFace.test.tsx --runInBand`
- Result: pass, 1 suite / 55 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p07-t01`
- Result: pass in the implementing subagent run.
- Run: `pnpm --filter @sequence/mobile exec expo run:ios --no-bundler --device 3F87B084-DD33-41D5-B4F5-88DA77989607`
- Result: pass in the implementing subagent run.

**Notes / Decisions:**

- The SVG assets are copied into the mobile tree for Metro/native bundling
  rather than read directly from `apps/web/public/cards`.
- The card-grid route is intentionally under the existing development-only
  route tree and is not linked from the shipped app.
- Visual card-grid screenshot proof is deferred to the planned p07-t08
  game-surface playground story sweep because the p07-t01 Metro visual pass did
  not reach the route, while export and native rebuild proof passed.

### Task p07-t02: GameBoard grid + chips + sequences

**Status:** completed
**Commit:** 136bfb6
**Fix Commit:** d6a2c5a

**Outcome:**

- Added a 10x10 mobile `GameBoard` driven by `BOARD_MAP` from
  `@sequence/game-logic`.
- Added memoized `BoardCell` rendering for card faces, wild corners, team chip
  overlays, and locked-sequence treatment.
- Added a pure `BoardLayoutMap` with frame registration, clearing, and
  hit-testing for later drag-mode work.
- Registered board-local, card-aspect cell frames from the grid geometry so
  future drag hit-testing aligns with the rendered board.
- Added focused GameBoard and layout-map tests for stable cell IDs, all four
  wild corners, team colors, lock treatment, sequence ownership, render
  memoization, and frame registration.

**Files changed:**

- `apps/mobile/src/game/GameBoard/GameBoard.tsx` - responsive board grid,
  sequence lookup, board-local frame registration, and cell composition.
- `apps/mobile/src/game/GameBoard/BoardCell.tsx` - memoized board cell with
  card face, wild-corner, chip, and lock rendering.
- `apps/mobile/src/game/GameBoard/layout-map.ts` - pure layout-map and
  hit-testing helper.
- `apps/mobile/src/game/GameBoard/GameBoard.test.tsx` /
  `layout-map.test.ts` - focused board rendering, memoization, and layout-map
  coverage.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - captured
  the board-local frame/card-aspect learning.

**Verification:**

- RED run: `pnpm --filter @sequence/mobile exec jest src/game/GameBoard --runInBand`
- Result: failed before implementation on missing GameBoard/layout-map modules.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/GameBoard --runInBand`
- Result: pass, 2 suites / 9 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- `BoardLayoutMap` stores board-local frames. Later drag work should subtract
  the board origin before calling `hitTest()`.
- Spotlight, tap targeting, and move submission are intentionally deferred to
  p07-t03 and p07-t06/p07-t07.
- Visual board screenshot proof remains part of the planned p07-t08
  game-surface playground sweep.

### Task p07-t03: Spotlight targeting

**Status:** completed
**Commit:** 06dfe66
**Fix Commit:** e358852

**Outcome:**

- Added a `createBoardSpotlight()` helper that converts snapshot board records
  into the rules-engine board shape and derives legal target cells with
  `validPlacements`.
- Extended `GameBoard` with external selection inputs (`selectedCard` and
  `currentTeam`) while keeping selection ownership in the later game-screen
  controller.
- Added native-backed `BoardCell` dim and target overlays for selected-card
  spotlight states.
- Preserved web parity by activating spotlight only when the selected card has
  at least one legal target.
- Covered normal-card targets, empty selection, no-target selected cards, and
  one-eyed jack removable-opponent targeting.

**Files changed:**

- `apps/mobile/src/game/GameBoard/spotlight.ts` /
  `spotlight.test.ts` - valid-placement-backed target derivation and
  regression coverage.
- `apps/mobile/src/game/GameBoard/GameBoard.tsx` - selected-card/current-team
  props and per-cell spotlight state wiring.
- `apps/mobile/src/game/GameBoard/BoardCell.tsx` - native dim/target overlay
  rendering.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - captured
  the non-empty target-set spotlight learning.

**Verification:**

- RED run: `pnpm --filter @sequence/mobile exec jest src/game/GameBoard/spotlight.test.ts --runInBand`
- Result: failed before implementation on missing `./spotlight.ts`.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/GameBoard/spotlight.test.ts src/game/GameBoard --runInBand`
- Result: pass, 3 suites / 14 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- Move submission remains out of scope and is still planned for p07-t06/p07-t07.
- A selected card with no legal target leaves the board undimmed rather than
  dimming all cells.
- Explicit absolute positioning is used for the RN overlays; this avoided
  typings friction around `StyleSheet.absoluteFillObject` in this workspace.

### Task p07-t04: CardHand

**Status:** completed
**Commit:** 7172173
**Fix Commit:** 6d11693

**Outcome:**

- Added a native-backed bottom-docked `CardHand` component using the shared
  mobile `CardFace` renderer.
- Supported controlled and uncontrolled selected-card state with tap-to-select
  and tap-to-deselect behavior.
- Derived dead-card badges with `findDeadCards` over the snapshot board
  converted into the rules-engine board shape.
- Kept dead-card badges and turn-in affordances in drag mode, where users must
  notice and turn in dead cards manually.
- Isolated the nested turn-in press so it invokes `onTurnInDeadCard` without
  toggling selected-card state.

**Files changed:**

- `apps/mobile/src/game/CardHand/CardHand.tsx` - native hand dock, card fan,
  selection state, dead-card badge logic, and turn-in control.
- `apps/mobile/src/game/CardHand/CardHand.test.tsx` - stable card testIDs,
  selection toggling, controlled selected state, dead-card badges, drag-only
  turn-in affordance, and nested press isolation coverage.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - captured
  the hard-mode dead-card affordance learning.

**Verification:**

- RED run: `pnpm --filter @sequence/mobile exec jest src/game/CardHand --runInBand`
- Result: failed before implementation because `CardHand.tsx` was missing.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/CardHand --runInBand`
- Result: pass, 1 suite / 7 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- Move submission and turn-in mutation wiring remain p07-t06/p07-t07 scope.
- The snapshot-board to rules-board converter now exists in both
  `GameBoard/spotlight.ts` and `CardHand.tsx`; extract a shared mobile helper
  if a third consumer appears.

### Task p07-t05: PlayerRail + TimerBadge

**Status:** completed
**Commit:** 8c612b1
**Fix Commit:** f2c3dbb

**Outcome:**

- Added a native-backed `PlayerRail` for active-game player names, seats, team
  swatches, connected/offline state, and current-turn highlight.
- Added round and sequence-count display for the active game surface.
- Added `TimerBadge` with countdown display derived from `turnDeadlineAt`,
  immediate re-sync when deadline props change, and `0:00` clamping on expiry.
- Kept timer expiry display-only; no client-side forfeit or mutation path was
  added.
- Rendered only visible status badges so tests and accessibility do not see
  hidden inactive/offline copy.

**Files changed:**

- `apps/mobile/src/game/PlayerRail/PlayerRail.tsx` /
  `PlayerRail.test.tsx` - player rail, connection/current-turn display, round
  and sequence-count coverage.
- `apps/mobile/src/game/PlayerRail/TimerBadge.tsx` /
  `TimerBadge.test.tsx` - server-deadline countdown, deadline re-sync, expiry
  clamp, and no-local-forfeit coverage.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - captured
  the server-deadline timer learning.

**Verification:**

- RED run: `pnpm --filter @sequence/mobile exec jest src/game/PlayerRail --runInBand`
- Result: failed before implementation on missing PlayerRail modules.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/PlayerRail --runInBand`
- Result: pass, 2 suites / 4 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- `turnDeadlineAt` remains the timer source of truth; client expiry does not
  trigger any local forfeit behavior.
- `nowMs` is available as a deterministic test/preview override.
- Visual PlayerRail proof remains part of the planned p07-t08 game-surface
  playground sweep.

### Task p07-t06: Move submission + submitting state + violation feedback

**Status:** completed
**Commit:** 4a8403c
**Fix Commit:** 6ba10cf

**Outcome:**

- Added `useMoveSubmit()` for version-guarded `game.makeMove` submission from
  mobile gameplay surfaces.
- The hook enters a pending/submitting state before mutation submission,
  disables selected-card interactions through the returned state, and avoids
  local board mutation while waiting for server-authoritative stream echo.
- Pending state clears on a matching streamed event carrying the returned
  post-mutation version, or on mutation error.
- Duplicate submissions are ignored while a move is pending.
- Conflict and rule-violation feedback map through the mobile error policy and
  shared `@sequence/client-state` violation-message catalog.
- Tap and error/conflict haptics are wired through `expo-haptics`, and
  development builds log client-observed move round-trip samples with p50.

**Files changed:**

- `apps/mobile/src/game/use-move-submit.ts` /
  `use-move-submit.test.ts` - version-guarded move mutation hook, pending
  state, haptics, duplicate-submit guard, stream-echo clearing, and timing
  coverage.
- `apps/mobile/src/game/feedback/toasts.ts` /
  `feedback/toasts.test.ts` - move-submit feedback mapping for conflicts,
  rule violations, and fallback errors.
- `apps/mobile/package.json` / `pnpm-lock.yaml` - added Expo-compatible
  `expo-haptics`.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - captured
  the Expo package compatibility-check learning.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/game/use-move-submit.test.ts src/game/feedback/toasts.test.ts --runInBand`
- Result: pass, 2 suites / 19 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo install expo-haptics@~57.0.0 --check`
- Result: pass.

**Notes / Decisions:**

- Server events currently expose `seq` and `version`, not server timestamps.
  The round-trip log therefore measures submit time to first matching streamed
  event observed on the client.
- The hook clears pending on stream echo rather than mutation response so board
  and hand updates remain server-authoritative.
- `turnInDeadCard` remains a separate mutation path for the p07-t07 screen
  assembly to wire as needed.

### Task p07-t07: Game screen assembly + turn flow

**Status:** completed
**Commit:** afbd9a0
**Fix Commit:** 9518c86

**Outcome:**

- Replaced the active-game placeholder route branch with a native-backed play
  surface composed from `PlayerRail`, `GameBoard`, `CardHand`, turn banner, and
  controls/status copy.
- Wired `useGameStream()` view state to selected-card state and `useMoveSubmit()`
  for tap-mode move submission.
- My-turn state enables card selection, highlights legal board cells, and
  submits a version-guarded move with the selected card and target position.
- Opponent-turn and pending-submit states keep the board visible while
  disabling hand selection and move submission.
- Added `GameBoard`/`BoardCell` press callbacks and a `CardHand` disabled prop
  needed by the route controller.
- Preserved the lobby branch and kept non-active states on placeholder branches
  until later phases.

**Files changed:**

- `apps/mobile/src/app/game/[id].tsx` - active-game route assembly, selection
  state, turn copy, and `useMoveSubmit()` wiring.
- `apps/mobile/src/game/GameRouteScreen.test.tsx` - route-level active/lobby/status
  branch coverage outside the route directory.
- `apps/mobile/src/game/GameBoard/GameBoard.tsx` /
  `GameBoard/BoardCell.tsx` - cell press callback and selected-card target
  disabling.
- `apps/mobile/src/game/CardHand/CardHand.tsx` /
  `CardHand.test.tsx` - disabled hand behavior, including nested turn-in
  control coverage.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - captured
  the React Native route-test cleanup gotcha.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx src/game/CardHand src/game/GameBoard --runInBand`
- Result: pass, 5 suites / 27 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- The route test lives at `apps/mobile/src/game/GameRouteScreen.test.tsx`, not
  inside `src/app/`, to avoid Expo Router bundling route-local test files.
- Separate tests are used for separate route states; mid-test `cleanup()` caused
  overlapping React `act()` warnings.
- Full device visual proof remains planned for p07-t08/p07-t09.

### Task p07-t08: Playground stories for game components

**Status:** completed
**Commit:** 5f91046
**Fix Commits:** fab0c19 / c81b6c9

**Outcome:**

- Added development playground stories for the mobile `GameBoard`, `CardHand`,
  and `PlayerRail` components.
- Board stories cover empty board, midgame scatter, spotlight targets, locked
  sequences, and a 6-player table.
- Hand stories cover tap-mode selection, drag-mode dead-card turn-in,
  opponent-turn disabled state, and a 6-player short deal.
- Rail stories cover active timer, opponent offline, locked sequence count, and
  6-player teams.
- Moved the game route test out of `src/app` after Expo Router attempted to
  bundle it during `expo export`.
- Compact hand story previews now use a representative 4-card sample so the
  fan fits inside iPhone-width story cards.
- PlayerRail status labels now participate in normal row layout instead of
  absolute overlays, preventing seat/status overlap in compact previews.

**Files changed:**

- `apps/mobile/src/dev/stories.ts` / `stories.test.ts` - game-surface story
  fixtures, compact hand previews, and story registration coverage.
- `apps/mobile/src/game/GameRouteScreen.test.tsx` - route-level active/lobby
  test moved out of the Expo Router app tree.
- `apps/mobile/src/game/PlayerRail/PlayerRail.tsx` /
  `PlayerRail.test.tsx` - compact non-overlapping player-card status layout.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - captured
  the visual-proof and compact-card layout learning.

**Verification:**

- Run: `git ls-files 'apps/mobile/src/app/**/*.test.*' 'apps/mobile/src/app/*.test.*'`
- Result: pass; no route-local test files remain under `src/app`.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx src/dev/stories.test.ts src/game/PlayerRail/PlayerRail.test.tsx src/game/CardHand src/game/GameBoard --runInBand`
- Result: pass, 7 suites / 31 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p07-t08-final3`
- Result: pass.
- Run: simulator story screenshot sweep in dark and light appearances.
- Result: pass. Evidence:
  `/tmp/p07-t08-game-board.png`, `/tmp/p07-t08-game-hand-fixed.png`,
  `/tmp/p07-t08-game-rail-fixed.png`, `/tmp/p07-t08-game-board-light.png`,
  `/tmp/p07-t08-game-hand-light.png`, and
  `/tmp/p07-t08-game-rail-light.png`.

**Notes / Decisions:**

- `/dev/[story]` did not need route changes because the existing `Card` story
  fixture type already accepts React node children.
- Dark screenshots first exposed two visual issues that tests/export missed:
  clipped full-hand fans and overlapping PlayerRail status labels. Both were
  fixed before the task was accepted.
- The Expo dev-client tools gear overlaps the top-right theme toggle in
  screenshots, but it does not obscure the story content being verified.

### Task p07-t09: Full tap-mode game verification

**Status:** completed
**Commits:** 1a1f149 / 65880bd

**Outcome:**

- Verified a full timed tap-mode game loop with local API, web, and mobile
  clients.
- Covered two-eyed jack placement, one-eyed jack removal, auto-draw, stale
  version recovery, timer display sync, locked sequence state, and final
  `GameWon` state.
- Recorded move round-trip p50 samples for the p11-t02 baseline: `6.1ms`
  in the orchestrator deterministic run and `3.35ms` in the subagent run.
- Fixed email input casing for mobile auth forms after device login exposed
  native autocapitalization.
- Fixed the mobile realtime inactivity watchdog so quiet live subscriptions
  remain connected and do not trigger false active-game freezes.

**Files changed:**

- `apps/mobile/src/components/TextField.tsx` /
  `TextField.test.tsx` - native text-input prop passthrough and coverage.
- `apps/mobile/src/app/(auth)/login.tsx` /
  `signup.tsx` - email keyboard/capitalization/autocorrect configuration.
- `apps/mobile/src/realtime/lifecycle.ts` /
  `lifecycle.test.ts` - quiet-live watchdog behavior and closed-socket
  reconnect coverage.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - captured
  the quiet-subscription watchdog learning.

**Verification:**

- Run: local API/web/mobile deterministic game
  `3fc7917c-862d-45a0-90e6-380a7335eb87`, invite `P07XENBK5P`.
- Result: pass. Final state `finished`, winner team `1`, version `5`, sequence
  locks on `23H,24H,25H,26H,27H`, and event sequence included `ChipPlaced`,
  `CardDrawn`, `TurnAdvanced`, `ChipRemoved`, `SequenceCompleted`, and
  `GameWon`.
- Run: stale-version move from a deliberately stale client version.
- Result: pass; API returned `409 CONFLICT`.
- Run: subagent deterministic game
  `e6fa8ecf-4839-41a6-b2bf-30b18e64f7ad`, invite `E6FA8ECF48`.
- Result: pass. Mobile one-eyed jack removed `17S` with `JS`, web placed `2D`,
  mobile two-eyed jack `JD` completed the winning sequence, and final status was
  `finished` with winner team `1`.
- Run: visual and accessibility proof.
- Result: pass. Evidence:
  `/tmp/p07-t09-web-active.png`, `/tmp/p07-t09-web-final.png`,
  `/tmp/p07-t09-mobile-initial.png`, `/tmp/p07-t09-mobile-final.png`, and
  `/tmp/p07-t09-mobile-active.png`. The final mobile proof stayed on the active
  game screen beyond the previous 15s watchdog failure point and exposed
  `game.timer`, `game.rail`, board cells, and hand cards in the accessibility
  tree.
- Run: `pnpm --filter @sequence/mobile exec jest src/components/TextField.test.tsx src/auth/login-screen.test.tsx src/auth/signup-screen.test.tsx --runInBand`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec jest src/realtime/lifecycle.test.ts src/realtime/use-game-stream.test.tsx --runInBand`
- Result: pass, 2 suites / 15 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p07-t09`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- Scenario evidence is recorded in this implementation artifact because the
  task itself had no planned source files. The two code commits are verification
  fixes surfaced by the scenario.
- The API remains the authority for stale-version recovery, draw events,
  sequence completion, and win state; mobile waits for server-authoritative
  stream updates rather than mutating the board optimistically.

---

## Phase 8: Game Surface — Advanced Play

**Status:** completed
**Started:** 2026-07-03

### Phase Summary

**Outcome (what changed):**

- Started advanced game-surface work by adding the mobile drag gesture layer
  foundation for hard-mode play.
- Added direct Expo-compatible `react-native-gesture-handler` and
  `react-native-reanimated` dependencies plus the Reanimated Babel plugin.
- Added a `DragLayer` overlay and `useDragChip()` hook that keep the moving
  ghost on Reanimated shared values, expose hover-confirm state only while over
  a board cell, and cancel drops outside the board.
- Added pure worklet-safe drag hit-testing helpers over the existing board
  layout-map frames so p08-t02 can wire submission without reworking the
  gesture foundation.
- Wired drag-mode drops into the game screen's server-authoritative move
  submission path, with invalid-drop feedback and board-local overlay geometry.
- Stabilized the native gesture runtime by wrapping the app in
  `GestureHandlerRootView`, importing Gesture Handler at the root, and pinning
  the Expo-compatible Worklets dependency directly.
- Added the sequence-choice sheet for >5-run pending choices, including
  client-side five-cell window selection, board highlighting, chained-choice
  copy, and `chooseSequenceCells` route wiring.
- Added dead-card turn-in controls for hard-mode drag play, reused the shared
  rule-violation feedback catalog for rejected turn-ins, and surfaced
  default-mode `DeadCardSwapped` events as a de-duplicated live toast.
- Added the board rotate control with Reanimated rotation, kept rotated
  layout-map frames aligned with drag hit-testing, and scaled 90/270-degree
  rotations so the non-square portrait-card board remains inside the drag
  layer's touch area.
- Verified hard-mode play end-to-end across the mobile simulator, public tRPC
  mutations, a web client, and direct DB assertions: dead-card turn-in,
  one-eyed removal, web opponent placement, no-card drag contract placement,
  pending sequence choice, final win, and a separate chained-choice proof.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/game/drag --runInBand`
- Result: pass, 2 suites / 5 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo install react-native-reanimated react-native-gesture-handler --check`
- Result: pass; direct dependencies match Expo SDK 57 expected versions.
- Run: `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p08-t01`
- Result: pass; iOS bundle exported successfully with the Reanimated Babel
  plugin configured.
- Run: `pnpm --filter @sequence/mobile exec jest src/test/root-layout.test.tsx src/game/GameRouteScreen.test.tsx src/game/drag --runInBand`
- Result: pass, 4 suites / 15 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile exec expo install react-native-reanimated react-native-gesture-handler react-native-worklets --check`
- Result: pass; direct dependencies match Expo SDK 57 expected versions.
- Run: `pnpm --filter @sequence/mobile ios`
- Result: pass; rebuilt and relaunched the development client after native
  Gesture Handler/Reanimated/Worklets changes.
- Run: `EXPO_UNSTABLE_MCP_SERVER=1 pnpm --filter @sequence/mobile exec expo start --dev-client --host lan --port 8081 --clear`
- Result: pass; cleared the stale Metro bundle that had produced a Worklets JSI
  assertion crash after the native rebuild.
- Run: local simulator drag-mode route proof for game
  `18d450fa-1eb9-4c4a-a91c-f1ef8a1996ad`.
- Result: pass; screenshots
  `/tmp/sequence-mobile-p08-t02-drag-game.png` and
  `/tmp/sequence-mobile-p08-t02-drag-after-move.png` show the active drag game
  and version 2 after a drag-mode no-card `game.makeMove` placed at `16D`; the
  dev-client subscription received the resulting three events.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/SequenceChoiceSheet.test.tsx src/game/GameRouteScreen.test.tsx --runInBand`
- Result: pass, 2 suites / 13 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/DeadCardControls.test.tsx src/game/GameRouteScreen.test.tsx src/game/feedback/toasts.test.ts --runInBand`
- Result: pass, 3 suites / 29 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check HEAD`
- Result: pass.
- Run: seeded drag-mode game
  `c5315deb-9acb-4f8c-b78a-355b0ae95447` with mobile seat 0 and web seat 1.
- Result: pass; event/version chain was `DeadCardSwapped` v2,
  `ChipRemoved`/`CardDrawn`/`TurnAdvanced` v3, web
  `ChipPlaced`/`CardDrawn`/`TurnAdvanced` v4, mobile no-card
  `ChipPlaced`/`PendingChoice` v5, and
  `SequenceCompleted`/`GameWon` v6.
- Run: simulator screenshots
  `/tmp/p08-t06-mobile-seeded.png`,
  `/tmp/p08-t06-mobile-pending-choice.png`, and
  `/tmp/p08-t06-mobile-final-win.png`.
- Result: pass; mobile route showed the seeded hard-mode board at v1, the
  pending-choice-highlight state at v5, and `Game finished` at v6.
- Run: web screenshot `/tmp/p08-t06-web-final-win.png`.
- Result: pass; web opponent client showed game-over, team 1 win, and
  sequence count 2/0/0.
- Run: DB assertions for game `c5315deb-9acb-4f8c-b78a-355b0ae95447`.
- Result: pass; `status=finished`, `version=6`, `winnerTeam=1`,
  `pendingChoice=null`, two locked team-1 sequences, `17S` cleared, and `23H`
  locked by sequence 2.
- Run: chained-choice seed `716fbe0d-ea9d-453f-bd00-117032eea989`.
- Result: pass; no-card two-eyed-jack placement at `15H` emitted
  `ChipPlaced`/`PendingChoice`, first choice emitted
  `SequenceCompleted`/`PendingChoice`, second choice emitted
  `SequenceCompleted`/`GameWon`.
- Run: `pnpm --filter @sequence/mobile exec jest src/game/GameBoard --runInBand`
- Result: pass, 3 suites / 16 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check HEAD`
- Result: pass.

**Notes / Decisions:**

- The drag layer intentionally does not submit moves or route-wire drag mode;
  p08-t02 owns `makeMove` integration and rejection feedback.
- Drag mode intentionally does not pre-highlight legal targets. The new layer
  only exposes hover-confirm state while the gesture is over a board cell.
- Adding these native gesture dependencies requires a dev-client rebuild before
  simulator proof of p08-t02/p08-t06 gesture behavior.
- After native Gesture Handler/Reanimated/Worklets changes, rebuild the dev
  client and restart Metro with `--clear`; stale bundles can crash the rebuilt
  native Worklets runtime even when the native build is valid.

### Task p08-t01: Drag gesture layer

**Status:** completed
**Commit:** 0a851b4

**Outcome:**

- Added a reusable `DragLayer` component for an absolute gesture overlay and
  card ghost.
- Added `useDragChip()` with Reanimated shared values for active state,
  translation, hover-confirm state, and reset animation.
- Added pure helper coverage for board layout-frame snapshotting, hit-testing,
  hover-confirm derivation, and release cancel/drop classification.
- Added direct Expo-compatible Gesture Handler and Reanimated dependencies plus
  the Reanimated Babel plugin.

**Files changed:**

- `apps/mobile/src/game/drag/DragLayer.tsx` /
  `DragLayer.test.tsx` - drag overlay and render/no-pre-highlight coverage.
- `apps/mobile/src/game/drag/use-drag-chip.ts` /
  `use-drag-chip.test.ts` - gesture hook, worklet-safe helpers, and pure
  hit-test/release coverage.
- `apps/mobile/package.json` / `pnpm-lock.yaml` - direct gesture dependencies.
- `apps/mobile/babel.config.js` - Reanimated Babel plugin.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/game/drag --runInBand`
- Result: pass, 2 suites / 5 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo install react-native-reanimated react-native-gesture-handler --check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p08-t01`
- Result: pass.
- Run: `git diff --check`
- Result: pass.

**Notes / Decisions:**

- `react-native-reanimated@4.5.0` and
  `react-native-gesture-handler@~2.32.0` are the SDK-compatible direct
  dependencies; the previously present transitive versions failed Expo's
  compatibility check.
- Gesture submission, illegal-drop feedback, and route mode branching remain
  p08-t02 scope.

---

### Task p08-t02: Drag submit + rejection feedback

**Status:** completed
**Commit:** 61df269 / a616e36

**Outcome:**

- Wired drag-mode `DragLayer` drops into `game.makeMove`, omitting the card
  payload so the API infers the consumed card for hard-mode drag play.
- Preserved tap-mode card/cell submission while keeping drag mode free of
  target pre-highlighting.
- Added drag-mode rejection feedback for invalid drops and stale/server
  rejection paths.
- Moved the drag overlay into a board-local wrapper so gesture release
  coordinates align with the measured board cell frames.
- Added root Gesture Handler setup and a direct Expo-compatible
  `react-native-worklets` dependency to keep Reanimated/Gesture Handler stable
  in the rebuilt iOS dev client.

**Files changed:**

- `apps/mobile/src/game/drag/DragLayer.tsx` /
  `DragLayer.test.tsx` - drop submission and rejection-feedback coverage.
- `apps/mobile/src/app/game/[id].tsx` /
  `apps/mobile/src/game/GameRouteScreen.test.tsx` - route drag-mode submit
  branch, board-local overlay placement, and active-route coverage.
- `apps/mobile/src/app/_layout.tsx`,
  `apps/mobile/src/test/setup.ts`, and
  `apps/mobile/src/test/root-layout.test.tsx` - Gesture Handler root setup and
  Jest native-module mocks.
- `apps/mobile/package.json` / `pnpm-lock.yaml` - direct Worklets dependency
  pinned to Expo SDK 57's expected version.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` and
  `using-expo-mcp-learnings.md` - captured the general project-learning log
  and the native-module rebuild/Metro cache gotcha for end-of-project skill
  distillation.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/test/root-layout.test.tsx src/game/GameRouteScreen.test.tsx src/game/drag --runInBand`
- Result: pass, 4 suites / 15 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo install react-native-reanimated react-native-gesture-handler react-native-worklets --check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p08-t02-final`
- Result: pass; iOS bundle exported successfully.
- Run: `git diff --check`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile ios`
- Result: pass; rebuilt and relaunched the iOS dev client after native module
  changes.
- Run: local simulator drag-mode route proof for game
  `18d450fa-1eb9-4c4a-a91c-f1ef8a1996ad`.
- Result: pass; `/tmp/sequence-mobile-p08-t02-drag-game.png` shows the active
  drag game with a live subscription, and
  `/tmp/sequence-mobile-p08-t02-drag-after-move.png` shows version 2 after a
  no-card drag-mode `game.makeMove` placed a chip at `16D`; Metro logged the
  three subscription events received by the app.

**Notes / Decisions:**

- Direct UI gesture injection remained unavailable in this session: local Expo
  MCP automation calls returned the known `Unexpected end of JSON input`, and
  Computer Use / AppleScript were blocked by macOS Accessibility permissions.
  The task still proceeded with focused unit coverage plus simulator route,
  server-contract, realtime, and screenshot evidence.
- The rebuilt dev client initially crashed with a Worklets JSI assertion until
  Metro was restarted with `--clear`. This is captured in both project learning
  logs for later skill/agent-instruction distillation.

---

### Task p08-t03: Sequence-choice sheet

**Status:** completed
**Commit:** e13a789

**Outcome:**

- Added a bottom-sheet `SequenceChoiceSheet` for pending >5-run choices owned
  by the current user.
- Derived valid five-cell contiguous windows from the pending run and required
  the chosen window to include the placed chip.
- Wired the active game route to `game.chooseSequenceCells` with the current
  game version.
- Highlighted the selected choice window on the board while disabling normal
  hand/move submission during pending choices.
- Rendered a frozen banner instead of the sheet when another seat owns the
  pending choice, and surfaced chained-choice copy when `additionalRuns` exist.

**Files changed:**

- `apps/mobile/src/game/SequenceChoiceSheet.tsx` /
  `SequenceChoiceSheet.test.tsx` - sheet UI, window derivation, selection,
  submit, chained-choice copy, and other-seat frozen state.
- `apps/mobile/src/app/game/[id].tsx` /
  `apps/mobile/src/game/GameRouteScreen.test.tsx` - route wiring,
  `chooseSequenceCells` mutation, pending-choice controls copy, and board
  highlight integration.
- `apps/mobile/src/game/GameBoard/GameBoard.tsx` - optional highlighted-cell
  support for the selected pending-choice window.
- `apps/mobile/src/test/test-ids.ts` - `sequenceChoice` testID namespace.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/game/SequenceChoiceSheet.test.tsx src/game/GameRouteScreen.test.tsx --runInBand`
- Result: pass, 2 suites / 13 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check HEAD`
- Result: pass.

**Notes / Decisions:**

- The sheet treats the server as authoritative; client-side validation exists
  only to guide users toward valid five-cell windows before submitting.
- Other-seat pending choices freeze the active game surface and keep the board
  visible without exposing the local selection sheet.

---

### Task p08-t04: Dead-card turn-in + auto-swap surfacing

**Status:** completed
**Commit:** 6ca7d32

**Outcome:**

- Added `useDeadCardControls()` for versioned `game.turnInDeadCard` mutation
  submission, pending state, haptics, and shared move-feedback mapping.
- Wired drag-mode dead-card hand affordances to turn in cards without also
  submitting/selecting a normal move.
- Surfaced same-turn rejected turn-ins through the existing
  `not-a-dead-card` rule-violation message.
- Surfaced default-mode `DeadCardSwapped` events as an auto-swap toast, keyed
  by event sequence so rerenders do not duplicate the feedback.

**Files changed:**

- `apps/mobile/src/game/DeadCardControls.tsx` /
  `DeadCardControls.test.tsx` - dead-card turn-in hook, auto-swap event
  feedback, and focused tests.
- `apps/mobile/src/app/game/[id].tsx` /
  `apps/mobile/src/game/GameRouteScreen.test.tsx` - active-route wiring and
  versioned mutation coverage.
- `apps/mobile/src/game/feedback/toasts.ts` /
  `toasts.test.ts` - default-mode auto-swap feedback constant.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/game/DeadCardControls.test.tsx src/game/GameRouteScreen.test.tsx src/game/feedback/toasts.test.ts --runInBand`
- Result: pass, 3 suites / 29 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check HEAD`
- Result: pass.

**Notes / Decisions:**

- Auto-swap feedback is scoped to non-drag mode because drag mode exposes the
  explicit turn-in affordance.
- Turn-in success remains server authoritative; the hook does not mutate the
  local hand and waits for the stream/view update.

---

### Task p08-t05: Board rotate control

**Status:** completed
**Commit:** b21961a / aaa8f56

**Outcome:**

- Added an in-board `board.rotate` control that cycles the board through
  0/90/180/270-degree orientations.
- Animated board rotation with Reanimated `withTiming`.
- Registered transformed layout-map frames for each orientation so drag
  hit-testing follows the visual board.
- Scaled 90/270-degree rotations to the existing board bounds so the portrait
  card-aspect board does not produce negative or overflow hit targets.

**Files changed:**

- `apps/mobile/src/game/GameBoard/GameBoard.tsx` - rotation control, animated
  transform, and layout-map frame transformation.
- `apps/mobile/src/game/GameBoard/GameBoard.test.tsx` - cycle coverage,
  rotated frame assertions, and rotated hit-test coverage.
- `apps/mobile/src/game/GameBoard/spotlight.test.ts` - Reanimated mock setup
  for the updated board dependency.

**Verification:**

- Run: `pnpm --filter @sequence/mobile exec jest src/game/GameBoard --runInBand`
- Result: pass, 3 suites / 16 tests; Watchman emitted the existing recrawl
  warning only.
- Run: `pnpm --filter @sequence/mobile typecheck`
- Result: pass.
- Run: `pnpm --filter @sequence/mobile lint`
- Result: pass.
- Run: `pnpm format:check`
- Result: pass.
- Run: `git diff --check HEAD`
- Result: pass.

**Notes / Decisions:**

- The Sequence board is not square because cells use portrait card aspect
  ratio. Raw 90-degree rotation can move cells outside the drag layer, so the
  90/270-degree visual transform and registered frames both scale to fit the
  existing board bounds.

---

### Task p08-t06: Hard-mode e2e verification

**Status:** completed
**Commit:** 7e06cfc

**Outcome:**

- Seeded a real drag-mode game for the mobile simulator's signed-in account
  (`mobile-1783120066432-1529@example.test`) and a registered web opponent
  (`p08-web-1783128469616@example.test`).
- Verified hard-mode dead-card turn-in through the public
  `game.turnInDeadCard` mutation; the event stream emitted
  `DeadCardSwapped` with no turn advance.
- Verified one-eyed jack removal in hard mode via no-card `game.makeMove`; the
  event stream emitted `ChipRemoved`, `CardDrawn`, and `TurnAdvanced`.
- Verified the web opponent seat advanced the game with a legal placement.
- Verified the mobile hard-mode no-card placement contract at `23H`, producing
  a `PendingChoice`, then resolved the choice to complete the second team-1
  sequence and win.
- Verified chained choice on a separate deterministic seeded drag game where a
  two-eyed-jack no-card placement at `15H` produced two crossing six-runs.

**Files changed:**

- None in app source. Evidence was captured in this implementation artifact and
  durable project learnings.

**Verification:**

- Run: seeded drag-mode game
  `c5315deb-9acb-4f8c-b78a-355b0ae95447`.
- Result: pass; event/version chain was:
  `v2 DeadCardSwapped`,
  `v3 ChipRemoved/CardDrawn/TurnAdvanced`,
  `v4 ChipPlaced/CardDrawn/TurnAdvanced` from the web opponent,
  `v5 ChipPlaced/PendingChoice`, and
  `v6 SequenceCompleted/GameWon`.
- Run: screenshots
  `/tmp/p08-t06-mobile-seeded.png`,
  `/tmp/p08-t06-mobile-pending-choice.png`,
  `/tmp/p08-t06-mobile-final-win.png`, and
  `/tmp/p08-t06-web-final-win.png`.
- Result: pass; mobile showed the hard-mode board, pending-choice state, and
  final version 6; web showed game-over with `Team 1 wins`.
- Run: DB assertions for
  `c5315deb-9acb-4f8c-b78a-355b0ae95447`.
- Result: pass; status finished, winner team 1, no pending choice, two team-1
  sequences, removed target `17S` empty, and `23H` locked by sequence 2.
- Run: chained-choice seed `716fbe0d-ea9d-453f-bd00-117032eea989`.
- Result: pass; first choice chained to a second `PendingChoice`, and resolving
  the second completed the game with `GameWon`.

**Notes / Decisions:**

- Direct simulator gesture injection was still not available, so the pass
  combined simulator route/stream screenshots with public tRPC hard-mode
  mutations and DB assertions. The no-card `makeMove` calls exercised the same
  server contract that drag-mode UI uses after a drop.
- Chained choice was verified through a deterministic API-backed seed rather
  than another simulator route because the primary end-to-end game already
  finished on the first resolved pending choice.

---

## Phase 9: Lifecycle + Local Pass-and-Play

**Status:** completed
**Started:** 2026-07-04

### Phase Summary

**Outcome (what changed):**

- Active games now expose save-and-exit and concede controls with confirmation,
  version-guarded mutations, guest-roster save hiding, dashboard navigation for
  saved games, and active-game-specific lifecycle error copy.
- Frozen games now keep the board/player context visible while disabling play,
  show the disconnected player and expiry copy in the connection banner, resume
  automatically from the live stream when status returns to active, and saved
  games render a resumable state with expiry messaging.
- Finished games now render a mobile GameOver screen with web-parity result
  titles, winner/concede attribution, local win/loss/unknown outcome copy,
  winning sequence representation, and rematch/dashboard action testIDs.
- Rematch on finished games now calls `game.rematch`, disables while pending,
  navigates to the returned new game route on success, and shows
  finished-game-specific unavailable/error copy on failure.
- Local pass-and-play now has a mobile HandoffScreen gate that names the
  incoming player, hides the entire hand tree until reveal, then shows only the
  active local seat's hand as the stream current seat changes.
- Local saved/resumable games now surface an explicit dashboard `LOCAL` badge,
  route back into `/game/<id>` from the dashboard, and resumed local active
  streams enter through the handoff veil when another seat is current.
- Phase 9 lifecycle verification passed against the running local API/web stack
  plus focused API/mobile suites: save/resume, concede outcomes, freeze/resume,
  rematch, local pass-and-play save, and expiry UI coverage are all evidenced.

**Verification:**

- Run:
  `pnpm --filter @sequence/mobile exec jest src/game/ActiveGameControls.test.tsx src/game/GameRouteScreen.test.tsx --runInBand`
- Run:
  `pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx src/components/ConnectionBanner.test.tsx --runInBand`
- Run:
  `TZ=UTC pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx --runInBand`
- Run:
  `pnpm --filter @sequence/mobile exec jest src/game/GameOver.test.tsx src/game/GameRouteScreen.test.tsx --runInBand`
- Run:
  `pnpm --filter @sequence/mobile exec jest src/game/HandoffScreen.test.tsx src/game/GameRouteScreen.test.tsx --runInBand`
- Run:
  `pnpm --filter @sequence/mobile exec jest src/features/dashboard src/game/ActiveGameControls.test.tsx --runInBand`
- Run:
  `pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx --runInBand`
- Run:
  `pnpm --filter @sequence/api exec vitest run src/game/routes/lifecycle.test.ts src/game/presence.test.ts`
- Run:
  `pnpm --filter @sequence/mobile exec jest src/game/ActiveGameControls.test.tsx src/game/GameRouteScreen.test.tsx src/components/ConnectionBanner.test.tsx src/game/GameOver.test.tsx src/game/HandoffScreen.test.tsx --runInBand`
- Run: `node /tmp/p09-t07-live.mjs`
- Run: `pnpm --filter @sequence/mobile typecheck`
- Run: `pnpm --filter @sequence/mobile lint`
- Run: `pnpm format:check`
- Run: `git diff --check HEAD`
- Result: pass; Jest reported the known Watchman recrawl warning.

**Notes / Decisions:**

- Save-and-exit intentionally navigates to the dashboard while concede waits
  for the authoritative stream to render the outcome.
- Expiry/date tests compute the expected local `Intl.DateTimeFormat` output
  instead of hardcoding a timezone-specific string; the p09-t02 check was also
  run under `TZ=UTC`.
- Rematch success uses `router.replace('/game/<newId>')` to land in the newly
  created rematch lobby/active game returned by the API.
- Local pass-and-play move authorization remains server-authoritative: the API
  resolves local creator actions to the current server seat, while mobile swaps
  `mySeat`/visible hand only for UI targeting and hand privacy.
- Resumed local active games initialize the locally revealed seat from
  `view.mySeat`, not `view.currentSeat`, so a current-seat mismatch shows
  `HandoffScreen` before exposing the incoming hand.
- p09-t07 live stack evidence used the already-running local API
  (`localhost:3001`), web app (`localhost:3000`), and system Chrome because the
  local Playwright bundled Chromium cache was absent. The temp probe created
  unique users/games and left no repo files behind.
- Live matrix IDs: registered save/resume
  `578d55e4-d71d-42bd-9a6f-3756a849b6d8` (`resumeState: active` after the
  saved card was observed in `myGames`), 2-team concede
  `25529460-e675-4840-9c0f-016cf050cf07`, 3-player FFA concede
  `e31c7373-a4e0-4769-ac67-c028b4c0b0aa`, disconnect freeze/resume
  `73b881a5-f5dd-48c3-99bf-a1d0ad883978`, rematch
  `9699eba3-e086-4995-b0b8-86d1e039a547`, and local pass-and-play save after
  a real handoff `b16166f5-68c3-4321-9ec3-6cf79fb00628`.
- Expiry messaging was fixture-verified rather than live-seeded: mobile route
  tests cover saved expiry copy with computed `Intl.DateTimeFormat` labels, the
  connection banner covers frozen expiry copy, and p09-t02 includes a `TZ=UTC`
  rerun to avoid local-time false positives.

---

## Phase 10: History, Notifications, Settings, Polish

**Status:** completed
**Started:** 2026-07-04

### Phase Summary

**Outcome (what changed):**

- Mobile now has a signed-in `/history` route with aggregate record, completed
  games pagination, local-game/result badges, empty/loading states, and
  head-to-head rows backed by `history.myRecord`, `history.myGames`, and
  `history.headToHead`.
- The signed-in dashboard now exposes a History action so the route is reachable
  from the app, matching the web dashboard's full-history affordance.
- Active game streams now surface in-app notification affordances for turn
  changes to my seat, opponent sequences, concede, and disconnect/freeze events,
  with Expo notification haptics and a seq baseline that avoids replaying the
  initial stream view as a toast.
- The shared move-feedback catalog now exposes a broader `GameFeedback` shape
  while preserving all 13 rule-violation mappings through UI feedback tests.
- Mobile now has a signed-in `/settings` route with theme mode controls,
  logout, version display, and a dashboard Settings entry point.
- Settings tests live outside the Expo Router app tree while the route itself
  stays in `src/app/settings.tsx`.
- Dashboard, history, and join preview now distinguish generic query failures
  from empty/not-found states, with retry affordance on invite preview errors.
- The mobile dev story test now carries the same Reanimated mock used by route
  tests so full mobile Jest covers the playground story registry.
- Dashboard, create, join, history, settings, and active-game surfaces now have
  additional accessibility labels and stable testIDs across actions,
  loading/empty/error states, badges, and game control messaging.
- Route and feature tests now exercise these screens through testID and
  accessibility queries without coordinate fallbacks.
- The p10-t06 both-theme visual pass covered dashboard, create, join, history,
  settings, an active local game, and development game-surface fixtures in
  light and dark appearances. FR15 system tracking and manual theme override
  persistence passed without requiring source changes.
- FR13-FR15 parity verification passed: seeded history data rendered the
  expected 2-1 record, head-to-head row, completed-game rows, and local-game
  badge; a live active local game exposed the notification surface and active
  game affordances; FR15 reused the accepted p10-t06 theme persistence and
  both-theme evidence.

**Verification:**

- Run:
  `pnpm --filter @sequence/mobile exec jest src/features/history src/features/dashboard src/test/root-layout.test.tsx --runInBand`
- Run: `pnpm --filter @sequence/mobile typecheck`
- Run: `pnpm --filter @sequence/mobile lint`
- Run: `pnpm format:check`
- Run: `git diff --check HEAD`
- Result: pass; Jest reported the known Watchman recrawl warning.
- Run:
  `pnpm --filter @sequence/mobile exec jest src/game/feedback src/game/GameRouteScreen.test.tsx --runInBand`
- Run: `pnpm --filter @sequence/mobile typecheck`
- Run: `pnpm --filter @sequence/mobile lint`
- Run: `pnpm format:check`
- Run: `git diff --check HEAD`
- Result: pass; Jest reported the known Watchman recrawl warning.
- Run:
  `pnpm --filter @sequence/mobile exec jest src/features/settings/SettingsScreen.test.tsx src/features/dashboard/DashboardScreen.test.tsx src/test/root-layout.test.tsx src/test/index.test.tsx --runInBand`
- Run: `pnpm --filter @sequence/mobile typecheck`
- Run: `pnpm --filter @sequence/mobile lint`
- Run: `pnpm format:check`
- Run: `git diff --check HEAD`
- Result: pass; Jest reported the known Watchman recrawl warning.
- Run: `pnpm --filter @sequence/mobile test`
- Run: `pnpm --filter @sequence/mobile typecheck`
- Run: `pnpm --filter @sequence/mobile lint`
- Run: `pnpm format:check`
- Run: `git diff --check HEAD`
- Result: pass; Jest reported the known Watchman recrawl warning. Simulator
  screenshot pass was not run for p10-t04; visual coverage remains scheduled in
  p10-t06/p10-t07, while this state sweep is covered by component/route tests.
- Run: `pnpm --filter @sequence/mobile test`
- Run: `pnpm --filter @sequence/mobile typecheck`
- Run: `pnpm --filter @sequence/mobile lint`
- Run: `pnpm format:check`
- Run: `git diff --check HEAD`
- Result: pass; Jest reported the known Watchman recrawl warning. The updated
  tests drive dashboard, create, join, history, settings, and active-game
  affordances through testID/accessibility queries, so no coordinate fallback
  was needed for this audit.
- Run: local API + Metro LAN + iOS dev-client p10-t06 both-theme visual pass,
  including `simctl` light/dark appearance changes and a terminate/relaunch
  persistence check for the Light theme override while the simulator stayed in
  dark appearance.
- Result: pass; no contrast or token misuse fixes were needed. Screenshot
  evidence:
  `/tmp/p10-t06-dashboard-current.png`,
  `/tmp/p10-t06-dashboard-light.png`,
  `/tmp/p10-t06-create-light.png`, `/tmp/p10-t06-create-dark.png`,
  `/tmp/p10-t06-game-active-dark.png`,
  `/tmp/p10-t06-game-active-light.png`,
  `/tmp/p10-t06-history-light.png`, `/tmp/p10-t06-history-dark.png`,
  `/tmp/p10-t06-settings-system-dark.png`,
  `/tmp/p10-t06-settings-light-override.png`,
  `/tmp/p10-t06-settings-light-persisted-after-relaunch.png`,
  `/tmp/p10-t06-join-entry-dark.png`,
  `/tmp/p10-t06-join-entry-light.png`,
  `/tmp/p10-t06-join-preview-not-found-light.png`,
  `/tmp/p10-t06-join-preview-not-found-dark.png`,
  `/tmp/p10-t06-dev-index-dark.png`,
  `/tmp/p10-t06-dev-index-light-final.png`,
  `/tmp/p10-t06-dev-game-board-light.png`, and
  `/tmp/p10-t06-dev-game-board-dark.png`.
- Run: `pnpm --filter @sequence/mobile test`
- Run: `pnpm --filter @sequence/mobile typecheck`
- Run: `pnpm --filter @sequence/mobile lint`
- Run: `pnpm format:check`
- Run: `git diff --check HEAD`
- Result: pass; mobile Jest reported 49 suites / 297 tests with the known
  Watchman recrawl warning.
- Run: local API + Metro LAN + iOS dev-client p10-t07 parity verification.
- Result: pass. FR13 seeded account
  `p10t06-direct-1783137043685@example.test` with opponent
  `Parity Opponent` (`p10-t07-opponent-1783138511475`), finished games
  `52791c97-6eee-4116-9628-a61c089283f2`,
  `cccc5d11-eb19-4840-8185-159c8dac2ad0`,
  `a476d393-f1e2-4f14-8276-0d2f956c0d07`, and local listed game
  `028b77dd-33f0-4cf3-a655-495f27ef70d7`. Screenshot
  `/tmp/p10-t07-history-seeded.png` and accessibility tree confirmed record
  `2 / 1 / 3`, `Parity Opponent 2-1`, `3 games`, and `LOCAL`.
- Result: pass. FR14 live active game with opponent `P10 Nia` produced
  screenshot `/tmp/p10-t07-active-local-created.png`; accessibility tree
  confirmed `Your turn`, player rail, lifecycle controls, and board
  affordances. Deterministic fallback tests cover turn-to-me, opponent
  sequence, concede, freeze/disconnect, haptics/toasts, and violation mapping.
- Result: pass. FR15 reused the p10-t06 both-theme screenshot set and
  persisted Light-override relaunch proof; current p10-t07 screenshots also
  include `/tmp/p10-t07-launch.png` and `/tmp/p10-t07-create-screen.png`.
- Run:
  `pnpm --filter @sequence/mobile exec jest src/features/history src/game/feedback src/features/settings/SettingsScreen.test.tsx src/theme/theme-provider.test.tsx --runInBand`
- Result: pass, 5 suites / 44 tests.

**Notes / Decisions:**

- The history route test lives under `src/features/history` rather than
  `src/app` to preserve the Expo Router test-location rule.
- Stream-driven notification effects establish their first-seen seq from the
  first visible view, then only process later `recentEvents` entries. This keeps
  resumed screens and initial snapshots quiet while still surfacing live events.
- The plan's `src/app/settings.test.tsx` path was adapted to
  `src/features/settings/SettingsScreen.test.tsx` to preserve the repo's
  established Expo Router test-location rule.
- p10-t04 screenshot proof was deferred to the existing visual-verification
  tasks because the changes are state-specific query/error branches with
  focused test coverage and no new layout primitive.
- p10-t05 verified the planned NFR5 selector/accessibility audit through
  component and route tests rather than simulator coordinate driving; the
  relevant user flows are queryable by stable testIDs or accessibility labels.
- p10-t06 produced no app code commit because the visual pass found no
  contrast/token misuse to fix. The OAT tracking commit records evidence and
  advances the task.
- Some screenshots include the Expo dev-client gear near the top-right. This
  is a tooling overlay and did not obscure the app surfaces under review.
- The bounded `simctl io screenshot` wrapper can exit by alarm after a valid
  PNG is already written; each selected p10-t06 screenshot was confirmed with
  `file` as a full-size simulator PNG.
- A simulator-driving p10-t06 subagent was closed after route/theme
  interference with local evidence collection. The learning was captured in
  `references/project-learnings.md`: a booted simulator needs exclusive
  ownership during visual/scenario verification.
- p10-t07 produced no app code commit because the scenario found no source
  issues to fix. The live FR14 event-transition attempt was narrowed to a live
  active-game surface plus deterministic notification tests, which is the
  source of truth for turn/event affordance mapping.

---

## Phase 11: Hardening

**Status:** completed
**Started:** 2026-07-04

### Phase Summary

**Outcome:**

- NFR2 lifecycle recovery now has fresh simulator and automated coverage for
  API restart, brief background/foreground recovery, force-quit route recovery,
  stale-version submit recovery, and stale replay-window snapshot fallback.
- The mobile client now treats no-timer `PlayerReconnected` events as an active
  resume signal, clearing frozen expiry state and marking the roster connected.
- The API presence tracker now counts overlapping subscriptions per seat,
  handles local-game presence as creator-connection coverage for every seat,
  awaits presence connection before the first stream snapshot, and rechecks for
  post-freeze reconnect races before leaving a game frozen.
- Project-level learnings now capture the DB-reset simulator gotcha, route-test
  hook wiring gotcha, and presence-race testing pattern for later skill and
  `AGENTS.md` distillation.
- NFR3 now has fresh game-surface profiling evidence. The selected-card/drag
  session produced 3 React commits over `21.6s`, no per-frame React commit
  cascade during drag movement, and no `BoardCell` renders in the hot commit
  query.
- Board-cell memo boundaries are hardened against route-level callback churn,
  and the mutable board layout map now publishes revision updates so Reanimated
  drag snapshots refresh after frame mutations.
- Project-level and Expo MCP learnings now capture the p11-t02 perf workflow:
  stable board callbacks, layout-map revision subscriptions, Argent profiler
  start/stop/analyze usage, and commit-query validation.
- NFR4 release-audit hardening now fails closed for production `apiUrl`/`wsUrl`
  protocol drift, strips app `console.*` calls from production Babel output,
  and excludes development-only Expo Router routes from the production Hermes
  bundle through a production router context.
- The release audit confirmed credential storage boundaries and remote-hand
  redaction: Better Auth session and raw guest tokens stay in SecureStore, and
  the host's remote `GameSnapshotView` contained only seat 0's hand with no
  `localHands` or exact opponent-hand array.
- NFR6 gate sweep is green across root typecheck, lint, format check, tests,
  build, and DB-backed web Playwright e2e. The sweep fixed two gate-runner
  issues: Playwright config now uses explicit CommonJS to avoid the TS loader
  ESM/CJS mismatch, and both API Vitest and web Playwright load
  `packages/api/.env` as a local fallback so DB-backed gates run from a clean
  shell.
- NFR7 phase audit confirmed Phases 1-11 had no required human operator steps.
  The only pre-Phase-12 human-adjacent item is optional remote Expo MCP OAuth;
  the required local loop remains covered by local `expo-mcp`, Argent, and
  `simctl`.
- The mobile operator runbook now has complete required-vs-optional guidance
  for local machine setup, Expo account/EAS project setup, Apple Developer
  access, App Store Connect bundle/app record creation, EAS credentials,
  TestFlight groups, physical-device verification, and production smoke.
- Documentation parity is current for the mobile workspace and shared client
  packages. Root docs, package READMEs, `AGENTS.md`, mobile instructions, the
  environment template, architecture, development, testing, styling, and
  configuration docs now describe `apps/mobile`, `@sequence/client-state`, and
  `@sequence/design-tokens`.
- Pre-distribution local and production smoke passed through the public API
  contract: auth, create, registered join, 2-client play-to-win, rematch,
  local pass-and-play, save/resume, concede, and timers. The production smoke
  used throwaway accounts against the Railway API and kept persistent WebSocket
  streams open during active-game lifecycle checks to avoid artificial presence
  freezes.

**Verification:**

- Run: local API + Metro LAN + iOS dev-client p11-t01 force-quit/relaunch
  check.
- Result: pass after reducer fix; game route recovered to active/no paused in
  `2743ms` with screenshot `/tmp/p11-t01-after-fix-active.png` and summary
  `/tmp/p11-t01-after-fix-active-summary.json`.
- Run: local API kill/restart scenario.
- Result: pass; disconnect detected in `1299ms`, API restart-to-health
  `1580ms`, restart-to-recovered `4391ms`, health-to-recovered `2811ms`.
  Evidence: `/tmp/p11-t01-api-kill-restart-summary.json` and
  `/tmp/p11-t01-api-kill-restart-recovered.png`.
- Run: local game first-snapshot presence proof after API route ordering fix.
- Result: pass; accessibility tree showed both local seats connected on the
  first refreshed game view. Screenshot:
  `/tmp/p11-t01-local-presence-await-fixed.png`.
- Run: brief background/foreground scenario against local API + iOS dev-client.
- Result: pass after post-freeze reconnect-race fix; foreground-to-active
  `1830ms`, no `Game paused`, no `Connection lost`, and both seats connected.
  Evidence: `/tmp/p11-t01-brief-background-summary.json` and
  `/tmp/p11-t01-brief-background-recovered.png`.
- Run: `pnpm --filter @sequence/client-state test`.
- Result: pass, 2 files / 11 tests.
- Run:
  `pnpm --filter @sequence/api exec vitest run src/game/presence.test.ts src/game/routes/on-game-event.test.ts src/game/routes/make-move.test.ts`.
- Result: pass, 3 files / 32 tests. Includes replay-window fallback snapshot,
  awaitable presence-hook snapshot, overlapping subscription, and post-freeze
  reconnect-race regressions.
- Run:
  `pnpm --filter @sequence/mobile exec jest src/realtime/use-game-stream.test.tsx src/components/ConnectionBanner.test.tsx src/game/use-move-submit.test.ts src/game/GameRouteScreen.test.tsx --runInBand`.
- Result: pass, 4 suites / 38 tests; Jest reported the known Watchman recrawl
  warning.
- Run: `pnpm --filter @sequence/api typecheck`;
  `pnpm --filter @sequence/client-state typecheck`;
  `pnpm --filter @sequence/mobile typecheck`;
  `pnpm format:check`; `pnpm lint`; `git diff --check`.
- Result: pass. `pnpm lint` exits zero with existing warnings, including
  `unicorn(no-array-sort)` in `presence.ts`; `toSorted` was not compatible with
  the package's current TypeScript lib target, so the target-compatible `sort`
  remains.
- Run: Argent React profiler over the active local drag game:
  `react-profiler-start`, tap `hand.card.8S`, `gesture-swipe` toward
  `board.cell.15D`, `react-profiler-stop`, `react-profiler-analyze`, and
  `profiler-commit-query`.
- Result: pass. Profiler captured 3 React commits / `21.6s`; one dev-mode hot
  commit (`29.45ms`) followed the selection tap and mounted the drag chip/card;
  drag movement did not create per-frame React commits, and
  `profiler-commit-query --component_name BoardCell` returned no `BoardCell`
  commit data. Evidence: `/tmp/p11-t02-react-profiler-report.md` and
  `/tmp/p11-t02-active-drag-profile.png`.
- Run:
  `pnpm --filter @sequence/mobile exec jest src/game/GameBoard/GameBoard.test.tsx src/game/GameBoard/layout-map.test.ts src/game/drag/use-drag-chip.test.ts src/game/drag/DragLayer.test.tsx src/game/use-move-submit.test.ts src/game/GameRouteScreen.test.tsx src/realtime/use-game-stream.test.tsx --runInBand`.
- Result: pass, 7 suites / 54 tests; Jest reported the known Watchman recrawl
  warning.
- Run: `pnpm --filter @sequence/mobile typecheck`;
  `pnpm --filter @sequence/mobile lint`; `pnpm format:check`;
  `git diff --check`.
- Result: pass.
- Run: `NODE_ENV=production pnpm --filter @sequence/mobile exec expo config --type public`.
- Result: expected fail-closed pass; production config without secure overrides
  errors with `EXPO_PUBLIC_API_URL must use https in production.`
- Run:
  `NODE_ENV=production EXPO_PUBLIC_API_URL=https://sequence-api-production-8687.up.railway.app EXPO_PUBLIC_WS_URL=wss://sequence-api-production-8687.up.railway.app pnpm --filter @sequence/mobile exec expo config --type public --json`.
- Result: pass; public config resolves secure production `apiUrl` and `wsUrl`.
- Run:
  `NODE_ENV=production EXPO_PUBLIC_API_URL=https://sequence-api-production-8687.up.railway.app EXPO_PUBLIC_WS_URL=wss://sequence-api-production-8687.up.railway.app pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p11-t03-current`.
- Result: pass; production iOS export bundled 1036 modules and produced
  `/tmp/sequence-mobile-export-p11-t03-current/_expo/static/js/ios/entry-4e1dc39a01bdc816ea069a45914dc083.hbc`
  at `2.1M`.
- Run: release bundle `strings -a ... | rg -o ... | sort -u` scans for
  dev-route markers, `expo-mcp`, app move telemetry, localhost endpoints, and
  raw auth-token keys.
- Result: pass; dev-route, `expo-mcp`, localhost endpoint, app telemetry, and
  raw auth-token marker scans were empty. The only console marker found was a
  generic dependency `console.error`; a narrow Babel transform proof produced
  `const y = void 0;`, confirming app console calls are stripped.
- Run: source credential audit greps across `apps/mobile/src`.
- Result: pass; Better Auth session storage uses `expo-secure-store`,
  guest raw tokens use SecureStore async APIs, and AsyncStorage usage is limited
  to theme preference plus guest-game registry metadata.
- Run: live local API remote-game redaction proof with database hand comparison
  and `@sequence/client-state` projection.
- Result: pass; `/tmp/p11-t03-remote-game-summary.json` shows remote game
  `62959319-7538-4ebd-9b82-46cf2c817bde`, host seat 0, host hand matching DB,
  no `localHands`, and no exact seat 1 hand array in the server snapshot or
  client `GameSnapshotView`.
- Run: clean-shell root `pnpm test`.
- Result: pass; the API Vitest config loaded `packages/api/.env`, Drizzle
  schema push reported no changes, 63 Vitest files / 411 tests passed with
  DB-backed API integration active, and mobile Jest passed 49 suites / 299
  tests.
- Run: `pnpm --filter @sequence/web e2e` from a clean shell with no exported
  `DATABASE_URL_TEST`.
- Result: pass after Playwright cache install; Playwright loaded
  `packages/api/.env` fallback, started its own API/web servers, and ran 10
  tests across `desktop-chromium` and `mobile-375`.
- Run: `pnpm typecheck`; `pnpm lint`; `pnpm format:check`; `pnpm build`;
  `git diff --check`.
- Result: pass. `pnpm lint` exits zero with the same existing non-fatal
  warnings (`unicorn(no-array-sort)` and `unicorn(consistent-function-scoping)`).
- Run: p11-t05 runbook audit over plan/design/spec/runbook plus sidecar
  read-only review.
- Result: pass; no required operator work found in Phases 1-11, optional
  remote Expo MCP OAuth remains the only pre-final human-adjacent item, and
  Phase 12 remains the single operator phase.
- Run: runbook structural check for Sections 0-7 requiring `Why`, `When`,
  `Prerequisites`, `Steps`, `Verify`, and `Troubleshooting`; leftover
  placeholder grep; required/optional label grep; `git diff --check`.
- Result: pass; all required headings are present, no placeholder scaffold text
  remains, required/optional language is present, and no whitespace errors were
  reported.
- Run: p11-t06 sidecar documentation gap audit over target docs and package
  surfaces.
- Result: pass; the audit identified stale web-only boundaries, missing package
  READMEs, mobile workflow/testing gaps, config-template drift, and stale agent
  pointers, all resolved in the p11-t06 commit.
- Run: `pnpm format:check`; relative Markdown link sweep over changed docs;
  `git diff --check`; stale-phrase grep for pre-mobile wording.
- Result: pass. The first format check flagged only the two new package
  READMEs; `pnpm exec oxfmt packages/client-state/README.md packages/design-tokens/README.md`
  fixed them, and the final format check passed. Link sweep checked 13 Markdown
  files, whitespace was clean, and the stale-phrase sweep had no hits.
- Run:
  `pnpm --filter @sequence/api exec vitest run src/test/full-game.e2e.test.ts src/game/routes/lifecycle.test.ts src/game/routes/rematch.test.ts src/game/TimerService.test.ts src/game/routes/create-game.test.ts src/game/routes/join-game.test.ts`.
- Result: pass; 6 files / 35 tests covered auth/create/join/start,
  play-to-win/rematch, local pass-and-play creation, save/concede/myGames, and
  timer service lifecycle.
- Run:
  `node --experimental-transform-types --env-file=packages/api/.env /tmp/p11-t07-smoke.mjs`.
- Result: pass. Local in-process API against `DATABASE_URL_TEST` passed in
  `1348ms`; production Railway API passed in `17168ms`. Summary evidence:
  `/tmp/p11-t07-smoke-summary.json`.

### Task p11-t01: NFR2 measured scenario matrix

**Status:** completed
**Commit:** fcfc1f9

**Outcome:**

- Captured NFR2 measured recovery evidence and fixed locally diagnosed
  lifecycle defects found during the matrix.
- Added reducer coverage for no-timer `PlayerReconnected` resume.
- Added API coverage for stale replay-window snapshot fallback, awaitable
  presence before initial snapshots, overlapping subscription disconnects, local
  presence semantics, and reconnect races around freeze commits.
- Recorded broad project learnings adjacent to the Expo MCP-specific learnings
  log.

**Measured values:**

| Scenario                           | Result | Measurement / Evidence                                                                                                                                    |
| ---------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Force-quit/relaunch route recovery | pass   | Active/no paused route recovered in `2743ms`; `/tmp/p11-t01-after-fix-active-summary.json`, `/tmp/p11-t01-after-fix-active.png`                           |
| API kill/restart mid-game          | pass   | Detection `1299ms`; restart-to-health `1580ms`; restart-to-recovered `4391ms`; health-to-recovered `2811ms`; `/tmp/p11-t01-api-kill-restart-summary.json` |
| Brief background/foreground        | pass   | Foreground-to-active `1830ms`; no paused/connection-lost; both seats connected; `/tmp/p11-t01-brief-background-summary.json`                              |
| Replay-window stale cursor         | pass   | API regression proves `lastEventId=1` after 502 events yields snapshot id `502`; prior live p05 evidence remains `/tmp/p05-t07-replay-summary.json`       |
| Stale-version submit recovery      | pass   | Focused API/mobile tests cover stale move conflict handling and recovery copy: `make-move.test.ts`, `use-move-submit.test.ts`, `GameRouteScreen.test.tsx` |

**Files changed:**

- `packages/client-state/src/game-state.ts` - `PlayerReconnected` now resumes
  no-timer frozen views to active and clears expiry.
- `packages/client-state/src/game-state.test.ts` - reducer regression for
  `PlayerReconnected` without `TimerResumed`.
- `packages/api/src/game/presence.ts` - overlapping subscription counts,
  local-game all-seat DB presence, pre-freeze and post-freeze reconnect-race
  handling.
- `packages/api/src/game/presence.test.ts` - lifecycle race and local presence
  regressions.
- `packages/api/src/game/routes/on-game-event.ts` / `server.ts` - awaitable
  presence hook before initial snapshot reads.
- `packages/api/src/game/routes/on-game-event.test.ts` - awaitable hook and
  stale replay-window fallback regressions.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - durable
  execution/codebase learnings for end-of-project distillation.

**Notes / Decisions:**

- The simulator/API scenario database was reset by DB-backed integration tests
  during this task; this is now captured as a durable project learning. The
  accepted workflow is to finish live simulator evidence before reset-heavy
  tests or reseed the simulator account/game afterward.
- The server-side caller harness does not instantiate production `server.ts`
  hooks. Route-level tests that assert hook ordering should install controlled
  module hooks explicitly.
- The brief background failure required two server-side fixes: overlapping
  subscription counts and a post-freeze resume recheck for reconnects that
  arrive while the older disconnect is committing the freeze.

### Task p11-t02: Perf pass + NFR3 measurement

**Status:** completed
**Commit:** a2ccf75

**Outcome:**

- Recorded NFR3 profiling evidence for the active drag game surface with
  Argent / React DevTools.
- Hardened board-cell memo boundaries so route-level `onCellPress` identity
  changes do not re-render all repeated board cells.
- Added a revision/subscription contract to the mutable board layout map so
  `useDragChip` refreshes its UI-thread frame snapshot after cell frame
  registration, clearing the stale-layout risk around rotation/layout updates.
- Kept the existing SVG card-rendering path; profiling did not show an SVG
  bottleneck requiring a sprite-raster contingency.
- Appended p11-t02 learnings to the Expo MCP/Argent and general project
  learning references for end-of-project skill and instruction distillation.

**Measured values / decisions:**

| Area                         | Result   | Measurement / Evidence                                                                                                                                                                                                                                           |
| ---------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drag frame timing            | pass     | React profiler recorded 3 commits over `21.6s`; drag movement did not create per-frame React commits after the selected-card overlay mounted. Evidence: `/tmp/p11-t02-react-profiler-report.md`.                                                                 |
| Event-application memo scope | pass     | `GameBoard.test.tsx` proves only the changed chip cell re-renders and that parent `onCellPress` identity changes leave sampled cells at one render; `profiler-commit-query --component_name BoardCell` found no `BoardCell` renders in the hot selection commit. |
| Move round-trip p50          | pass     | Existing p07-t09 sampled local game p50 remains `6.1ms` (`/tmp/p07-t09-deterministic-summary.json`) against the `<=300ms` local target. Successful samples: `10.4ms`, `6.1ms`, `10ms`, `2.7ms`, `4ms`.                                                           |
| SVG contingency              | keep SVG | The only hot dev-mode commit was selected-card overlay mount (`29.45ms`, roughly production-acceptable per profiler note); no board-cell/SVG cascade appeared during drag. Sprite rasters are not justified for this pass.                                       |

**Files changed:**

- `apps/mobile/src/game/GameBoard/GameBoard.tsx` - stable ref-backed board-cell
  press callback passed into repeated cells.
- `apps/mobile/src/game/GameBoard/GameBoard.test.tsx` - regression for
  callback-identity stability and existing changed-cell memo audit.
- `apps/mobile/src/game/GameBoard/layout-map.ts` - revision counter and
  batched subscriber notifications for mutable frame changes.
- `apps/mobile/src/game/GameBoard/layout-map.test.ts` - revision batching and
  unsubscribe regression.
- `apps/mobile/src/game/drag/use-drag-chip.ts` - `useSyncExternalStore`
  subscription that refreshes drag frame snapshots on layout-map revisions.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - general
  p11-t02 project/codebase learnings.
- `.oat/projects/shared/mobile-mvp/references/using-expo-mcp-learnings.md` -
  Argent profiler and dev-client route-loop learnings.

**Notes / Decisions:**

- The selected-card mount is the intentional React boundary for drag mode; the
  drag gesture itself stays on the UI-thread path except for bounded hover/drop
  state publication, and no per-frame React commit cascade was observed.
- The `BoardLayoutMap` object remains stable by design. Its new revision store
  makes internal frame mutations observable to React consumers without replacing
  the map object.
- SVG card rendering remains the accepted implementation for Phase 11; no
  design deviation or sprite-raster follow-up is required from this pass.

### Task p11-t03: Release build audit (NFR4)

**Status:** completed
**Commit:** fff72a4

**Outcome:**

- Added production config assertions so release config must use `https` for
  `EXPO_PUBLIC_API_URL` and `wss` for `EXPO_PUBLIC_WS_URL`.
- Added a production-only Babel console-strip plugin that removes app
  `console.*` calls while preserving Reanimated's plugin as the final Babel
  plugin.
- Added a production Metro resolver override for `expo-router/_ctx` so the
  production router context excludes `./dev/*` route modules from the Hermes
  bundle instead of only guarding runtime route access.
- Verified the release bundle, credential storage boundary, and NFR1
  remote-hand redaction boundary.
- Appended p11-t03 release-audit learnings to the Expo MCP/Argent and general
  project learning references.

**Release-audit results:**

| Area                | Result | Evidence                                                                                                                                                                                                                |
| ------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production config   | pass   | `NODE_ENV=production expo config` fails closed without secure overrides; secure override config resolves `https://sequence-api-production-8687.up.railway.app` and `wss://sequence-api-production-8687.up.railway.app`. |
| Production export   | pass   | `/tmp/sequence-mobile-export-p11-t03-current`, 1036 modules, `2.1M` Hermes bundle.                                                                                                                                      |
| Dev-route exclusion | pass   | Bundle string scan found no `dev.playground`, `Development only`, `Kit playground`, `DevStreamFeed`, `dev.stream`, or `./dev/*.tsx` markers after the production router context override.                               |
| Release leak scan   | pass   | Bundle string scan found no `expo-mcp`, `game.move.round_trip`, localhost API/WS endpoints, raw guest registry/token constants, or Better Auth token markers; only generic dependency `console.error` remained.         |
| Console strip       | pass   | Production Babel transform changed `console.info("x"); const y = console.error("y");` into `const y = void 0;`.                                                                                                         |
| Credential storage  | pass   | Better Auth session and raw guest tokens use SecureStore; AsyncStorage is limited to theme preference and non-token guest-game registry metadata.                                                                       |
| Remote hand privacy | pass   | `/tmp/p11-t03-remote-game-summary.json` proves the host snapshot/client view had only seat 0's hand, no `localHands`, and no exact seat 1 hand array.                                                                   |

**Files changed:**

- `apps/mobile/app.config.ts` - production URL protocol assertions and resolved
  API/WS extras.
- `apps/mobile/babel.config.js` - production console stripping before the
  Reanimated plugin.
- `apps/mobile/metro.config.js` - production `expo-router/_ctx` resolver
  override.
- `apps/mobile/src/router/ctx-production.js` - production-only route context
  excluding development routes.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - general
  production route-bundle learning.
- `.oat/projects/shared/mobile-mvp/references/using-expo-mcp-learnings.md` -
  Hermes bundle scan, console-strip proof, Argent invocation, and p11-t03
  evidence learnings.

**Notes / Decisions:**

- A `__DEV__` route guard is not a bundle-exclusion proof. The first production
  export still included development route strings until the production router
  context excluded `./dev/*`.
- The generic `console.error` string is dependency-owned bundle residue; the
  app-specific telemetry marker is absent and the Babel plugin proof verifies
  app console calls are stripped.
- Argent remained useful as a configured MCP concept, but the local package
  binary was not available through the mobile workspace and `pnpm dlx` hit
  ignored-build friction. The redaction proof used direct API/DB/runtime probes
  instead of adding tooling dependencies.

### Task p11-t04: Gate sweep (NFR6)

**Status:** completed
**Commit:** c3c2b2c

**Outcome:**

- Ran the full NFR6 gate sweep, including root static gates, DB-backed root
  tests, root build, and web Playwright e2e.
- Fixed the Playwright config loader failure by renaming the web Playwright
  config from TypeScript ESM-style config to explicit CommonJS
  `playwright.config.cjs`.
- Fixed local DB-backed gate discovery so both API Vitest and web Playwright
  load root `.env` first, then `packages/api/.env` as a fallback. This lets
  clean-shell root tests and web e2e run DB-backed suites without manual env
  exports.
- Installed the expected Playwright Chromium cache locally after the first
  successful config load exposed a missing browser binary.
- Updated testing docs and project learnings with the gate-runner fallout.

**Verification:**

| Gate                              | Result | Evidence                                                                                                                                                       |
| --------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                  | pass   | All recursive package typechecks completed.                                                                                                                    |
| `pnpm lint`                       | pass   | Exited 0 with existing warnings only: two `unicorn(no-array-sort)`, three test `consistent-function-scoping`, and `scripts/optimize-cards.mjs` helper scoping. |
| `pnpm format:check`               | pass   | `oxfmt` checked 355 files.                                                                                                                                     |
| `pnpm test`                       | pass   | Clean-shell run loaded `packages/api/.env`, pushed schema with no changes, passed 63 Vitest files / 411 tests and 49 mobile Jest suites / 299 tests.           |
| `pnpm build`                      | pass   | Recursive build completed; `@sequence/web` Next build generated 10 static/dynamic routes successfully.                                                         |
| `pnpm --filter @sequence/web e2e` | pass   | Clean-shell run with no exported `DATABASE_URL_TEST` passed 10 Playwright tests across desktop and mobile projects.                                            |
| `git diff --check`                | pass   | No whitespace errors.                                                                                                                                          |

**Files changed:**

- `apps/web/playwright.config.cjs` - explicit CommonJS Playwright config and
  root/package-local env fallback.
- `apps/web/playwright.config.ts` - removed in favor of `.cjs`.
- `packages/api/vitest.config.ts` - explicit root `.env` plus
  `packages/api/.env` fallback for workspace-runner DB-backed tests.
- `apps/web/README.md` / `docs/testing.md` - testing docs now describe the env
  fallback and `.cjs` config path.
- `.oat/projects/shared/mobile-mvp/references/project-learnings.md` - durable
  p11-t04 gate-sweep learnings.

**Notes / Decisions:**

- The first Playwright run failed before tests with
  `ReferenceError: exports is not defined in ES module scope`; the `.cjs`
  config makes the module format unambiguous for Playwright 1.60 on this Node
  setup.
- A clean-shell `pnpm test` initially passed while skipping API integration.
  The final clean-shell run confirms the DB-backed API suites execute when
  `packages/api/.env` is present.
- Playwright browser binaries are machine-local cache state, not repo files.
  `pnpm --filter @sequence/web exec playwright install chromium` installed the
  expected Chromium/headless-shell cache before the passing e2e run.

### Task p11-t05: NFR7 phase audit + runbook completeness (FR19)

**Status:** completed
**Commit:** 4873e3f

**Outcome:**

- Audited the plan, design, spec, implementation record, and sidecar review for
  operator-dependent work across Phases 1-11.
- Confirmed NFR7: no required operator task exists before Phase 12. Optional
  remote Expo MCP OAuth is the only pre-Phase-12 human-adjacent step, and local
  `expo-mcp`, Argent, and `simctl` cover the required simulator loop.
- Replaced the placeholder runbook sections for Apple Developer Program, App
  Store Connect app record / bundle id, EAS credentials, TestFlight groups,
  physical-device checks, and production smoke with operator-ready checklists.
- Added a top-level NFR7 phase-audit note to the runbook and made
  required-vs-optional labels explicit across the operator sections.

**Files changed:**

- `docs/mobile-operator-runbook.md` - complete Phase 12 operator guidance for
  sections 0-7, including bundle id `com.tkstang.sequenceonline`, app name
  `Sequence Online`, EAS command location, TestFlight group defaults, deferred
  NFR2/NFR3 device cases, and two-human production smoke.

**Verification:**

- Run: sidecar read-only runbook audit against `plan.md`, `design.md`,
  `spec.md`, and `docs/mobile-operator-runbook.md`.
- Result: pass; sidecar found no required Phase 1-11 operator steps and
  identified Sections 2-7 as the remaining FR19 completion gaps.
- Run: structural node check over `docs/mobile-operator-runbook.md` for
  `Why`, `When`, `Prerequisites`, `Steps`, `Verify`, and `Troubleshooting` in
  Sections 0-7.
- Result: pass; all sections contain the required headings.
- Run:
  `rg -n "Authored by|Add the exact|Add each|Add final|placeholder|later" docs/mobile-operator-runbook.md`.
- Result: pass; no placeholder scaffold text remains.
- Run: `rg -n "Required|Optional|optional" docs/mobile-operator-runbook.md`.
- Result: pass; required/optional labeling is present for operator sections.
- Run: `git diff --check`.
- Result: pass.

**Notes / Decisions:**

- The runbook now documents Phase 12 execution before Phase 12 begins, so the
  final operator phase can record actual non-secret identifiers and results
  rather than discover the process from chat history.
- EAS commands are documented from `apps/mobile`; the monorepo root remains the
  wrong working directory for EAS project linking and credentials.

### Task p11-t06: Documentation updates

**Status:** completed
**Commit:** 19f679c

**Outcome:**

- Updated docs and root guidance from web/API-only framing to the current web,
  mobile, API, game-logic, shared client-state, and shared design-token
  workspace shape.
- Added package READMEs for `@sequence/client-state` and
  `@sequence/design-tokens`, covering public exports, ownership boundaries,
  commands, web StyleX generation, and mobile usage.
- Updated mobile docs with the Expo SDK 57 simulator loop, LAN Metro path,
  production `https`/`wss` config checks, shared package dependencies, Jest
  testing layer, and operator-runbook links.
- Updated testing docs to reflect the actual root harness: Vitest workspace
  first, then `@sequence/mobile` Jest via `jest-expo`, with `apps/mobile`
  intentionally excluded from `vitest.workspace.ts`.
- Updated `.env.example` to include mobile `EXPO_PUBLIC_*` variables and
  removed stale web-only MVP wording.

**Files changed:**

- `README.md` / `AGENTS.md` - root docs and agent guidance now include mobile
  and shared package boundaries.
- `.env.example` / `docs/configuration.md` - mobile public URL variables and
  production protocol checks documented.
- `docs/index.md`, `docs/architecture.md`, `docs/development.md`,
  `docs/testing.md`, `docs/styling.md`, `docs/api-reference.md` - documentation
  parity for mobile workflow, shared state, shared tokens, and test layers.
- `apps/mobile/README.md` / `apps/mobile/AGENTS.md` - current mobile workflow,
  simulator loop, MCP tooling, and runbook references.
- `packages/client-state/README.md` / `packages/design-tokens/README.md` - new
  shared package docs.

**Verification:**

- Run: p11-t06 sidecar read-only documentation gap audit.
- Result: pass; all concrete gaps from the audit were addressed or superseded
  by the final source diff.
- Run: `pnpm format:check`.
- Result: pass after formatting the two new package READMEs with
  `pnpm exec oxfmt packages/client-state/README.md packages/design-tokens/README.md`.
- Run: relative Markdown link sweep over 13 changed Markdown files.
- Result: pass; all relative link targets exist.
- Run: stale-phrase grep for `future React Native`, `web MVP`,
  `three runtime`, `shared by both`, `Full mobile documentation`,
  `once that runbook exists`, `Vitest workspace only`, `tokens live in apps/web`,
  and `web-mvp`.
- Result: pass; no hits.
- Run: `git diff --check`.
- Result: pass.

**Notes / Decisions:**

- The docs pass included `README.md` and `.env.example` even though the plan's
  focused file list was narrower, because both were direct sources of stale
  web-only setup guidance referenced by the docs.
- `docs/styling.md` now treats `@sequence/design-tokens` as the source of truth;
  generated web StyleX files remain committed outputs.

### Task p11-t07: Pre-distribution smoke flows

**Status:** completed
**Commit:** evidence only, no source changes

**Outcome:**

- Ran the documented pre-distribution smoke set against both a local
  in-process API booted on `DATABASE_URL_TEST` and the production Railway API.
- Verified auth, create, registered 2-client join, full 2-client
  play-to-win, rematch, local pass-and-play, save/resume, concede, and timed
  turn deadline behavior through public Better Auth, tRPC HTTP, and tRPC
  WebSocket contracts.
- Used throwaway production accounts and games; no production DB seeding or
  privileged DB reads were used.
- Recorded durable smoke-run gotchas in `references/project-learnings.md` for
  future production scenario harnesses.

**Evidence:**

| Target                                                                 | Result | Evidence                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local API (`DATABASE_URL_TEST`)                                        | pass   | `/tmp/p11-t07-smoke-summary.json`; full game `6ea10750-5322-467c-ae82-3e7fb2ab1af0` reached a win in 88 turns, rematch `b2454145-58f9-407d-86b2-18b274d050d5`, save resumed to active version 3, timer snapshot had a 30s deadline.                                                                                 |
| Production API (`https://sequence-api-production-8687.up.railway.app`) | pass   | `/tmp/p11-t07-smoke-summary.json`; full game `dd0a9327-d6bd-4993-b788-daa40422ae39` reached a win in 82 turns, rematch `3db3b917-c2b9-4240-84b7-acb07365b68f`, pass-and-play exposed 2 local hands, save resumed to active version 3, concede finished with `endReason=concede`, timer snapshot had a 30s deadline. |

**Verification:**

- Run:
  `pnpm --filter @sequence/api exec vitest run src/test/full-game.e2e.test.ts src/game/routes/lifecycle.test.ts src/game/routes/rematch.test.ts src/game/TimerService.test.ts src/game/routes/create-game.test.ts src/game/routes/join-game.test.ts`.
- Result: pass; 6 files / 35 tests.
- Run:
  `node --experimental-transform-types --env-file=packages/api/.env /tmp/p11-t07-smoke.mjs`.
- Result: pass; local and production smoke passed with redacted summary at
  `/tmp/p11-t07-smoke-summary.json`.

**Notes / Decisions:**

- Production direct Better Auth probes used the deployed web origin
  `https://sequence-online.vercel.app`; `Origin: sequence://` was rejected by
  the production auth route during direct Node probes.
- The production smoke reused one host/guest account pair across flows to avoid
  tripping the deployed auth route's rate limiter with repeated throwaway
  signups.
- Active-game production smoke kept both player WebSocket streams open while
  reading snapshots and applying moves. Short-lived active-game subscription
  probes can create artificial presence disconnect/freeze behavior, especially
  around save/resume.

## Phase 12: TestFlight (Operator Phase)

**Status:** blocked
**Started:** 2026-07-04

### Phase Summary

**Outcome:**

- Phase 12 started after Phase 11 hardening and pre-distribution smoke passed.
- p12-t01 cannot proceed autonomously on this shell because the required Expo,
  EAS, Apple Developer, and App Store Connect operator state is not available.
- p01-p12 review-fix tasks p12-t07 through p12-t15 are implemented and verified;
  p12-t01 remains the active operator blocker.

**Verification / Pre-flight checks:**

- Run: `pnpm --filter @sequence/mobile exec expo whoami`.
- Result: blocked; Expo CLI reported `Not logged in`.
- Run:
  `test -n "$EXPO_TOKEN"` / `test -n "$ASC_API_KEY"` /
  `test -n "$APP_STORE_CONNECT_API_KEY"` checks.
- Result: blocked; all checked non-secret environment presence probes are
  unset.
- Run: `cd apps/mobile && eas --version && eas whoami --non-interactive`.
- Result: blocked; `eas` command is not installed on the shell.
- Run: `cd apps/mobile && pnpm dlx eas-cli@latest --version`.
- Result: blocked; pnpm downloaded the package but stopped on
  `ERR_PNPM_IGNORED_BUILDS` for `dtrace-provider@0.8.8` and requires
  `pnpm approve-builds` operator approval.

### Task p12-t01: Operator pre-flight (runbook §§1–4)

**Status:** blocked
**Blocker:** Operator account/setup required. Expo CLI is not logged in, EAS CLI
is not installed, no Expo/App Store Connect automation token is present in the
shell, `pnpm dlx eas-cli@latest --version` requires ignored-build approval, and
Apple Developer / App Store Connect membership cannot be verified or created by
the agent without the operator.

**Next required operator actions:**

1. Log in to Expo for this shell or provide an approved Expo automation path:
   `pnpm --filter @sequence/mobile exec expo login` or an operator-approved
   token outside the repo.
2. Install or approve EAS CLI for the operator shell, then run from
   `apps/mobile`: `eas whoami`.
3. Confirm Apple Developer Program team access and App Store Connect app-record
   authority for bundle id `com.tkstang.sequenceonline`.
4. Resume p12-t01 so the runbook can record non-secret identifiers only
   (team name/id, operator role, App Store Connect app URL/id, Expo org, EAS
   project id).

### Review Received: p01-p12

**Date:** 2026-07-04
**Review artifact:** reviews/archived/range-review-2026-07-04.md

**Findings:**

- Critical: 0
- Important: 3
- Medium: 4
- Minor: 2

**New tasks added:** p12-t07, p12-t08, p12-t09, p12-t10, p12-t11,
p12-t12, p12-t13, p12-t14, p12-t15

**Finding disposition map:**

- I1 converted to p12-t07: align the accepted p11-t01 presence-correctness API
  deviation in spec, design, and implementation artifacts.
- I2 converted to p12-t08: fix guest WebSocket credential staleness and make
  destructive guest cleanup conservative.
- I3 converted to p12-t09: align spec/design chrome architecture with the
  accepted native-backed implementation.
- M1 converted to p12-t10: re-arm the realtime inactivity watchdog for
  non-live recovery states.
- M2 converted to p12-t11: make generated web StyleX token output
  format-stable and add a freshness guard.
- M3 converted to p12-t12: prevent the AuthedWebSocket close-before-open async
  leak.
- M4 converted to p12-t13: align FR12 rematch acceptance to web-parity
  semantics or explicitly defer a future all-player navigation event.
- m1 converted to p12-t14: remove or document the vestigial React Strict DOM
  layer.
- m2 converted to p12-t15: bound mobile non-color design-token drift with a
  native mapping or explicit scope documentation.

**Design drift / artifact alignment notes:**

- I1: The review found stale spec/design additive-only API language relative to
  the accepted p11-t01 presence tracker rewrite. The shipped implementation is
  accepted because it fixed NFR2 reconnect/freeze races and is covered by API
  presence tests. p12-t07 aligned the lifecycle artifacts and durable
  deviation record in `d1c7855`.
- I3: The review found stale RSD `html.*` chrome architecture text. The
  shipped native-backed chrome is accepted as the implementation source of
  truth because simulator verification showed it was the stable mobile layout
  baseline. p12-t09 aligned spec/design wording in `d1c7855`.
- M4: The review found FR12 acceptance text that over-promises non-initiator
  rematch navigation relative to web parity. p12-t13 aligned acceptance to the
  shipped parity behavior in `d1c7855`.

**Fix completion:**

- p12-t07, p12-t09, and p12-t13: artifact drift fixes in `d1c7855`.
- p12-t08, p12-t10, and p12-t12: guest WebSocket credential staleness,
  conservative forbidden cleanup, non-live watchdog re-arm, and
  close-before-open protection in `00143fa`.
- p12-t11: generated StyleX token freshness guard in `757c074`.
- p12-t14: vestigial React Strict DOM layer removal in `920ba50`.
- p12-t15: native dimension-token mapping for mobile chrome in `83140fc`.

**Next:** Re-run `oat-project-review-provide code p01-p12`, then
`oat-project-review-receive` to reach `passed`. The p12-t01 operator
pre-flight blocker remains active while the operator completes
Expo/EAS/Apple/App Store Connect setup.

---

## Orchestration Runs

_Each run from `oat-project-implement` appends an entry below with:_
_- Run header (number, timestamp, branch, tier, policy, phase counts)_
_- Phase Outcomes table_
_- Parallel Groups list_
_- Outstanding Items_

<!-- orchestration-runs-start -->

_Orchestration runs from `oat-project-implement` are appended here, most-recent-first within the file but append-only at the bottom of the log._

<!-- orchestration-runs-end -->

---

## Implementation Log

Chronological log of implementation progress.

### 2026-07-03

**Session Start:** 03:13 UTC

- [x] p01-t01: Scaffold @sequence/mobile Expo workspace - fe544ee
- [x] p01-t02: Metro, TypeScript, and lint/format wiring - 2890e84
- [x] p01-t03: Shared-import spike — game-logic + AppRouter under Metro - dac6545
- [x] p01-t04: jest-expo + Testing Library setup - 8d0205f
- [x] p01-t05: Root gate integration - 95f1aca
- [x] p01-t06: First dev build boots on the simulator - 5911833
- [x] p01-t07: health.ping screen via minimal tRPC client - e463438
- [x] p01-t08: Workspace doc stubs + spike cleanup - 3d61683
- [ ] p02-t01: MCP configuration + expo-mcp local tools - next

**What changed (high level):**

- Mobile Expo workspace scaffolded with app identity, router entry, CNG ignores,
  placeholder home route, and lockfile dependencies.
- Mobile Metro, Babel, TypeScript, lint, and format wiring now pass their scoped
  gates.
- Metro export now proves mobile can consume `@sequence/game-logic` runtime
  exports and the `@sequence/api` `AppRouter` type contract.
- Mobile Jest now runs through `jest-expo` with React Native Testing Library and
  a first home-screen component test.
- Root gates now include mobile typecheck/lint/format coverage and run mobile
  Jest after the Vitest workspace.
- The iOS development build installs, launches, and renders the home route on
  the iPhone 17 Pro simulator.
- The mobile home route now renders a real tRPC `health.ping` result through
  the QueryClient/tRPC provider stack.
- The mobile workspace now has an initial README, and the temporary import
  spike route has been removed.

**Decisions:**

- Deferred Jest packages to p01-t04 so p01-t01 remains a clean Expo scaffold;
  the test script is present but test tooling lands with the planned Jest task.
- The Jest dependency graph resolves to `@react-native/jest-preset@0.86.0`;
  `jest-expo` 57's older peer range is accepted through pnpm
  `peerDependencyRules.allowedVersions`.
- Expo Router route-local tests are kept outside `src/app`; otherwise Metro can
  bundle test-only dependencies during dev-client startup.
- `p01-t07` simulator proof used the documented production API origin because
  the local API `.env` was absent; the app's committed defaults remain
  localhost for local development.

**Follow-ups / TODO:**

- Begin Phase 2 with MCP configuration and expo-mcp local tools.

**Blockers:**

- None.

**Session End:** 13:39 UTC

---

### 2026-07-03

**Session Start:** 13:40 UTC

- [x] p02-t01: MCP configuration + expo-mcp local tools - 0e51aa5
- [x] p02-t01 fix: invoke Argent MCP subcommand - 3e5b0c1
- [x] p02-t02: testID convention + identifier helper - 24b317b
- [x] p02-t03: apps/mobile/AGENTS.md - the agent loop - 3b3b5c2
- [x] p02-t04: Operator runbook scaffold - 4a927c1
- [x] p02-t05: FR17 agent-loop demo + evidence - 92dd239
- [x] p03-t01: packages/design-tokens - d2395ed
- [x] p03-t01 fix: remove token test lint warning - 6d3da25
- [x] p03-t02: Web consumes design-tokens - 1ef4f5d
- [x] p03-t03: RSD spike passes on SDK 57 - 7bb701d
- [x] p03-t04: Full token vars + ThemeProvider + useTheme - a0ca075
- [x] p03-t05: Chrome kit — Button + TextField - 9444737
- [x] p03-t06: Chrome kit — Card, Badge, Screen scaffold - b5214b2
- [x] p03-t07: Dev playground scaffold + kit stories - de17181 / f28fae6
- [x] p03-t08: Both-scheme visual verification - b2083f8
- [x] p04-t01: API — Better Auth expo() plugin + trustedOrigins - eb58299
- [x] p04-t02: Mobile auth client + SecureStore session - 24088c1
- [x] p04-t03: Cookie-header transport in tRPC client - 4d3e24c
- [x] p04-t04: Login/signup/logout + protected routing - e6d202a / d97bf0d
- [x] p04-t05: Session probe + central error policy - a64c521
- [x] p04-t06: Session persistence scenario (simulator) - 8d260e3
- [x] p04-t07: Phase gate sweep + configuration docs - dc3fde7
- [x] p05-t01: Extract @sequence/client-state - 6e74bcc
- [x] p05-t02: Web consumes client-state - 87271e2
- [x] p05-t03: AuthedWebSocket + wsLink split transport - 3c20b66 / 2c3cd91
- [x] p05-t04: useGameStream with snapshot-first event application - 73f1469 / 060493f
- [x] p05-t05: AppState lifecycle + inactivity watchdog - 6a4c8ce / 1826565
- [x] p05-t06: Connection banners + debug event feed - e33ef1b
- [x] p05-t07: Two-client live + recovery-time verification - c4a9033 / e5a5c97 / 0111bb5 / 50664e7
- [x] p06-t01: API — game.join returnGuestToken flag - c2f08a3 / 2b68ed7
- [x] p06-t02: Dashboard screen - b0ef411
- [x] p06-t03: Create screen - 64686b0
- [x] p06-t04: Join-by-code preview + registered join - bd5ebda
- [x] p06-t05: Guest join + guest store/registry + continue-list - 6c7c5bc / ac2a3ee
- [x] p06-t06: Scheme deep links - e70d449
- [x] p06-t07: Lobby screen + controls + share - bddfa59 / 8099ab9
- [x] p06-t08: Multi-client lobby verification - c75ee97 / 7f875d1
- [x] p07-t01: SVG card pipeline - fa42027 / 08645c8
- [x] p07-t02: GameBoard grid + chips + sequences - 136bfb6 / d6a2c5a
- [x] p07-t03: Spotlight targeting - 06dfe66 / e358852
- [x] p07-t04: CardHand - 7172173 / 6d11693
- [x] p07-t05: PlayerRail + TimerBadge - 8c612b1 / f2c3dbb
- [x] p07-t06: Move submission + submitting state + violation feedback - 4a8403c / 6ba10cf
- [x] p07-t07: Game screen assembly + turn flow - afbd9a0 / 9518c86
- [x] p07-t08: Playground stories for game components - 5f91046 / fab0c19 / c81b6c9
- [x] p07-t09: Full tap-mode game verification - 1a1f149 / 65880bd
- [x] p08-t01: Drag gesture layer - 0a851b4
- [x] p08-t02: Drag submit + rejection feedback - 61df269 / a616e36
- [x] p08-t03: Sequence-choice sheet - e13a789
- [x] p08-t04: Dead-card turn-in + auto-swap surfacing - 6ca7d32
- [x] p08-t05: Board rotate control - b21961a / aaa8f56
- [x] p08-t06: Hard-mode e2e verification - 7e06cfc
- [x] p09-t01: Save & exit + concede controls - e664340 / 7d27bf4
- [x] p09-t02: Freeze/resume + expiry states - 5d629c8 / d8a3db0
- [x] p09-t03: GameOver screen - 2037cf6
- [x] p09-t04: Rematch flow - b004600
- [x] p09-t05: HandoffScreen + local pass-and-play - 5de7702
- [x] p09-t06: Local save/resume + dashboard integration - ad72c90
- [x] p09-t07: Lifecycle matrix verification - 01166d6
- [x] p10-t01: History screens - d181966 / 4750213
- [x] p10-t02: Notification affordances - 8c0c116
- [x] p10-t03: Settings screen - f2b6868
- [x] p10-t04: Empty/loading/error states pass - f15c7c0
- [x] p10-t05: A11y labels + testID audit - c7d03f9
- [x] p10-t06: Both-themes screenshot pass - evidence only, no source changes
- [x] p10-t07: FR13-FR15 verification - evidence only, no source changes
- [x] p11-t01: NFR2 measured scenario matrix - fcfc1f9
- [x] p11-t02: Perf pass + NFR3 measurement - a2ccf75
- [x] p11-t03: Release build audit (NFR4) - fff72a4
- [x] p11-t04: Gate sweep (NFR6) - c3c2b2c
- [x] p11-t05: NFR7 phase audit + runbook completeness (FR19) - 4873e3f
- [x] p11-t06: Documentation updates - 19f679c
- [x] p11-t07: Pre-distribution smoke flows - evidence only, no source changes
- [ ] p12-t01: Operator pre-flight (runbook §§1–4) - blocked on operator account/setup
- [x] p12-t07: (review) Align API presence constraint artifacts - d1c7855
- [x] p12-t08: (review) Fix guest WebSocket credential staleness - 00143fa
- [x] p12-t09: (review) Align native-backed chrome artifacts - d1c7855
- [x] p12-t10: (review) Re-arm lifecycle watchdog outside live state - 00143fa
- [x] p12-t11: (review) Add StyleX token freshness guard - 757c074
- [x] p12-t12: (review) Prevent AuthedWebSocket close-before-open leak - 00143fa
- [x] p12-t13: (review) Align rematch acceptance to parity semantics - d1c7855
- [x] p12-t14: (review) Resolve vestigial React Strict DOM layer - 920ba50
- [x] p12-t15: (review) Bound mobile non-color token drift - 83140fc

**What changed (high level):**

- Phase 2 now has local Expo MCP and Argent configuration plus a committed
  mobile `AGENTS.md` / `CLAUDE.md` instruction surface for the simulator
  agent loop.
- Mobile testIDs now use the shared `testId()` helper and documented
  `screen.element[.qualifier]` convention.
- Mobile operator setup now has a durable runbook under `docs/`, linked from
  the Operations docs index, with local machine and Expo/MCP sections authored
  and Phase 12 operator sections scaffolded.
- The FR17 loop now has live evidence for Expo MCP screenshot, view lookup, log
  collection, and Argent native-tree/tap fallback, plus a project reference log
  for later Expo MCP skill distillation.
- Design tokens now live in a framework-free workspace package, web StyleX
  token/theme files are generated from that package, and the RSD spike passed
  on the iOS simulator with light/dark token values.
- Mobile theming now has full RSD token vars, persisted light/dark/system mode,
  native appearance overrides, and a root `ThemeProvider`; the temporary
  `/rsd-spike` route is removed.
- The mobile chrome kit now has initial RSD Button and TextField primitives
  with tested handlers, disabled states, testID passthrough, variants, and
  sizes.
- The chrome kit now also includes Card, Badge, and a safe-area Screen scaffold
  with a native ScrollView-backed scroll mode.
- The development-only kit playground now exposes list and detail story routes
  with a theme toggle and simulator screenshot evidence.
- Device visual proof moved layout-sensitive chrome and dev-route wrappers to
  native-backed primitives while preserving the exported component APIs.
- Both-scheme visual verification now covers the dev index and every chrome-kit
  story route; TextField and Badge were stabilized with native-backed
  implementations.
- Mobile move submission now has a version-guarded hook with pending state,
  no optimistic board mutation, haptics, conflict/violation feedback, and
  client-observed round-trip timing logs.
- The mobile active game route now renders the playable tap-mode surface and
  submits selected-card moves through the server-authoritative mutation hook.
- Token propagation was proven with a reverted scratch token that exercised
  dark-palette parity, mobile token vars, web StyleX generation, and mobile/web
  typechecks.
- The API auth configuration now registers the Better Auth Expo plugin and
  trusts native/development origins according to environment.
- The mobile app now has a Better Auth Expo client with SecureStore-backed
  session storage and env-derived API base URL.
- The mobile tRPC HTTP client now sends explicit Better Auth and guest-token
  cookies while keeping native fetch cookie-jar behavior disabled.
- The mobile app now has login/signup screens, protected root routing, signed-in
  session display, logout behavior, and a Better Auth client route target that
  matches the API's `/api/auth/*` mount.
- The home route now probes `health.me`, redirects to login on unauthorized
  probes, and centralizes tRPC error-policy mapping for later game screens.
- The p04-t06 simulator scenario now proves SecureStore-backed auth persists
  across app termination/relaunch, that `health.me` works after relaunch, and
  that logout remains cleared after another relaunch.
- The auth slice configuration docs now cover mobile `EXPO_PUBLIC_*` API URL
  defaults, release/simulator overrides, and the dev-client rebuild requirement
  after native auth peer/plugin changes.
- The framework-free `@sequence/client-state` package now contains the shared
  game-view reducer, fixtures, and exhaustive rule-violation message catalog for
  upcoming web and mobile consumers.
- The web game route now consumes `@sequence/client-state` for shared stream
  state, fixtures, and rule-violation copy; the duplicated web-local reducer and
  fixture files have been removed.
- The mobile tRPC client now uses a cookie-authed WebSocket transport for
  subscriptions with centralized keepalive, lazy, and reconnect timing
  constants.
- The mobile app now has a shared-client-state-backed `useGameStream()` hook
  with snapshot-first projection, event application, connection-state tracking,
  and explicit cursor-based resubscription.
- The realtime hook now includes AppState foreground recovery, a 15s
  inactivity watchdog, and timestamped lifecycle logs for later NFR2 timing
  verification.
- The mobile app now has a reusable connection banner and a development-only
  raw stream screen for live subscription debugging.
- The p05-t07 live simulator pass now records local web/mobile two-client
  stream evidence, measured API restart recovery, measured foreground
  recovery, and stale-cursor snapshot fallback recovery beyond the replay
  window.
- The API `game.join` route now supports an opt-in raw guest-token return for
  mobile guest persistence while preserving httpOnly cookie issuance and the
  default no-token response.
- The mobile home route is now the dashboard, backed by `game.myGames`, with
  resumable/recent game cards, empty states, pull-to-refresh, create/join CTAs,
  and status-aware navigation.
- The mobile app now has a signed-in create-game flow over `game.create` with
  web-parity settings, local pass-and-play validation, protected route
  registration, and route-level mutation/error tests.
- The mobile app now has signed-in join-by-code entry and preview routes with
  normalized invite codes, roster/settings preview, friendly unavailable
  states, and registered-user join navigation.
- The mobile app now persists guest game identity, sends stored guest tokens
  through the explicit cookie header, supports anonymous guest joins, surfaces a
  cold-start guest continue list, and keeps the join subtree public.
- The mobile join deep-link route now treats the route code as untrusted preview
  input only, uses the server-returned invite code for join mutations, and has
  simulator evidence for `sequence://join/<code>` routing.
- The mobile game route now renders a live lobby branch with team roster
  controls, native invite sharing, creator-only randomize/kick/start actions,
  and public route access that relies on API/stream participant checks.
- The local API/web/mobile multi-client verification now demonstrates FR2-FR5
  through guest deep-link join, live lobby propagation, kick/randomize, start
  gate evidence, and guest relaunch continue-list recovery. The run also fixed
  the missing guest-token cookie path for mobile WebSocket streams.
- The Phase 7 card asset pipeline now supports all 52 SVG faces on mobile with
  memoized `CardFace` rendering, Metro SVG transformer wiring, and a
  development-only card-grid route.
- The mobile `GameBoard` now renders the 10x10 Sequence board from
  `BOARD_MAP`, including wild corners, team chips, locked sequence treatment,
  memoized per-cell updates, and board-local layout frames for later drag
  hit-testing.
- The board now supports selection-gated spotlight targeting through
  `validPlacements`, including one-eyed jack removal targets and no-target
  selected-card parity.
- The mobile hand fan now renders hand cards with stable testIDs, supports
  controlled/uncontrolled selection, and exposes drag-mode dead-card turn-in
  affordances.
- The active-game player rail now displays seats, team colors,
  connected/offline state, current turn, round/sequence counts, and a
  server-deadline-synced timer badge.
- The game-surface playground now has board, hand, and rail stories with
  both-theme simulator screenshot evidence for compact iPhone-width rendering.
- Full tap-mode gameplay is now verified against local API/web/mobile clients,
  including timed turns, two-eyed and one-eyed jack moves, auto-draw, stale
  version conflict recovery, sequence locks, and final win state.
- The p07-t09 verification pass fixed lowercase email entry on native auth
  forms and prevented quiet live mobile streams from triggering false
  disconnect/freeze behavior.
- The advanced game surface now has a Reanimated/Gesture Handler drag layer
  foundation with board-layout-map hit-testing, hover-confirm state, outside
  release cancellation, and no pre-highlighting.
- Drag-mode drop submission now uses the server-authoritative no-card move
  contract, and the route keeps rejected drops selected with shared violation
  feedback.
- The active game route now supports pending sequence-choice sheets and
  dead-card turn-in controls, including default-mode auto-swap feedback.
- The mobile board now has a rotate control with Reanimated visual rotation
  and layout-map-aware transformed hit targets for drag-mode play.
- Hard-mode Phase 8 verification now covers mobile simulator state, web client
  state, public tRPC hard-mode mutations, DB assertions, pending-choice final
  win, and an API-backed chained-choice proof.
- Active games now have save-and-exit plus concede lifecycle controls; save
  hides for guest-roster games, both actions submit the current version, save
  returns signed-in users to the dashboard, and lifecycle conflicts show
  game-specific recovery copy.
- Frozen mobile game routes now keep the active board visible but disabled,
  surface the disconnected player plus expiry in the connection banner, and
  restore normal play when the stream view resumes to active. Saved routes now
  render a resumable saved-state screen with expiry copy.
- Finished mobile game routes now render a dedicated GameOver screen instead
  of the generic placeholder, covering winner names, concede attribution,
  no-winner fallback copy, timer-expired copy, winning sequence representation,
  and dashboard/rematch action testIDs.
- Mobile rematch now invokes the server rematch mutation from GameOver,
  disables the action while pending, replaces to the returned game route, and
  surfaces non-finished/conflict failures with rematch-specific copy.
- Mobile local pass-and-play now gates between turns with `HandoffScreen`,
  veils both outgoing and incoming hands until confirm, and then renders only
  the incoming/current seat hand from `localHands`.
- Phase 11 hardening is complete. The pre-distribution smoke suite passed
  locally and against the production Railway API using public auth, tRPC HTTP,
  and tRPC WebSocket contracts with throwaway production accounts.

---

## Deviations from Plan / Design

Document any intentional deviations from the original plan, spec, or design. Include accepted review findings where the shipped implementation is source of truth and a lifecycle artifact needs alignment.

| Task / Review | Source Artifact     | Planned / Documented                                                                                       | Actual / Accepted                                                                                                                                                                                                                        | Reason                                                                                                                                                          | Source of Truth                                                                                                                                                                                                                                                                                                                                      | Follow-up                                                                                            |
| ------------- | ------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| p02-t05       | plan.md             | Expo MCP screenshot, tap `home.ping` by testID, read logs, then Argent a11y-tree read                      | Expo MCP covered screenshot, `home.ping` find, and logs; Argent covered native-tree read and tap at the `pong: true` point                                                                                                               | Expo MCP `automation_tap` was unreliable on this host; user approved Argent fallback where Expo MCP does not cover the flow                                     | `apps/mobile/AGENTS.md`; `references/using-expo-mcp-learnings.md`                                                                                                                                                                                                                                                                                    | Re-evaluate Expo MCP tap reliability when distilling the final skill                                 |
| p03-t02       | plan.md             | Web StyleX themes consume `@sequence/design-tokens` imports directly if static evaluation allows it        | Web StyleX files are generated from `@sequence/design-tokens` by script                                                                                                                                                                  | Uses the plan's codegen contingency while preserving the package as source of truth                                                                             | `packages/design-tokens/scripts/write-web-stylex.ts`                                                                                                                                                                                                                                                                                                 | Keep generated StyleX files in sync with token changes                                               |
| p03-t03       | plan.md             | `pnpm --filter @sequence/mobile ios` for the RSD spike proof                                               | Existing installed dev client plus Metro LAN mode verified the JS/Babel spike                                                                                                                                                            | The inherited `expo run:ios` process stalled; p03-t03 did not require a native rebuild, and simulator visual gate passed                                        | `/tmp/p03-t03-rsd-light-clean.png`; `/tmp/p03-t03-rsd-dark-clean.png`                                                                                                                                                                                                                                                                                | Completed by the p03-t04 native rebuild when AsyncStorage landed                                     |
| p03-t07       | plan.md             | Dev route guard test at `apps/mobile/src/app/dev/_layout.test.tsx`                                         | Test lives at `apps/mobile/src/dev/dev-layout.test.tsx`                                                                                                                                                                                  | Expo Router bundled the route-local test into Metro and pulled in test-only Node stdlib imports                                                                 | `apps/mobile/src/dev/dev-layout.test.tsx`                                                                                                                                                                                                                                                                                                            | Keep route tests outside `src/app` unless Expo Router behavior changes                               |
| p03-t07       | plan.md / design.md | RSD `html.*` wrappers for chrome-kit and dev playground layout                                             | Layout-sensitive `Button`, `Card`, `Screen`, and dev-route wrappers are native-backed while preserving public APIs                                                                                                                       | Simulator screenshots showed oversized and stretched RSD native layouts; native primitives matched the intended mobile chrome                                   | `apps/mobile/src/components/Button.tsx`; `apps/mobile/src/components/Card.tsx`; `apps/mobile/src/components/Screen.tsx`; `apps/mobile/src/app/dev/`                                                                                                                                                                                                  | p03-t08 continues light/dark story verification across the kit                                       |
| p03-t08       | plan.md / design.md | RSD `html.*` wrappers for remaining TextField and Badge chrome-kit primitives                              | `TextField` and `Badge` are native-backed while preserving public APIs                                                                                                                                                                   | Both-scheme simulator verification showed the native-backed approach is the stable baseline for the full chrome-kit surface                                     | `apps/mobile/src/components/TextField.tsx`; `apps/mobile/src/components/Badge.tsx`                                                                                                                                                                                                                                                                   | Continue using native-backed chrome primitives unless a later RSD issue is deliberately re-evaluated |
| p04-t04       | plan.md             | Auth route tests under `apps/mobile/src/app/(auth)` and root layout test under `apps/mobile/src/app`       | Auth and root-route tests live under `apps/mobile/src/auth` and `apps/mobile/src/test`                                                                                                                                                   | Expo Router can bundle route-local tests into Metro; this preserves the already proven route-tree rule                                                          | `apps/mobile/src/auth/login-screen.test.tsx`; `apps/mobile/src/auth/signup-screen.test.tsx`; `apps/mobile/src/test/root-layout.test.tsx`                                                                                                                                                                                                             | Keep future route tests outside `src/app` unless Expo Router behavior changes                        |
| p04-t06       | plan.md             | Scenario task with no file changes unless fixes land                                                       | Installed `expo-network` / `expo-web-browser` and added the `expo-web-browser` config plugin                                                                                                                                             | Simulator proof exposed missing `@better-auth/expo` runtime peers after auth-client initialization                                                              | `apps/mobile/package.json`; `apps/mobile/app.config.ts`; `pnpm-lock.yaml`                                                                                                                                                                                                                                                                            | Keep declared native peers installed and rebuild the dev client after native module changes          |
| p07-t01       | plan.md             | Dev-build screenshot of a card grid sanity check                                                           | Focused Jest, Expo export, and native rebuild passed; no usable card-grid screenshot was captured                                                                                                                                        | Metro was not reachable during the visual pass, and p07-t08 owns full game-surface playground screenshot verification                                           | `apps/mobile/src/app/dev/cards.tsx`; `apps/mobile/src/game/cards/CardFace.tsx`                                                                                                                                                                                                                                                                       | Completed by p07-t08 game-surface playground screenshot sweep                                        |
| p07-t07       | plan.md             | Route test under `apps/mobile/src/app/game`                                                                | Route test lives at `apps/mobile/src/game/GameRouteScreen.test.tsx`                                                                                                                                                                      | Expo Router can bundle `.test.*` files under `src/app` during export and pull test-only dependencies into Metro                                                 | `apps/mobile/src/game/GameRouteScreen.test.tsx`                                                                                                                                                                                                                                                                                                      | Keep mobile route tests outside `apps/mobile/src/app`                                                |
| p07-t09       | plan.md             | Scenario task with no source files unless fixes land                                                       | Two source fixes landed during scenario verification: mobile email TextField prop passthrough and quiet-live realtime watchdog behavior                                                                                                  | Device/local-game proof exposed native autocapitalization and false presence disconnect behavior that unit-only verification would not catch                    | `apps/mobile/src/components/TextField.tsx`; `apps/mobile/src/realtime/lifecycle.ts`; `references/project-learnings.md`                                                                                                                                                                                                                               | Use scenario tasks to fix locally diagnosable issues before advancing                                |
| p10-t03       | plan.md             | Settings route test at `apps/mobile/src/app/settings.test.tsx`                                             | Settings route lives at `apps/mobile/src/app/settings.tsx`; route behavior tests live at `apps/mobile/src/features/settings/SettingsScreen.test.tsx`                                                                                     | Expo Router can bundle route-local tests into Metro/export; this preserves the established route-test location rule                                             | `apps/mobile/src/features/settings/SettingsScreen.test.tsx`; `apps/mobile/src/test/root-layout.test.tsx`                                                                                                                                                                                                                                             | Keep future route tests outside `src/app` unless Expo Router behavior changes                        |
| p10-t04       | plan.md             | Agent screenshot pass over each screen's loading/empty/error variants                                      | Full mobile Jest covers the changed loading/empty/error branches; simulator screenshots were not run in this task                                                                                                                        | The changed states are query/error branches rather than new layout primitives, and p10-t06/p10-t07 still own visual/theme and scenario verification             | `apps/mobile/src/features/dashboard/DashboardScreen.test.tsx`; `apps/mobile/src/features/history/HistoryScreen.test.tsx`; `apps/mobile/src/features/join/JoinScreen.test.tsx`                                                                                                                                                                        | Complete visual proof in p10-t06/p10-t07                                                             |
| p10-t05       | plan.md             | Agent drives one flow per screen through testID/a11y tree                                                  | Full mobile Jest exercises dashboard, create, join, history, settings, and active-game selectors through testID/accessibility queries; no simulator coordinate fallback was needed                                                       | This task was an accessibility/testID audit, and the updated route/feature tests provide deterministic selector proof while p10-t06 still owns screenshot proof | `apps/mobile/src/features/dashboard/DashboardScreen.test.tsx`; `apps/mobile/src/features/create/CreateScreen.test.tsx`; `apps/mobile/src/features/join/JoinScreen.test.tsx`; `apps/mobile/src/features/history/HistoryScreen.test.tsx`; `apps/mobile/src/features/settings/SettingsScreen.test.tsx`; `apps/mobile/src/game/GameRouteScreen.test.tsx` | Use p10-t06 for visual/theming confirmation                                                          |
| p10-t06       | plan.md             | Agent loop covers every screen plus key game states in light and dark, with source commit if fixes land    | Orchestrator-local simulator pass covered dashboard, create, join, history, settings, active local game, and dev game-surface fixtures; no source fixes landed, so no app code commit was made                                           | The visual pass found no contrast/token misuse, and evidence-only scenario tasks should record proof without manufacturing a source commit                      | `implementation.md`; `references/using-expo-mcp-learnings.md`; `/tmp/p10-t06-*.png`                                                                                                                                                                                                                                                                  | Complete FR13-FR15 scenario acceptance in p10-t07                                                    |
| p10-t07       | plan.md             | History against seeded local data, notification affordances observed in a live game, and theming scenarios | Seeded history data was verified in the simulator; a live active local game proved the active notification surface; deterministic mobile tests covered turn/event/concede/freeze notification mapping; p10-t06 theme evidence was reused | No source issues were found, and deterministic tests are the durable source for notification mapping after the live event-transition attempt was narrowed       | `/tmp/p10-t07-history-seeded.png`; `/tmp/p10-t07-active-local-created.png`; `apps/mobile/src/game/feedback/turn-notifications.test.ts`; `apps/mobile/src/game/GameRouteScreen.test.tsx`                                                                                                                                                              | Start Phase 11 NFR hardening                                                                         |
| p01-p12/I1    | spec.md / design.md | API changes were documented as additive auth/config surface only                                           | p11-t01 rewrote presence tracking behavior to fix NFR2 reconnect/freeze races; the implementation is accepted and tested, and lifecycle artifacts now allow presence-correctness fixes required by NFR2                                  | The review found artifact drift, not a code defect; p12-t07 aligned the constraint wording and durable deviation record                                        | `packages/api/src/game/presence.ts`; `packages/api/src/game/presence.test.ts`; `packages/api/src/game/routes/on-game-event.ts`; `.oat/projects/shared/mobile-mvp/spec.md`; `.oat/projects/shared/mobile-mvp/design.md`                                                                                                                               | d1c7855                                                                                              |
| p01-p12/I3    | spec.md / design.md | Chrome architecture was documented as RSD `html.*` wrappers plus shared tokens                             | Shipped chrome uses native React Native primitives backed by shared tokens; prior p03 deviation rows already accepted this as the stable mobile layout baseline                                                                          | The review found stale artifact wording relative to an accepted implementation decision; p12-t09 aligned the durable architecture text                          | `apps/mobile/src/components/Button.tsx`; `apps/mobile/src/components/TextField.tsx`; `apps/mobile/src/components/Card.tsx`; `apps/mobile/src/components/Badge.tsx`; `apps/mobile/src/components/Screen.tsx`; `.oat/projects/shared/mobile-mvp/spec.md`; `.oat/projects/shared/mobile-mvp/design.md`                                                   | d1c7855                                                                                              |
| p01-p12/M4    | spec.md             | FR12 acceptance said rematch navigates all connected players                                               | Mobile matches web parity: the initiator navigates after rematch, while non-initiators can reach the new game from the dashboard unless a future API/event enhancement is added                                                          | The review found an over-broad acceptance criterion; p12-t13 aligned FR12 acceptance to parity semantics                                                       | `packages/api/src/game/routes/rematch.ts`; `apps/mobile/src/app/game/[id].tsx`; `apps/web/src/app/game/[id]/page.tsx`; `.oat/projects/shared/mobile-mvp/spec.md`; `.oat/projects/shared/mobile-mvp/design.md`                                                                                                                                       | d1c7855                                                                                              |

## Test Results

Track test execution during implementation.

| Phase | Tests Run                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Passed                      | Failed               | Coverage                                                                                                                                                                                                                                                                                                                                                                                  |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- | --- |
| 1     | `pnpm --filter @sequence/mobile exec jest src/api/env.test.ts`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm --filter @sequence/mobile test`; `pnpm --filter @sequence/mobile test && pnpm --filter @sequence/mobile typecheck`; `pnpm format:check`; simulator screenshots `/tmp/p01-t06-boot-home.png`, `/tmp/p01-t07-health-ping.png`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 2     | `pnpm --filter @sequence/mobile exec expo-mcp --help`; `pnpm install`; Expo dev server + MCP stdio `tools/list` / `automation_take_screenshot` (`/tmp/p02-t01-expo-mcp-screenshot.jpg`); Argent MCP stdio `tools/list`; RED `pnpm --filter @sequence/mobile exec jest src/test/test-ids.test.ts`; `pnpm --filter @sequence/mobile exec jest src/test/test-ids.test.ts src/test/index.test.tsx`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm --filter @sequence/mobile format`; `pnpm format:check`; manual p02-t03 read-through against design Agent Tooling section; `test -f docs/mobile-operator-runbook.md && rg -n "mobile-operator-runbook.md                                                                                                                                                                                                          | ## 0\\. Local Machine Setup | ## 1\\. Expo Account | ## 7\\. Production Smoke" docs/index.md docs/mobile-operator-runbook.md`; p02-t05 Metro + `simctl launch --initialUrl`; Expo MCP stdio `automation_take_screenshot` (`/tmp/p02-t05-expo-mcp-screenshot.jpg`), `automation_find_view home.ping`, `collect_app_logs`; Argent `tools`, `describe`, `boot-device`, `launch-app`, `native-describe-screen`, `gesture-tap`; `pnpm format:check` | yes | 0   | -   |
| 3     | `pnpm --filter @sequence/design-tokens exec vitest run src/palette.test.ts`; `pnpm --filter @sequence/web build`; `pnpm --filter @sequence/web test`; `pnpm typecheck`; Playwright/system Chrome screenshots `/tmp/p03-t02-web-dev-light.png`, `/tmp/p03-t02-web-dev-dark.png`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; RSD spike simulator screenshots `/tmp/p03-t03-rsd-light-clean.png`, `/tmp/p03-t03-rsd-dark-clean.png`; `pnpm --filter @sequence/mobile exec jest src/theme/theme-provider.test.tsx`; `pnpm --filter @sequence/mobile test`; `pnpm --filter @sequence/mobile exec expo run:ios --no-bundler --device 3F87B084-DD33-41D5-B4F5-88DA77989607`; `pnpm --filter @sequence/mobile exec jest src/components/Button.test.tsx src/components/TextField.test.tsx`; `pnpm --filter @sequence/mobile exec jest src/components` | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 3     | `pnpm --filter @sequence/mobile exec jest src/components src/dev/dev-layout.test.tsx`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; dev-client screenshots `/tmp/p03-t07-dev-playground-accepted.png`, `/tmp/p03-t07-dev-story-button-final.png`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 3     | `pnpm --filter @sequence/mobile exec jest src/components`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm --filter @sequence/web typecheck`; `pnpm --filter @sequence/design-tokens exec vitest run src/palette.test.ts`; `pnpm format:check`; scratch-token proof (`pnpm --filter @sequence/mobile typecheck` failed while dark palette missed `scratchProbe`, then passed after completed scratch propagation through mobile vars and web StyleX generation); dev-client screenshots `/tmp/p03-t08-{light,dark}-{index,button,text-field,card,badge,screen}.png`                                                                                                                                                                                                                                                                                              | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 4     | `pnpm --filter @sequence/api exec vitest run src/user/auth-expo.test.ts`; `pnpm --filter @sequence/api test` (subagent; DB-backed suites skipped because `DATABASE_URL_TEST` absent); `pnpm --filter @sequence/api typecheck`; `pnpm lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 4     | `pnpm --filter @sequence/mobile exec jest src/auth/client.test.ts`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 4     | `pnpm --filter @sequence/mobile exec jest src/api/cookies.test.ts`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 4     | `pnpm --filter @sequence/mobile exec jest src/auth/client.test.ts src/auth/login-screen.test.tsx src/auth/signup-screen.test.tsx src/components/TextField.test.tsx src/test/root-layout.test.tsx src/test/index.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p04-t04`                                                                                                                                                                                                                                                                                                                                                                                                                                          | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 4     | `pnpm --filter @sequence/mobile exec jest src/api/error-policy.test.ts src/test/index.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 4     | `pnpm --filter @sequence/mobile exec jest src/auth/client.test.ts src/test/root-layout.test.tsx src/test/index.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `pnpm --filter @sequence/mobile exec expo run:ios --no-bundler --device 3F87B084-DD33-41D5-B4F5-88DA77989607`; local API + Metro LAN simulator scenario with screenshots `/tmp/p04-t06-signed-in.png`, `/tmp/p04-t06-after-restart.png`, `/tmp/p04-t06-after-logout.png`, `/tmp/p04-t06-after-logout-relaunch.png`                                                                                                                                                                                                                                                                                                                                          | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 4     | `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 5     | `pnpm --filter @sequence/client-state exec vitest run`; `pnpm --filter @sequence/client-state typecheck`; `pnpm exec oxlint packages/client-state`; `pnpm exec oxfmt --check packages/client-state`; framework-boundary import scan over `packages/client-state`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 5     | `pnpm --filter @sequence/client-state test`; `pnpm --filter @sequence/web test`; `pnpm --filter @sequence/web typecheck`; `pnpm --filter @sequence/web build`; `pnpm typecheck`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 5     | `pnpm --filter @sequence/mobile exec jest src/api/ws.test.ts --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 5     | `pnpm --filter @sequence/mobile exec jest src/realtime/use-game-stream.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 5     | `pnpm --filter @sequence/mobile exec jest src/realtime/lifecycle.test.ts src/realtime/use-game-stream.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 5     | `pnpm --filter @sequence/mobile exec jest src/components/ConnectionBanner.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | yes                         | 0                    | -                                                                                                                                                                                                                                                                                                                                                                                         |
| 5     | Local API + web + Metro LAN + iOS dev-client p05-t07 scenario; web-created game with mobile `/dev/stream`; API kill/restart timing; 10s background/foreground timing; replay-window event-count attempt; stale-cursor `/dev/stream?lastEventId=1` proof; screenshots `/tmp/p05-t07-web-created-lobby.png`, `/tmp/p05-t07-mobile-initial-stream.png`, `/tmp/p05-t07-web-after-start.png`, `/tmp/p05-t07-mobile-after-start.png`, `/tmp/p05-t07-mobile-after-foreground.png`, `/tmp/p05-t07-mobile-replay-window.png`, `/tmp/p05-t07-replay-window-proof.png`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                      | yes                         | 0                    | Replay-window fallback proven by snapshot item id `504` after requested `lastEventId=1`                                                                                                                                                                                                                                                                                                   |
| 6     | `pnpm --filter @sequence/api exec vitest run src/game/routes/join-game.test.ts` with disposable local `DATABASE_URL_TEST`; `pnpm --filter @sequence/api typecheck`; `pnpm lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | yes                         | 0                    | 11 join/preview integration tests executed                                                                                                                                                                                                                                                                                                                                                |
| 6     | `pnpm --filter @sequence/mobile exec jest src/features/dashboard src/test/index.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | yes                         | 0                    | 3 dashboard/home suites, 13 tests                                                                                                                                                                                                                                                                                                                                                         |
| 6     | `pnpm --filter @sequence/mobile exec jest src/features/create src/test/root-layout.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | yes                         | 0                    | 3 create/root-layout suites, 8 tests                                                                                                                                                                                                                                                                                                                                                      |
| 6     | `pnpm --filter @sequence/mobile exec jest src/features/join src/test/root-layout.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | yes                         | 0                    | 2 join/root-layout suites, 11 tests                                                                                                                                                                                                                                                                                                                                                       |
| 6     | `pnpm --filter @sequence/mobile exec jest src/auth/guest-store.test.ts src/auth/login-screen.test.tsx src/features/join src/api/cookies.test.ts src/test/root-layout.test.tsx src/realtime/use-game-stream.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | yes                         | 0                    | 6 guest/join/root-layout/stream suites, 34 tests                                                                                                                                                                                                                                                                                                                                          |
| 6     | `pnpm --filter @sequence/mobile exec jest src/features/join --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`; `xcrun simctl openurl booted "sequence://join/TESTCODE"` with screenshots `/tmp/p06-t06-sequence-join-testcode-preview.png` and `/tmp/p06-t06-sequence-join-garbage-unknown.png`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | yes                         | 0                    | Scheme route/UI proof used temporary mock API; API-backed preview covered elsewhere                                                                                                                                                                                                                                                                                                       |
| 6     | `pnpm --filter @sequence/mobile exec jest src/game/LobbyTeams.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | yes                         | 0                    | 1 lobby suite, 5 tests; includes over-capacity roster regression                                                                                                                                                                                                                                                                                                                          |
| 6     | Local API/web/Metro/iOS dev-client p06-t08 scenario; `pnpm --filter @sequence/api exec vitest run src/game/routes/join-game.test.ts src/game/routes/lobby.test.ts`; `pnpm --filter @sequence/mobile exec jest src/api/client.test.ts src/api/cookies.test.ts src/api/ws.test.ts src/realtime/use-game-stream.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                            | yes                         | 0                    | FR2-FR5 evidence screenshots `/tmp/p06-t08-web-created-lobby.png`, `/tmp/p06-t08-mobile-deeplink-preview.png`, `/tmp/p06-t08-mobile-lobby-after-guest-join.png`, `/tmp/p06-t08-web-after-randomize.png`, `/tmp/p06-t08-mobile-after-randomize.png`, `/tmp/p06-t08-mobile-relaunch-continue-list.png`, `/tmp/p06-t08-orchestrator-current.png`                                             |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/cards/CardFace.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`; `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p07-t01`; `pnpm --filter @sequence/mobile exec expo run:ios --no-bundler --device 3F87B084-DD33-41D5-B4F5-88DA77989607`                                                                                                                                                                                                                                                                                                                                                                                                                                                     | yes                         | 0                    | 55 card-pipeline tests; export and native rebuild passed; card-grid screenshot deferred to p07-t08                                                                                                                                                                                                                                                                                        |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/GameBoard --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | yes                         | 0                    | 2 GameBoard/layout-map suites, 9 tests; includes per-cell memo probe and board-local frame registration                                                                                                                                                                                                                                                                                   |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/GameBoard/spotlight.test.ts src/game/GameBoard --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | yes                         | 0                    | 3 GameBoard/spotlight suites, 14 tests; includes no-target selected-card parity and one-eyed jack targets                                                                                                                                                                                                                                                                                 |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/CardHand --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | yes                         | 0                    | 1 CardHand suite, 7 tests; includes drag-only dead-card affordance and nested press isolation                                                                                                                                                                                                                                                                                             |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/PlayerRail --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | yes                         | 0                    | 2 PlayerRail/TimerBadge suites, 4 tests; includes deadline re-sync and no local forfeit path                                                                                                                                                                                                                                                                                              |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/use-move-submit.test.ts src/game/feedback/toasts.test.ts --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`; `pnpm --filter @sequence/mobile exec expo install expo-haptics@~57.0.0 --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | yes                         | 0                    | 2 move-submit/feedback suites, 19 tests; Expo package compatibility check passed                                                                                                                                                                                                                                                                                                          |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx src/game/CardHand src/game/GameBoard --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | yes                         | 0                    | 5 active-route/hand/board suites, 27 tests; route test lives outside `src/app`                                                                                                                                                                                                                                                                                                            |
| 7     | `git ls-files 'apps/mobile/src/app/**/*.test.*' 'apps/mobile/src/app/*.test.*'`; `pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx src/dev/stories.test.ts src/game/PlayerRail/PlayerRail.test.tsx src/game/CardHand src/game/GameBoard --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`; `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p07-t08-final3`; simulator screenshots `/tmp/p07-t08-game-board.png`, `/tmp/p07-t08-game-hand-fixed.png`, `/tmp/p07-t08-game-rail-fixed.png`, `/tmp/p07-t08-game-board-light.png`, `/tmp/p07-t08-game-hand-light.png`, `/tmp/p07-t08-game-rail-light.png`                                                                                                                            | yes                         | 0                    | 7 game-surface suites, 31 tests; Expo export and both-theme story visual sweep passed                                                                                                                                                                                                                                                                                                     |
| 7     | Local API/web/mobile deterministic p07-t09 games `3fc7917c-862d-45a0-90e6-380a7335eb87` and `e6fa8ecf-4839-41a6-b2bf-30b18e64f7ad`; web screenshots `/tmp/p07-t09-web-active.png`, `/tmp/p07-t09-web-final.png`; mobile screenshots `/tmp/p07-t09-mobile-initial.png`, `/tmp/p07-t09-mobile-final.png`, `/tmp/p07-t09-mobile-active.png`; `pnpm --filter @sequence/mobile exec jest src/components/TextField.test.tsx src/auth/login-screen.test.tsx src/auth/signup-screen.test.tsx --runInBand`; `pnpm --filter @sequence/mobile exec jest src/realtime/lifecycle.test.ts src/realtime/use-game-stream.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p07-t09`; `git diff --check`                             | yes                         | 0                    | FR6/FR9 full tap-mode loop passed; stale 409, jack moves, auto-draw, timer UI, locked sequence, and final win verified; p50 samples `6.1ms` and `3.35ms`                                                                                                                                                                                                                                  |
| 8     | `pnpm --filter @sequence/mobile exec jest src/game/drag --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `pnpm --filter @sequence/mobile exec expo install react-native-reanimated react-native-gesture-handler --check`; `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p08-t01`; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | yes                         | 0                    | 2 drag suites, 5 tests; SDK-compatible gesture dependencies and Reanimated Babel config verified                                                                                                                                                                                                                                                                                          |
| 8     | `pnpm --filter @sequence/mobile exec jest src/test/root-layout.test.tsx src/game/GameRouteScreen.test.tsx src/game/drag --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `pnpm --filter @sequence/mobile exec expo install react-native-reanimated react-native-gesture-handler react-native-worklets --check`; `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p08-t02-final`; `git diff --check`; `pnpm --filter @sequence/mobile ios`; simulator proof for drag game `18d450fa-1eb9-4c4a-a91c-f1ef8a1996ad` with screenshots `/tmp/sequence-mobile-p08-t02-drag-game.png` and `/tmp/sequence-mobile-p08-t02-drag-after-move.png`                                                                                                                                         | yes                         | 0                    | 4 focused suites, 15 tests; dev client rebuilt; no-card drag-mode `game.makeMove` placed `16D`, app received subscription events, and screen updated to version 2                                                                                                                                                                                                                         |
| 8     | `pnpm --filter @sequence/mobile exec jest src/game/SequenceChoiceSheet.test.tsx src/game/GameRouteScreen.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | yes                         | 0                    | 2 sequence-choice/route suites, 13 tests; my-seat pending choice opens the sheet and submits `chooseSequenceCells`; other-seat choice shows frozen banner                                                                                                                                                                                                                                 |
| 8     | `pnpm --filter @sequence/mobile exec jest src/game/DeadCardControls.test.tsx src/game/GameRouteScreen.test.tsx src/game/feedback/toasts.test.ts --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | yes                         | 0                    | 3 dead-card/route/feedback suites, 29 tests; hard-mode turn-in calls `turnInDeadCard`, same-turn rejection uses `not-a-dead-card`, and default-mode auto-swap emits one toast per event seq                                                                                                                                                                                               |
| 8     | `pnpm --filter @sequence/mobile exec jest src/game/GameBoard --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | yes                         | 0                    | 3 GameBoard suites, 16 tests; rotate control cycles 0/90/180/270, transformed frames stay aligned with drag hit-testing, and 90/270 rotations stay within the board touch area                                                                                                                                                                                                            |
| 8     | Seeded drag-mode game `c5315deb-9acb-4f8c-b78a-355b0ae95447`; public mutations `game.turnInDeadCard`, `game.makeMove`, `game.chooseSequenceCells`; mobile screenshots `/tmp/p08-t06-mobile-seeded.png`, `/tmp/p08-t06-mobile-pending-choice.png`, `/tmp/p08-t06-mobile-final-win.png`; web screenshot `/tmp/p08-t06-web-final-win.png`; DB assertions; chained-choice seed `716fbe0d-ea9d-453f-bd00-117032eea989`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | yes                         | 0                    | FR7/FR8 hard-mode pass: dead-card turn-in, one-eyed removal, web opponent move, no-card drag contract placement, pending choice, final win, and chained choice verified                                                                                                                                                                                                                   |
| 9     | `pnpm --filter @sequence/mobile exec jest src/game/ActiveGameControls.test.tsx src/game/GameRouteScreen.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | yes                         | 0                    | 2 active-lifecycle/control suites, 19 tests; save-and-exit, concede, versioned payloads, guest save hiding, and active-game lifecycle conflict copy covered                                                                                                                                                                                                                               |
| 9     | `pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx src/components/ConnectionBanner.test.tsx --runInBand`; `TZ=UTC pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | yes                         | 0                    | 2 freeze/resume/connection suites, 18 tests; UTC route rerun 15 tests; frozen board visible but disabled, resume restores play, saved state expiry copy, and disconnected-player banner covered                                                                                                                                                                                           |
| 9     | `pnpm --filter @sequence/mobile exec jest src/game/GameOver.test.tsx src/game/GameRouteScreen.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | yes                         | 0                    | 2 game-over/route suites, 20 tests; finished route renders GameOver; win/loss, concede, no-winner FFA, timer-expired copy, winner names, sequence representation, and dashboard/rematch testIDs covered                                                                                                                                                                                   |
| 9     | `pnpm --filter @sequence/mobile exec jest src/game/GameOver.test.tsx src/game/GameRouteScreen.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | yes                         | 0                    | 2 rematch/game-over route suites, 23 tests; rematch mutation payload, success navigation to returned game route, pending disabled state, dashboard preservation, and conflict copy covered                                                                                                                                                                                                |
| 9     | `pnpm --filter @sequence/mobile exec jest src/game/HandoffScreen.test.tsx src/game/GameRouteScreen.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | yes                         | 0                    | 2 local-handoff/route suites, 20 tests; handoff prompt/action, visible-hand helper, full hand-tree veil, outgoing/incoming hand privacy, and revealed current-seat hand covered                                                                                                                                                                                                           |
| 9     | `pnpm --filter @sequence/mobile exec jest src/features/dashboard src/game/ActiveGameControls.test.tsx --runInBand`; `pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | yes                         | 0                    | Dashboard/control suites 16 tests and route suite 19 tests; local resumables show a `LOCAL` badge, route to `/game/<id>`, local save remains available, and resumed local active games start behind the handoff veil                                                                                                                                                                      |
| 9     | `pnpm --filter @sequence/api exec vitest run src/game/routes/lifecycle.test.ts src/game/presence.test.ts`; `pnpm --filter @sequence/mobile exec jest src/game/ActiveGameControls.test.tsx src/game/GameRouteScreen.test.tsx src/components/ConnectionBanner.test.tsx src/game/GameOver.test.tsx src/game/HandoffScreen.test.tsx --runInBand`; `node /tmp/p09-t07-live.mjs`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                               | yes                         | 0                    | API lifecycle/presence suites 15 tests, mobile lifecycle suites 36 tests, and live local API/web probe passed; covers registered save/resume, 2-team concede, 3-player FFA concede/no-result, disconnect freeze/resume, registered rematch roster, local pass-and-play save after handoff, and fixture-backed expiry UI                                                                   |
| 10    | `pnpm --filter @sequence/mobile exec jest src/features/history src/features/dashboard src/test/root-layout.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | yes                         | 0                    | 4 history/dashboard/root suites, 16 tests; `/history` route registered, record/list/head-to-head rendered, nextCursor load-more behavior covered, local games flagged, and dashboard history navigation added                                                                                                                                                                             |
| 10    | `pnpm --filter @sequence/mobile exec jest src/game/feedback src/game/GameRouteScreen.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | yes                         | 0                    | 3 feedback/route suites, 53 tests; live stream notifications cover turn-to-me, opponent sequence, concede, freeze/disconnect, initial-view suppression, haptics, and all 13 rule-violation catalog mappings                                                                                                                                                                               |
| 10    | `pnpm --filter @sequence/mobile exec jest src/features/settings/SettingsScreen.test.tsx src/features/dashboard/DashboardScreen.test.tsx src/test/root-layout.test.tsx src/test/index.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | yes                         | 0                    | 4 settings/dashboard/root suites, 14 tests; signed-in `/settings` route registered, dashboard settings navigation covered, theme mode control persists through ThemeProvider, logout redirects to login, and version display is testable                                                                                                                                                  |
| 10    | `pnpm --filter @sequence/mobile test`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | yes                         | 0                    | 49 mobile suites, 297 tests; dashboard, history, and join preview error states no longer collapse into empty/not-found states; simulator screenshots deferred to p10-t06/p10-t07 visual passes                                                                                                                                                                                            |
| 10    | `pnpm --filter @sequence/mobile test`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | yes                         | 0                    | 49 mobile suites, 297 tests; p10-t05 selector/accessibility audit covers dashboard, create, join, history, settings, and active-game paths via testID/a11y queries with no coordinate fallback                                                                                                                                                                                            |
| 10    | p10-t06 local API + Metro LAN + iOS dev-client visual pass; `simctl` light/dark appearance changes; terminate/relaunch theme override persistence check; `file /tmp/p10-t06-*.png`; `pnpm --filter @sequence/mobile test`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | yes                         | 0                    | FR15 proof passed with dashboard, create, active local game, history, settings, join entry/not-found, dev index, and dev board story screenshots in light/dark. Manual Light override persisted across app terminate/relaunch while simulator appearance stayed dark; 49 mobile suites / 297 tests passed                                                                                 |
| 10    | p10-t07 local API + Metro LAN + iOS dev-client seeded-history and active-game verification; `file /tmp/p10-t07-history-seeded.png /tmp/p10-t07-active-local-created.png /tmp/p10-t07-launch.png /tmp/p10-t07-create-screen.png`; `pnpm --filter @sequence/mobile exec jest src/features/history src/game/feedback src/features/settings/SettingsScreen.test.tsx src/theme/theme-provider.test.tsx --runInBand`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | yes                         | 0                    | FR13-FR15 parity pass: seeded history rendered 2-1 record, `Parity Opponent 2-1`, 3 games, and local badge; live active game exposed `Your turn`, rail, lifecycle controls, and board affordances; focused tests covered notification and theme behavior, 5 suites / 44 tests                                                                                                             |
| 11    | p11-t01 simulator/API NFR2 matrix; `pnpm --filter @sequence/client-state test`; `pnpm --filter @sequence/api exec vitest run src/game/presence.test.ts src/game/routes/on-game-event.test.ts src/game/routes/make-move.test.ts`; `pnpm --filter @sequence/mobile exec jest src/realtime/use-game-stream.test.tsx src/components/ConnectionBanner.test.tsx src/game/use-move-submit.test.ts src/game/GameRouteScreen.test.tsx --runInBand`; `pnpm --filter @sequence/{api,client-state,mobile} typecheck`; `pnpm format:check`; `pnpm lint`; `git diff --check`                                                                                                                                                                                                                                                                                                                                            | yes                         | 0                    | NFR2 pass: API restart recovered in `4391ms`, brief foreground recovered in `1830ms`, force-quit route recovered in `2743ms`, replay-window fallback snapshot covered after 502 events, and stale-version recovery remained covered by focused API/mobile tests                                                                                                                           |
| 11    | p11-t02 Argent/React profiler selected-card drag session; `profiler-commit-query --component_name BoardCell`; `jq '.p50RoundTripMs' /tmp/p07-t09-deterministic-summary.json`; `pnpm --filter @sequence/mobile exec jest src/game/GameBoard/GameBoard.test.tsx src/game/GameBoard/layout-map.test.ts src/game/drag/use-drag-chip.test.ts src/game/drag/DragLayer.test.tsx src/game/use-move-submit.test.ts src/game/GameRouteScreen.test.tsx src/realtime/use-game-stream.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                                                                                | yes                         | 0                    | NFR3 pass: 3 React commits over `21.6s`, no drag per-frame React cascade, no `BoardCell` hot-commit renders, local move p50 `6.1ms`, 7 mobile suites / 54 tests passed                                                                                                                                                                                                                    |
| 11    | `NODE_ENV=production pnpm --filter @sequence/mobile exec expo config --type public` expected-failure check; secure production `expo config --json`; production `expo export --platform ios --output-dir /tmp/sequence-mobile-export-p11-t03-current`; Hermes `strings -a` leak scans; production Babel transform proof; source credential audit greps; live local API remote-game redaction proof `/tmp/p11-t03-remote-game-summary.json`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm --filter @sequence/mobile exec oxfmt --check src app.config.ts babel.config.js metro.config.js`; `pnpm format:check`; `git diff --check`                                                                                                                                                                                                                              | yes                         | 0                    | NFR4 pass: production config fails closed without secure URLs, secure release config exports, dev-route markers and app telemetry are absent from the Hermes bundle, app console calls are stripped, credentials use SecureStore, and the host client view contains only its own hand                                                                                                     |
| 11    | Clean-shell `pnpm test`; `pnpm typecheck`; `pnpm lint`; `pnpm format:check`; `pnpm build`; clean-shell `pnpm --filter @sequence/web e2e`; `git diff --check`; `pnpm --filter @sequence/web exec playwright install chromium` for missing local browser cache                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | yes                         | 0                    | NFR6 pass: DB-backed root tests executed from `packages/api/.env` fallback and passed 63 Vitest files / 411 tests plus 49 mobile suites / 299 tests; Playwright passed 10 desktop/mobile tests from a clean shell; build and static gates passed                                                                                                                                          |
| 11    | p11-t05 sidecar runbook audit; structural node check for required headings in runbook Sections 0-7; placeholder grep; required/optional label grep; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | yes                         | 0                    | NFR7/FR19 pass: no required Phase 1-11 operator work, optional Expo MCP OAuth only before Phase 12, Sections 0-7 complete with verification/troubleshooting, and Phase 12 operator checklists documented                                                                                                                                                                                  |
| 11    | p11-t06 sidecar docs gap audit; `pnpm format:check`; relative Markdown link sweep over changed docs; stale-phrase grep; `git diff --check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | yes                         | 0                    | Docs parity pass: mobile/shared-package boundaries documented, package READMEs added, mobile workflow/testing/config pointers current, 13 Markdown files link-checked, and stale web-only wording removed                                                                                                                                                                                 |
| 11    | Focused API smoke suites: `pnpm --filter @sequence/api exec vitest run src/test/full-game.e2e.test.ts src/game/routes/lifecycle.test.ts src/game/routes/rematch.test.ts src/game/TimerService.test.ts src/game/routes/create-game.test.ts src/game/routes/join-game.test.ts`; local + production public-contract smoke: `node --experimental-transform-types --env-file=packages/api/.env /tmp/p11-t07-smoke.mjs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | yes                         | 0                    | Pre-distribution smoke pass: local API (`DATABASE_URL_TEST`) and production Railway API both passed health/auth/create/join/play-to-win/rematch/pass-and-play/save-resume/concede/timer flows; production full game won in 82 turns, save resumed to active version 3, and timer snapshot carried a 30s deadline (`/tmp/p11-t07-smoke-summary.json`)                                      |

| 12    | p12-t07/p12-t09/p12-t13 artifact alignment greps; `pnpm --filter @sequence/mobile exec jest src/api/ws.test.ts src/realtime/lifecycle.test.ts src/realtime/use-game-stream.test.tsx --runInBand`; `pnpm --filter @sequence/api exec vitest run src/game/routes/access.test.ts`; `pnpm --filter @sequence/design-tokens generate:web-stylex && git diff --exit-code apps/web/src/styles`; `pnpm --filter @sequence/design-tokens test`; `pnpm --filter @sequence/mobile exec jest src/components src/theme --runInBand`; `pnpm typecheck`; `pnpm lint`; `pnpm format:check`; `pnpm test`; `git diff --check` | yes                         | 0                    | p01-p12 review fixes complete: artifact drift aligned, guest WebSocket credentials reset on active-game changes, forbidden guest cleanup now confirms over HTTP, non-live lifecycle recovery is bounded, generated StyleX token freshness is guarded, RSD vestiges removed, and mobile chrome dimensions map through native token helpers; root test passed 65 Vitest files / 415 tests plus 50 mobile suites / 310 tests |

## Final Summary (for PR/docs)

**What shipped:**

- {capability 1}
- {capability 2}

**Behavioral changes (user-facing):**

- {bullet}

**Key files / modules:**

- `{path}` - {purpose}

**Verification performed:**

- {tests/lint/typecheck/build/manual steps}

**Design deltas (if any):**

- {what changed vs design.md and why}

## References

- Plan: `plan.md`
- Design: `design.md`
- Spec: `spec.md`
