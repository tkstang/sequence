---
oat_status: in_progress
oat_ready_for: null
oat_blockers: []
oat_last_updated: 2026-07-03
oat_current_task_id: p01-t07
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
| Phase 1 | in_progress | 8     | 6/8       |
| Phase 2 | pending     | 5     | 0/5       |

**Total:** 6/85 tasks completed

---

## Phase 1: Foundation

**Status:** in_progress
**Started:** 2026-07-03

### Phase Summary (fill when phase is complete)

**Outcome (what changed):**

- {2-5 bullets describing user-visible / behavior-level changes delivered in this phase}

**Key files touched:**

- `{path}` - {why}

**Verification:**

- Run: `{command(s)}`
- Result: {pass/fail + notes}

**Notes / Decisions:**

- {trade-offs or deviations discovered during implementation}

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

## Phase 2: {Phase Name}

**Status:** pending
**Started:** -

### Task p02-t01: {Task Name}

**Status:** pending
**Commit:** -

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
- [ ] p01-t07: health.ping screen via minimal tRPC client - next

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

**Decisions:**

- Deferred Jest packages to p01-t04 so p01-t01 remains a clean Expo scaffold;
  the test script is present but test tooling lands with the planned Jest task.
- The Jest dependency graph resolves to `@react-native/jest-preset@0.86.0`;
  `jest-expo` 57's older peer range is accepted through pnpm
  `peerDependencyRules.allowedVersions`.
- Expo Router route-local tests are kept outside `src/app`; otherwise Metro can
  bundle test-only dependencies during dev-client startup.

**Follow-ups / TODO:**

- Add the minimal tRPC health smoke screen in p01-t07.

**Blockers:**

- None.

**Session End:** in progress

---

### 2026-07-03

**Session Start:** {time}

{Continue log...}

---

## Deviations from Plan / Design

Document any intentional deviations from the original plan, spec, or design. Include accepted review findings where the shipped implementation is source of truth and a lifecycle artifact needs alignment.

| Task / Review | Source Artifact | Planned / Documented | Actual / Accepted | Reason | Source of Truth | Follow-up |
| ------------- | --------------- | -------------------- | ----------------- | ------ | --------------- | --------- |
| -             | -               | -                    | -                 | -      | -               | -         |

## Test Results

Track test execution during implementation.

| Phase | Tests Run | Passed | Failed | Coverage |
| ----- | --------- | ------ | ------ | -------- |
| 1     | -         | -      | -      | -        |
| 2     | -         | -      | -      | -        |

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
