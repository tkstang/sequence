---
oat_status: in_progress
oat_ready_for: null
oat_blockers: []
oat_last_updated: 2026-07-03
oat_current_task_id: p03-t06
oat_generated: false
---

# Implementation: mobile-mvp

**Started:** 2026-07-03
**Last Updated:** 2026-07-03

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

| Phase   | Status      | Tasks | Completed |
| ------- | ----------- | ----- | --------- |
| Phase 1 | completed   | 8     | 8/8       |
| Phase 2 | completed   | 5     | 5/5       |
| Phase 3 | in_progress | 8     | 5/8       |

**Total:** 18/85 tasks completed

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

**Status:** in_progress
**Started:** 2026-07-03

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
- [ ] p03-t06: Chrome kit — Card, Badge, Screen scaffold - next

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

---

## Deviations from Plan / Design

Document any intentional deviations from the original plan, spec, or design. Include accepted review findings where the shipped implementation is source of truth and a lifecycle artifact needs alignment.

| Task / Review | Source Artifact | Planned / Documented | Actual / Accepted | Reason | Source of Truth | Follow-up |
| ------------- | --------------- | -------------------- | ----------------- | ------ | --------------- | --------- |
| p02-t05       | plan.md         | Expo MCP screenshot, tap `home.ping` by testID, read logs, then Argent a11y-tree read | Expo MCP covered screenshot, `home.ping` find, and logs; Argent covered native-tree read and tap at the `pong: true` point | Expo MCP `automation_tap` was unreliable on this host; user approved Argent fallback where Expo MCP does not cover the flow | `apps/mobile/AGENTS.md`; `references/using-expo-mcp-learnings.md` | Re-evaluate Expo MCP tap reliability when distilling the final skill |
| p03-t02       | plan.md         | Web StyleX themes consume `@sequence/design-tokens` imports directly if static evaluation allows it | Web StyleX files are generated from `@sequence/design-tokens` by script | Uses the plan's codegen contingency while preserving the package as source of truth | `packages/design-tokens/scripts/write-web-stylex.ts` | Keep generated StyleX files in sync with token changes |
| p03-t03       | plan.md         | `pnpm --filter @sequence/mobile ios` for the RSD spike proof | Existing installed dev client plus Metro LAN mode verified the JS/Babel spike | The inherited `expo run:ios` process stalled; p03-t03 did not require a native rebuild, and simulator visual gate passed | `/tmp/p03-t03-rsd-light-clean.png`; `/tmp/p03-t03-rsd-dark-clean.png` | Completed by the p03-t04 native rebuild when AsyncStorage landed |

## Test Results

Track test execution during implementation.

| Phase | Tests Run | Passed | Failed | Coverage |
| ----- | --------- | ------ | ------ | -------- |
| 1     | `pnpm --filter @sequence/mobile exec jest src/api/env.test.ts`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm --filter @sequence/mobile test`; `pnpm --filter @sequence/mobile test && pnpm --filter @sequence/mobile typecheck`; `pnpm format:check`; simulator screenshots `/tmp/p01-t06-boot-home.png`, `/tmp/p01-t07-health-ping.png` | yes    | 0      | -        |
| 2     | `pnpm --filter @sequence/mobile exec expo-mcp --help`; `pnpm install`; Expo dev server + MCP stdio `tools/list` / `automation_take_screenshot` (`/tmp/p02-t01-expo-mcp-screenshot.jpg`); Argent MCP stdio `tools/list`; RED `pnpm --filter @sequence/mobile exec jest src/test/test-ids.test.ts`; `pnpm --filter @sequence/mobile exec jest src/test/test-ids.test.ts src/test/index.test.tsx`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm --filter @sequence/mobile format`; `pnpm format:check`; manual p02-t03 read-through against design Agent Tooling section; `test -f docs/mobile-operator-runbook.md && rg -n "mobile-operator-runbook.md|## 0\\. Local Machine Setup|## 1\\. Expo Account|## 7\\. Production Smoke" docs/index.md docs/mobile-operator-runbook.md`; p02-t05 Metro + `simctl launch --initialUrl`; Expo MCP stdio `automation_take_screenshot` (`/tmp/p02-t05-expo-mcp-screenshot.jpg`), `automation_find_view home.ping`, `collect_app_logs`; Argent `tools`, `describe`, `boot-device`, `launch-app`, `native-describe-screen`, `gesture-tap`; `pnpm format:check` | yes    | 0      | -        |
| 3     | `pnpm --filter @sequence/design-tokens exec vitest run src/palette.test.ts`; `pnpm --filter @sequence/web build`; `pnpm --filter @sequence/web test`; `pnpm typecheck`; Playwright/system Chrome screenshots `/tmp/p03-t02-web-dev-light.png`, `/tmp/p03-t02-web-dev-dark.png`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; RSD spike simulator screenshots `/tmp/p03-t03-rsd-light-clean.png`, `/tmp/p03-t03-rsd-dark-clean.png`; `pnpm --filter @sequence/mobile exec jest src/theme/theme-provider.test.tsx`; `pnpm --filter @sequence/mobile test`; `pnpm --filter @sequence/mobile exec expo run:ios --no-bundler --device 3F87B084-DD33-41D5-B4F5-88DA77989607`; `pnpm --filter @sequence/mobile exec jest src/components/Button.test.tsx src/components/TextField.test.tsx` | yes    | 0      | -        |

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
