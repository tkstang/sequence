---
oat_status: in_progress
oat_ready_for: null
oat_blockers: []
oat_last_updated: 2026-07-04
oat_current_task_id: p09-t01
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

| Phase   | Status      | Tasks | Completed |
| ------- | ----------- | ----- | --------- |
| Phase 1 | completed   | 8     | 8/8       |
| Phase 2 | completed   | 5     | 5/5       |
| Phase 3 | completed   | 8     | 8/8       |
| Phase 4 | completed   | 7     | 7/7       |
| Phase 5 | completed   | 7     | 7/7       |
| Phase 6 | completed   | 8     | 8/8       |
| Phase 7 | completed   | 9     | 9/9       |
| Phase 8 | completed   | 6     | 6/6       |
| Phase 9 | in_progress | 7     | 0/7       |

**Total:** 58/85 tasks completed

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

**Status:** in_progress
**Started:** 2026-07-04

### Phase Summary

**Outcome (what changed):**

- Phase 9 is starting from task p09-t01.

**Verification:**

- Pending.

**Notes / Decisions:**

- None yet.

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
- [ ] p09-t01: Save & exit + concede controls - next

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

---

## Deviations from Plan / Design

Document any intentional deviations from the original plan, spec, or design. Include accepted review findings where the shipped implementation is source of truth and a lifecycle artifact needs alignment.

