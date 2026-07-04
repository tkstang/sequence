# Mobile Operator Runbook

This runbook is the durable home for operator-dependent mobile steps. Phases
1-11 should remain agent-executable on a simulator. Phase 12 is the planned
operator phase for account, signing, TestFlight, physical-device, and production
smoke work.

Use this page as a checklist when setting up a new machine or preparing the
TestFlight release path. If an implementation phase discovers a new operator
step, add it to the relevant section here before Phase 12 executes it.

## NFR7 Phase Audit

Phase 11 audited the project plan, design, and implementation record for
operator-dependent work. No required human operator step was found in Phases
1-11. Those phases are agent-executable and simulator-verifiable. The only
pre-Phase-12 human-adjacent step is optional remote Expo MCP OAuth in Section 1;
local `expo-mcp`, Argent, and `simctl` cover the required simulator loop without
it.

Sections below label whether each operator task is required or optional and
which project phase needs it. Phase 12 executes the required account, signing,
TestFlight, device, and production-smoke work against this runbook.

## 0. Local Machine Setup

### Why

The mobile app uses an Expo dev build on the iOS Simulator. A machine must have
Xcode, an iOS Simulator runtime, CocoaPods, Watchman, Node 24, and pnpm before
an agent can build, launch, screenshot, and inspect the app locally.

### When

Required before any Mac can run simulator-based mobile development. This is the
only operator prerequisite that may precede Phase 1. It was performed for the
current development machine on 2026-07-02 and should be repeated for any new Mac
that will build the iOS dev client.

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

9. For auth-slice simulator checks, choose the API endpoint before starting
   Metro. The mobile app reads `extra.apiUrl` and `extra.wsUrl` from Expo config;
   see `configuration.md#mobile-api-urls-extraapiurl--extrawsurl`.

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
- If auth persistence behaves unexpectedly after changing native auth peers or
  Expo config plugins, rebuild the dev client before retesting. The Phase 4
  simulator pass required the native `@better-auth/expo` peers and plugin state
  to match the installed client.
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

5. Required in Phase 12: create or select the Expo project that will own
   Sequence Online. Run EAS project-linking commands from `apps/mobile`, not
   from the monorepo root.
6. Optional before Phase 12: connect the remote Expo MCP server named `expo`
   from the host MCP client and complete the browser OAuth flow.
7. Keep using local `expo-mcp` for simulator screenshots, taps, logs, and
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

Required in Phase 12 pre-flight before Sections 3-5 can proceed. Optional
before Phase 12 only if the operator wants to remove account-access risk early.

### Prerequisites

- Operator with authority to enroll or use the organization's Apple Developer
  account.
- Legal entity and payment details if a new enrollment is required.
- Access to the Apple Developer portal and App Store Connect for the Apple ID
  that will run signing and app-record work.

### Steps

1. Sign in to `https://developer.apple.com/account/` with the Apple ID that
   will manage the app.
2. Confirm the account belongs to the Apple Developer Program. If enrollment is
   missing, complete Apple's enrollment flow before continuing.
3. Select the team that will own Sequence Online.
4. Confirm the operator has enough access to manage identifiers, certificates,
   provisioning profiles, App Store Connect app records, TestFlight builds, and
   tester groups. Account Holder or Admin access is the lowest-risk path.
5. Record these non-secret identifiers in this section during Phase 12:

   | Field | Value |
   | --- | --- |
   | Apple team name | `<record in Phase 12>` |
   | Apple team ID | `<record in Phase 12>` |
   | Operator role | `<record in Phase 12>` |
   | Apple ID owner | `<record name, not password>` |

6. Do not store passwords, app-specific passwords, API keys, certificates, or
   provisioning profiles in the repository.

### Verify

The Apple Developer portal shows active membership for the selected team, and
the operator can open Certificates, Identifiers & Profiles. App Store Connect
opens for the same team without requesting additional approval.

### Troubleshooting

- If enrollment or team access is pending, record the blocker in the active OAT
  implementation state and continue only with simulator-verifiable work.
- If the portal shows multiple teams, confirm the intended team before creating
  the bundle identifier. Moving an app between teams is avoidable release risk.
- If the operator cannot manage identifiers or certificates, ask the Account
  Holder or Admin to grant access or perform Sections 3-4.

