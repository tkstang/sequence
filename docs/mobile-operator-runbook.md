# Mobile Operator Runbook

This runbook is the durable home for operator-dependent mobile steps. Phases
1-11 should remain agent-executable on a simulator. Phase 12 is the planned
operator phase for account, signing, TestFlight, physical-device, and production
smoke work.

Use this page as a checklist when setting up a new machine or preparing the
TestFlight release path. If an implementation phase discovers a new operator
step, add it to the relevant section here before Phase 12 executes it.

## 0. Local Machine Setup

### Why

The mobile app uses an Expo dev build on the iOS Simulator. A machine must have
Xcode, an iOS Simulator runtime, CocoaPods, Watchman, Node 24, and pnpm before
an agent can build, launch, screenshot, and inspect the app locally.

### When

This is the only operator prerequisite that may precede Phase 1. It was
performed for the current development machine on 2026-07-02 and should be
repeated for any new Mac that will build the iOS dev client.

### Prerequisites

- macOS with enough disk space for Xcode and at least one iOS Simulator runtime.
- Apple ID access to install Xcode from the App Store or Apple Developer site.
- Homebrew or another approved package manager for Watchman and CocoaPods.
- Repository checkout using Node `v24` from `.nvmrc` and pnpm `10.17.0+`.

### Steps

1. Install Xcode from the App Store or Apple Developer downloads.
2. Open Xcode once and complete first-launch component installation.
3. Select the installed Xcode developer directory:

   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

4. Accept the Xcode license:

   ```bash
   sudo xcodebuild -license accept
   ```

5. Download the iOS simulator platform if Xcode did not install one:

   ```bash
   xcodebuild -downloadPlatform iOS
   ```

6. Install simulator build helpers:

   ```bash
   brew install watchman cocoapods
   ```

7. Install repo dependencies from the checkout root:

   ```bash
   pnpm install
   ```

8. Build or reuse the mobile dev client:

   ```bash
   pnpm --filter @sequence/mobile ios
   ```

### Verify

Run these checks from the repository root:

```bash
node -v
pnpm -v
xcodebuild -version
xcrun simctl list devices available
pod --version
watchman --version
pnpm --filter @sequence/mobile typecheck
```

Expected result: Node reports v24, pnpm is at least 10.17.0, Xcode reports an
installed version, at least one iOS Simulator device is available, CocoaPods and
Watchman respond, and the mobile typecheck passes.

### Troubleshooting

- If `xcodebuild` cannot find Xcode, rerun `sudo xcode-select -s ...` with the
  correct Xcode app path.
- If the simulator runtime is missing, rerun `xcodebuild -downloadPlatform iOS`
  and open Xcode's Platforms settings to confirm the runtime finished
  installing.
- If `pnpm --filter @sequence/mobile ios` installs the app but Expo cannot
  activate Simulator through `osascript`, use the documented `simctl launch
  --initialUrl` fallback in `apps/mobile/AGENTS.md`.
- Generated native folders (`apps/mobile/ios`, `apps/mobile/android`),
  `.expo`, and `expo-env.d.ts` are local build artifacts and must stay
  untracked.

## 1. Expo Account + Optional MCP OAuth

### Why

An Expo account is required for EAS Build and the TestFlight path in Phase 12.
The remote Expo MCP server also uses per-user Expo OAuth for docs-search and EAS
tooling. The local simulator loop uses `expo-mcp` and does not require an Expo
account.

### When

Expo account access may be set up early for convenience. It is optional for
Phases 1-11 and required by Phase 12 before EAS project, build, and submission
work. The operator environment for this project has already been configured for
remote Expo MCP access; repeat these steps only for a new operator or machine.

### Prerequisites

- Expo account credentials for the operator.
- Access to the Expo organization or project that will own Sequence Online.
- A repository checkout with `.mcp.json` containing the `expo` remote MCP
  server entry.

### Steps

1. Sign in or create an Expo account at `https://expo.dev/`.
2. Confirm access to the organization or project that will own the mobile app.
3. From the repo root, verify the Expo CLI identity when account-backed commands
   are needed:

   ```bash
   pnpm --filter @sequence/mobile exec expo whoami
   ```

4. If the command reports that no user is logged in, sign in:

   ```bash
   pnpm --filter @sequence/mobile exec expo login
   ```

5. Optional before Phase 12: connect the remote Expo MCP server named `expo`
   from the host MCP client and complete the browser OAuth flow.
6. Keep using local `expo-mcp` for simulator screenshots, taps, logs, and
   DevTools. Local `expo-mcp` requires only a running dev server.

### Verify

```bash
pnpm --filter @sequence/mobile exec expo whoami
pnpm --filter @sequence/mobile exec expo-mcp --help
```

Expected result: `expo whoami` returns the operator account when logged in, and
`expo-mcp --help` prints local tool options regardless of Expo account status.
If remote MCP OAuth was connected, the host MCP client should show the `expo`
server as authenticated.

### Troubleshooting

- If OAuth opens the wrong browser profile, sign out of Expo in that browser or
  retry from the intended operator profile.
- If the remote Expo MCP server is unavailable, continue with local
  `expo-mcp`, Argent, and `simctl`; remote Expo MCP is optional until Phase 12.