| Task / Review | Source Artifact | Planned / Documented | Actual / Accepted | Reason | Source of Truth | Follow-up |
| ------------- | --------------- | -------------------- | ----------------- | ------ | --------------- | --------- |
| p02-t05       | plan.md         | Expo MCP screenshot, tap `home.ping` by testID, read logs, then Argent a11y-tree read | Expo MCP covered screenshot, `home.ping` find, and logs; Argent covered native-tree read and tap at the `pong: true` point | Expo MCP `automation_tap` was unreliable on this host; user approved Argent fallback where Expo MCP does not cover the flow | `apps/mobile/AGENTS.md`; `references/using-expo-mcp-learnings.md` | Re-evaluate Expo MCP tap reliability when distilling the final skill |
| p03-t02       | plan.md         | Web StyleX themes consume `@sequence/design-tokens` imports directly if static evaluation allows it | Web StyleX files are generated from `@sequence/design-tokens` by script | Uses the plan's codegen contingency while preserving the package as source of truth | `packages/design-tokens/scripts/write-web-stylex.ts` | Keep generated StyleX files in sync with token changes |
| p03-t03       | plan.md         | `pnpm --filter @sequence/mobile ios` for the RSD spike proof | Existing installed dev client plus Metro LAN mode verified the JS/Babel spike | The inherited `expo run:ios` process stalled; p03-t03 did not require a native rebuild, and simulator visual gate passed | `/tmp/p03-t03-rsd-light-clean.png`; `/tmp/p03-t03-rsd-dark-clean.png` | Completed by the p03-t04 native rebuild when AsyncStorage landed |
| p03-t07       | plan.md         | Dev route guard test at `apps/mobile/src/app/dev/_layout.test.tsx` | Test lives at `apps/mobile/src/dev/dev-layout.test.tsx` | Expo Router bundled the route-local test into Metro and pulled in test-only Node stdlib imports | `apps/mobile/src/dev/dev-layout.test.tsx` | Keep route tests outside `src/app` unless Expo Router behavior changes |
| p03-t07       | plan.md / design.md | RSD `html.*` wrappers for chrome-kit and dev playground layout | Layout-sensitive `Button`, `Card`, `Screen`, and dev-route wrappers are native-backed while preserving public APIs | Simulator screenshots showed oversized and stretched RSD native layouts; native primitives matched the intended mobile chrome | `apps/mobile/src/components/Button.tsx`; `apps/mobile/src/components/Card.tsx`; `apps/mobile/src/components/Screen.tsx`; `apps/mobile/src/app/dev/` | p03-t08 continues light/dark story verification across the kit |
| p03-t08       | plan.md / design.md | RSD `html.*` wrappers for remaining TextField and Badge chrome-kit primitives | `TextField` and `Badge` are native-backed while preserving public APIs | Both-scheme simulator verification showed the native-backed approach is the stable baseline for the full chrome-kit surface | `apps/mobile/src/components/TextField.tsx`; `apps/mobile/src/components/Badge.tsx` | Continue using native-backed chrome primitives unless a later RSD issue is deliberately re-evaluated |
| p04-t04       | plan.md         | Auth route tests under `apps/mobile/src/app/(auth)` and root layout test under `apps/mobile/src/app` | Auth and root-route tests live under `apps/mobile/src/auth` and `apps/mobile/src/test` | Expo Router can bundle route-local tests into Metro; this preserves the already proven route-tree rule | `apps/mobile/src/auth/login-screen.test.tsx`; `apps/mobile/src/auth/signup-screen.test.tsx`; `apps/mobile/src/test/root-layout.test.tsx` | Keep future route tests outside `src/app` unless Expo Router behavior changes |
| p04-t06       | plan.md         | Scenario task with no file changes unless fixes land | Installed `expo-network` / `expo-web-browser` and added the `expo-web-browser` config plugin | Simulator proof exposed missing `@better-auth/expo` runtime peers after auth-client initialization | `apps/mobile/package.json`; `apps/mobile/app.config.ts`; `pnpm-lock.yaml` | Keep declared native peers installed and rebuild the dev client after native module changes |
| p07-t01       | plan.md         | Dev-build screenshot of a card grid sanity check | Focused Jest, Expo export, and native rebuild passed; no usable card-grid screenshot was captured | Metro was not reachable during the visual pass, and p07-t08 owns full game-surface playground screenshot verification | `apps/mobile/src/app/dev/cards.tsx`; `apps/mobile/src/game/cards/CardFace.tsx` | Completed by p07-t08 game-surface playground screenshot sweep |
| p07-t07       | plan.md         | Route test under `apps/mobile/src/app/game` | Route test lives at `apps/mobile/src/game/GameRouteScreen.test.tsx` | Expo Router can bundle `.test.*` files under `src/app` during export and pull test-only dependencies into Metro | `apps/mobile/src/game/GameRouteScreen.test.tsx` | Keep mobile route tests outside `apps/mobile/src/app` |
| p07-t09       | plan.md         | Scenario task with no source files unless fixes land | Two source fixes landed during scenario verification: mobile email TextField prop passthrough and quiet-live realtime watchdog behavior | Device/local-game proof exposed native autocapitalization and false presence disconnect behavior that unit-only verification would not catch | `apps/mobile/src/components/TextField.tsx`; `apps/mobile/src/realtime/lifecycle.ts`; `references/project-learnings.md` | Use scenario tasks to fix locally diagnosable issues before advancing |

## Test Results

Track test execution during implementation.