## 3. App Store Connect App Record + Bundle Identifier

### Why

The TestFlight build needs an App Store Connect app record and bundle
identifier matching the native iOS app id.

### When

Required in Phase 12 pre-flight after Section 2 and before EAS credentials in
Section 4.

### Prerequisites

- Apple Developer Program access from Section 2.
- Confirmed iOS bundle identifier: `com.tkstang.sequenceonline`.
- Confirmed display name: `Sequence Online`.
- App Store Connect access for the selected Apple team.

### Steps

1. In the Apple Developer portal, open Certificates, Identifiers & Profiles.
2. Create an App ID for the iOS bundle identifier
   `com.tkstang.sequenceonline`, or confirm it already exists on the selected
   team.
3. In App Store Connect, create a new iOS app record using these project
   defaults unless the owner changes them during Phase 12:

   | Field | Required value or default |
   | --- | --- |
   | Platform | iOS |
   | Name | `Sequence Online` |
   | Bundle ID | `com.tkstang.sequenceonline` |
   | SKU | `sequence-online-ios` |
   | Primary locale | English (U.S.) |
   | Category | Games |

4. Record App Store Connect metadata that Phase 12 finalizes:

   | Field | Value |
   | --- | --- |
   | App Store Connect app URL | `<record in Phase 12>` |
   | Apple app ID | `<record in Phase 12>` |
   | Bundle ID owner team | `<record in Phase 12>` |
   | Export compliance answer | `<record in Phase 12>` |
   | Tester contact owner | `<record in Phase 12>` |

5. Confirm `apps/mobile/app.config.ts` still declares the same bundle
   identifier before moving to Section 4.

### Verify

The App Store Connect app record opens for `Sequence Online`, the visible bundle
identifier is `com.tkstang.sequenceonline`, and `apps/mobile/app.config.ts`
matches that bundle identifier.

### Troubleshooting

- If the bundle identifier already exists under a different Apple team, resolve
  ownership before starting EAS credentials work.
- If the app name is unavailable, pick the owner-approved App Store display
  name and keep the native display name `Sequence Online` unless the owner
  decides otherwise.
- If App Store Connect asks for compliance metadata that is not yet known,
  capture the exact field name and value needed before submitting a build for
  beta review.

## 4. EAS Build Credentials and Signing

### Why

EAS Build needs Apple credentials and signing assets to produce an installable
production iOS build for TestFlight.

### When

Required in Phase 12 before the first production iOS build and TestFlight
upload. Optional earlier only for account-risk reduction.

### Prerequisites

- Expo account access from Section 1.
- Apple Developer and App Store Connect setup from Sections 2 and 3.
- `eas.json` production profiles from the implementation phase that creates
  them.
- EAS CLI available on the operator shell.

### Steps

1. Change to the mobile workspace before running EAS commands:

   ```bash
   cd apps/mobile
   ```

2. Confirm the Expo account:

   ```bash
   eas whoami
   ```

   If `eas` is not installed, install the EAS CLI in the operator environment
   or run the equivalent command through `pnpm dlx eas-cli@latest`.

3. Link or initialize the EAS project from `apps/mobile`:

   ```bash
   eas init
   ```

   Use the existing Expo organization/project when available. Do not initialize
   an EAS project from the monorepo root.

4. Inspect iOS credentials for the production bundle identifier:

   ```bash
   eas credentials --platform ios
   ```

5. Prefer EAS-managed credentials unless the owner explicitly chooses a manual
   signing path. Approve prompts that create or reuse distribution
   certificates and App Store provisioning profiles for
   `com.tkstang.sequenceonline`.
6. Record non-secret EAS identifiers:

   | Field | Value |
   | --- | --- |
   | Expo account / organization | `<record in Phase 12>` |
   | EAS project ID | `<record in Phase 12>` |
   | Credential mode | `EAS-managed` or `manual` |
   | First production build URL | `<record in Phase 12>` |

7. When Phase 12 reaches the production build task, run build and submit from
   `apps/mobile`:

   ```bash
   eas build --profile production --platform ios
   eas submit --platform ios
   ```

### Verify

`eas whoami` reports the expected Expo account, `eas credentials --platform ios`
shows iOS distribution credentials for `com.tkstang.sequenceonline`, and the
first production EAS build produces a build URL.

