---
oat_status: complete
oat_ready_for: oat-project-implement
oat_blockers: []
oat_last_updated: 2026-07-04
oat_phase: plan
oat_phase_status: complete
oat_plan_hill_phases: ['p12']
oat_auto_review_at_hill_checkpoints: true
oat_plan_parallel_groups: [] # groups of phases that run concurrently in worktrees; [] = fully sequential
oat_plan_source: spec-driven # spec-driven | quick | imported
oat_import_reference: null
oat_import_source_path: null
oat_import_provider: null
oat_generated: false
oat_template: false
---

# Implementation Plan: mobile-mvp

> Execute this plan using `oat-project-implement` — sequential by default, parallel when `oat_plan_parallel_groups` is declared.

**Goal:** Full web-parity Sequence Online client for iOS (Expo SDK 57), delivered to TestFlight, with first-class agentic tooling — Phases 1–11 agent-executable and simulator-verifiable, Phase 12 the single operator phase.

**Architecture:** `apps/mobile` renders the existing server-authoritative tRPC contract (snapshot-first subscription, version-guarded mutations). Hybrid styling: React Strict DOM + shared tokens for chrome, plain RN + Reanimated for the game surface. Two extracted shared packages: `@sequence/design-tokens`, `@sequence/client-state`. Additive-only API changes (Better Auth `expo()` plugin, `game.join` guest-token flag).

**Tech Stack:** Expo SDK 57 (RN 0.86, React 19.2, New Arch), expo-router, React Compiler, react-strict-dom (pinned), @trpc/tanstack-react-query + TanStack Query v5 (wsLink subscriptions), @better-auth/expo + expo-secure-store, react-native-svg(+transformer), Reanimated 4.5 / gesture-handler 2.32, jest-expo + @testing-library/react-native, oxlint/oxfmt.

**Commit Convention:** `{type}(p{NN}-t{NN}): {description}` — e.g., `feat(p01-t03): prove game-logic imports under Metro`

## Planning Checklist

- [x] Defer HiLL checkpoint confirmation to oat-project-implement
- [x] Evaluated phases for parallelism opportunities
- [x] Set `oat_plan_parallel_groups` in frontmatter (`[]` — every phase touches `apps/mobile` shared files: package.json, `_layout.tsx`, navigation; no safely disjoint pairs)

---

## Conventions Used Throughout This Plan

- **Mobile test runs:** `pnpm --filter @sequence/mobile exec jest <path>` (jest-expo; scoped to the named file).
- **Package test runs:** `pnpm --filter <pkg> exec vitest run <path>` (Vitest packages: client-state, design-tokens, api, web).
- **Simulator loop:** `pnpm --filter @sequence/mobile ios` (dev build) / `pnpm --filter @sequence/mobile start` (Metro); screenshots via `xcrun simctl io booted screenshot <file>` or expo-mcp/Argent tools; deep links via `xcrun simctl openurl booted <url>`.
- **Local API:** `pnpm --filter @sequence/api dev` (requires `packages/api/.env`); web client for two-client tests: `pnpm --filter @sequence/web dev`.
- **Gates (root):** `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`.
- **API integration tests require `DATABASE_URL_TEST`:** the API suites self-skip without it (`describeIntegration`). Any task verifying via the API harness must run with `DATABASE_URL_TEST` set and confirm the suites actually executed (non-zero test count in vitest output) — a skipped suite is NOT a passing verification.
- **Scenario/verification tasks** (Files: none): commit only if fixes landed during the scenario; when clean, record the evidence in `implementation.md` and skip the git commit step — do not create empty commits.
- **Imports:** explicit `.ts`/`.tsx` extensions + `import type` everywhere (verbatimModuleSyntax); `AppRouter` type-only.
- **testIDs:** `screen.element[.qualifier]` per the convention doc (p02-t02) — e.g. `board.cell.1AC`, `hand.card.JH`, `lobby.start`.
- Verification steps that say "screenshot-verify" mean: capture via the agent loop and visually confirm the stated expectation.

---

## Phase 1: Foundation

Workspace exists, boots on the iOS Simulator, and the monorepo seams are proven.

### Task p01-t01: Scaffold @sequence/mobile Expo workspace

**Files:**

- Create: `apps/mobile/package.json`, `apps/mobile/app.config.ts`, `apps/mobile/tsconfig.json`, `apps/mobile/src/app/_layout.tsx`, `apps/mobile/src/app/index.tsx`, `apps/mobile/.gitignore`
- Modify: `pnpm-workspace.yaml` (already `apps/*` — verify only)

**Step 1: Implement**

Expo SDK 57 app named `@sequence/mobile`: `main: "expo-router/entry"`, scheme `sequence`, iOS bundle id `com.tkstang.sequenceonline`, display name "Sequence Online", New Arch (default), `src/app` router root, React Compiler experiment on. Scripts: `start`, `ios`, `test`, `typecheck`, `lint`, `format`. `.gitignore`: `ios/`, `android/`, `.expo/` (CNG — native dirs are build artifacts). Placeholder home screen renders "Sequence Online".

**Step 2: Verify**

Run: `pnpm install && pnpm --filter @sequence/mobile exec expo config --type public | head -20`
Expected: install clean; config resolves with scheme `sequence`, `com.tkstang.sequenceonline`.

**Step 3: Commit**

```bash
git add apps/mobile pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat(p01-t01): scaffold @sequence/mobile Expo SDK 57 workspace"
```

### Task p01-t02: Metro, TypeScript, and lint/format wiring

**Files:**

- Create: `apps/mobile/metro.config.js`, `apps/mobile/babel.config.js`
- Modify: `apps/mobile/tsconfig.json` (extends `tsconfig.base.json`; jsx/react-native settings)

**Step 1: Implement**

`expo/metro-config` defaults (monorepo auto-config, SDK 55+ autolinking resolution). Babel: `babel-preset-expo` only (RSD preset added in p03-t03). Confirm oxlint/oxfmt cover `apps/mobile` from the root config.

**Step 2: Verify**

Run: `pnpm --filter @sequence/mobile typecheck && pnpm --filter @sequence/mobile lint && pnpm format:check`
Expected: all pass on the scaffold.

**Step 3: Commit**

```bash
git add apps/mobile
git commit -m "chore(p01-t02): metro/babel/ts/lint wiring for mobile workspace"
```

### Task p01-t03: Shared-import spike — game-logic + AppRouter under Metro

**Files:**

- Create: `apps/mobile/src/app/spike.tsx` (temporary route, removed p01-t08)
- Modify: `apps/mobile/package.json` (workspace deps `@sequence/game-logic`, `@sequence/api`)

**Step 1: Implement**

Spike screen imports `BOARD_MAP`, `ALL_POSITIONS` from `@sequence/game-logic` (explicit-extension internal imports exercised transitively) and `import type { AppRouter } from '@sequence/api'`; renders board dimensions + position count. This is the de-risking gate for Metro vs the repo's explicit-`.ts`-extension convention.

**Step 2: Verify**

Run: `pnpm --filter @sequence/mobile exec expo export --platform ios --output-dir /tmp/mobile-export-spike`
Expected: bundle succeeds (no resolution errors). If it fails: apply the Metro `resolveRequest` shim for explicit-`.ts` specifiers (design contingency) before proceeding — this task does not complete until the export is green.

**Step 3: Commit**

```bash
git add apps/mobile
git commit -m "feat(p01-t03): prove game-logic + AppRouter imports under Metro"
```

### Task p01-t04: jest-expo + Testing Library setup

**Files:**

- Create: `apps/mobile/jest.config.js`, `apps/mobile/src/test/setup.ts`, `apps/mobile/src/app/index.test.tsx`

**Step 1: Write test (RED)**

`index.test.tsx`: renders home screen, asserts "Sequence Online" text via `@testing-library/react-native`. Fails until config lands.

**Step 2: Implement (GREEN)**

`jest-expo` preset, setup file with Testing Library config, `transformIgnorePatterns` covering Expo/RN/RSD packages.

Run: `pnpm --filter @sequence/mobile exec jest src/app/index.test.tsx`
Expected: 1 passing.

**Step 3: Verify**

Run: `pnpm --filter @sequence/mobile test`
Expected: suite green.

**Step 4: Commit**

```bash
git add apps/mobile
git commit -m "test(p01-t04): jest-expo + testing-library setup with first component test"
```

### Task p01-t05: Root gate integration

**Files:**

- Modify: root `package.json` (ensure `typecheck`/`lint`/`format:check`/`test` include the mobile workspace), `scripts/run-tests.mjs` (root test orchestrator — spawn mobile Jest alongside Vitest), `vitest.workspace.ts` (exclude `apps/mobile` — it runs Jest)

**Step 1: Implement**

Root `pnpm test` (`node scripts/run-tests.mjs`) orchestrates Vitest workspaces AND `@sequence/mobile` Jest. Vitest workspace must not pick up mobile files.

**Step 2: Verify**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`
Expected: all green, mobile included (visible in output).

**Step 3: Commit**

```bash
git add package.json vitest.workspace.ts scripts/run-tests.mjs
git commit -m "chore(p01-t05): include mobile workspace in root quality gates"
```

### Task p01-t06: First dev build boots on the simulator

**Files:**

- Modify: `apps/mobile/package.json` (`expo-dev-client` dependency)

**Step 1: Implement**

Add `expo-dev-client`; run CNG prebuild + local dev build against a booted simulator.

**Step 2: Verify**

Run: `pnpm --filter @sequence/mobile ios` (wraps `expo run:ios`)
Expected: app installs + launches on the simulator showing the home screen. Screenshot-verify via `xcrun simctl io booted screenshot /tmp/p01-t06-boot.png`. Confirm `ios/` remains untracked (`git status --porcelain | grep -c apps/mobile/ios` → 0).

**Step 3: Commit**

```bash
git add apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(p01-t06): dev-client build boots on iOS simulator"
```

### Task p01-t07: health.ping screen via minimal tRPC client

**Files:**

- Create: `apps/mobile/src/api/client.ts`, `apps/mobile/src/api/env.ts`, `apps/mobile/src/api/env.test.ts`
- Modify: `apps/mobile/src/app/index.tsx`, `apps/mobile/package.json` (`@trpc/client`, `@trpc/tanstack-react-query`, `@tanstack/react-query`), `apps/mobile/app.config.ts` (`extra.apiUrl`/`extra.wsUrl` defaults `http://localhost:3001`/`ws://localhost:3001`)

**Step 1: Write test (RED)**

`env.test.ts` (jest): env module resolves `apiUrl`/`wsUrl` from expo-constants extra with localhost defaults.

**Step 2: Implement (GREEN)**

`createTRPCContext` pattern with `httpBatchLink` only (no auth yet, `credentials: 'omit'`); QueryClient provider in `_layout.tsx`; home screen shows `health.ping` result (`pong: true`) with a `home.ping` testID.

