# @sequence/mobile

Expo SDK 57 iOS client for Sequence Online. Inherits the root `AGENTS.md`;
this file adds the mobile-specific command loop, simulator tooling, and
testID conventions.

## Commands

- `pnpm --filter @sequence/mobile start` - Expo dev server.
- `pnpm --filter @sequence/mobile ios` - local iOS dev build.
- `pnpm --filter @sequence/mobile test` - Jest via `jest-expo`.
- `pnpm --filter @sequence/mobile typecheck` - TypeScript.
- `pnpm --filter @sequence/mobile lint` - oxlint for mobile source/config.
- `pnpm --filter @sequence/mobile format` - oxfmt for mobile source/config.
- `pnpm format:check` - repo format gate, including mobile docs/config.

For local API-backed screens, start `pnpm --filter @sequence/api dev` first.
That command needs `packages/api/.env`; when it is absent, the home screen can
show a `health.ping` fetch error and the mobile tooling loop is still valid.

## Agent Loop

Run this loop as build -> launch -> screenshot -> drive by testID -> logs.

1. Build or reuse the dev client:
   - `pnpm --filter @sequence/mobile ios`
   - Generated `ios/`, `android/`, `.expo/`, and `expo-env.d.ts` are ignored
     build artifacts and must stay untracked.
2. Start Metro:
   - `EXPO_UNSTABLE_MCP_SERVER=1 pnpm --filter @sequence/mobile exec expo start --dev-client --host lan --port 8081`
3. Launch the installed dev build:
   - Preferred: use the Expo CLI prompt or QR/deep link.
   - Fallback when Expo CLI's Simulator activation path fails:
     `xcrun simctl launch --terminate-running-process booted com.tkstang.sequenceonline --initialUrl 'exp+sequence-online://expo-development-client/?url=http%3A%2F%2F<lan-ip>%3A8081%3FdisableOnboarding%3D1&disableOnboarding=1'`
   - Fallback for a deep link into an already-running app:
     `xcrun simctl openurl booted 'exp+sequence-online://expo-development-client/?url=http%3A%2F%2F<lan-ip>%3A8081%3FdisableOnboarding%3D1&disableOnboarding=1'`
   - Prefer `launch --initialUrl` over `openurl` for startup; `openurl` can
     surface the iOS "Open in Sequence Online?" confirmation prompt.
   - Replace `<lan-ip>` with the LAN URL printed by Expo when Metro starts.
4. See the app:
   - Expo MCP local tool: `automation_take_screenshot`.
   - Argent tool: `screenshot`.
   - Fallback: `xcrun simctl io booted screenshot /tmp/mobile.png`.
5. Drive the app:
   - Expo MCP local tool: `automation_tap` with `testID` whenever available.
   - Expo MCP local tool: `automation_find_view` to inspect a named testID.
   - Argent tools: `describe`, `native-describe-screen`, `await-ui-element`,
     `gesture-tap`, and gesture tools for flows that need native inspection.
   - Fallback: Orca computer-use only when MCP tools are unavailable or a flow
     has no stable selector yet.
6. Inspect runtime behavior:
   - Expo MCP local tool: `collect_app_logs`.
   - Expo MCP local tool: `open_devtools` for React Native DevTools.
   - Expo MCP local tool: `expo_router_sitemap` for route inventory.
   - Argent tools: `debugger-status`, `debugger-log-registry`,
     `debugger-component-tree`, and profiler tools for performance work.

## MCP Tooling

Project MCP config lives at `../../.mcp.json`.

- Remote Expo MCP: `expo` uses HTTP transport at `https://mcp.expo.dev/mcp`.
  OAuth is per-user and optional before Phase 12; do not block simulator work on
  it.
- Local Expo MCP: `expo-mcp` is a mobile dev dependency. Start it against the
  running Metro server when the host does not auto-wire local tools:
  `pnpm --filter @sequence/mobile exec expo-mcp --dev-server-url http://127.0.0.1:8081 --root apps/mobile --platform ios --app-id com.tkstang.sequenceonline`.
  Omit `--collect-logs` for long-lived MCP server mode; that flag is a
  one-shot log collector that prints logs and exits.
  When scripting the local stdio server directly, use newline-delimited
  JSON-RPC messages.
- Argent: `.mcp.json` starts `npx -y @swmansion/argent mcp`. Argent needs an
  installed dev build for native screen inspection and profiling; use
  `npx -y @swmansion/argent tools` to list the current tool surface. Browser or
  Expo Go sessions are not enough for the native/profiler loop. For native
  devtools-backed inspection, boot through `boot-device` and start the app with
  `launch-app` / `restart-app`; `native-describe-screen` can return
  `restart_required` when the app was launched outside Argent.

## testID Convention

Use `screen.element[.qualifier]`.

- Build IDs with `testId()` from `src/test/test-ids.ts`.
- Current examples: `home.ping`, `board.cell.1AC`, `hand.card.JH`,
  `lobby.start`.
- Interactive elements that an agent must find should expose a stable `testID`
  and, where applicable, an `accessibilityLabel` / `accessibilityRole`.
- Keep tests outside `src/app`; Expo Router route-local tests can be bundled by
  Metro.

## Guardrails

- Import relative local modules with explicit `.ts` / `.tsx` extensions and use
  `import type` for type-only imports. This is stricter than typical Expo
  examples because the API package runs native `.ts` files directly under
  `verbatimModuleSyntax`.
- Do not import Fastify, database, server runtime code, DOM-only APIs, or React
  web-only code into the mobile runtime.
- Keep Expo MCP, Argent, simulator utilities, and any `/dev` routes
  development-only. They should not be runtime imports or shipped surfaces.
- Do not commit generated native folders, Expo local state, local env files, or
  simulator screenshots.

## References

- `README.md` - workspace quick reference.
- `../../docs/development.md` - repo-wide local workflows.
- `../../docs/configuration.md` - environment variables.
- `../../docs/mobile-operator-runbook.md` - operator-only account, signing,
  TestFlight, physical-device, and production-smoke steps.