- If `expo whoami` is not authenticated on a CI or agent shell, do not store
  secrets in the repo. Use Expo's supported token or provider configuration
  when Phase 12 requires automation.

## 2. Apple Developer Program Enrollment

### Why

Apple Developer Program membership is required before App Store Connect,
signing, and TestFlight distribution can proceed.

### When

Authored by the phase that discovers the exact account need; executed in
Phase 12.

### Prerequisites

- Operator with authority to enroll or use the organization's Apple Developer
  account.
- Legal entity and payment details if a new enrollment is required.

### Steps

1. Add the exact enrollment or account-access steps when the relevant phase
   confirms the organization's Apple Developer account path.
2. Keep this section updated with any role, team, or permission names the
   operator must verify.

### Verify

Document the accepted Apple team name, team ID, and the operator role that can
manage certificates, identifiers, profiles, and App Store Connect access.

### Troubleshooting

- If enrollment or team access is pending, record the blocker in the active OAT
  implementation state and continue only with simulator-verifiable work.

## 3. App Store Connect App Record + Bundle Identifier

### Why

The TestFlight build needs an App Store Connect app record and bundle
identifier matching the native iOS app id.

### When

Authored by the phase that discovers the exact App Store Connect need; executed
in Phase 12.

### Prerequisites

- Apple Developer Program access from Section 2.
- Confirmed iOS bundle identifier: `com.tkstang.sequenceonline`.
- App name, SKU, primary locale, category, and required metadata decisions.

### Steps

1. Add the App Store Connect creation steps when the relevant phase finalizes
   app metadata and ownership.
2. Include exact values for bundle id, SKU, app name, locale, and any required
   compliance answers.

### Verify

Document the App Store Connect app URL and confirm the bundle identifier matches
the Expo/EAS production configuration.

### Troubleshooting

- If the bundle identifier already exists under a different Apple team, resolve
  ownership before starting EAS credentials work.

## 4. EAS Build Credentials and Signing

### Why

EAS Build needs Apple credentials and signing assets to produce an installable
production iOS build for TestFlight.

### When

Authored by the phase that discovers the exact signing need; executed in
Phase 12.

### Prerequisites

- Expo account access from Section 1.
- Apple Developer and App Store Connect setup from Sections 2 and 3.
- `eas.json` production profiles from the implementation phase that creates
  them.

### Steps

1. Add the exact EAS credential prompts, approval points, and fallback manual
   steps when the EAS profile lands.
2. Record whether EAS-managed credentials or manually supplied credentials are
   the source of truth.

### Verify

Document the successful EAS credential state and a build URL for the first
signed production build.

### Troubleshooting

- If EAS cannot create or reuse credentials, capture the exact EAS error and
  resolve Apple team permissions before retrying.

## 5. TestFlight Internal and External Tester Groups

### Why

Internal and external TestFlight groups control who can install and verify the
mobile MVP.

### When

Authored by the phase that discovers the exact tester-management need; executed
in Phase 12.

### Prerequisites

- App Store Connect app record from Section 3.
- A successful uploaded TestFlight build from Section 4.
- Tester email list and group policy.

### Steps

1. Add exact group names, tester lists, and invitation steps when the TestFlight
   phase is active.
2. Record which group owns internal smoke testing and which group owns external
   validation.

### Verify

Document the build number assigned to each group and confirmation that at least
one tester can install the build.

### Troubleshooting

- If external testing is blocked by beta review, capture the App Store Connect
  message and update the release checklist before retrying.

## 6. Physical-Device Verification Checklist

### Why

Some mobile risks, including real device performance, app lifecycle behavior,
network transitions, and native input feel, require physical-device checks.

### When

Authored by the phase that discovers each device-only verification need;
executed in Phase 12.

### Prerequisites

- TestFlight build installable from Section 5.
- At least one supported iPhone-class device.
- Production or staging API endpoint selected for the smoke pass.

### Steps

1. Add each device-only checklist item when a phase discovers it.
2. Include device model, iOS version, account state, and expected outcome for
   every item.

### Verify

Record device model, OS version, build number, checklist result, and screenshots
or logs for failures.

### Troubleshooting

- If a physical-device issue cannot be reproduced on simulator, keep the device
  result as the source of truth and add a focused follow-up task.

## 7. Production Smoke Checklist

### Why

The production TestFlight build must prove the end-to-end player path against
the production API before the project is complete.

### When

Authored by the phase that discovers the exact production smoke needs; executed
in Phase 12.

### Prerequisites

- TestFlight build installable by the required tester group.
- Production API, websocket, database, and deployment health verified.
- Two human testers or two production-capable devices/accounts as required by
  the final smoke plan.

### Steps

1. Add the final production smoke checklist as gameplay, auth, realtime, and
   lifecycle features land.
2. Include exact start state, accounts/guest identities, invite flow, and
   expected game outcome.

### Verify

Record the TestFlight build number, production API base URL, players/devices
used, completed game outcome, and any screenshots or logs required by the final
release audit.

### Troubleshooting

- If production smoke fails, capture server logs, client logs, build number,
  and reproduction steps before retrying or shipping a new build.