| Phase | Tests Run | Passed | Failed | Coverage |
| ----- | --------- | ------ | ------ | -------- |
| 1     | `pnpm --filter @sequence/mobile exec jest src/api/env.test.ts`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm --filter @sequence/mobile test`; `pnpm --filter @sequence/mobile test && pnpm --filter @sequence/mobile typecheck`; `pnpm format:check`; simulator screenshots `/tmp/p01-t06-boot-home.png`, `/tmp/p01-t07-health-ping.png` | yes    | 0      | -        |
| 2     | `pnpm --filter @sequence/mobile exec expo-mcp --help`; `pnpm install`; Expo dev server + MCP stdio `tools/list` / `automation_take_screenshot` (`/tmp/p02-t01-expo-mcp-screenshot.jpg`); Argent MCP stdio `tools/list`; RED `pnpm --filter @sequence/mobile exec jest src/test/test-ids.test.ts`; `pnpm --filter @sequence/mobile exec jest src/test/test-ids.test.ts src/test/index.test.tsx`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm --filter @sequence/mobile format`; `pnpm format:check`; manual p02-t03 read-through against design Agent Tooling section; `test -f docs/mobile-operator-runbook.md && rg -n "mobile-operator-runbook.md|## 0\\. Local Machine Setup|## 1\\. Expo Account|## 7\\. Production Smoke" docs/index.md docs/mobile-operator-runbook.md`; p02-t05 Metro + `simctl launch --initialUrl`; Expo MCP stdio `automation_take_screenshot` (`/tmp/p02-t05-expo-mcp-screenshot.jpg`), `automation_find_view home.ping`, `collect_app_logs`; Argent `tools`, `describe`, `boot-device`, `launch-app`, `native-describe-screen`, `gesture-tap`; `pnpm format:check` | yes    | 0      | -        |
| 3     | `pnpm --filter @sequence/design-tokens exec vitest run src/palette.test.ts`; `pnpm --filter @sequence/web build`; `pnpm --filter @sequence/web test`; `pnpm typecheck`; Playwright/system Chrome screenshots `/tmp/p03-t02-web-dev-light.png`, `/tmp/p03-t02-web-dev-dark.png`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; RSD spike simulator screenshots `/tmp/p03-t03-rsd-light-clean.png`, `/tmp/p03-t03-rsd-dark-clean.png`; `pnpm --filter @sequence/mobile exec jest src/theme/theme-provider.test.tsx`; `pnpm --filter @sequence/mobile test`; `pnpm --filter @sequence/mobile exec expo run:ios --no-bundler --device 3F87B084-DD33-41D5-B4F5-88DA77989607`; `pnpm --filter @sequence/mobile exec jest src/components/Button.test.tsx src/components/TextField.test.tsx`; `pnpm --filter @sequence/mobile exec jest src/components` | yes    | 0      | -        |
| 3     | `pnpm --filter @sequence/mobile exec jest src/components src/dev/dev-layout.test.tsx`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; dev-client screenshots `/tmp/p03-t07-dev-playground-accepted.png`, `/tmp/p03-t07-dev-story-button-final.png` | yes    | 0      | -        |
| 3     | `pnpm --filter @sequence/mobile exec jest src/components`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm --filter @sequence/web typecheck`; `pnpm --filter @sequence/design-tokens exec vitest run src/palette.test.ts`; `pnpm format:check`; scratch-token proof (`pnpm --filter @sequence/mobile typecheck` failed while dark palette missed `scratchProbe`, then passed after completed scratch propagation through mobile vars and web StyleX generation); dev-client screenshots `/tmp/p03-t08-{light,dark}-{index,button,text-field,card,badge,screen}.png` | yes    | 0      | -        |
| 4     | `pnpm --filter @sequence/api exec vitest run src/user/auth-expo.test.ts`; `pnpm --filter @sequence/api test` (subagent; DB-backed suites skipped because `DATABASE_URL_TEST` absent); `pnpm --filter @sequence/api typecheck`; `pnpm lint`; `pnpm format:check`; `git diff --check` | yes    | 0      | -        |
| 4     | `pnpm --filter @sequence/mobile exec jest src/auth/client.test.ts`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check` | yes    | 0      | -        |
| 4     | `pnpm --filter @sequence/mobile exec jest src/api/cookies.test.ts`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check` | yes    | 0      | -        |
| 4     | `pnpm --filter @sequence/mobile exec jest src/auth/client.test.ts src/auth/login-screen.test.tsx src/auth/signup-screen.test.tsx src/components/TextField.test.tsx src/test/root-layout.test.tsx src/test/index.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p04-t04` | yes    | 0      | -        |
| 4     | `pnpm --filter @sequence/mobile exec jest src/api/error-policy.test.ts src/test/index.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check` | yes    | 0      | -        |
| 4     | `pnpm --filter @sequence/mobile exec jest src/auth/client.test.ts src/test/root-layout.test.tsx src/test/index.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `pnpm --filter @sequence/mobile exec expo run:ios --no-bundler --device 3F87B084-DD33-41D5-B4F5-88DA77989607`; local API + Metro LAN simulator scenario with screenshots `/tmp/p04-t06-signed-in.png`, `/tmp/p04-t06-after-restart.png`, `/tmp/p04-t06-after-logout.png`, `/tmp/p04-t06-after-logout-relaunch.png` | yes    | 0      | -        |
| 4     | `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` | yes    | 0      | -        |
| 5     | `pnpm --filter @sequence/client-state exec vitest run`; `pnpm --filter @sequence/client-state typecheck`; `pnpm exec oxlint packages/client-state`; `pnpm exec oxfmt --check packages/client-state`; framework-boundary import scan over `packages/client-state` | yes    | 0      | -        |
| 5     | `pnpm --filter @sequence/client-state test`; `pnpm --filter @sequence/web test`; `pnpm --filter @sequence/web typecheck`; `pnpm --filter @sequence/web build`; `pnpm typecheck`; `pnpm format:check`; `git diff --check` | yes    | 0      | -        |
| 5     | `pnpm --filter @sequence/mobile exec jest src/api/ws.test.ts --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check` | yes    | 0      | -        |
| 5     | `pnpm --filter @sequence/mobile exec jest src/realtime/use-game-stream.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check` | yes    | 0      | -        |
| 5     | `pnpm --filter @sequence/mobile exec jest src/realtime/lifecycle.test.ts src/realtime/use-game-stream.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check` | yes    | 0      | -        |
| 5     | `pnpm --filter @sequence/mobile exec jest src/components/ConnectionBanner.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check` | yes    | 0      | -        |
| 5     | Local API + web + Metro LAN + iOS dev-client p05-t07 scenario; web-created game with mobile `/dev/stream`; API kill/restart timing; 10s background/foreground timing; replay-window event-count attempt; stale-cursor `/dev/stream?lastEventId=1` proof; screenshots `/tmp/p05-t07-web-created-lobby.png`, `/tmp/p05-t07-mobile-initial-stream.png`, `/tmp/p05-t07-web-after-start.png`, `/tmp/p05-t07-mobile-after-start.png`, `/tmp/p05-t07-mobile-after-foreground.png`, `/tmp/p05-t07-mobile-replay-window.png`, `/tmp/p05-t07-replay-window-proof.png`; `pnpm format:check`; `git diff --check` | yes    | 0      | Replay-window fallback proven by snapshot item id `504` after requested `lastEventId=1` |
| 6     | `pnpm --filter @sequence/api exec vitest run src/game/routes/join-game.test.ts` with disposable local `DATABASE_URL_TEST`; `pnpm --filter @sequence/api typecheck`; `pnpm lint`; `pnpm format:check`; `git diff --check` | yes    | 0      | 11 join/preview integration tests executed |
| 6     | `pnpm --filter @sequence/mobile exec jest src/features/dashboard src/test/index.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check` | yes    | 0      | 3 dashboard/home suites, 13 tests |
| 6     | `pnpm --filter @sequence/mobile exec jest src/features/create src/test/root-layout.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check` | yes    | 0      | 3 create/root-layout suites, 8 tests |
| 6     | `pnpm --filter @sequence/mobile exec jest src/features/join src/test/root-layout.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check` | yes    | 0      | 2 join/root-layout suites, 11 tests |
| 6     | `pnpm --filter @sequence/mobile exec jest src/auth/guest-store.test.ts src/auth/login-screen.test.tsx src/features/join src/api/cookies.test.ts src/test/root-layout.test.tsx src/realtime/use-game-stream.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check` | yes    | 0      | 6 guest/join/root-layout/stream suites, 34 tests |
| 6     | `pnpm --filter @sequence/mobile exec jest src/features/join --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`; `xcrun simctl openurl booted "sequence://join/TESTCODE"` with screenshots `/tmp/p06-t06-sequence-join-testcode-preview.png` and `/tmp/p06-t06-sequence-join-garbage-unknown.png` | yes    | 0      | Scheme route/UI proof used temporary mock API; API-backed preview covered elsewhere |
| 6     | `pnpm --filter @sequence/mobile exec jest src/game/LobbyTeams.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check` | yes    | 0      | 1 lobby suite, 5 tests; includes over-capacity roster regression |
| 6     | Local API/web/Metro/iOS dev-client p06-t08 scenario; `pnpm --filter @sequence/api exec vitest run src/game/routes/join-game.test.ts src/game/routes/lobby.test.ts`; `pnpm --filter @sequence/mobile exec jest src/api/client.test.ts src/api/cookies.test.ts src/api/ws.test.ts src/realtime/use-game-stream.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check` | yes    | 0      | FR2-FR5 evidence screenshots `/tmp/p06-t08-web-created-lobby.png`, `/tmp/p06-t08-mobile-deeplink-preview.png`, `/tmp/p06-t08-mobile-lobby-after-guest-join.png`, `/tmp/p06-t08-web-after-randomize.png`, `/tmp/p06-t08-mobile-after-randomize.png`, `/tmp/p06-t08-mobile-relaunch-continue-list.png`, `/tmp/p06-t08-orchestrator-current.png` |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/cards/CardFace.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`; `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p07-t01`; `pnpm --filter @sequence/mobile exec expo run:ios --no-bundler --device 3F87B084-DD33-41D5-B4F5-88DA77989607` | yes    | 0      | 55 card-pipeline tests; export and native rebuild passed; card-grid screenshot deferred to p07-t08 |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/GameBoard --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check` | yes    | 0      | 2 GameBoard/layout-map suites, 9 tests; includes per-cell memo probe and board-local frame registration |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/GameBoard/spotlight.test.ts src/game/GameBoard --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check` | yes    | 0      | 3 GameBoard/spotlight suites, 14 tests; includes no-target selected-card parity and one-eyed jack targets |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/CardHand --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check` | yes    | 0      | 1 CardHand suite, 7 tests; includes drag-only dead-card affordance and nested press isolation |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/PlayerRail --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check` | yes    | 0      | 2 PlayerRail/TimerBadge suites, 4 tests; includes deadline re-sync and no local forfeit path |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/use-move-submit.test.ts src/game/feedback/toasts.test.ts --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`; `pnpm --filter @sequence/mobile exec expo install expo-haptics@~57.0.0 --check` | yes    | 0      | 2 move-submit/feedback suites, 19 tests; Expo package compatibility check passed |
| 7     | `pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx src/game/CardHand src/game/GameBoard --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check` | yes    | 0      | 5 active-route/hand/board suites, 27 tests; route test lives outside `src/app` |
| 7     | `git ls-files 'apps/mobile/src/app/**/*.test.*' 'apps/mobile/src/app/*.test.*'`; `pnpm --filter @sequence/mobile exec jest src/game/GameRouteScreen.test.tsx src/dev/stories.test.ts src/game/PlayerRail/PlayerRail.test.tsx src/game/CardHand src/game/GameBoard --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check`; `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p07-t08-final3`; simulator screenshots `/tmp/p07-t08-game-board.png`, `/tmp/p07-t08-game-hand-fixed.png`, `/tmp/p07-t08-game-rail-fixed.png`, `/tmp/p07-t08-game-board-light.png`, `/tmp/p07-t08-game-hand-light.png`, `/tmp/p07-t08-game-rail-light.png` | yes    | 0      | 7 game-surface suites, 31 tests; Expo export and both-theme story visual sweep passed |
| 7     | Local API/web/mobile deterministic p07-t09 games `3fc7917c-862d-45a0-90e6-380a7335eb87` and `e6fa8ecf-4839-41a6-b2bf-30b18e64f7ad`; web screenshots `/tmp/p07-t09-web-active.png`, `/tmp/p07-t09-web-final.png`; mobile screenshots `/tmp/p07-t09-mobile-initial.png`, `/tmp/p07-t09-mobile-final.png`, `/tmp/p07-t09-mobile-active.png`; `pnpm --filter @sequence/mobile exec jest src/components/TextField.test.tsx src/auth/login-screen.test.tsx src/auth/signup-screen.test.tsx --runInBand`; `pnpm --filter @sequence/mobile exec jest src/realtime/lifecycle.test.ts src/realtime/use-game-stream.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p07-t09`; `git diff --check` | yes    | 0      | FR6/FR9 full tap-mode loop passed; stale 409, jack moves, auto-draw, timer UI, locked sequence, and final win verified; p50 samples `6.1ms` and `3.35ms` |
| 8     | `pnpm --filter @sequence/mobile exec jest src/game/drag --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `pnpm --filter @sequence/mobile exec expo install react-native-reanimated react-native-gesture-handler --check`; `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p08-t01`; `git diff --check` | yes    | 0      | 2 drag suites, 5 tests; SDK-compatible gesture dependencies and Reanimated Babel config verified |
| 8     | `pnpm --filter @sequence/mobile exec jest src/test/root-layout.test.tsx src/game/GameRouteScreen.test.tsx src/game/drag --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `pnpm --filter @sequence/mobile exec expo install react-native-reanimated react-native-gesture-handler react-native-worklets --check`; `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/sequence-mobile-export-p08-t02-final`; `git diff --check`; `pnpm --filter @sequence/mobile ios`; simulator proof for drag game `18d450fa-1eb9-4c4a-a91c-f1ef8a1996ad` with screenshots `/tmp/sequence-mobile-p08-t02-drag-game.png` and `/tmp/sequence-mobile-p08-t02-drag-after-move.png` | yes    | 0      | 4 focused suites, 15 tests; dev client rebuilt; no-card drag-mode `game.makeMove` placed `16D`, app received subscription events, and screen updated to version 2 |
| 8     | `pnpm --filter @sequence/mobile exec jest src/game/SequenceChoiceSheet.test.tsx src/game/GameRouteScreen.test.tsx --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD` | yes    | 0      | 2 sequence-choice/route suites, 13 tests; my-seat pending choice opens the sheet and submits `chooseSequenceCells`; other-seat choice shows frozen banner |
| 8     | `pnpm --filter @sequence/mobile exec jest src/game/DeadCardControls.test.tsx src/game/GameRouteScreen.test.tsx src/game/feedback/toasts.test.ts --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD` | yes    | 0      | 3 dead-card/route/feedback suites, 29 tests; hard-mode turn-in calls `turnInDeadCard`, same-turn rejection uses `not-a-dead-card`, and default-mode auto-swap emits one toast per event seq |
| 8     | `pnpm --filter @sequence/mobile exec jest src/game/GameBoard --runInBand`; `pnpm --filter @sequence/mobile typecheck`; `pnpm --filter @sequence/mobile lint`; `pnpm format:check`; `git diff --check HEAD` | yes    | 0      | 3 GameBoard suites, 16 tests; rotate control cycles 0/90/180/270, transformed frames stay aligned with drag hit-testing, and 90/270 rotations stay within the board touch area |
| 8     | Seeded drag-mode game `c5315deb-9acb-4f8c-b78a-355b0ae95447`; public mutations `game.turnInDeadCard`, `game.makeMove`, `game.chooseSequenceCells`; mobile screenshots `/tmp/p08-t06-mobile-seeded.png`, `/tmp/p08-t06-mobile-pending-choice.png`, `/tmp/p08-t06-mobile-final-win.png`; web screenshot `/tmp/p08-t06-web-final-win.png`; DB assertions; chained-choice seed `716fbe0d-ea9d-453f-bd00-117032eea989` | yes    | 0      | FR7/FR8 hard-mode pass: dead-card turn-in, one-eyed removal, web opponent move, no-card drag contract placement, pending choice, final win, and chained choice verified |

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