**Step 3: Verify**

Run: local API up, then `pnpm --filter @sequence/mobile ios`; screenshot-verify pong renders. Scoped test: `pnpm --filter @sequence/mobile exec jest src/api/env.test.ts`.
Expected: pong visible; test green.

**Step 4: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(p01-t07): tRPC http client + health.ping smoke screen"
```

### Task p01-t08: Workspace doc stubs + spike cleanup

**Files:**

- Create: `apps/mobile/README.md`
- Delete: `apps/mobile/src/app/spike.tsx`

**Step 1: Implement**

README: purpose, commands, dev workflow pointer (full docs land p11-t06). Remove the p01-t03 spike route (its lesson is now encoded in metro config/README).

**Step 2: Verify**

Run: `pnpm --filter @sequence/mobile test && pnpm --filter @sequence/mobile typecheck`
Expected: green; no spike route in router.

**Step 3: Commit**

```bash
git add apps/mobile
git commit -m "docs(p01-t08): mobile README stub; remove import spike route"
```

---

## Phase 2: Agent Tooling

The agent loop works before feature work begins (FR17); the operator runbook is born (FR19).

### Task p02-t01: MCP configuration + expo-mcp local tools

**Files:**

- Create: `.mcp.json` (project scope)
- Modify: `apps/mobile/package.json` (`expo-mcp` dev dependency)

**Step 1: Implement**

`.mcp.json` entries: `expo` (HTTP transport → `https://mcp.expo.dev/mcp`; OAuth is per-user and optional pre-Phase-12) and `argent` (stdio: `npx @swmansion/argent`). Add `expo-mcp` dev dep so the dev server exposes local tools (screenshot, tap-by-testID, RN DevTools, logs).

**Step 2: Verify**

Run: `pnpm install`; start dev server; confirm expo-mcp local tools respond (screenshot of the running app via the local tool).
Expected: screenshot produced by the MCP tool, not simctl.

**Step 3: Commit**

```bash
git add .mcp.json apps/mobile/package.json pnpm-lock.yaml
git commit -m "feat(p02-t01): commit Expo MCP + Argent config and expo-mcp local tools"
```

### Task p02-t02: testID convention + identifier helper

**Files:**

- Create: `apps/mobile/src/test/test-ids.ts`, `apps/mobile/src/test/test-ids.test.ts`

**Step 1: Write test (RED)**

`testId('board', 'cell', '1AC')` → `board.cell.1AC`; rejects empty segments.

**Step 2: Implement (GREEN)**

Tiny helper + typed screen-name union; retrofit `home.ping` usage.

Run: `pnpm --filter @sequence/mobile exec jest src/test/test-ids.test.ts`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p02-t02): testID convention helper"
```

### Task p02-t03: apps/mobile/AGENTS.md — the agent loop

**Files:**

- Create: `apps/mobile/AGENTS.md`, symlink `apps/mobile/CLAUDE.md → AGENTS.md`

**Step 1: Implement**

Document: build/run/test commands; the loop (build → launch → screenshot → drive-by-testID → logs) with expo-mcp/Argent tool names; testID convention; Argent-needs-dev-build note; fallbacks (`simctl` screenshots/openurl, Orca computer-use); dev-only guardrails; import-convention delta.

**Step 2: Verify**

Run: `pnpm format:check`; manual read-through against the design's Agent Tooling section.
Expected: every FR17 deliverable has a documented command.

**Step 3: Commit**

```bash
git add apps/mobile/AGENTS.md apps/mobile/CLAUDE.md
git commit -m "docs(p02-t03): mobile agent-loop instructions (AGENTS.md)"
```

### Task p02-t04: Operator runbook scaffold

**Files:**

- Create: `docs/mobile-operator-runbook.md`
- Modify: `docs/index.md` (Operations section link)

**Step 1: Implement**

Runbook per design structure with sections 0–7 scaffolded; author now: §0 Local machine setup (Xcode install/license/first-launch/`downloadPlatform iOS` — as performed 2026-07-02) and §1 Expo account + optional MCP OAuth (as performed). Mark §2–§7 "authored by the phase that discovers the need; executed in Phase 12". Each section: Why / When / Prerequisites / Steps / Verify / Troubleshooting.

**Step 2: Verify**

Run: `pnpm format:check`; `docs/index.md` Contents updated.
Expected: green; runbook discoverable from the index.

**Step 3: Commit**

```bash
git add docs/mobile-operator-runbook.md docs/index.md
git commit -m "docs(p02-t04): operator runbook scaffold with machine + Expo sections (FR19)"
```

### Task p02-t05: FR17 agent-loop demo + evidence

**Files:**

- Modify: `apps/mobile/AGENTS.md` (append fixes if gaps found)

**Step 1: Implement**

Execute the documented loop end-to-end as an agent, no operator: dev build → launch → expo-mcp screenshot → tap `home.ping` by testID → read app logs → Argent a11y-tree read. Fix any doc/config gaps discovered.

**Step 2: Verify**

Expected: each FR17 acceptance criterion demonstrably satisfied; evidence (screenshot paths, tool outputs) noted in `implementation.md` for this task.

**Step 3: Commit**

```bash
git add apps/mobile/AGENTS.md
git commit -m "docs(p02-t05): verify FR17 agent loop end-to-end"
```

---

## Phase 3: Tokens, Theming, Chrome Kit

Shared design language on both platforms (FR16, FR15 foundation); RSD spike gate.

### Task p03-t01: packages/design-tokens

**Files:**

- Create: `packages/design-tokens/package.json`, `packages/design-tokens/src/index.ts`, `packages/design-tokens/src/palette.ts`, `packages/design-tokens/src/dimensions.ts`, `packages/design-tokens/src/palette.test.ts`

**Step 1: Write test (RED)**

Vitest: `palette.light` and `palette.dark` share an identical key set (compile-time union + runtime assertion); dimension groups export expected keys (space/radius/fontSize/fontWeight/lineHeight/zIndex/fontFamily).

**Step 2: Implement (GREEN)**

Extract raw values verbatim from `apps/web/src/styles/tokens.stylex.ts` + `themes.stylex.ts` (values move, never change). `ColorToken` union typed so both palettes must define every key.

Run: `pnpm --filter @sequence/design-tokens exec vitest run src/palette.test.ts`
Expected: green.

**Step 3: Commit**

```bash
git add packages/design-tokens pnpm-lock.yaml
git commit -m "feat(p03-t01): framework-free @sequence/design-tokens package"
```

### Task p03-t02: Web consumes design-tokens (value-identical)

**Files:**

- Modify: `apps/web/src/styles/tokens.stylex.ts`, `apps/web/src/styles/themes.stylex.ts`, `apps/web/package.json`

**Step 1: Implement**

`defineVars`/`createTheme` values sourced from `@sequence/design-tokens` imports. Verify StyleX static evaluation of the cross-package import (shareable-tokens recipe / `unstable_moduleResolution`); if the compiler balks, fall back to the design's codegen contingency (script emits the `.stylex.ts` files from the package) — same source of truth either way.

**Step 2: Verify**

Run: `pnpm --filter @sequence/web build && pnpm --filter @sequence/web test && pnpm typecheck`
Expected: green. Screenshot `/dev` playground (light + dark) and compare against pre-change captures — visually identical.

**Step 3: Commit**

```bash
git add apps/web packages/design-tokens pnpm-lock.yaml
git commit -m "refactor(p03-t02): web StyleX themes consume @sequence/design-tokens"
```

### Task p03-t03: RSD spike + sign-off gate

**Files:**

- Create: `apps/mobile/src/theme/vars.css.ts` (minimal), `apps/mobile/src/app/rsd-spike.tsx` (temporary)
- Modify: `apps/mobile/babel.config.js` (`react-strict-dom/babel-preset`), `apps/mobile/package.json` (`react-strict-dom` pinned exact)

**Step 1: Implement**

Minimal RSD screen: `html.div`/`html.span` + `css.create` + two `css.defineVars` tokens with a `prefers-color-scheme` dark value; `data-layoutconformance="strict"` on root. Boot on simulator; flip appearance (`xcrun simctl ui booted appearance dark`).

**Step 2: Verify**

Run: `pnpm --filter @sequence/mobile ios`; screenshot light + dark.
Expected: RSD renders; dark values apply. **Decision gate:** record PASS → continue; FAIL → STOP and surface to the user before invoking the pre-agreed Unistyles fallback.

**Step 3: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(p03-t03): react-strict-dom spike passes on SDK 57 (sign-off)"
```

### Task p03-t04: Full token vars + ThemeProvider + useTheme

**Files:**

- Create: `apps/mobile/src/theme/theme-provider.tsx`, `apps/mobile/src/theme/use-theme.ts`, `apps/mobile/src/theme/theme-provider.test.tsx`
- Modify: `apps/mobile/src/theme/vars.css.ts` (full token wrap), `apps/mobile/src/app/_layout.tsx`, `apps/mobile/package.json` (`@react-native-async-storage/async-storage`)
- Delete: `apps/mobile/src/app/rsd-spike.tsx`

**Step 1: Write test (RED)**

