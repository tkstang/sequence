# Using Expo MCP Learnings

This file is a running project reference for turning the `mobile-mvp` Expo MCP
and Argent experience into a reusable skill at the end of the project. It is not
the final skill; keep it appendable as new phases exercise more of the tooling.

## Current Tooling

- Remote Expo MCP is configured in `.mcp.json` as `expo` at
  `https://mcp.expo.dev/mcp`. It is useful for documentation and hosted Expo
  capabilities, while local simulator automation comes from `expo-mcp`.
- Local Expo MCP is installed as `expo-mcp@0.2.4` in `apps/mobile`.
- Argent is configured in `.mcp.json` as `npx -y @swmansion/argent mcp`.
  The `mcp` subcommand is required for the stdio server.
- The current local Expo MCP tool list includes:
  `automation_find_view`, `automation_take_screenshot`, `automation_tap`,
  `collect_app_logs`, `expo_router_sitemap`, and `open_devtools`.

## Efficient Local Loop

1. Start Metro with local Expo MCP enabled:

   ```bash
   EXPO_UNSTABLE_MCP_SERVER=1 pnpm --filter @sequence/mobile exec expo start --dev-client --host lan --port 8081
   ```

2. Launch the installed dev client directly with `simctl launch` and an
   `--initialUrl`:

   ```bash
   xcrun simctl launch --terminate-running-process booted com.tkstang.sequenceonline --initialUrl 'exp+sequence-online://expo-development-client/?url=http%3A%2F%2F<lan-ip>%3A8081%3FdisableOnboarding%3D1&disableOnboarding=1'
   ```

3. For app-route proof after the dev client is loaded, open the app scheme with
   `simctl openurl`, for example `sequence://game/<id>`. Plain
   `simctl launch --initialUrl sequence://...` can reopen the Expo dev-client
   launcher instead of the bundled app.

4. Call `expo-mcp` as a stdio MCP server without `--collect-logs` for tool use:

   ```bash
   pnpm --filter @sequence/mobile exec expo-mcp --dev-server-url http://127.0.0.1:8081 --root apps/mobile --platform ios --app-id com.tkstang.sequenceonline
   ```

5. Use targeted selectors before screenshots when possible. `automation_find_view`
   returns fast structured proof: existence, label, frame, enabled state, and
   hittability for a `testID`.

6. Use screenshots for visual proof and artifact capture. Allow a long timeout;
   `automation_take_screenshot` can take more than a minute on this host.

7. Use Argent for gaps in Expo MCP, especially native accessibility tree reads,
   screen descriptions, gesture tooling, and debugger/profiler views. For native
   devtools-backed tools, boot through Argent and launch/restart the app through
   Argent at least once so injection is active.

## MCP Stdio Notes

- The installed MCP SDK (`@modelcontextprotocol/sdk@1.29.0`) uses newline
  delimited JSON-RPC on stdio. Do not use `Content-Length` framing for the local
  `expo-mcp` process in this setup.
- Send `initialize`, then the `notifications/initialized` notification, then
  `tools/list` or `tools/call`.
- The useful `initialize` shape is:

  ```json
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": { "name": "codex-mobile-loop", "version": "1.0.0" }
    }
  }
  ```

## Gotchas

- `expo-mcp --collect-logs <duration>` is one-shot log collection mode. It
  prints collected logs and exits instead of starting a long-lived MCP server.
- Expo CLI simulator activation can fail through `osascript` permissions even
  after broader system-event approval. `xcrun simctl launch --initialUrl` is the
  most reliable non-operator launch path found so far.
- `xcrun simctl openurl` can trigger an iOS "Open in Sequence Online?" prompt.
  Prefer `simctl launch --initialUrl` when bootstrapping the dev client.
- `automation_take_screenshot` and `automation_find_view` succeeded during this
  project, but each could leave the simulator shutdown immediately afterward on
  this host. Check `xcrun simctl list devices booted` before the next tool call
  and reboot/relaunch when necessary.
- For Expo dev-client route proof, load the dev-client URL first and then open
  the app route. During p11-t02, `simctl launch --initialUrl sequence://game/...`
  returned to the Expo launcher, while the dev-client URL followed by
  `simctl openurl booted sequence://game/<id>` landed on the active game.