### Troubleshooting

- If EAS cannot create or reuse credentials, capture the exact EAS error and
  resolve Apple team permissions before retrying.
- If EAS creates credentials for the wrong team or bundle identifier, stop and
  delete or replace the incorrect credential from the EAS credentials UI before
  building again.
- If `eas init` links the wrong Expo project, correct the project link before
  committing any generated project identifier.

## 5. TestFlight Internal and External Tester Groups

### Why

Internal and external TestFlight groups control who can install and verify the
mobile MVP.

### When

Required in Phase 12 after the first submitted production build appears in App
Store Connect.

### Prerequisites

- App Store Connect app record from Section 3.
- A successful uploaded TestFlight build from Section 4.
- Tester email list and group policy.

### Steps

1. In App Store Connect, open `Sequence Online` and select TestFlight.
2. Confirm the uploaded build finished processing and is available for testing.
3. Create or select an internal tester group:

   | Field | Default |
   | --- | --- |
   | Group name | `Sequence Online Internal` |
   | Purpose | Operator smoke and owner validation |
   | Minimum install proof | One operator installs and launches the build |

4. Add internal testers from App Store Connect users. Internal testers must have
   App Store Connect access before they can receive the build.
5. Assign the processed build to the internal group.
6. Create or select an external tester group:

   | Field | Default |
   | --- | --- |
   | Group name | `Sequence Online External` |
   | Purpose | External MVP validation |
   | Minimum install proof | One external tester installs through TestFlight |

7. Add the external tester list or public-link policy approved by the owner.
8. Submit the build for beta review when App Store Connect requires it for
   external testing. Complete export compliance and beta app review fields with
   the owner-approved answers.
9. Record group actuals during Phase 12:

   | Field | Value |
   | --- | --- |
   | Internal group name | `<record in Phase 12>` |
   | External group name | `<record in Phase 12>` |
   | Build number assigned | `<record in Phase 12>` |
   | Beta review status | `<record in Phase 12>` |
   | First tester install | `<record in Phase 12>` |

### Verify

The selected build is assigned to the internal group, at least one internal
tester installs and launches it, the external group is created, and at least one
external tester can install after beta review or invite availability.

### Troubleshooting

- If external testing is blocked by beta review, capture the App Store Connect
  message and update the release checklist before retrying.
- If a tester does not receive an invite, confirm the email address, group
  assignment, build assignment, and TestFlight app install state.
- If App Store Connect expires or removes a build, submit a newer build and
  update the build number in this runbook.

## 6. Physical-Device Verification Checklist

### Why

Some mobile risks, including real device performance, app lifecycle behavior,
network transitions, and native input feel, require physical-device checks.

### When

Required in Phase 12 after a TestFlight build can be installed. The Wi-Fi to
cellular handoff and airplane-mode recovery checks are the deferred NFR2 device
network cases. The device-feel spot-check is the deferred NFR3 case.

### Prerequisites

- TestFlight build installable from Section 5.
- At least one supported iPhone-class device.
- Production API endpoint selected for final smoke:
  `https://sequence-api-production-8687.up.railway.app`.
- Production WebSocket endpoint selected for final smoke:
  `wss://sequence-api-production-8687.up.railway.app`.
- Two tester identities or a coordinated second device/browser for remote-game
  checks.

### Steps

1. Record device and build information:

   | Field | Value |
   | --- | --- |
   | Device model | `<record in Phase 12>` |
   | iOS version | `<record in Phase 12>` |
   | TestFlight build number | `<record in Phase 12>` |
   | API origin | `<record in Phase 12>` |
   | WebSocket origin | `<record in Phase 12>` |

2. Launch the TestFlight build and sign up or sign in with a disposable
   production account.
3. Confirm session persistence: force quit the app, relaunch, and verify the
   account remains signed in. Then sign out, relaunch, and verify the app stays
   signed out.
4. Join or create an active remote game with another tester or browser client.
5. Deferred NFR2 Wi-Fi to cellular handoff: while the remote game is active,
   switch the phone from Wi-Fi to cellular data. Verify the app shows any
   connection interruption promptly and recovers once the network is available.
6. Deferred NFR2 airplane-mode recovery: while the remote game is active,
   enable airplane mode, wait for the app to show offline/reconnecting state,
   disable airplane mode, and verify the game state catches up without losing
   the session.