Provider test: mode persists to AsyncStorage key `sequence-theme`; `system` follows `Appearance`; manual override calls `Appearance.setColorScheme`; `useTheme()` returns `{ mode, scheme, colors }` with safe fallback (mirrors web's provider-less behavior).

**Step 2: Implement (GREEN)**

`vars.css.ts` wraps all design-token colors via `css.defineVars` (dark via in-definition media); ThemeProvider per design.

Run: `pnpm --filter @sequence/mobile exec jest src/theme/theme-provider.test.tsx`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(p03-t04): RSD token vars + ThemeProvider with persisted override"
```

### Task p03-t05: Chrome kit — Button + TextField

**Files:**

- Create: `apps/mobile/src/components/Button.tsx`, `apps/mobile/src/components/TextField.tsx`, `+ .test.tsx` for each

**Step 1: Write test (RED)**

Render + press/change handlers + disabled state + testID passthrough; styling-agnostic public API (fallback-proofing per design).

**Step 2: Implement (GREEN)**

RSD `html.*` + `css.create` over token vars; variants (primary/secondary/destructive), sizes.

Run: `pnpm --filter @sequence/mobile exec jest src/components/Button.test.tsx src/components/TextField.test.tsx`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/components
git commit -m "feat(p03-t05): RSD chrome kit — Button, TextField"
```

### Task p03-t06: Chrome kit — Card, Badge, Screen scaffold

**Files:**

- Create: `apps/mobile/src/components/Card.tsx`, `Badge.tsx`, `Screen.tsx`, `+ .test.tsx` each

**Step 1: Write test (RED) → Step 2: Implement (GREEN)**

Same pattern as p03-t05. `Screen`: safe-area-aware scaffold (header slot, scroll option) used by every chrome route.

Run: `pnpm --filter @sequence/mobile exec jest src/components`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/components
git commit -m "feat(p03-t06): RSD chrome kit — Card, Badge, Screen"
```

### Task p03-t07: Dev playground scaffold + kit stories

**Files:**

- Create: `apps/mobile/src/app/dev/_layout.tsx`, `apps/mobile/src/app/dev/index.tsx`, `apps/mobile/src/app/dev/[story].tsx`, `apps/mobile/src/dev/stories.ts`, `apps/mobile/src/app/dev/_layout.test.tsx`

**Step 1: Write test (RED)**

`_layout` renders null (routes unregistered) when `__DEV__` is false (mocked).

**Step 2: Implement (GREEN)**

Dev-only route group; story registry lists kit components with fixture props; in-playground theme toggle. Minimal per design (list + detail).

**Step 3: Verify**

Run: dev build → `xcrun simctl openurl booted "sequence:///dev"`; screenshot stories. Jest: `pnpm --filter @sequence/mobile exec jest src/app/dev/_layout.test.tsx`.
Expected: playground reachable in dev; prod-mode test green.

**Step 4: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p03-t07): dev-only playground with chrome kit stories"
```

### Task p03-t08: Both-scheme visual verification

**Files:** none (verification task; fixes land in the components they touch)

**Step 1: Implement**

Agent loop: screenshot every kit story light + dark (`simctl ui appearance`); fix any unreadable/missing token usage inline.

**Step 2: Verify**

Expected: FR16 propagation check — add a scratch token in `design-tokens`, confirm typecheck forces both palettes and both platforms can consume it; then revert scratch. Evidence noted in implementation.md.

**Step 3: Commit**

```bash
git add -u apps/mobile packages/design-tokens
git commit -m "test(p03-t08): both-scheme kit verification + token propagation check"
```

---

## Phase 4: Auth Vertical Slice

Riskiest seam first: sessions on device storage (FR1), simulator-verified.

### Task p04-t01: API — Better Auth expo() plugin + trustedOrigins

**Files:**

- Modify: `packages/api/src/user/auth.ts`, `packages/api/package.json` (`@better-auth/expo`)
- Create: `packages/api/src/user/auth-expo.test.ts`

**Step 1: Write test (RED)**

Integration test (existing harness): auth config registers the expo plugin; `trustedOrigins` includes `sequence://` always and `exp://` wildcard only when `NODE_ENV !== 'production'`.

**Step 2: Implement (GREEN)**

Add `expo()` plugin + origins per design. No other server changes.

Run: `pnpm --filter @sequence/api exec vitest run src/user/auth-expo.test.ts` (with `DATABASE_URL_TEST` set)
Expected: green with a non-zero executed-test count (not skipped); then `pnpm --filter @sequence/api test` unaffected.

**Step 3: Commit**

```bash
git add packages/api pnpm-lock.yaml
git commit -m "feat(p04-t01): Better Auth expo plugin + native trustedOrigins"
```

### Task p04-t02: Mobile auth client + SecureStore session

**Files:**

- Create: `apps/mobile/src/auth/client.ts`, `apps/mobile/src/auth/client.test.ts`
- Modify: `apps/mobile/package.json` (`better-auth`, `@better-auth/expo`, `expo-secure-store` — better-auth version locked to the API's)

**Step 1: Write test (RED)**

Client config test: expoClient plugin wired with SecureStore storage, storage keys using only `[A-Za-z0-9._-]`; baseURL from env module.

**Step 2: Implement (GREEN)**

`createAuthClient` + `expoClient` per Better Auth docs; export `useSession`, `signIn`, `signUp`, `signOut`, `getCookie`.

Run: `pnpm --filter @sequence/mobile exec jest src/auth/client.test.ts`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(p04-t02): Better Auth expo client with SecureStore sessions"
```

### Task p04-t03: Cookie-header transport in tRPC client

**Files:**

- Create: `apps/mobile/src/api/cookies.ts`, `apps/mobile/src/api/cookies.test.ts`
- Modify: `apps/mobile/src/api/client.ts`

**Step 1: Write test (RED)**

`buildCookieHeader()`: session-only → Better Auth cookie string; with `gameId` whose guest token exists → merged `; sequence_guest=<token>`; neither → undefined. (Guest store stubbed until p06-t05.)

**Step 2: Implement (GREEN)**

`httpBatchLink` `headers()` uses `buildCookieHeader`; `credentials: 'omit'` everywhere.

Run: `pnpm --filter @sequence/mobile exec jest src/api/cookies.test.ts`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/api
git commit -m "feat(p04-t03): explicit cookie-header transport for tRPC"
```

### Task p04-t04: Login/signup/logout + protected routing

**Files:**

- Create: `apps/mobile/src/app/(auth)/login.tsx`, `apps/mobile/src/app/(auth)/signup.tsx`, `+ .test.tsx` each
- Modify: `apps/mobile/src/app/_layout.tsx` (Stack.Protected guards per session state), `apps/mobile/src/app/index.tsx` (authed placeholder + logout)

**Step 1: Write test (RED)**

Screen tests: field validation, submit calls authClient, error rendering (bad credentials), testIDs (`auth.login.email` etc.). Routing test: unauthenticated state exposes only auth routes.

**Step 2: Implement (GREEN)**

RSD kit forms; `Stack.Protected` guard on session; logout returns to login.

Run: `pnpm --filter @sequence/mobile exec jest "src/app/(auth)"`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/app
git commit -m "feat(p04-t04): login/signup screens with protected routing"
```

### Task p04-t05: Session probe + central error policy

**Files:**

- Create: `apps/mobile/src/api/error-policy.ts`, `apps/mobile/src/api/error-policy.test.ts`
- Modify: `apps/mobile/src/app/index.tsx` (renders `health.me` email; UNAUTHORIZED → login redirect)

**Step 1: Write test (RED)**

Error-policy unit: UNAUTHORIZED → `redirect-login`; FORBIDDEN → `not-participant`; TOO_MANY_REQUESTS → `backoff-toast`; CONFLICT → `refetch-feedback`; BAD_REQUEST+ruleViolation → `violation:<code>` passthrough.

**Step 2: Implement (GREEN)**

Central mapper used by all screens (realtime usage lands p05/p07).

Run: `pnpm --filter @sequence/mobile exec jest src/api/error-policy.test.ts`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p04-t05): health.me probe + central tRPC error policy"
```

### Task p04-t06: Session persistence scenario (simulator)

**Files:** none (scenario task; fixes land where they belong)

**Step 1: Implement**

Against local API: sign up → verify `health.me` → `xcrun simctl terminate booted com.tkstang.sequenceonline` → relaunch → still authenticated without spinner-block (cached session) → authed call works → logout clears → relaunch stays logged out.

**Step 2: Verify**

Expected: FR1 criteria pass on simulator; timings + screenshots recorded in implementation.md. Any SecureStore key/size issue fixed now (known Better Auth rough edge).

**Step 3: Commit**

```bash
git add -u apps/mobile
git commit -m "test(p04-t06): session persistence scenario verified on simulator"
```

### Task p04-t07: Phase gate sweep + configuration docs

**Files:**

- Modify: `docs/configuration.md` (mobile env rows), `docs/mobile-operator-runbook.md` (note discovered operator steps, if any)

**Step 1: Implement**

Document `extra.apiUrl`/`extra.wsUrl` and mobile env model; run full root gates.

**Step 2: Verify**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`
Expected: all green including API suite with expo plugin.

**Step 3: Commit**

```bash
git add docs
git commit -m "docs(p04-t07): configuration + runbook updates for auth slice"
```

---

## Phase 5: Realtime Plumbing + Client-State Extraction

Live game data flows end-to-end with the NFR2 timing contract.

### Task p05-t01: Extract @sequence/client-state

**Files:**

- Create: `packages/client-state/package.json`, `packages/client-state/src/index.ts`, `packages/client-state/src/game-state.ts` (moved), `packages/client-state/src/game-state.test.ts` (moved), `packages/client-state/src/violation-messages.ts`, `packages/client-state/src/violation-messages.test.ts`, `packages/client-state/src/fixtures.ts` (moved/adapted from web `game-fixtures.ts`)

**Step 1: Write test (RED)**

Moved Vitest suite runs in the new package; new test: violation catalog maps **all 13** `RuleViolation` codes to user strings (assert against the game-logic union so a new code fails the build).

**Step 2: Implement (GREEN)**

Move `apps/web/src/app/game/[id]/components/game-state.ts` (+tests) verbatim; extract the violation-code → message map from web components into `violation-messages.ts`. Framework-free (game-logic types only).

Run: `pnpm --filter @sequence/client-state exec vitest run`
Expected: green.

**Step 3: Commit**

```bash
git add packages/client-state pnpm-lock.yaml
git commit -m "feat(p05-t01): extract @sequence/client-state (view model + violation catalog)"
```

### Task p05-t02: Web consumes client-state

**Files:**

- Modify: `apps/web/src/app/game/[id]/**` (imports → `@sequence/client-state`), `apps/web/package.json`
- Delete: `apps/web/src/app/game/[id]/components/game-state.ts`, its test, `game-fixtures.ts` (now re-exported from the package)

**Step 1: Implement**

Mechanical import swap; `/dev` playground fixtures import from the package. No behavior change.

**Step 2: Verify**

Run: `pnpm --filter @sequence/web test && pnpm --filter @sequence/web build && pnpm typecheck`
Expected: green — the moved tests plus untouched web suites are the regression net.

**Step 3: Commit**

```bash
git add apps/web packages/client-state pnpm-lock.yaml
git commit -m "refactor(p05-t02): web imports game state from @sequence/client-state"
```

### Task p05-t03: AuthedWebSocket + wsLink split transport

**Files:**

- Create: `apps/mobile/src/api/ws.ts`, `apps/mobile/src/api/ws.test.ts`, `apps/mobile/src/realtime/timing.ts` (contract constants — owned here)
- Modify: `apps/mobile/src/api/client.ts` (splitLink: subscription → wsLink, else httpBatchLink)

**Step 1: Write test (RED)**

`AuthedWebSocket` passes `{ headers: { Cookie } }` as the RN WebSocket options arg (constructor spy); wsLink config exposes the timing contract constants: `keepAlive { enabled, intervalMs: 5000, pongTimeoutMs: 2000 }`, `retryDelayMs` exponential 250→5000ms, `lazy { enabled: true, closeMs: 30000 }`.

**Step 2: Implement (GREEN)**

Per design; contract constants exported from one module (`src/realtime/timing.ts`) so tests and docs share them.

Run: `pnpm --filter @sequence/mobile exec jest src/api/ws.test.ts`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p05-t03): cookie-authed wsLink transport with timing contract"
```

### Task p05-t04: useGameStream — subscription + reducer integration

**Files:**

- Create: `apps/mobile/src/realtime/use-game-stream.ts`, `apps/mobile/src/realtime/use-game-stream.test.tsx`

**Step 1: Write test (RED)**

With a scripted stream (mocked subscription): snapshot item initializes view; events apply via `applyStreamItem`; `lastEventId` tracks applied `seq`; `connectionState` transitions `connecting → live`; resubscribe passes tracked `lastEventId`.

**Step 2: Implement (GREEN)**

Hook per design (`{ view, connectionState }`); consumes `@sequence/client-state`.

Run: `pnpm --filter @sequence/mobile exec jest src/realtime/use-game-stream.test.tsx`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/realtime
git commit -m "feat(p05-t04): useGameStream with snapshot-first event application"
```

### Task p05-t05: AppState lifecycle + inactivity watchdog

**Files:**

- Create: `apps/mobile/src/realtime/lifecycle.ts`, `apps/mobile/src/realtime/lifecycle.test.ts`, `apps/mobile/src/lib/logger.ts` (thin logger module per design — console-backed, strip-safe)
- Modify: `apps/mobile/src/realtime/use-game-stream.ts`, `apps/mobile/src/realtime/timing.ts` (watchdog ceiling constant)

**Step 1: Write test (RED)**

Fake timers: AppState `background→active` forces liveness check + resubscribe when socket closed/errored; watchdog fires teardown+resubscribe at the ~15s ceiling (2 missed keepalive cycles, no stream item); state transitions logged with timestamps (`live → reconnecting → live`).

**Step 2: Implement (GREEN)**

Per the design's NFR2 timing contract; Info-level lifecycle logging via the new shared `logger.ts` module (used app-wide thereafter) for measurable recovery times.

Run: `pnpm --filter @sequence/mobile exec jest src/realtime/lifecycle.test.ts`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/realtime apps/mobile/src/lib
git commit -m "feat(p05-t05): AppState resubscribe + watchdog per NFR2 timing contract"
```

### Task p05-t06: Connection banners + debug event feed

**Files:**

- Create: `apps/mobile/src/components/ConnectionBanner.tsx`, `+ .test.tsx`, `apps/mobile/src/app/dev/stream.tsx` (dev-only raw event feed)

**Step 1: Write test (RED)**

Banner renders nothing when `live`; "reconnecting" state visible with testID `game.connection.banner`.

**Step 2: Implement (GREEN)**

Banner from `connectionState`; dev stream screen joins a game id and prints raw items (agent debugging surface).

Run: `pnpm --filter @sequence/mobile exec jest src/components/ConnectionBanner.test.tsx`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p05-t06): connection banner + dev stream debug screen"
```

### Task p05-t07: Two-client live + recovery-time verification

**Files:** none (scenario task)

**Step 1: Implement**

Local API + web client + mobile simulator: create game on web, subscribe on mobile (dev stream screen), verify lobby/game events arrive live both ways. Recovery scenarios with measured times from lifecycle logs: kill API process mid-subscription → restart → detection ≤10s, resubscribed+recovered ≤15s; background app 10s → foreground → immediate resubscribe; background beyond replay window → snapshot recovery.

**Step 2: Verify**

Expected: all measured times within contract; evidence (log excerpts) recorded in implementation.md.

**Step 3: Commit**

```bash
git add -u apps/mobile
git commit -m "test(p05-t07): two-client realtime + measured recovery verification"
```

---

## Phase 6: Dashboard, Create, Join, Lobby

Everything up to the first move (FR2–FR5).

### Task p06-t01: API — game.join returnGuestToken flag

**Files:**

- Modify: `packages/api/src/game/routes/join-game.ts`, its existing test file

**Step 1: Write test (RED)**

API integration: guest join with `returnGuestToken: true` → response includes `guestToken` matching the `sequence_guest` cookie value; without the flag → no `guestToken` key; registered join with flag → no `guestToken`.

**Step 2: Implement (GREEN)**

Additive input/output per design; token never logged.

Run: `pnpm --filter @sequence/api exec vitest run src/game/routes/join-game.test.ts` (with `DATABASE_URL_TEST` set)
Expected: green with a non-zero executed-test count (not skipped).

**Step 3: Commit**

```bash
git add packages/api
git commit -m "feat(p06-t01): opt-in guest token return on game.join"
```

### Task p06-t02: Dashboard screen

**Files:**

- Create: `apps/mobile/src/features/dashboard/GameCard.tsx`, `+ tests`
- Modify: `apps/mobile/src/app/index.tsx` (replaces probe placeholder → dashboard)

**Step 1: Write test (RED)**

Fixtures: resumables + recents render with status/roster/result; tap navigates per status (lobby → game route, finished → game-over view); empty states.

**Step 2: Implement (GREEN)**

`game.myGames` via queryOptions; pull-to-refresh; testIDs (`dashboard.resumable.<id>`).

Run: `pnpm --filter @sequence/mobile exec jest src/features/dashboard`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p06-t02): dashboard with resumable + recent games"
```

### Task p06-t03: Create screen

**Files:**

- Create: `apps/mobile/src/app/create.tsx`, `apps/mobile/src/features/create/CreateForm.tsx`, `+ tests`

**Step 1: Write test (RED)**

Form: player count 2/3/4/6; mode tap/drag; timer options (off, 30s steps ≤180, 60s steps — mirror web's option list); local toggle (forces 2p + opponent name, 1–40 chars); submit → remote lands in lobby route, local lands in active game route.

**Step 2: Implement (GREEN)**

RSD kit form over `game.create`.

Run: `pnpm --filter @sequence/mobile exec jest src/features/create`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p06-t03): create-game screen with full settings parity"
```

### Task p06-t04: Join flow — code entry + preview + registered join

**Files:**

- Create: `apps/mobile/src/app/join/index.tsx`, `apps/mobile/src/app/join/[code].tsx`, `apps/mobile/src/features/join/PreviewCard.tsx`, `+ tests`

**Step 1: Write test (RED)**

Code entry validates non-empty; preview renders roster/settings from `game.preview` fixture; NOT_FOUND → friendly unknown-code state; registered join navigates to lobby/game; CONFLICT (full/started) rendered.

**Step 2: Implement (GREEN)**

Preview via queryOptions; join mutation; error policy integration.

Run: `pnpm --filter @sequence/mobile exec jest src/features/join src/app/join`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p06-t04): join flow with invite preview"
```

### Task p06-t05: Guest join + guest store/registry + continue-list

**Files:**

- Create: `apps/mobile/src/auth/guest-store.ts`, `apps/mobile/src/auth/guest-store.test.ts`
- Modify: `apps/mobile/src/app/join/[code].tsx` (guest name path, `returnGuestToken: true`), `apps/mobile/src/app/(auth)/login.tsx` (guest continue-list), `apps/mobile/src/api/cookies.ts` (un-stub guest lookup)

**Step 1: Write test (RED)**

Guest store: `saveGuestToken` (SecureStore, key `sequence.guest.<uuid>`) + `saveGuestGame` (AsyncStorage registry entry) round-trip; `listGuestGames` ordering; `removeGuestGame` deletes both; login screen renders continue-list from registry fixture with testID `auth.guest.continue.<gameId>`; join screen stores token+registry on guest join.

**Step 2: Implement (GREEN)**

Per design (C1 resolution): registry `sequence-guest-games`; cleanup on finished/`NOT_FOUND`/`FORBIDDEN` wired into error policy + stream status updates.

Run: `pnpm --filter @sequence/mobile exec jest src/auth/guest-store.test.ts "src/app/(auth)/login.test.tsx"`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p06-t05): guest identity store + registry + cold-start continue-list"
```

### Task p06-t06: Scheme deep links

**Files:**

- Modify: `apps/mobile/src/app/join/[code].tsx` (param handling hardening)

**Step 1: Implement**

`sequence://join/<code>` resolves through expo-router to the join preview with code prefilled; param treated as untrusted (passed only to `game.preview`).

**Step 2: Verify**

Run: dev build; `xcrun simctl openurl booted "sequence://join/TESTCODE"`; screenshot-verify preview screen with code populated (and unknown-code state for garbage input).
Expected: both paths render correctly.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p06-t06): app-scheme deep links into the join flow"
```

### Task p06-t07: Lobby screen + controls + share

**Files:**

- Create: `apps/mobile/src/game/LobbyTeams.tsx`, `+ .test.tsx`, `apps/mobile/src/app/game/[id].tsx` (lobby-status branch; game surface fills in p07)

**Step 1: Write test (RED)**

From `GameSnapshotView` lobby fixtures: roster with teams; self team-set enabled; creator sees kick/randomize/start; start disabled until legal layout; share affordance present; 6-player 3-team layout renders.

**Step 2: Implement (GREEN)**

Port web semantics; native `Share` API for invite code; mutations (`setTeam`, `kick`, `randomizeTeams`, `start`) with error policy; live updates via `useGameStream`.

Run: `pnpm --filter @sequence/mobile exec jest src/game/LobbyTeams.test.tsx`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p06-t07): live lobby with team + creator controls"
```

### Task p06-t08: Multi-client lobby verification

**Files:** none (scenario task)

**Step 1: Implement**

Web + mobile sim on local API: guest joins via deep link; team changes/kick/randomize reflect live on both clients; start gates correctly; guest relaunch scenario (terminate app → relaunch → continue-list → back in lobby).

**Step 2: Verify**

Expected: FR2–FR5 acceptance criteria demonstrated; evidence in implementation.md.

**Step 3: Commit**

```bash
git add -u apps/mobile
git commit -m "test(p06-t08): multi-client lobby + guest relaunch verification"
```

---

## Phase 7: Game Surface — Core Play (Tap Mode)

A playable game (FR6, FR9); NFR3 submitting-state lands here.

### Task p07-t01: SVG card pipeline

**Files:**

- Create: `apps/mobile/src/game/cards/CardFace.tsx`, `+ .test.tsx`, `apps/mobile/src/types/svg.d.ts`
- Modify: `apps/mobile/metro.config.js` (add svg transformer), `apps/mobile/package.json` (`react-native-svg-transformer`), card assets shared/copied from web's set

**Step 1: Write test (RED)**

`CardFace rank/suit` resolves the right asset component for all 52 faces (table-driven); memoization identity stable across re-renders.

**Step 2: Implement (GREEN)**

Metro transformer config; card asset module map; memoized `CardFace` with `size` prop (board vs hand scale).

Run: `pnpm --filter @sequence/mobile exec jest src/game/cards/CardFace.test.tsx`
Expected: green; dev-build screenshot of a card grid sanity check.

**Step 3: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(p07-t01): SVG card pipeline with memoized CardFace"
```

### Task p07-t02: GameBoard grid + chips + sequences

**Files:**

- Create: `apps/mobile/src/game/GameBoard/GameBoard.tsx`, `BoardCell.tsx`, `layout-map.ts`, `+ tests`

**Step 1: Write test (RED)**

Fixtures: 10×10 from `BOARD_MAP` (flexbox rows); corners render wild; chips render team colors; `lockedBy` shows lock treatment; memo check — updating one cell's chip re-renders only that cell (render-count probe); cells carry `board.cell.<pos>` testIDs; layout map registers cell frames.

**Step 2: Implement (GREEN)**

Per design: cell = CardFace + chip overlay; layout computed from screen width; `React.memo` keyed props.

Run: `pnpm --filter @sequence/mobile exec jest src/game/GameBoard`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/game
git commit -m "feat(p07-t02): GameBoard grid with chips, locks, and layout map"
```

### Task p07-t03: Spotlight targeting

**Files:**

- Create: `apps/mobile/src/game/GameBoard/spotlight.ts`, `+ test`
- Modify: `GameBoard.tsx`, `BoardCell.tsx`

**Step 1: Write test (RED)**

`validPlacements` (game-logic) drives targets for a selected card; non-target cells get dim treatment ONLY when a card is selected (never automatic — web parity); deselect clears; one-eyed jack targets = removable opponent chips.

**Step 2: Implement (GREEN)**

Spotlight dim layer per design; selection state lives in the game screen controller.

Run: `pnpm --filter @sequence/mobile exec jest src/game/GameBoard/spotlight.test.ts`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/game
git commit -m "feat(p07-t03): selection-gated spotlight for legal targets"
```

### Task p07-t04: CardHand

**Files:**

- Create: `apps/mobile/src/game/CardHand/CardHand.tsx`, `+ .test.tsx`

**Step 1: Write test (RED)**

Hand fixtures render bottom-docked cards (`hand.card.<code>` testIDs); tap selects/deselects; selected visual state; dead cards badged (hard mode) with turn-in affordance visible only in drag mode games.

**Step 2: Implement (GREEN)**

Per design; `findDeadCards` from game-logic for badges.

Run: `pnpm --filter @sequence/mobile exec jest src/game/CardHand`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/game
git commit -m "feat(p07-t04): CardHand with selection + dead-card badges"
```

### Task p07-t05: PlayerRail + TimerBadge

**Files:**

- Create: `apps/mobile/src/game/PlayerRail/PlayerRail.tsx`, `TimerBadge.tsx`, `+ tests`

**Step 1: Write test (RED)**

Rail: seats, teams, connected/disconnected, current-turn highlight. Timer (fake timers): countdown derives from `turnDeadlineAt`; re-syncs when a new event updates the deadline; expired shows 0:00 (server forfeit reflected via stream, not client action).

**Step 2: Implement (GREEN)**

Per design; deadline re-sync on every event application.

Run: `pnpm --filter @sequence/mobile exec jest src/game/PlayerRail`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/game
git commit -m "feat(p07-t05): PlayerRail + deadline-synced TimerBadge"
```

### Task p07-t06: Move submission + submitting state + violation feedback

**Files:**

- Create: `apps/mobile/src/game/use-move-submit.ts`, `+ test`, `apps/mobile/src/game/feedback/toasts.ts`, `+ test`
- Modify: `apps/mobile/package.json` (`expo-haptics`)

**Step 1: Write test (RED)**

Submit hook: enters `submitting` (card disabled, no board mutation) → clears on server-echo event or error; CONFLICT → "game updated" feedback + no duplicate submit; violation codes → messages from `@sequence/client-state` catalog; round-trip logged (submit ts → first resulting event ts) in dev.

**Step 2: Implement (GREEN)**

Per NFR3 design resolution: haptic on tap, pending affordance, p50 measurement log.

Run: `pnpm --filter @sequence/mobile exec jest src/game/use-move-submit.test.ts src/game/feedback/toasts.test.ts`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "feat(p07-t06): version-guarded move submission with pending state + feedback"
```

### Task p07-t07: Game screen assembly + turn flow

**Files:**

- Modify: `apps/mobile/src/app/game/[id].tsx` (active-status branch: board + hand + rail + timer + banner + controls shell)

**Step 1: Write test (RED)**

Assembled screen from active fixture: my-turn enables interaction; opponent-turn disables submission but keeps board visible; status branches (lobby p06 / active / others placeholder until p09).

**Step 2: Implement (GREEN)**

Controller wires `useGameStream` + selection + `use-move-submit`.

Run: `pnpm --filter @sequence/mobile exec jest src/app/game`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p07-t07): playable game screen (tap mode) with turn flow"
```

### Task p07-t08: Playground stories for game components

**Files:**

- Modify: `apps/mobile/src/dev/stories.ts` (board states: empty/midgame/spotlight/locked-sequences/6-player; hand states; rail states — fixtures from `@sequence/client-state`)

**Step 1: Implement**

Register game-surface stories; agent screenshots each in both themes.

**Step 2: Verify**

Run: dev build → `/dev` → screenshot pass.
Expected: all states render plausibly at iPhone widths; issues fixed inline.

**Step 3: Commit**

```bash
git add apps/mobile/src/dev
git commit -m "feat(p07-t08): game-surface playground stories"
```

### Task p07-t09: Full tap-mode game verification

**Files:** none (scenario task)

**Step 1: Implement**

Mobile sim vs web on local API, timed game: play to a win including two-eyed + one-eyed jack plays, sequence lock, auto-draw, timer display sync, stale-version recovery (submit from a deliberately stale client). Agent-driven via testIDs.

**Step 2: Verify**

Expected: FR6 + FR9 acceptance criteria pass; move round-trip p50 sample recorded (baseline for p11-t02); evidence in implementation.md.

**Step 3: Commit**

```bash
git add -u apps/mobile
git commit -m "test(p07-t09): full tap-mode game verified mobile-vs-web"
```

---

## Phase 8: Game Surface — Advanced Play

Rules-complete parity (FR7, FR8).

### Task p08-t01: Drag gesture layer

**Files:**

- Create: `apps/mobile/src/game/drag/DragLayer.tsx`, `use-drag-chip.ts`, `+ tests`

**Step 1: Write test (RED)**

Pan gesture drives ghost position via Reanimated shared values (worklet logic unit-testable parts: hit-test against layout-map frames returns hovered cell; hover-confirm state only while over a cell; release outside board cancels).

**Step 2: Implement (GREEN)**

Per design: UI-thread ghost, layout-map hit-testing, NO pre-highlighting in drag mode.

Run: `pnpm --filter @sequence/mobile exec jest src/game/drag`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/game
git commit -m "feat(p08-t01): drag layer with UI-thread ghost + hit-testing"
```

### Task p08-t02: Drag submit + rejection feedback

**Files:**

- Modify: `apps/mobile/src/game/drag/DragLayer.tsx`, `apps/mobile/src/app/game/[id].tsx` (mode branch)

**Step 1: Write test (RED)**

Release over a cell submits `makeMove` WITHOUT `card` (server infers — drag contract); illegal drop → violation feedback + chip returns; hover-confirm shows before release.

**Step 2: Implement (GREEN)**

Wire to `use-move-submit`; drag mode selected by `mode: 'drag'` games.

Run: `pnpm --filter @sequence/mobile exec jest src/game/drag`
Expected: green. Dev-build interaction check via agent (Argent gesture or manual): ghost tracks finger smoothly.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p08-t02): drag-mode submission with rejection feedback"
```

### Task p08-t03: Sequence-choice sheet

**Files:**

- Create: `apps/mobile/src/game/SequenceChoiceSheet.tsx`, `+ .test.tsx`

**Step 1: Write test (RED)**

`pendingChoice` fixture for my seat opens the sheet; exactly-5 contiguous window selection including placed cell validated client-side (UX only); submit calls `chooseSequenceCells`; chained-choice fixture reopens for next run; other-seat pendingChoice shows frozen banner, no sheet.

**Step 2: Implement (GREEN)**

Bottom sheet per design; board highlights candidate windows.

Run: `pnpm --filter @sequence/mobile exec jest src/game/SequenceChoiceSheet.test.tsx`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/game
git commit -m "feat(p08-t03): >5-run sequence-choice sheet with chained flow"
```

### Task p08-t04: Dead-card turn-in + auto-swap surfacing

**Files:**

- Create: `apps/mobile/src/game/DeadCardControls.tsx`, `+ .test.tsx`
- Modify: `apps/mobile/src/game/feedback/toasts.ts`

**Step 1: Write test (RED)**

Hard mode: dead-badge card exposes turn-in → calls `turnInDeadCard` → turn continues (no advance); second attempt same turn shows `not-a-dead-card` feedback path; default mode: `DeadCardSwapped` events surface as a toast ("auto-swapped a dead card").

**Step 2: Implement (GREEN)**

Per design/FR8.

Run: `pnpm --filter @sequence/mobile exec jest src/game/DeadCardControls.test.tsx`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/game
git commit -m "feat(p08-t04): dead-card turn-in + auto-swap surfacing"
```

### Task p08-t05: Board rotate control

**Files:**

- Modify: `apps/mobile/src/game/GameBoard/GameBoard.tsx` (+ test)

**Step 1: Write test (RED)**

Rotate control cycles 0/90/180/270; layout map accounts for rotation in hit-testing; testID `board.rotate`.

**Step 2: Implement (GREEN)**

Reanimated rotation per design (explicitly cuttable if phase runs long — flag rather than silently skip).

Run: `pnpm --filter @sequence/mobile exec jest src/game/GameBoard`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/game
git commit -m "feat(p08-t05): board rotate control"
```

### Task p08-t06: Hard-mode e2e verification

**Files:** none (scenario task)

**Step 1: Implement**

Drag-mode game mobile-vs-web to completion: drag placements, one-eyed removal by drag, dead-card turn-in, forced >5-run choice (seeded/contrived board via extended play), chained choice if reachable.

**Step 2: Verify**

Expected: FR7 + FR8 criteria pass; evidence in implementation.md.

**Step 3: Commit**

```bash
git add -u apps/mobile
git commit -m "test(p08-t06): hard-mode game verified end-to-end"
```

---

## Phase 9: Lifecycle + Local Pass-and-Play

Every game state reachable and recoverable (FR10–FR12).

### Task p09-t01: Save & exit + concede controls

**Files:**

- Create: `apps/mobile/src/game/ActiveGameControls.tsx`, `+ .test.tsx`

**Step 1: Write test (RED)**

Controls menu: save & exit (hidden for guest-roster games — server rejects; UI pre-hides per snapshot roster), concede with confirmation dialog; both submit version-guarded mutations; success navigates (save → dashboard) or renders outcome (concede → game over via stream).

**Step 2: Implement (GREEN)**

Port web semantics; wire into game screen.

Run: `pnpm --filter @sequence/mobile exec jest src/game/ActiveGameControls.test.tsx`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p09-t01): save-and-exit + concede controls"
```

### Task p09-t02: Freeze/resume + expiry states

**Files:**

- Modify: `apps/mobile/src/app/game/[id].tsx`, `apps/mobile/src/components/ConnectionBanner.tsx` (+ tests)

**Step 1: Write test (RED)**

`frozen` status fixture: banner names the disconnected player, board visible but interaction disabled; resume (status → active via stream) restores play; `saved` status shows resumable state; expired/expiring shows `expiresAt` messaging.

**Step 2: Implement (GREEN)**

Status-driven UI per web parity; presence data from snapshot players.

Run: `pnpm --filter @sequence/mobile exec jest src/app/game`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p09-t02): freeze/resume + expiry states"
```

### Task p09-t03: GameOver screen

**Files:**

- Create: `apps/mobile/src/game/GameOver.tsx`, `+ .test.tsx`

**Step 1: Write test (RED)**

Outcome matrix fixtures: 2-team win/loss (winning sequences highlighted), concede (conceding team loss; 3-team FFA no-winner case), timer-forfeit finishes; result phrasing matches web semantics; testIDs for rematch/dashboard actions.

**Step 2: Implement (GREEN)**

Per design; renders from finished snapshot fields (`winnerTeam`, `concededTeam`, `endReason`).

Run: `pnpm --filter @sequence/mobile exec jest src/game/GameOver.test.tsx`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/game
git commit -m "feat(p09-t03): game-over screen with outcome matrix"
```

### Task p09-t04: Rematch flow

**Files:**

- Modify: `apps/mobile/src/game/GameOver.tsx` (+ test)

**Step 1: Write test (RED)**

Rematch button calls `game.rematch`; navigates to the new game's route; non-initiating client follows via its own stream/game link (verify the web-parity mechanism from the snapshot/rematch linkage); local rematch lands directly in active state.

**Step 2: Implement (GREEN)**

Per design; error policy for CONFLICT (non-finished).

Run: `pnpm --filter @sequence/mobile exec jest src/game/GameOver.test.tsx`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/game
git commit -m "feat(p09-t04): one-tap rematch"
```

### Task p09-t05: HandoffScreen + local pass-and-play

**Files:**

- Create: `apps/mobile/src/game/HandoffScreen.tsx`, `+ .test.tsx`
- Modify: `apps/mobile/src/app/game/[id].tsx` (local-mode flow)

**Step 1: Write test (RED)**

Local game fixture (`localHands`): between turns the handoff interstitial gates — incoming player named, NO hand visible until confirm tap (`handoff.confirm`); after confirm, only the incoming player's hand renders; NFR1 privacy assertion: outgoing hand absent from the tree during handoff.

**Step 2: Implement (GREEN)**

Port web handoff semantics to a full-screen gate.

Run: `pnpm --filter @sequence/mobile exec jest src/game/HandoffScreen.test.tsx`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p09-t05): local pass-and-play handoff gate"
```

### Task p09-t06: Local save/resume + dashboard integration

**Files:**

- Modify: `apps/mobile/src/game/ActiveGameControls.tsx`, `apps/mobile/src/features/dashboard/GameCard.tsx` (+ tests)

**Step 1: Write test (RED)**

Local game can save & exit; appears in dashboard resumables flagged local; resume re-enters local flow at the correct seat/handoff state.

**Step 2: Implement (GREEN)**

Wire local branch through save/resume.

Run: `pnpm --filter @sequence/mobile exec jest src/features/dashboard src/game/ActiveGameControls.test.tsx`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p09-t06): local save/resume through dashboard"
```

### Task p09-t07: Lifecycle matrix verification

**Files:** none (scenario task)

**Step 1: Implement**

Scenario matrix on local API: save→resume (registered roster), concede 2-team + 3-team FFA, disconnect-freeze → reconnect-resume (kill web client mid-game), rematch across two clients, full local pass-and-play game with save mid-way, expiry messaging (seed near-expiry data if practical, else fixture-verified).

**Step 2: Verify**

Expected: FR10–FR12 + FR11 criteria pass; evidence in implementation.md.

**Step 3: Commit**

```bash
git add -u apps/mobile
git commit -m "test(p09-t07): lifecycle + pass-and-play matrix verified"
```

---

## Phase 10: History, Notifications, Settings, Polish

Full parity surface complete (FR13–FR15, NFR5 groundwork).

### Task p10-t01: History screens

**Files:**

- Create: `apps/mobile/src/app/history.tsx`, `apps/mobile/src/features/history/` (Record, GamesList, HeadToHead components + tests)

**Step 1: Write test (RED)**

Record fixture (W-L-total); paginated list (keyset cursor; local games flagged, included in list); head-to-head table; empty states; infinite-scroll page fetch calls with `nextCursor`.

**Step 2: Implement (GREEN)**

`history.myRecord` / `history.myGames` / `history.headToHead` via queryOptions.

Run: `pnpm --filter @sequence/mobile exec jest src/features/history`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p10-t01): history record, paginated games, head-to-head"
```

### Task p10-t02: Notification affordances

**Files:**

- Create: `apps/mobile/src/game/feedback/turn-notifications.ts`, `+ test`
- Modify: `apps/mobile/src/game/feedback/toasts.ts`

**Step 1: Write test (RED)**

Turn-change to my seat → toast + haptic when game screen visible; significant events (opponent sequence, concede, freeze) surface; violation catalog completeness re-asserted against all 13 codes (moved check from p05 now exercised through UI mapping).

**Step 2: Implement (GREEN)**

Event-driven feedback layered on stream application (FR14 parity, mobile idioms).

Run: `pnpm --filter @sequence/mobile exec jest src/game/feedback`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src/game
git commit -m "feat(p10-t02): in-app turn/event notification affordances"
```

### Task p10-t03: Settings screen

**Files:**

- Create: `apps/mobile/src/app/settings.tsx`, `+ .test.tsx`

**Step 1: Write test (RED)**

Theme segmented control (light/dark/system) persists via ThemeProvider; logout; app version display; testIDs.

**Step 2: Implement (GREEN)**

RSD kit; wire `useTheme`.

Run: `pnpm --filter @sequence/mobile exec jest src/app/settings.test.tsx`
Expected: green.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "feat(p10-t03): settings with theme toggle + logout"
```

### Task p10-t04: Empty/loading/error states pass

**Files:**

- Modify: screens across `src/app/` + `src/features/` (+ tests where gaps found)

**Step 1: Implement**

Sweep every screen for loading skeletons, empty states, and error-policy rendering; standardize via kit components.

**Step 2: Verify**

Run: `pnpm --filter @sequence/mobile test`; agent screenshot pass over each screen's loading/empty/error variants (playground stories where feasible).
Expected: no blank/undefined states anywhere.

**Step 3: Commit**

```bash
git add apps/mobile/src
git commit -m "chore(p10-t04): loading/empty/error state sweep"
```

### Task p10-t05: A11y labels + testID audit

**Files:**

- Modify: components missing labels/testIDs (+ audit script optional: `apps/mobile/scripts/audit-testids.ts`)

**Step 1: Implement**

Audit interactive elements for `testID` (convention) + `accessibilityLabel`/`accessibilityRole`; fix gaps. NFR5 closure.

**Step 2: Verify**

Run: agent drives one flow per screen purely by testID/a11y tree (no coordinates); jest suite green.
Expected: no coordinate fallbacks needed.

**Step 3: Commit**

```bash
git add apps/mobile
git commit -m "chore(p10-t05): accessibility + testID audit (NFR5)"
```

### Task p10-t06: Both-themes screenshot pass

**Files:** none (verification; fixes inline)

**Step 1: Implement**

Agent loop: every screen + key game states in light and dark; fix contrast/token misuse inline.

**Step 2: Verify**

Expected: FR15 criteria (system tracking live, override persists across relaunch — `simctl` appearance + terminate/relaunch scenario); screenshots archived in implementation.md notes.

**Step 3: Commit**

```bash
git add -u apps/mobile
git commit -m "chore(p10-t06): both-themes visual pass (FR15)"
```

### Task p10-t07: FR13–FR15 verification

**Files:** none (scenario task)

**Step 1: Implement**

History against seeded local data (wins/losses/head-to-head from played games in prior phases); notification affordances observed in a live game; theming scenarios.

**Step 2: Verify**

Expected: FR13–FR15 acceptance criteria recorded as passing.

**Step 3: Commit**

```bash
git add -u apps/mobile
git commit -m "test(p10-t07): parity-polish verification (FR13-15)"
```

---

## Phase 11: Hardening

NFR closure before distribution — everything verifiable without an operator.

### Task p11-t01: NFR2 measured scenario matrix

**Files:** none (scenario task; fixes into realtime modules)

**Step 1: Implement**

Execute the full simulator matrix with elapsed-time capture from lifecycle logs: kill/restart API mid-game (detection ≤10s, recovery ≤15s), brief background, >replay-window background (snapshot recovery), force-quit mid-game → relaunch → resume, stale-version submit recovery.

**Step 2: Verify**

Expected: every timing within contract; table of measured values recorded in implementation.md (device-network cases remain in the runbook checklist for Phase 12).

**Step 3: Commit**

```bash
git add -u apps/mobile
git commit -m "test(p11-t01): NFR2 recovery matrix measured within contract"
```

### Task p11-t02: Perf pass + NFR3 measurement

**Files:** possible fixes in `src/game/**` (memo boundaries)

**Step 1: Implement**

Argent/RN DevTools profiling: drag frame timing (target: no JS-thread work per frame), event-application re-render scope (board memo audit via render counts), move round-trip p50 from p07-t06 logs over a sampled game (target ≤300ms local). SVG contingency decision gate: keep SVG or switch to sprite rasters (expo-image) — record decision.

**Step 2: Verify**

Expected: NFR3 evidence recorded; memo audit shows single-cell re-renders; decision documented in implementation.md (+ design deviation note if sprites chosen).

**Step 3: Commit**

```bash
git add -u apps/mobile
git commit -m "perf(p11-t02): profiling pass + NFR3 measurements"
```

### Task p11-t03: Release build audit (NFR4)

**Files:**

- Modify: `apps/mobile/babel.config.js` (production console strip), any leaks found

**Step 1: Implement**

Production-mode export (`expo export -p ios` with NODE_ENV=production): inspect bundle for `/dev` routes (must be absent), `expo-mcp` (absent), console strip active; config check: production `apiUrl`/`wsUrl` are https/wss; SecureStore-only credential audit (grep AsyncStorage usage for tokens); NFR1 remote-hand-absence inspection — during a live remote game, dump the client `GameSnapshotView`/query store and confirm only the local player's hand is present (no `localHands`, no foreign card data).

**Step 2: Verify**

Run: scripted greps over the exported bundle + config assertions.
Expected: all clean; results recorded (web's `/dev` leak precedent makes this list explicit).

**Step 3: Commit**

```bash
git add apps/mobile
git commit -m "chore(p11-t03): release-build audit clean (NFR4)"
```

### Task p11-t04: Gate sweep (NFR6)

**Files:** whatever the sweep flags

**Step 1: Implement**

Full root gates + per-package suites incl. web e2e if `DATABASE_URL_TEST` available; fix fallout.

**Step 2: Verify**

Run: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`
Expected: green across all workspaces.

**Step 3: Commit**

```bash
git add -u
git commit -m "chore(p11-t04): full gate sweep green (NFR6)"
```

### Task p11-t05: NFR7 phase audit + runbook completeness (FR19)

**Files:**

- Modify: `docs/mobile-operator-runbook.md` (fill gaps found)

**Step 1: Implement**

Audit implementation.md: confirm no Phase 1–11 task required an operator; inventory every operator step discovered across phases against runbook sections 0–7; author any missing sections (§2 Apple Developer, §3 ASC/bundle-id incl. the decided `com.tkstang.sequenceonline`, §4 EAS credentials, §5 TestFlight groups, §6 device checklist incl. deferred NFR2/NFR3 device cases, §7 production smoke).

**Step 2: Verify**

Expected: FR19 criteria — every section has Why/When/Prerequisites/Steps/Verify/Troubleshooting; required-vs-optional labeled; NFR7 audit note in implementation.md.

**Step 3: Commit**

```bash
git add docs/mobile-operator-runbook.md
git commit -m "docs(p11-t05): operator runbook complete + NFR7 phase audit (FR19)"
```

### Task p11-t06: Documentation updates

**Files:**

- Modify: `docs/index.md`, `docs/architecture.md` (mobile boundary section), `docs/development.md` (mobile workflow), `docs/testing.md` (jest-expo layer), `docs/configuration.md`, `apps/mobile/README.md`, `apps/mobile/AGENTS.md`, root `AGENTS.md` (mobile workspace pointers)
- Create: `packages/client-state/README.md`, `packages/design-tokens/README.md`

**Step 1: Implement**

Documentation parity per FR/NFR6 constraints and the docs map conventions (update `docs/index.md` Contents).

**Step 2: Verify**

Run: `pnpm format:check`; link sweep over changed docs.
Expected: docs current and internally linked.

**Step 3: Commit**

```bash
git add docs apps/mobile packages AGENTS.md
git commit -m "docs(p11-t06): documentation parity for mobile workspace"
```

### Task p11-t07: Pre-distribution smoke flows

**Files:** none (scenario task)

**Step 1: Implement**

Run the documented smoke flow set end-to-end via the agent loop against the local API, then against the **production** API (read-only friendly: create/join/play with throwaway accounts): auth, create, 2-client join+play-to-win, pass-and-play, save/resume, concede, rematch, timers.

**Step 2: Verify**

Expected: all flows pass against production; this is the Phase 12 entry gate. Evidence in implementation.md.

**Step 3: Commit**

```bash
git add -u
git commit -m "test(p11-t07): pre-distribution smoke flows green incl. production API"
```

---

## Phase 12: TestFlight (Operator Phase)

FR18 — the single consolidated operator phase; every task maps to a runbook section.

### Task p12-t01: Operator pre-flight (runbook §§1–4)

**Files:**

- Modify: `docs/mobile-operator-runbook.md` (record actuals: team id, ASC app id, EAS project id — non-secret identifiers only)

**Step 1: Implement**

Operator executes with agent assistance: Apple Developer Program enrollment (§2), ASC app record with bundle id `com.tkstang.sequenceonline` / name "Sequence Online" (§3), `eas init` project link + credentials setup (§4), Expo MCP OAuth if not already done (§1).

**Step 2: Verify**

Run: `cd apps/mobile && eas whoami && eas credentials` (all EAS commands run from `apps/mobile` — the monorepo root has no EAS project), ASC record visible.
Expected: all pre-flight checks green per runbook Verify blocks.

**Step 3: Commit**

```bash
git add docs/mobile-operator-runbook.md apps/mobile
git commit -m "chore(p12-t01): operator pre-flight complete (Apple/ASC/EAS)"
```

### Task p12-t02: eas.json profiles + production config

**Files:**

- Create: `apps/mobile/eas.json`
- Modify: `apps/mobile/app.config.ts` (production `apiUrl`/`wsUrl` → Railway https/wss; APP_ENV plumbing; version/buildNumber scheme)

**Step 1: Implement**

Profiles: `development` (dev client, simulator), `preview` (internal device), `production` (store). Production extra points at the production API.

**Step 2: Verify**

Run: `pnpm --filter @sequence/mobile exec expo config --type public` under each APP_ENV; `cd apps/mobile && eas config --profile production --platform ios` (or `eas build:inspect`) for config validation — note `eas build` has no `--dry-run` flag.
Expected: correct URLs per profile; config validates.

**Step 3: Commit**

```bash
git add apps/mobile
git commit -m "feat(p12-t02): EAS build profiles + production configuration"
```

### Task p12-t03: Production build → TestFlight internal

**Files:** none (build task; runbook §4/§5)

**Step 1: Implement**

`cd apps/mobile && eas build --profile production --platform ios` → `eas submit` (from `apps/mobile`; or auto-submit) → ASC processing → internal TestFlight group installs.

**Step 2: Verify**

Expected: build processes without export-compliance blockers; internal tester (operator device) installs and completes an auth + game smoke against production.

**Step 3: Commit**

```bash
git add docs/mobile-operator-runbook.md
git commit -m "chore(p12-t03): production build live on TestFlight internal"
```

### Task p12-t04: External tester group

**Files:** none (runbook §5)

**Step 1: Implement**

External group + beta review submission; invite testers.

**Step 2: Verify**

Expected: external tester successfully installs via public/email invite.

**Step 3: Commit**

```bash
git add docs/mobile-operator-runbook.md
git commit -m "chore(p12-t04): TestFlight external testing open"
```

### Task p12-t05: Device checklist + production smoke (runbook §§6–7)

**Files:**

- Modify: `docs/mobile-operator-runbook.md` (record results)

**Step 1: Implement**

Physical-device checklist: deferred NFR2 device-network cases (Wi-Fi↔LTE handoff, airplane-mode recovery), NFR3 device feel spot-check, session persistence on device. Production smoke: two humans complete a full multiplayer game via TestFlight installs.

**Step 2: Verify**

Expected: FR18 acceptance criteria met; results recorded.

**Step 3: Commit**

```bash
git add docs/mobile-operator-runbook.md
git commit -m "test(p12-t05): device checklist + two-human production smoke"
```

### Task p12-t06: Deployment docs + final wrap

**Files:**

- Modify: `docs/deployment.md` (mobile section linking the runbook), `docs/index.md`

**Step 1: Implement**

Deployment docs finalized; confirm HiLL `final` checkpoint readiness (final review → PR flow follows the lifecycle skills).

**Step 2: Verify**

Run: `pnpm format:check`; docs link sweep.
Expected: green; project ready for final review + PR.

**Step 3: Commit**

```bash
git add docs
git commit -m "docs(p12-t06): deployment docs for mobile; project wrap"
```

### Task p12-t07: (review) Align API presence constraint artifacts

**Files:**

- Modify: `spec.md`
- Modify: `design.md`
- Modify: `.oat/projects/shared/mobile-mvp/implementation.md`

**Step 1: Understand the issue**

Review finding I1: p11-t01 changed observable API presence behavior beyond the
original additive-only API constraint. The presence rewrite is accepted because
it fixed NFR2 reconnect/freeze races and is covered by `presence.test.ts`, but
the spec/design constraints and Deviations table still conflict with shipped
behavior.

**Step 2: Implement fix**

Align the lifecycle artifacts: update the spec/design constraint wording from
"additive auth/config only" to "additive auth/config surface plus
presence-correctness fixes required by NFR2", and add a Deviations table row
for p11-t01 identifying `packages/api/src/game/presence.ts` and
`packages/api/src/game/presence.test.ts` as the source of truth.

**Step 3: Verify**

Run: `rg -n "additive|presence-correctness|p11-t01|presence tracker" .oat/projects/shared/mobile-mvp/spec.md .oat/projects/shared/mobile-mvp/design.md .oat/projects/shared/mobile-mvp/implementation.md`
Expected: spec, design, and implementation notes consistently describe the
accepted presence-correctness exception.

**Step 4: Commit**

```bash
git add .oat/projects/shared/mobile-mvp/spec.md .oat/projects/shared/mobile-mvp/design.md .oat/projects/shared/mobile-mvp/implementation.md
git commit -m "docs(p12-t07): align presence API constraint artifacts"
```

### Task p12-t08: (review) Fix guest WebSocket credential staleness

**Files:**

- Modify: `apps/mobile/src/api/ws.ts`
- Modify: `apps/mobile/src/realtime/use-game-stream.ts`
- Modify: related mobile realtime/auth tests

**Step 1: Understand the issue**

Review finding I2: the lazy shared WebSocket connection can retain game A's
guest cookie while game B subscribes, and subscription-level `FORBIDDEN`
handling can then delete game B's valid guest token.

**Step 2: Implement fix**

Ensure the WebSocket credential matches the active guest game. Prefer closing
or recreating the lazy wsClient when `setActiveGameCookieGameId` changes the
active id, or move guest WebSocket auth to connection parameters if that proves
cleaner. Make destructive guest cleanup conservative: before
`removeGuestGame(gameId)` on subscription-level `FORBIDDEN`, confirm through an
HTTP request that the per-game guest identity is genuinely rejected.

**Step 3: Verify**

Run: `pnpm --filter @sequence/mobile exec jest src/realtime/use-game-stream.test.tsx src/api --runInBand`
Expected: guest game switching does not reuse a stale game cookie, and
subscription-level `FORBIDDEN` does not delete a valid token without HTTP
confirmation.

**Step 4: Commit**

```bash
git add apps/mobile/src/api apps/mobile/src/realtime
git commit -m "fix(p12-t08): prevent stale guest websocket credentials"
```

### Task p12-t09: (review) Align native-backed chrome artifacts

**Files:**

- Modify: `spec.md`
- Modify: `design.md`

**Step 1: Understand the issue**

Review finding I3: shipped chrome uses native React Native primitives with
shared tokens, while spec/design still describe RSD `html.*` chrome as the
current architecture.

**Step 2: Implement fix**

Update spec constraints and design chrome sections to describe the accepted
native-backed chrome approach, preserving RSD/deviation history as provenance
rather than current implementation guidance.

**Step 3: Verify**

Run: `rg -n "React Strict DOM|html\\.\\*|native-backed|shared tokens" .oat/projects/shared/mobile-mvp/spec.md .oat/projects/shared/mobile-mvp/design.md`
Expected: remaining RSD references are historical/provenance or future
re-evaluation notes; current chrome guidance is native-backed.

**Step 4: Commit**

```bash
git add .oat/projects/shared/mobile-mvp/spec.md .oat/projects/shared/mobile-mvp/design.md
git commit -m "docs(p12-t09): align chrome architecture artifacts"
```

### Task p12-t10: (review) Re-arm lifecycle watchdog outside live state

**Files:**

- Modify: `apps/mobile/src/realtime/lifecycle.ts`
- Modify: `apps/mobile/src/realtime/lifecycle.test.ts`

**Step 1: Understand the issue**

Review finding M1: the 15s inactivity watchdog is armed only by `markLive`.
`markConnecting`, `markReconnecting`, and `markError` clear it without
re-arming, so some non-live states have no forced resubscribe ceiling.

**Step 2: Implement fix**

Re-arm the watchdog for non-live recovery states while preserving the quiet-live
reschedule behavior that prevents false disconnects.

**Step 3: Verify**

Run: `pnpm --filter @sequence/mobile exec jest src/realtime/lifecycle.test.ts src/realtime/use-game-stream.test.tsx --runInBand`
Expected: every non-live recovery state has a bounded forced-resubscribe path,
and quiet-live behavior remains covered.

**Step 4: Commit**

```bash
git add apps/mobile/src/realtime/lifecycle.ts apps/mobile/src/realtime/lifecycle.test.ts apps/mobile/src/realtime/use-game-stream.test.tsx
git commit -m "fix(p12-t10): bound realtime non-live recovery"
```

### Task p12-t11: (review) Add StyleX token freshness guard

**Files:**

- Modify: `packages/design-tokens/scripts/write-web-stylex.ts`
- Modify: relevant design-token tests or root/package scripts
- Modify: `apps/web/src/styles/tokens.stylex.ts`
- Modify: `apps/web/src/styles/themes.stylex.ts`

**Step 1: Understand the issue**

Review finding M2: generated web StyleX token files can drift from
`@sequence/design-tokens`, and the generator's output is currently not
format-stable.

**Step 2: Implement fix**

Make `generate:web-stylex` emit oxfmt-stable output, then add a freshness guard
that fails when generated web token files are stale. Prefer a deterministic
test or script that regenerates and compares `apps/web/src/styles`.

**Step 3: Verify**

Run: `pnpm --filter @sequence/design-tokens generate:web-stylex && git diff --exit-code apps/web/src/styles`
Run: `pnpm --filter @sequence/design-tokens test`
Expected: generation is idempotent after formatting, and the guard catches
future token drift.

**Step 4: Commit**

```bash
git add packages/design-tokens apps/web/src/styles package.json
git commit -m "test(p12-t11): guard generated StyleX token freshness"
```

### Task p12-t12: (review) Prevent AuthedWebSocket close-before-open leak

**Files:**

- Modify: `apps/mobile/src/api/ws.ts`
- Modify: related WebSocket tests

**Step 1: Understand the issue**

Review finding M3: `AuthedWebSocket.close()` can no-op during the async
credential-read gap before the inner socket exists, allowing a socket to open
after the wrapper was already closed.

**Step 2: Implement fix**

Track pending close intent when `close()` is called before `open()` installs
the inner socket. If close was requested, skip connecting or immediately close
the created socket before attaching normal handlers.

**Step 3: Verify**

Run: `pnpm --filter @sequence/mobile exec jest src/api --runInBand`
Expected: close-before-open is covered and no untracked authenticated socket can
survive wrapper closure.

**Step 4: Commit**

```bash
git add apps/mobile/src/api
git commit -m "fix(p12-t12): close websocket during async open race"
```

### Task p12-t13: (review) Align rematch acceptance to parity semantics

**Files:**

- Modify: `spec.md`
- Modify: `design.md`
- Modify: `.oat/projects/shared/mobile-mvp/implementation.md`

**Step 1: Understand the issue**

Review finding M4: FR12 says rematch navigates all connected players, but both
web and mobile only navigate the initiating client; non-initiators can reach
the new game from the dashboard.

**Step 2: Implement fix**

Align FR12 acceptance to web parity semantics, or explicitly defer a future
server rematch event plus both-client navigation enhancement. Record the chosen
disposition in implementation notes.

**Step 3: Verify**

Run: `rg -n "rematch|FR12|connected players|dashboard" .oat/projects/shared/mobile-mvp/spec.md .oat/projects/shared/mobile-mvp/design.md .oat/projects/shared/mobile-mvp/implementation.md`
Expected: acceptance criteria no longer promise all-player rematch navigation
unless a concrete deferred follow-up is recorded.

**Step 4: Commit**

```bash
git add .oat/projects/shared/mobile-mvp/spec.md .oat/projects/shared/mobile-mvp/design.md .oat/projects/shared/mobile-mvp/implementation.md
git commit -m "docs(p12-t13): align rematch acceptance semantics"
```

### Task p12-t14: (review) Resolve vestigial React Strict DOM layer

**Files:**

- Modify: `apps/mobile/src/theme/vars.css.ts`
- Modify: `apps/mobile/babel.config.js`
- Modify: `apps/mobile/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: mobile docs if RSD is intentionally retained

**Step 1: Understand the issue**

Review finding m1: after native-backed chrome became the accepted
implementation, `vars.css.ts`, the `react-strict-dom` dependency, and the Babel
preset appear vestigial.

**Step 2: Implement fix**

Remove the unused RSD layer if no consumers remain. If retaining it is
intentional as a future re-evaluation hook, document that intent in the mobile
README or AGENTS guidance so the next audit has a source of truth.

**Step 3: Verify**

Run: `pnpm --filter @sequence/mobile typecheck && pnpm --filter @sequence/mobile lint && pnpm format:check`
Expected: mobile still builds/tests without unused RSD code, or retained RSD is
explicitly documented.

**Step 4: Commit**

```bash
git add apps/mobile pnpm-lock.yaml
git commit -m "chore(p12-t14): resolve vestigial RSD layer"
```

### Task p12-t15: (review) Bound mobile non-color token drift

**Files:**

- Modify: `apps/mobile/src/theme`
- Modify: representative mobile component styles
- Modify: `packages/design-tokens/README.md` if dimensions are intentionally web-only

**Step 1: Understand the issue**

Review finding m2: mobile consumes palette tokens but hardcodes spacing,
radius, and typography values, so non-color design tokens can drift from web.

**Step 2: Implement fix**

Either add a native-friendly dimension mapping from `@sequence/design-tokens`
and migrate representative chrome surfaces, or explicitly document that
non-color dimensions are web-only for this MVP. Prefer the mapping path when it
can stay bounded without broad visual churn.

**Step 3: Verify**

Run: `pnpm --filter @sequence/mobile exec jest src/components --runInBand`
Run: `pnpm --filter @sequence/mobile typecheck && pnpm --filter @sequence/mobile lint && pnpm format:check`
Expected: token-drift policy is enforced by code or documented with a clear
scope boundary, and migrated surfaces still pass component tests.

**Step 4: Commit**

```bash
git add apps/mobile/src/theme apps/mobile/src/components packages/design-tokens/README.md
git commit -m "chore(p12-t15): bound mobile dimension token drift"
```

---

## Reviews

{Track reviews here after running the oat-project-review-provide and oat-project-review-receive skills.}

| Scope   | Type     | Status          | Date       | Artifact                                                                   |
| ------- | -------- | --------------- | ---------- | -------------------------------------------------------------------------- |
| p01     | code     | pending         | -          | -                                                                          |
| p02     | code     | pending         | -          | -                                                                          |
| p03     | code     | pending         | -          | -                                                                          |
| p04     | code     | pending         | -          | -                                                                          |
| p05     | code     | pending         | -          | -                                                                          |
| p06     | code     | pending         | -          | -                                                                          |
| p07     | code     | pending         | -          | -                                                                          |
| p08     | code     | pending         | -          | -                                                                          |
| p09     | code     | pending         | -          | -                                                                          |
| p10     | code     | pending         | -          | -                                                                          |
| p11     | code     | pending         | -          | -                                                                          |
| p12     | code     | pending         | -          | -                                                                          |
| p01-p12 | code     | received        | 2026-07-04 | reviews/range-review-2026-07-04-v2.md (re-review of fixes; prior: reviews/archived/range-review-2026-07-04.md) |
| final   | code     | pending         | -          | -                                                                          |
| spec    | artifact | pending         | -          | -                                                                          |
| design  | artifact | fixes_completed | 2026-07-03 | reviews/archived/artifact-design-review-2026-07-02.md                      |
| plan    | artifact | passed          | 2026-07-03 | structured (oat-reviewer, 1 fix cycle) + cross-provider codex gate (1 fix) |

**Status values:** `pending` → `received` → `fixes_added` → `fixes_completed` → `passed`

**Meaning:**

- `received`: review artifact exists (not yet converted into fix tasks)
- `fixes_added`: fix tasks were added to the plan (work queued)
- `fixes_completed`: fix tasks implemented, awaiting re-review
- `passed`: re-review run and recorded as passing (no Critical/Important)

---

## Implementation Complete

**Summary:**

- Phase 1: 8 tasks — Foundation (workspace, Metro/monorepo seams, gates, first boot, ping)
- Phase 2: 5 tasks — Agent tooling (MCP config, testIDs, AGENTS.md, runbook scaffold, FR17 demo)
- Phase 3: 8 tasks — Tokens, theming, chrome kit (design-tokens, web refactor, RSD gate, kit)
- Phase 4: 7 tasks — Auth vertical slice (expo plugin, SecureStore sessions, screens, persistence)
- Phase 5: 7 tasks — Realtime + client-state (extraction, wsLink, useGameStream, lifecycle, verification)
- Phase 6: 8 tasks — Dashboard/create/join/lobby (guest registry, deep links, lobby controls)
- Phase 7: 9 tasks — Game surface core (cards, board, spotlight, hand, rail/timer, submission, assembly)
- Phase 8: 6 tasks — Advanced play (drag, sequence choice, dead cards, rotate, hard-mode e2e)
- Phase 9: 7 tasks — Lifecycle + pass-and-play (save/concede, freeze/resume, game over, rematch, handoff)
- Phase 10: 7 tasks — History/notifications/settings/polish (FR13–15, a11y/testID audit, themes)
- Phase 11: 7 tasks — Hardening (NFR matrices, perf, release audit, gates, runbook, docs, smoke)
- Phase 12: 15 tasks — TestFlight operator phase (pre-flight, EAS, builds, testers, device smoke, wrap) plus review-fix tasks

**Total: 94 tasks**

Ready for p01-p12 re-review, remaining Phase 12 operator work, and final
closeout.

---

## References

- Design: `design.md`
- Spec: `spec.md`
- Discovery: `discovery.md`
- Docs: `docs/architecture.md`, `docs/api-reference.md`, `docs/game-logic-reference.md`, `docs/styling.md`
- Web reference implementation: `apps/web/src/app/game/[id]/`