- `automation_tap` against `home.ping` did not complete reliably in this run:
  direct invocation returned `Cannot read properties of undefined (reading
  'bundleIdentifier')`; the `pnpm exec` invocation timed out and then returned
  `Unexpected end of JSON input` during cleanup. Use Argent `describe` /
  `native-describe-screen` plus `gesture-tap` as the current fallback.
- Argent `describe` can read the accessibility tree without an Argent boot, but
  reports a hint that full accessibility settings require `boot-device` with
  `force: true`. Native devtools-backed `native-describe-screen` returned
  `restart_required` until Argent had booted the simulator and launched the app.
- Argent `open-url` works for the Expo dev-client URL, but can surface the iOS
  "Open in Sequence Online?" confirmation prompt. Use `simctl launch
  --initialUrl` when you need to bypass that prompt; use Argent `launch-app` /
  `restart-app` when you need native devtools injection.
- The fallback simulator screenshot command can hang after the image is written.
  Use a bounded timeout and keep the file if it already exists.
- During p10-t06, the bounded screenshot wrapper
  `perl -e 'alarm shift; exec @ARGV' 20 xcrun simctl io booted screenshot ...`
  often exited with signal/alarm status after writing a valid PNG. Treat the
  file's existence and `file` output as the evidence, not the wrapper exit code
  alone.
- Direct Better Auth probes against the local API need an Expo/mobile origin.
  A signup request without `Origin` returned `403 MISSING_OR_NULL_ORIGIN`;
  adding `Origin: sequence://` matched the mobile trust path and allowed the
  disposable simulator-login account setup.
- Keep route-adjacent tests out of `src/app`; Expo Router can bundle route-local
  test files into Metro.
- When the local API is not available, production API overrides are acceptable
  for read-only `health.ping` proof. Do not use production for mutating flows
  unless the phase explicitly calls for throwaway production smoke testing.
- Metro/DevTools origin warnings can appear while the app is otherwise working;
  do not treat them as proof of a failed simulator loop without a failing screen
  or tool call.
- On this host, `expo start --dev-client --host localhost` listened only on
  IPv6 loopback (`[::1]:8081`) during the p04-t06 run, while the iOS simulator
  tried `127.0.0.1` and failed to fetch the bundle. LAN mode with the Mac's
  local IP was the stable simulator route.
- After adding Expo native modules, rebuild the dev client before retesting.
  Metro can show JS-level module fixes while the installed app still lacks the
  native module.
- After adding Worklets/Reanimated/Gesture Handler or changing their native
  integration, restart Metro with `--clear` after the rebuild. A stale bundle
  produced a Worklets JSI assertion crash until Metro was restarted and the app
  loaded a fresh bundle.
- Argent keyboard input can be flaky in secure fields; if a password submit
  returns a validation error after apparent entry, retap the field, clear the
  partial value, and retype before resubmitting.
- Argent `describe` is useful after keyboard entry because it exposes TextInput
  accessibility values and native prompts. In p10-t06 it confirmed email and
  password values before submit and exposed the iOS "Save Password?" sheet so
  the flow could dismiss `Not Now` before continuing.
- The Expo dev-client tools gear can overlap app controls near the top-right.
  For coordinate taps, prefer the left side of the app control or use a
  selector-driven tool when available. When screenshots include the gear,
  record it as a tooling artifact if the app surface itself remains visible.
- Argent `react-profiler-renders` can report "No render data found" even when
  the app and debugger component tree are available. For measured perf passes,
  use the explicit `react-profiler-start` → gesture/tap scenario →
  `react-profiler-stop` → `react-profiler-analyze` path, then drill with
  `profiler-commit-query` for specific components.
- Argent profiler annotations are easiest when you keep the start
  `startedAtEpochMs` and gesture `timestampMs` values. Pass
  `offsetMs = timestampMs - startedAtEpochMs` into `react-profiler-analyze` so
  hot commits line up with the user action.

## Evidence Captured So Far

- `/tmp/p02-t05-reboot-check.png` - `simctl` fallback screenshot showing the
  dev client home screen and `pong: true`.
