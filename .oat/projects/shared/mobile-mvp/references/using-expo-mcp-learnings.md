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
   EXPO_UNSTABLE_MCP_SERVER=1 pnpm --filter @sequence/mobile exec expo start --dev-client --host localhost --port 8081
   ```

2. Launch the installed dev client directly with `simctl launch` and an
   `--initialUrl`:

   ```bash
   xcrun simctl launch --terminate-running-process booted com.tkstang.sequenceonline --initialUrl 'exp+sequence-online://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081%3FdisableOnboarding%3D1&disableOnboarding=1'
   ```

3. Call `expo-mcp` as a stdio MCP server without `--collect-logs` for tool use:

   ```bash
   pnpm --filter @sequence/mobile exec expo-mcp --dev-server-url http://127.0.0.1:8081 --root apps/mobile --platform ios --app-id com.tkstang.sequenceonline
   ```

4. Use targeted selectors before screenshots when possible. `automation_find_view`
   returns fast structured proof: existence, label, frame, enabled state, and
   hittability for a `testID`.

5. Use screenshots for visual proof and artifact capture. Allow a long timeout;
   `automation_take_screenshot` can take more than a minute on this host.

6. Use Argent for gaps in Expo MCP, especially native accessibility tree reads,
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
- Keep route-adjacent tests out of `src/app`; Expo Router can bundle route-local
  test files into Metro.
- When the local API is not available, production API overrides are acceptable
  for read-only `health.ping` proof. Do not use production for mutating flows
  unless the phase explicitly calls for throwaway production smoke testing.
- Metro/DevTools origin warnings can appear while the app is otherwise working;
  do not treat them as proof of a failed simulator loop without a failing screen
  or tool call.

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

## Candidate Skill Shape

- Scope the skill to local Expo MCP and simulator workflows, with Argent as a
  first-class companion rather than a last-resort fallback.
- Include a ready-to-run JSON-RPC stdio client snippet using newline-delimited
  messages.
- Include a launch/reboot helper for stable simulator setup.
- Include a troubleshooting matrix for no booted simulator, iOS deep-link
  prompts, slow screenshots, one-shot log collection, and `osascript`
  permission failures.
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