7. Background the app during an active turn, wait long enough for at least one
   remote event, foreground the app, and verify the board, current turn, hand,
   timer, and event history resynchronize.
8. Deferred NFR3 device-feel spot-check: select a card, drag over valid board
   targets, submit a move, and confirm taps, drag feedback, haptics, pending
   state, and move confirmation feel responsive on device.
9. Run a local pass-and-play handoff on device. Verify the previous player's
   hand is hidden during handoff and the next player's hand appears only after
   confirmation.
10. Record any failure with device model, OS version, build number, network
    state, reproduction steps, and screenshots or screen recording.

### Verify

Every required checklist item has a pass/fail result, device model, OS version,
build number, and notes. Failures include enough reproduction detail for a
follow-up fix.

### Troubleshooting

- If a physical-device issue cannot be reproduced on simulator, keep the device
  result as the source of truth and add a focused follow-up task.
- If cellular checks fail because the device has no active cellular plan, use a
  different tester device or record the missing capability as a Phase 12
  blocker.
- If a network transition logs the user out, capture client logs and server auth
  logs before retrying with a fresh session.

## 7. Production Smoke Checklist

### Why

The production TestFlight build must prove the end-to-end player path against
the production API before the project is complete.

### When

Required in Phase 12 after the TestFlight build is installable. Phase 11
pre-distribution smoke exercises the same flows through the agent loop, but
Phase 12 is the two-human TestFlight proof.

### Prerequisites

- TestFlight build installable by the required tester group.
- Production API, websocket, database, and deployment health verified.
- Two human testers or two production-capable devices/accounts as required by
  the final smoke plan.

### Steps

1. Record the production endpoints:

   | Endpoint | Value |
   | --- | --- |
   | API health | `https://sequence-api-production-8687.up.railway.app/health` |
   | API origin | `https://sequence-api-production-8687.up.railway.app` |
   | WebSocket origin | `wss://sequence-api-production-8687.up.railway.app` |

2. Verify API health returns `{"status":"ok"}` before starting:

   ```bash
   curl -fsS https://sequence-api-production-8687.up.railway.app/health
   ```

3. Tester A installs the TestFlight build, launches it, and signs up or signs
   in with a disposable production account.
4. Tester B installs the same TestFlight build and signs up, signs in, or joins
   as a guest when the smoke case requires guest coverage.
5. Tester A creates a remote game with legal settings.
6. Tester A shares the invite code or link. Tester B joins, selects a team, and
   verifies lobby presence updates on both devices.
7. Start the game and play until a real multiplayer win occurs. During play,
   verify turn ownership, board/hand rendering, move submission, realtime
   updates, timers, and game-over outcome.
8. Run focused lifecycle checks against production:

   | Flow | Expected result |
   | --- | --- |
   | Save/resume | Relaunch or dashboard resume returns to the active game |
   | Concede | All connected clients see the final outcome |
   | Rematch | Both testers land in the rematch lobby |
   | Pass-and-play | Local handoff hides the previous hand before the next player confirms |
   | Guest join | Guest identity can preview/join and receives authorized game state |

9. Record final smoke actuals:

   | Field | Value |
   | --- | --- |
   | TestFlight build number | `<record in Phase 12>` |
   | Tester A device/account | `<record in Phase 12>` |
   | Tester B device/account | `<record in Phase 12>` |
   | Game ID | `<record in Phase 12>` |
   | Winner/outcome | `<record in Phase 12>` |
   | Smoke result | `<pass or fail>` |
   | Evidence links | `<screenshots, logs, or notes>` |

### Verify

The TestFlight build completes auth, invite/join, a full two-human multiplayer
game, lifecycle checks, and required guest/local coverage against production.
The runbook records build number, endpoints, devices/accounts, game ID, outcome,
and evidence.

### Troubleshooting

- If production smoke fails, capture server logs, client logs, build number,
  and reproduction steps before retrying or shipping a new build.
- If production auth fails, compare the mobile `EXPO_PUBLIC_API_URL` and
  `EXPO_PUBLIC_WS_URL` used for the build with the production URLs above.
- If realtime updates fail while HTTP actions succeed, check the production
  WebSocket origin and server logs before replaying the smoke flow.