- `/tmp/p02-t05-expo-mcp-screenshot.jpg` - Expo MCP screenshot showing the same
  home screen and ping result.
- `automation_find_view` on `home.ping` returned `exists: true`,
  `is_hittable: true`, and label `pong: true`.
- Expo MCP `collect_app_logs` returned markdown-formatted CDP and iOS simulator
  log sections through stdio. The same collector output appears through
  `expo-mcp --collect-logs`, which then exits as expected for one-shot mode.
- Argent `describe` returned the visible app tree with `Sequence Online` and
  `pong: true`, including normalized coordinates suitable for `gesture-tap`.
- Argent `native-describe-screen` returned `status: ok`, `screenFrame`
  `402x874`, and accessibility leaf elements for `Sequence Online`,
  `pong: true`, and the toolbar icon after an Argent boot/launch.
- Argent `gesture-tap` succeeded at the normalized `pong: true` tap point
  derived from `native-describe-screen`.
- p04-t06 simulator auth persistence evidence:
  `/tmp/p04-t06-signed-in.png`, `/tmp/p04-t06-after-restart.png`,
  `/tmp/p04-t06-after-logout.png`, and
  `/tmp/p04-t06-after-logout-relaunch.png`.
- p10-t06 both-theme visual pass evidence:
  `/tmp/p10-t06-dashboard-current.png`, `/tmp/p10-t06-dashboard-light.png`,
  `/tmp/p10-t06-create-light.png`, `/tmp/p10-t06-create-dark.png`,
  `/tmp/p10-t06-game-active-dark.png`, `/tmp/p10-t06-game-active-light.png`,
  `/tmp/p10-t06-history-light.png`, `/tmp/p10-t06-history-dark.png`,
  `/tmp/p10-t06-settings-system-dark.png`,
  `/tmp/p10-t06-settings-light-override.png`,
  `/tmp/p10-t06-settings-light-persisted-after-relaunch.png`,
  `/tmp/p10-t06-join-entry-dark.png`, `/tmp/p10-t06-join-entry-light.png`,
  `/tmp/p10-t06-join-preview-not-found-light.png`,
  `/tmp/p10-t06-join-preview-not-found-dark.png`,
  `/tmp/p10-t06-dev-index-dark.png`,
  `/tmp/p10-t06-dev-index-light-final.png`,
  `/tmp/p10-t06-dev-game-board-light.png`, and
  `/tmp/p10-t06-dev-game-board-dark.png`.
- p11-t02 game-surface perf evidence:
  `/tmp/p11-t02-react-profiler-report.md` and
  `/tmp/p11-t02-active-drag-profile.png`. Argent profiler captured 3 React
  commits over a 21.6s selected-card/drag session; the drag path produced no
  per-frame React commit cascade, and `profiler-commit-query` found no
  `BoardCell` renders in the hot commit.

## Candidate Skill Shape

- Scope the skill to local Expo MCP and simulator workflows, with Argent as a
  first-class companion rather than a last-resort fallback.
- Include a ready-to-run JSON-RPC stdio client snippet using newline-delimited
  messages.
- Include a launch/reboot helper for stable simulator setup.
- Include a troubleshooting matrix for no booted simulator, iOS deep-link
  prompts, slow screenshots, one-shot log collection, and `osascript`
  permission failures.
- Include a profiling recipe that starts React profiling, records gesture
  timestamps, analyzes with annotations, and uses commit-query to validate
  component-specific render scope.
- Include a "choose the fastest proof" section: use `automation_find_view` for
  selector proof, screenshots for visual proof, logs for runtime proof, and
  Argent tree/debugger tools when Expo MCP lacks native introspection.

## Open Questions

- Whether the simulator shutdown after successful Expo MCP calls is host-local,
  Expo MCP lifecycle behavior, or an iOS 26.5 simulator issue.
- Whether `collect_app_logs` remains reliable when invoked after Expo MCP
  screenshot/find/tap calls that may shut down the simulator.
- Whether Argent should become the default tap driver for iOS until Expo MCP
  `automation_tap` is more reliable in this project.
- Whether project-local Codex MCP reload behavior should be documented with a
  specific `codex mcp` command once the operator setup phase is reached.
