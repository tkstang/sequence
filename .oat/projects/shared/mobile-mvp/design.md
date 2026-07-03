---
oat_status: in_progress
oat_ready_for: null
oat_blockers: []
oat_last_updated: 2026-07-03
oat_generated: false
oat_template: false
---

# Design: mobile-mvp

## Overview

This design adds a third runtime boundary to the monorepo: `apps/mobile`, an
Expo SDK 57 (React Native 0.86, New Architecture) iOS app that reaches full
feature parity with the web MVP. The approach follows discovery's validated
Chosen Direction (reaffirmed at design start): **hybrid React Strict DOM** —
RSD + shared StyleX-compatible tokens style the app chrome (auth, dashboard,
create/join, lobby shell, history, settings), while the game surface (board,
hand, chips, drag interactions) is built from plain React Native primitives
with Reanimated/gesture-handler, styled from the same tokens.

The architectural center of gravity does not move: `packages/api` remains the
sole authority for rules, persistence, auth, redaction, timers, and realtime.
The mobile app is a rendering client of the existing contract — it imports
`AppRouter` as a type, renders the snapshot-first subscription stream, submits
version-guarded mutations, and previews legal targets with the same
`@sequence/game-logic` display helpers the web uses. Two small shared packages
are extracted to prevent web/mobile drift: `@sequence/design-tokens` (raw
design values wrapped by web StyleX themes and native styles alike) and
`@sequence/client-state` (the `GameSnapshotView` view-model and
`applyStreamItem` event-application logic, moved out of `apps/web`).

Native-specific engineering concentrates in three seams: **auth transport**
(Better Auth's Expo integration stores the session cookie in SecureStore; the
client attaches it explicitly to HTTP headers and the WebSocket upgrade; guest
identity gets an additive, opt-in token return on `game.join`), **realtime
lifecycle** (a subscription manager reconciles tRPC `wsLink` with AppState
background/foreground transitions and dead-socket detection), and the
**gesture-driven game surface**.

Two execution-model commitments shape the plan. First, **agentic tooling**
(Expo MCP local tools, Argent, testID conventions, workspace agent
instructions) is a first-class early phase so the rest of the build runs with
an agent-verifiable simulator loop. Second, the project is **autonomy-first
(NFR7)**: Phases 1-11 are executable and verifiable by an agent alone on the
iOS Simulator; every operator-dependent step (Apple Developer enrollment,
App Store Connect, EAS setup, Expo account auth, physical-device and
external-tester verification) is consolidated into the final TestFlight phase
or explicitly optional, and each is documented in a durable **operator
runbook** (FR19) as it is designed, not after the fact.

## Architecture

### System Context

```
                    ┌─────────────────────────────────────────┐
                    │ Neon Postgres                           │
                    └──────────────▲──────────────────────────┘
                                   │ Drizzle
┌───────────────┐  HTTPS/WSS  ┌────┴────────────────────────────┐
│ apps/web      │────────────▶│ packages/api (Railway)          │
│ (Vercel)      │             │ Fastify + tRPC + Better Auth    │
└───────┬───────┘             │  + expo() plugin (NEW, additive)│
        │                     └────▲────────────────────────────┘
        │                          │ HTTPS/WSS (same contract)
        │                     ┌────┴───────────────┐
        │                     │ apps/mobile (NEW)  │
        │                     │ Expo SDK 57 / iOS  │
        │                     └────┬───────────────┘
        │   type-only AppRouter    │
        ├──────────────────────────┤
        │      shared packages     │
┌───────▼──────────────────────────▼──────────────────────────┐
│ packages/game-logic          (existing, unchanged)          │
│ packages/client-state        (NEW — extracted from web)     │
│ packages/design-tokens       (NEW — raw token source)       │
└─────────────────────────────────────────────────────────────┘
```

**Key Components:**

- **`apps/mobile`:** Expo app — expo-router navigation, RSD-styled chrome,
  native game surface, auth/session layer, realtime lifecycle manager,
  theming, dev playground (dev-only), agent-loop instrumentation (testIDs).
- **`packages/design-tokens` (new):** Framework-free raw design values
  (palette with light/dark pairs, spacing, radii, typography, z-index).
  Consumed by web `tokens.stylex.ts`/`themes.stylex.ts` and by mobile (RSD
  `css.defineVars` wrapper + game-surface theme hook).
- **`packages/client-state` (new):** `GameSnapshotView`, `GameStreamItem`,
  `applyStreamItem`, status/turn/timer view helpers, and the
  rule-violation-code → user-message catalog. Extracted from
  `apps/web/src/app/game/[id]/components/game-state.ts`; framework-free;
  Vitest-tested. Web is refactored to import it.
- **`packages/api` (additive changes only):** Better Auth `expo()` plugin,
  `trustedOrigins` for the app scheme, and an opt-in guest-token return on
  `game.join`.
- **Agent tooling config:** project `.mcp.json` (Expo MCP, Argent),
  `expo-mcp` dev dependency (local simulator tools), `apps/mobile/AGENTS.md`.
- **Operator runbook (new doc):** `docs/mobile-operator-runbook.md` — every
  operator step with prerequisites, actions, verification, and the phase
  that needs it; linked from `docs/index.md` (Operations).

### Component Diagram

```
apps/mobile/src
├── app/                          # expo-router routes (chrome = RSD)
│   ├── _layout.tsx               # providers: Query/tRPC, Auth, Theme, GestureRoot
│   ├── (auth)/login.tsx, signup.tsx
│   ├── index.tsx                 # dashboard
│   ├── create.tsx
│   ├── join/index.tsx            # code entry
│   ├── join/[code].tsx           # preview + join (deep-link target)
│   ├── game/[id].tsx             # game screen (native surface)
│   ├── history.tsx
│   ├── settings.tsx
│   └── dev/                      # dev-only playground (guarded)
├── api/                          # tRPC client, links, auth transport
├── auth/                         # Better Auth expo client, guest store
├── realtime/                     # useGameStream, AppState lifecycle
├── game/                         # native game surface components
│   ├── GameBoard/  CardHand/  PlayerRail/  LobbyTeams/
│   ├── GameOver/  HandoffScreen/  ActiveGameControls/
│   └── drag/                     # gesture-handler + Reanimated drag layer
├── theme/                        # RSD vars wrapper, ThemeProvider, useTheme
└── components/                   # shared RSD chrome components (Button, …)
```

### Data Flow

Unchanged from the web model, with mobile lifecycle grafted on:

1. Route `game/[id]` mounts `useGameStream(gameId)`.
2. The tRPC `wsLink` subscription (`game.onGameEvent`) authenticates via the
   cookie header on the WS upgrade; the server sends a redacted snapshot
   first, then tracked events.
3. Each `StreamItem` runs through `applyStreamItem` (from
   `@sequence/client-state`) into a single `GameSnapshotView` state; leaf
   components are prop-driven from it (same shape as web).
4. User actions submit version-guarded mutations
   (`makeMove`/`chooseSequenceCells`/…) over `httpBatchLink` with the session
   or guest cookie attached; results and opponent moves arrive as events on
   the stream.
5. AppState transitions drive the lifecycle manager: on foreground it
   verifies socket liveness and resubscribes with `lastEventId` (server
   gap-replays or re-snapshots); `keepAlive` ping/pong catches dead sockets
   in-session.
6. Legal-target previews (`validPlacements`) run locally via
   `@sequence/game-logic` against the current view — never authoritative.

## Component Design

### tRPC client + transport (`src/api/`)

**Purpose:** Typed access to the existing API with native credential
attachment.

**Responsibilities:**

- Build the tRPC client with `@trpc/tanstack-react-query` (`queryOptions`
  style) over a `splitLink`: subscriptions → `wsLink`, everything else →
  `httpBatchLink`.
- Attach credentials: `headers()` on the HTTP link returns a `Cookie` header
  assembled from the Better Auth session cookie (`authClient.getCookie()`)
  plus the per-game guest token when present. `fetch` runs with
  `credentials: 'omit'` (explicit header wins; avoids native cookie-jar
  ambiguity).
- WS auth: a small `WebSocket` subclass passed as the `wsLink` ponyfill
  injects the same `Cookie` header into the upgrade request (React Native's
  `WebSocket` supports an `options.headers` argument). No server change
  needed — the server already authenticates WS upgrades from cookies.
- `wsLink` config: `lazy: { enabled: true, closeMs: 30_000 }`, `keepAlive`
  enabled, exponential `retryDelayMs`.

**Interfaces:**

```typescript
// src/api/client.ts
export const queryClient: QueryClient;
export const trpc: TRPCOptionsProxy<AppRouter>; // createTRPCContext pattern
export function buildCookieHeader(gameId?: string): Promise<string | undefined>;

// src/api/ws.ts
export class AuthedWebSocket extends WebSocket {
  /* constructor injects { headers: { Cookie } } */
}
```

**Dependencies:** `@trpc/client`, `@trpc/tanstack-react-query`,
`@tanstack/react-query` v5, `@better-auth/expo` client, `AppRouter` type from
`@sequence/api` (type-only import — enforced, as on web).

**Design Decisions:**

- Cookie-header injection over `connectionParams`: keeps the server's WS auth
  path identical for web and mobile (zero server change). `connectionParams`
  remains a documented fallback if header injection proves unreliable.
- `credentials: 'omit'` + explicit header (Better Auth's documented Expo
  pattern) rather than relying on iOS's implicit NSHTTPCookieStorage —
  deterministic and debuggable.

### Auth + session layer (`src/auth/`)

**Purpose:** Registered-user sessions and game-scoped guest identity on
native.

**Responsibilities:**

- `authClient` via Better Auth's Expo client plugin: SecureStore-backed
  session cookie, cached session for spinner-free cold starts, `useSession`
  hook, login/signup/logout calls against `/api/auth/*`.
- Guest store: after a guest `game.join`, persist the returned guest token in
  SecureStore keyed by game id; `buildCookieHeader(gameId)` merges it as the
  `sequence_guest` cookie for that game's calls/subscription.
- Route guarding: unauthenticated users land on `(auth)/login`; guests can
  reach only `join/*` and their joined `game/[id]`.

**Interfaces:**

```typescript
// src/auth/client.ts
export const authClient: /* better-auth expo client */;
// src/auth/guest-store.ts
export async function saveGuestToken(gameId: string, token: string): Promise<void>;
export async function getGuestToken(gameId: string): Promise<string | null>;
```

**Dependencies:** `better-auth` client, `@better-auth/expo`,
`expo-secure-store`; server counterpart below.

**Design Decisions:**

- SecureStore keys use only `[A-Za-z0-9._-]` (documented SecureStore
  constraint; Better Auth had real bugs here) — keys like
  `sequence.guest.<uuid>` — and values are size-checked (SecureStore ~2KB
  soft limit; the guest token is small).
- Session persistence is the project's first vertical spike (Phase 4) — it
  is the highest-blast-radius unknown, and it is verifiable on the simulator
  (no operator dependency).

### API server changes (`packages/api`) — additive only

**Purpose:** Accept native clients without altering web behavior.

**Responsibilities / changes:**

1. Register Better Auth's `expo()` plugin and extend `trustedOrigins` with
   the app scheme (`sequence://`) — plus `exp://` wildcards in non-production
   for dev clients.
2. `game.join`: accept optional `returnGuestToken?: boolean`; when true and a
   guest joins, include the signed guest token in the response body
   (`guestToken?: string`) in addition to the httpOnly cookie. Web never
   sends the flag; behavior is unchanged for existing clients.
3. No other route, schema, or persistence changes.

**Design Decisions:**

- Returning the token in-body to the same caller that receives it as a cookie
  is equivalent trust (the cookie's `httpOnly` protects against browser XSS,
  which does not apply to a native client storing it in SecureStore). Gating
  on an explicit request flag keeps the web response shape untouched.
- CORS needs no change: native requests are not browser-governed; Better
  Auth's origin/CSRF checks are what the `expo()` plugin + `trustedOrigins`
  address.

### Realtime lifecycle manager (`src/realtime/`)

**Purpose:** Keep one live, correct game stream across mobile realities.

**Responsibilities:**

- `useGameStream(gameId)`: owns the `game.onGameEvent` subscription, applies
  items via `applyStreamItem`, exposes `{ view, connectionState }`.
- Track the last applied `seq`; on resubscribe pass it as `lastEventId` so
  the server gap-replays or re-snapshots (its existing recovery contract).
- AppState listener: on `active`, if the app was backgrounded or the
  subscription errored/closed, force a resubscribe; rely on `keepAlive` for
  in-session dead-socket detection.
- Surface `connectionState` (`connecting` / `live` / `reconnecting`) for UI
  banners; presence/freeze semantics come from the server as on web.
- Mutation error policy: `CONFLICT` (stale version) → "game updated"
  feedback and let the stream's next items reconcile; `BAD_REQUEST` with
  `ruleViolation` → feedback from the shared code catalog.

**Interfaces:**

```typescript
export function useGameStream(gameId: string): {
  view: GameSnapshotView | null;
  connectionState: 'connecting' | 'live' | 'reconnecting';
};
```

**Dependencies:** tRPC client, `@sequence/client-state`, React Native
`AppState`.

**Design Decisions:**

- Known upstream issue (tRPC #6962: server-side subscription close can leave
  the client `pending`): the AppState-driven resubscribe plus a stream
  inactivity watchdog (no item and no ping-ack beyond keepAlive windows →
  tear down and resubscribe) bounds the damage deterministically.

### Shared client state (`packages/client-state` — extraction)

**Purpose:** One view-model and one event-application semantics for all
clients.

**Responsibilities:** `GameSnapshotView` + related view types,
`applyStreamItem`, status/turn/deadline helpers, and the
rule-violation-code → message catalog (today embedded in web components).
Test fixtures (`game-fixtures` shapes) are exported for reuse by web's `/dev`,
mobile's playground, and tests.

**Dependencies:** `@sequence/game-logic` types only. Framework-free — no
React/DOM/RN imports (same discipline as game-logic).

**Design Decisions:**

- Extraction over duplication: this reducer is the exact "share logic, not
  UI" boundary; duplicating it guarantees drift in event handling.
- Mechanical web refactor: move `game-state.ts` (+ its tests, on Vitest) into
  the package, update imports; no behavior change, verified by the moved
  tests and existing web suites.

### Design tokens (`packages/design-tokens` — new)

**Purpose:** Single source of design values for both platforms.

**Schema shape (raw, framework-free):**

```typescript
export const palette: {
  light: Record<ColorToken, string>;
  dark: Record<ColorToken, string>;
};
export const space, radius, fontSize, fontWeight, lineHeight, zIndex, fontFamily;
```

**Consumers:**

- Web: `tokens.stylex.ts` builds `defineVars` from `palette.light` (+
  `prefers-color-scheme` dark defaults) and `themes.stylex.ts` builds
  `createTheme` overrides from `palette.dark` — output CSS must be
  value-identical to today (colors are moved, not changed).
- Mobile chrome: `src/theme/vars.css.ts` wraps the same values in RSD
  `css.defineVars` with in-definition `@media (prefers-color-scheme: dark)`
  dark values.
- Mobile game surface: `useTheme()` resolves `palette[scheme]` + dimensions
  for plain-RN styles.

**Design Decisions:**

- Share raw values, not `.stylex.ts` files — sidesteps RSD's bundled-StyleX
  version skew (0.15.x) vs web StyleX (0.19.x).
- StyleX must statically evaluate the cross-package import in web's
  `defineVars` files; verified in the token-refactor step (StyleX
  shareable-tokens recipe / `unstable_moduleResolution`). Fallback if the
  compiler balks: a trivial codegen step emitting the web `.stylex.ts` from
  the package (vox pattern), same source of truth.
- Typing forces every color key to exist in both `light` and `dark` — the
  web's "add to both themes" convention becomes a compile error.

### Theming (`src/theme/`)

**Purpose:** Light/dark parity with web's layered model.

**Responsibilities:** `ThemeProvider` holds mode (`light`/`dark`/`system`),
persists to AsyncStorage (`sequence-theme`, matching web's key), applies
manual override via `Appearance.setColorScheme()` (which RSD's
`prefers-color-scheme` polyfill and `useColorScheme` both respect), exposes
`useTheme()` returning `{ mode, scheme, colors }` for the game surface.

**Design Decisions:** OS-default with persisted manual override mirrors web
exactly; AsyncStorage (not SecureStore) because the preference is not a
secret.

### App chrome (RSD screens + components)

**Purpose:** All non-game screens, in the shared StyleX mental model.

**Responsibilities:** login/signup, dashboard (resumables/recents via
`game.myGames`), create form, join flow (code entry → `game.preview` card →
join), history (record, paginated list, head-to-head), settings (theme
toggle, logout), and a small RSD component kit (Button, TextField, Card,
Badge, Screen scaffold) built once and reused.

**Design Decisions:**

- RSD elements (`html.*` + `css.create`) with tokens from `vars.css.ts`;
  `data-layoutconformance="strict"` set at the root.
- RSD's native CSS subset suffices here (flexbox layouts; no grid needed in
  chrome); anything that fights the subset gets a plain-RN escape hatch
  locally rather than abandoning the approach globally.
- Fallback (pre-agreed in discovery): if the early RSD spike fails on SDK 57,
  chrome moves to Unistyles v3 consuming the same tokens; screen structure
  and the component kit API are styling-agnostic to keep that swap cheap.

### Game surface (plain RN: `src/game/`)

**Purpose:** The interaction-heavy heart of the app.

**Components (mirroring web's prop-driven leaves, same `GameSnapshotView`
inputs):**

- **GameBoard:** 10×10 grid from `BOARD_MAP` rendered as flexbox rows (no
  CSS-grid dependency); each cell = memoized card SVG + chip overlay
  (team-colored circle, lock indicator) + spotlight dim layer. Tap mode:
  when a selected card yields `validTargets`, non-target cells dim (the
  web's spotlight affordance); tapping a target submits. Optional
  rotate-the-board control (parity). Cell layout is computed (screen width /
  10) and registered in a shared layout map for drag hit-testing.
- **CardHand:** bottom-docked hand; tap to select (tap mode) or the drag
  source (drag mode); dead cards badged in hard mode with the turn-in
  affordance.
- **Drag layer (`src/game/drag/`):** gesture-handler `Pan` + Reanimated
  shared values drive a chip ghost on the UI thread; on move, hit-test
  against the board layout map for the hover-confirm highlight; on release,
  submit `makeMove` (card inferred server-side in drag mode). No
  pre-highlighting, per hard-mode rules.
- **PlayerRail, LobbyTeams, ActiveGameControls, GameOver, HandoffScreen,
  TimerBadge:** direct ports of web semantics; LobbyTeams adds native share
  for the invite code; HandoffScreen gates local-mode turns; TimerBadge
  renders the server deadline (`turnDeadlineAt`) with a local ticking
  countdown re-synced on every event.
- **Sequence-choice sheet:** when `pendingChoice` is present for my seat, a
  bottom sheet guides picking the 5-cell window (validated client-side for
  UX, authoritatively by `chooseSequenceCells`).

**Design Decisions:**

- SVG cards: reuse the existing web card assets via
  `react-native-svg-transformer` (SVGs import as components); memoized per
  rank+suit; board cells render small, the hand large — one asset set, two
  scales. If SVG-per-cell profiling disappoints, contingency is rasterized
  sprites via `expo-image` (decision gate in the hardening phase).
- All interactive elements carry `testID`s from a documented naming scheme
  (e.g. `board.cell.1AC`, `hand.card.JH`, `lobby.start`) — serving the agent
  loop (Expo MCP tap-by-testID, Argent a11y tree) and future Maestro flows.

### Dev playground (`src/app/dev/` — dev-only)

**Purpose:** Fixture-driven rendering of game-surface components for agent
iteration (the mobile analog of web's `/dev`).

**Responsibilities:** Render each leaf component from
`@sequence/client-state` fixtures; theme toggle inside the playground.
Excluded from release builds via `__DEV__` gating at the route-group layout
(screens unregistered in production).

**Design Decisions:** Deliberately minimal (list + detail screen, no
viewport tooling — the simulator IS the viewport). Kept because the agent
loop's screenshot/tap verification multiplies in value against isolated
components.

### Agent tooling configuration

**Purpose:** FR17 — a committed, documented agent loop that works without
operator involvement.

**Deliverables:**

- Project `.mcp.json`: `argent` (stdio via `npx @swmansion/argent`) and
  `expo` (HTTP transport → `https://mcp.expo.dev/mcp`) entries.
- `expo-mcp` as a mobile dev dependency (local tools: simulator screenshot,
  tap-by-testID, RN DevTools, logs) — active when the dev server runs; no
  account required.
- `apps/mobile/AGENTS.md`: the loop (build → launch → screenshot → drive →
  inspect), command reference, testID convention, dev-build requirement for
  Argent profiling, and fallbacks (`xcrun simctl` screenshots, Orca
  computer-use) when MCP tools are unavailable.
- Xcode MCP intentionally not configured (no external simulator tools as of
  Xcode 27 beta 1); revisit tracked in backlog.

**Autonomy note (NFR7):** the required loop is Argent + local `expo-mcp` +
`simctl` — none need an account. The **remote** Expo MCP server requires an
Expo-account OAuth: it is **optional**, adds docs-search/EAS tooling only,
and its login steps go in the operator runbook (used at latest in Phase 12
for EAS anyway).

### Operator runbook (`docs/mobile-operator-runbook.md` — new)

**Purpose:** FR19 — no operator step lives as tribal knowledge.

**Structure:** one section per operator concern, each with *Why / When
(phase) / Prerequisites / Steps / Verify / Troubleshooting*:

1. Expo account + EAS project setup (and optional Expo MCP remote OAuth).
2. Apple Developer Program enrollment.
3. App Store Connect app record + bundle identifier.
4. EAS Build credentials/signing (managed by EAS; what to click/approve).
5. TestFlight internal/external tester groups and invites.
6. Physical-device verification checklist (the operator-dependent slice of
   NFR2/NFR3 verification).
7. Production smoke checklist (two-human multiplayer game).

**Design Decisions:** Lives in `docs/` (Operations section, beside
`deployment.md`, linked from `docs/index.md`) because it is durable repo
documentation, not project-scoped ephemera; the project may keep phase notes
pointing into it. Written incrementally — each phase that *discovers* an
operator need appends its section then, so Phase 12 is execution, not
authoring.

## Data Models

No database changes. New/moved client-side models:

### `GameSnapshotView` (moved to `@sequence/client-state`)

**Purpose:** The single view-model all game UI renders from (shape unchanged
from web — `gameId`, `status`, `mySeat`, `currentSeat`, `version`, `board`,
`sequences`, `players`, `hand`, `localHands?`, `pendingChoice?`, timer
fields, outcome fields).

**Validation Rules:** Constructed only by `applyStreamItem` from server
items; never hand-assembled in UI code.

**Storage:** In-memory per game screen; never persisted on device.

### Guest token record (mobile)

**Schema:** SecureStore entries `sequence.guest.<gameId>` → signed token
string (server-issued, opaque).

**Validation Rules:** Sent back verbatim as the `sequence_guest` cookie
value; deleted when the game reaches `finished` (or on
`NOT_FOUND`/`FORBIDDEN` for that game).

**Storage:** iOS Keychain via `expo-secure-store`.

### Theme preference (mobile)

**Schema:** AsyncStorage `sequence-theme` → `'light' | 'dark' | 'system'`.

**Storage:** AsyncStorage (non-secret).

### Design tokens (`@sequence/design-tokens`)

**Schema:** As in Component Design; token names mirror web's existing groups
so the web refactor is a value-preserving move. Every color key must exist in
both `light` and `dark` (typed as one key union).

## API Design

No new endpoints. Contract deltas and mobile usage of the existing surface:

### `game.join` (additive input/output)

**Method:** tRPC mutation (existing).

**Request (delta):**

```typescript
{ inviteCode: string; guestName?: string; returnGuestToken?: boolean } // NEW flag
```

**Response (delta):**

```typescript
{ gameId: string; seat: number; team: number; isGuest: boolean; guestToken?: string } // NEW, only when flag && guest
```

**Error Handling:** unchanged (`NOT_FOUND`, `FORBIDDEN` local, `CONFLICT`
full/started, `BAD_REQUEST` missing guestName, `TOO_MANY_REQUESTS`).

**Authorization:** unchanged (public, shared anonymous rate-limit bucket —
mobile guests share it; acceptable at MVP scale).

### Better Auth surface

`/api/auth/*` gains the `expo()` plugin server-side; the mobile client
authenticates through Better Auth's Expo client. `trustedOrigins` extended
with `sequence://` (and `exp://**` outside production). Session semantics,
cookie attributes, and web behavior unchanged.

### Transport contract for native clients (documentation, not new code)

- HTTP: `Cookie` header assembled client-side; `credentials: 'omit'`.
- WS: same `Cookie` header injected on the upgrade via the ponyfill.
- Errors: clients render `error.data.ruleViolation.code` through the shared
  catalog; never string-match messages (existing contract, now codified in
  `@sequence/client-state`).

## Security Considerations

### Authentication

Better Auth session cookie in SecureStore (never AsyncStorage); guest tokens
in SecureStore per game. No credentials in JS-visible persistent storage.

### Authorization

Unchanged and server-side: seat resolution, creator checks, redaction. The
client adds no authority; it only chooses which credential to attach.

### Data Protection

- **Encryption:** TLS-only in production (https/wss); iOS ATS
  default-enforced (dev builds allow localhost http/ws via Expo's standard
  dev exceptions).
- **PII Handling:** Only the user's own email/name are on-device (session).
  Opponent hands never reach the device (server redaction, NFR1); local-mode
  hands exist only in memory behind the handoff gate.
- **Input Validation:** Server-side Zod on every procedure (existing). Client
  validates invite codes/names for UX only. Deep-link params are untrusted
  input: the code goes to `game.preview` and nowhere else.

### Threat Mitigation

- **Token theft from device:** Keychain-backed SecureStore; tokens are
  game-scoped (guest) or revocable sessions (Better Auth).
- **Guest-token-in-body exposure:** Only returned when explicitly requested
  by the native caller who would receive the identical token as a cookie;
  never logged; excluded from error payloads.
- **Dev surface leakage:** `__DEV__`-gated playground routes plus a
  release-audit checklist item verifying dev screens and `expo-mcp` are
  absent from production bundles (web's `/dev` leak was a real prior
  incident — treat as a known failure mode with an explicit check).
- **Invite enumeration:** existing shared anonymous limiter unchanged.

## Performance Considerations

### Scalability

No server impact: one more client type over the same contract; MVP remains a
single API instance. Client-side, the board is a fixed 100-cell grid — no
virtualization needed.

### Caching

- TanStack Query defaults with modest `staleTime` for dashboard/history;
  game state is subscription-driven (no polling).
- Card SVG components memoized module-level; board cells `React.memo` keyed
  on `(chip, lockedBy, spotlight, hover)` so an event re-renders only
  affected cells.
- React Compiler enabled — but memo boundaries on the 100-cell board are
  designed explicitly, not left to the compiler.

### Database Optimization

None — no schema or query changes.

### Resource Limits

- **Memory:** 52 memoized SVG card components + board overlay state —
  trivial for iPhone-class devices; confirmed via Argent profiling in the
  hardening phase.
- **CPU/GPU:** Drag ghost + spotlight dimming run as Reanimated UI-thread
  work; target: no JS-thread work per drag frame.
- **Network:** WS keepalive pings are small and infrequent; events are small
  JSON; cold-start snapshot ≈ board + hand.

## Error Handling

### Error Categories

- **User/rule errors:** `BAD_REQUEST` with `ruleViolation.code` → toast +
  haptic from the shared catalog (same wording as web).
- **Concurrency:** `CONFLICT` → non-blocking "game updated" feedback; the
  stream reconciles state; the attempted action is discarded (never queued).
- **Auth errors:** `UNAUTHORIZED` → session refresh attempt, then route to
  login preserving the return path; `FORBIDDEN` on a game → "not a
  participant" state.
- **System/network errors:** connection banner from `connectionState`;
  mutations fail fast with a retry affordance (no optimistic writes —
  server-authoritative rendering everywhere).

### Retry Logic

- Subscriptions: `wsLink` exponential backoff + AppState-triggered
  resubscribe; `lastEventId` resume; inactivity watchdog (see Realtime).
- Mutations: no automatic retry (the version guard makes blind retry wrong);
  user-initiated retry after the stream reconciles.
- Queries: TanStack Query defaults (retries with backoff) — safe, idempotent.

### Logging

- **Info:** connection lifecycle transitions, subscription resume points
  (dev builds).
- **Warn:** watchdog-triggered resubscribes, CONFLICT occurrences.
- **Error:** unhandled mutation/query failures, error-boundary catches.
- Console-based behind a thin logger module; production console stripped
  (babel transform, vox pattern). Crash reporting deliberately deferred (see
  Open Questions).

## Testing Strategy

### Requirement-to-Test Mapping

| ID | Verification | Key Scenarios |
| --- | --- | --- |
| FR1 | integration + manual | signup/login/logout against local API; force-quit → relaunch stays logged in (simulator); authed query + WS both work |
| FR2 | manual + unit | preview card renders; guest join seats + plays; relaunch → guest still in game; `sequence://join/<code>` routes with code prefilled |
| FR3 | unit + manual | dashboard renders resumables/recents fixtures; navigation per status |
| FR4 | unit + manual | create form validation (counts/mode/timer/local); remote → lobby, local → active |
| FR5 | manual + unit | two clients (mobile sim + web) see join/team/kick/randomize live; start gated on legal layout; share sheet |
| FR6 | unit + manual | board/hand render from fixtures (all cell states); spotlight only on selection; jack plays; live 2-client game; stale version recovers |
| FR7 | manual + unit | drag ghost tracks smoothly (simulator + profiler); no hints; illegal drop feedback |
| FR8 | unit + manual | pending-choice sheet (incl. chained runs); dead-card turn-in once/turn; auto-swap surfaced |
| FR9 | unit + manual | countdown from `turnDeadlineAt` fixture; re-sync after background; server forfeit reflected |
| FR10 | manual + unit | save→resumables; concede outcomes (2-team, 3-team); freeze/resume banners across disconnect |
| FR11 | unit + manual | handoff gates hand visibility; local save; aggregates exclusion (server-verified) |
| FR12 | unit + manual | outcome rendering matrix; rematch → all clients land in new lobby |
| FR13 | unit + manual | record/list/head-to-head fixtures; pagination |
| FR14 | unit + manual | event → toast mapping; violation catalog covers all 13 codes |
| FR15 | unit + manual | system tracking; manual override persists; both-themes screenshot pass |
| FR16 | unit + manual | web suites green post-refactor; `/dev` playground visual parity; token add propagates to both platforms |
| FR17 | manual | scripted demo: agent builds, launches, screenshots, taps by testID, reads logs from committed config — no operator involvement |
| FR18 | manual (operator) | TestFlight install by external tester; production game end-to-end; smoke checklist |
| FR19 | manual | runbook completeness review against the operator-step inventory; each step has verify instructions |
| NFR1 | integration + manual | existing server redaction tests remain the guarantee; client store inspected for absence of foreign hands; handoff privacy |
| NFR2 | manual | simulator scenario matrix: brief background, >replay-window background, dev-server kill/restart, force-quit mid-game; device-network cases deferred to the runbook's device checklist |
| NFR3 | perf + manual | Argent/DevTools profile of drag + event application (simulator); device spot-check deferred to runbook checklist |
| NFR4 | manual | release build audit: no dev routes, no expo-mcp, https/wss only, SecureStore-only credentials |
| NFR5 | unit + manual | testID convention spot-check; agent tap-by-testID demo |
| NFR6 | manual | root `typecheck`/`lint`/`format:check`/`test` include mobile and pass |
| NFR7 | manual | phase audit: every Phase 1-11 task/verification executable agent-only; operator steps consolidated in Phase 12 + runbook |

### Unit Tests

- **Scope:** jest-expo + `@testing-library/react-native` for mobile
  components/hooks (chrome screens with mocked tRPC; game-surface leaves from
  fixtures; realtime manager with a scripted stream); Vitest for
  `@sequence/client-state` (tests move with the extraction) and
  `@sequence/design-tokens` (both-themes key parity).
- **Coverage Target:** high for game-surface leaves, realtime manager, and
  client-state (these encode behavior); smoke-level for chrome screens.
- **Key Test Cases:** applyStreamItem event matrix (moves from web);
  spotlight gating; handoff gating; deadline computation; violation catalog
  completeness against game-logic's 13 codes.

### Integration Tests

- **Scope:** No new server suite — the API's existing Vitest integration
  tests already cover the contract. One addition: `game.join`
  `returnGuestToken` coverage in the API suite.
- **Test Environment:** existing Neon test-branch harness (unchanged).

### End-to-End Tests

- **Scope:** Manual + agent-driven for v1 (Maestro deferred to backlog by
  decision). Documented smoke flows executed via the agent loop (Expo MCP
  tap-by-testID + screenshots, simulator-only): auth, create, 2-client
  join+play-to-win (mobile sim vs web), pass-and-play, save/resume, concede,
  rematch, timers. Operator-dependent e2e (device, TestFlight, two humans)
  lives in the runbook and Phase 12.
- The testID discipline (NFR5) is written so these flows convert directly to
  Maestro YAML later.

## Deployment Strategy

### Build Process

- Dev loop: CNG/prebuild (native dirs gitignored), `expo run:ios` local dev
  builds (precompiled frameworks ≈ 1-min clean builds), Metro dev server via
  `pnpm --filter @sequence/mobile start`.
- Release: EAS Build with `eas.json` profiles — `development` (dev client,
  simulator), `preview` (internal device installs), `production`
  (TestFlight).

### Deployment Steps (final phase, runbook-driven)

1. Operator pre-flight per runbook: Apple Developer Program, App Store
   Connect record + bundle identifier, EAS account/project link.
2. `eas build --profile production --platform ios` → App Store Connect.
3. TestFlight internal group → external tester group (runbook section).
4. Production smoke checklist: install, auth, create/join across two devices
   vs production API, background/resume, complete a game.

### Rollback Plan

TestFlight: expire/supersede the build with the previous one. No OTA in v1
(EAS Update is backlogged), so rollback = build promotion only.

### Configuration

- **Environment Variables (mobile):** `app.config.ts` `extra`:
  `apiUrl`/`wsUrl` — defaults `http://localhost:3001` / `ws://localhost:3001`
  in development, Railway `https://…`/`wss://…` in production (build-profile
  driven; no staging tier exists). App scheme: `sequence`.
- **Server:** no new required env vars; `trustedOrigins` additions are
  code-level.
- **Feature Flags:** none.

### Monitoring

None client-side in v1 (crash reporting deferred — see Open Questions);
server monitoring unchanged. TestFlight feedback + crash organizer serve the
final phase.

## Migration Plan

No database or data migrations. Two code moves inside the repo (web token
source swap; `game-state.ts` → `@sequence/client-state`), each verified by
existing web gates and visual parity in `/dev`. Rollback is git.

## Open Questions

- **Bundle identifier + display name:** proposal `com.tkstang.sequence` /
  "Sequence" — needs owner confirmation before Phase 12 (changing later is
  painful); recorded in the runbook when decided.
- **Crash reporting:** deferred entirely in this design; confirm, and if
  wanted later, file as backlog (Sentry RN is the obvious candidate).
- **Board rotate control:** carried as parity; cheap on native (Reanimated
  rotation) but explicitly cuttable if the game-surface phases run long.

## Implementation Phases

**Operator model (NFR7):** Phases 1-11 are agent-executable and
simulator-verifiable end-to-end; no required operator step exists before
Phase 12. The only optional operator touchpoint earlier is the Expo MCP
remote OAuth (Phase 2 — skippable; the loop works with Argent + local
expo-mcp + simctl). Each phase that surfaces a future operator need appends
its runbook section immediately (FR19), so Phase 12 is execution against
existing docs, not documentation writing.

### Phase 1: Foundation

**Goal:** `apps/mobile` exists, boots on the iOS Simulator, and proves the
monorepo seams.

**Tasks:** Expo SDK 57 scaffold (`src/` + expo-router, TypeScript, New
Arch); Metro monorepo config; prove `@sequence/game-logic` + `AppRouter`
type-only imports (explicit-`.ts`-extension spike); oxlint/oxfmt/jest-expo
wiring; root gate integration; `health.ping` screen against a local API.

**Verification:** App renders a successful `health.ping` on the simulator;
root gates green. (Agent-only.)

### Phase 2: Agent tooling

**Goal:** The agent loop works before feature work begins.

**Tasks:** `.mcp.json` (Argent; Expo MCP entry with OAuth marked optional);
`expo-mcp` local tools; `apps/mobile/AGENTS.md`; testID convention doc; demo
script (build → launch → screenshot → tap → logs); runbook scaffold created
with the Expo-account section (optional-now, required-by-Phase-12).

**Verification:** FR17 demo executed end-to-end by an agent with no operator
involvement.

### Phase 3: Tokens + theming + chrome kit

**Goal:** Shared design language on both platforms.

**Tasks:** `packages/design-tokens`; web refactor to consume it (visual
parity check in `/dev`); RSD setup + spike sign-off (`vars.css.ts`,
`data-layoutconformance`); ThemeProvider; RSD component kit (Button,
TextField, Card, Screen).

**Verification:** FR16 criteria; themed kit renders on simulator in both
schemes; web gates green. (Agent-only.)

### Phase 4: Auth vertical slice

**Goal:** The riskiest seam proven: sessions on device storage.

**Tasks:** API `expo()` plugin + trustedOrigins; login/signup screens; tRPC
client with cookie-header transport; SecureStore session persistence;
`health.me` probe; force-quit/restart validation on simulator.

**Verification:** FR1 acceptance criteria on the simulator (physical-device
re-run listed in the runbook device checklist). (Agent-only.)

### Phase 5: Realtime plumbing + client-state extraction

**Goal:** Live game data flows end-to-end.

**Tasks:** Extract `@sequence/client-state` (web refactor + moved tests);
`AuthedWebSocket` + wsLink; `useGameStream` with AppState lifecycle +
watchdog; connection banners; raw event-feed debug screen.

**Verification:** Two clients (mobile sim + web) see each other's
lobby/game events live; background/foreground recovery scenarios pass on
simulator. (Agent-only.)

### Phase 6: Dashboard, create, join, lobby

**Goal:** Everything up to the first move.

**Tasks:** Dashboard (`game.myGames`); create form; join flow (code entry,
preview, guest join incl. `returnGuestToken` server change + SecureStore
guest store); scheme deep links (`simctl openurl` verifiable); lobby (teams,
kick, randomize, start, share).

**Verification:** FR2-FR5 acceptance criteria; guest relaunch scenario.
(Agent-only.)

### Phase 7: Game surface — core play (tap mode)

**Goal:** A playable game.

**Tasks:** GameBoard (grid, SVG cards, chips, sequences, spotlight);
CardHand; PlayerRail; tap-mode move submission; turn flow; TimerBadge;
violation feedback; dev playground with fixtures.

**Verification:** FR6 + FR9 criteria; full tap-mode game mobile-sim-vs-web.
(Agent-only.)

### Phase 8: Game surface — advanced play

**Goal:** Rules-complete parity.

**Tasks:** Drag mode (gesture layer, hover-confirm, rejection feedback);
sequence-choice sheet (incl. chained); dead-card turn-in; auto-swap
surfacing; board rotate control.

**Verification:** FR7 + FR8 criteria on simulator. (Agent-only.)

### Phase 9: Lifecycle + local pass-and-play

**Goal:** Every game state reachable and recoverable.

**Tasks:** Save & exit, concede, freeze/resume UX, expiry states; local
create → HandoffScreen flow → local save; GameOver + rematch.

**Verification:** FR10-FR12 criteria across the lifecycle matrix.
(Agent-only.)

### Phase 10: History, notifications, settings, polish

**Goal:** Full parity surface complete.

**Tasks:** History screens; in-app notification affordances
(toasts/haptics); settings (theme toggle, logout); both-themes screenshot
pass; a11y labels pass; empty/loading/error states.

**Verification:** FR13-FR15 criteria. (Agent-only.)

### Phase 11: Hardening

**Goal:** NFR closure before distribution — everything verifiable without an
operator.

**Tasks:** NFR2 simulator scenario matrix; perf pass (Argent profiling,
board memo audit, SVG contingency decision); release-build audit (NFR4);
gate sweep (NFR6); NFR7 phase audit; docs (workspace README/AGENTS, docs/
map updates, configuration reference); runbook completeness review against
the operator-step inventory (FR19).

**Verification:** NFR1-NFR7 evidence recorded (simulator scope); runbook
review passes; docs current. (Agent-only.)

### Phase 12: TestFlight (operator phase)

**Goal:** FR18 — external testers playing against production. This is the
single consolidated operator phase.

**Tasks (each mapped to a runbook section):** Apple Developer Program
enrollment; App Store Connect record + bundle identifier confirmation; EAS
account/project setup (+ optional Expo MCP remote OAuth if not done); EAS
production build; TestFlight internal → external groups; physical-device
verification checklist (deferred NFR2/NFR3 device cases); production smoke
(two-human multiplayer game); deployment docs finalized.

**Verification:** FR18 acceptance criteria; HiLL `final` checkpoint with the
operator.

## Dependencies

### External Dependencies

- **Expo SDK 57** (RN 0.86, React 19.2) — pinned; SDK-bundled versions for
  reanimated (4.5), gesture-handler (2.32), react-native-svg, SecureStore,
  AsyncStorage.
- **react-strict-dom** — pinned exact version (0.0.55 at design time);
  upgraded deliberately, never `^`.
- **@trpc/client + @trpc/tanstack-react-query 11.x, @tanstack/react-query
  5.x** — client-side only.
- **better-auth + @better-auth/expo** — version-locked to the server's
  `better-auth`.
- **react-native-svg-transformer** — Metro SVG-as-component imports.
- **EAS CLI** — Phase 12 only.

### Internal Dependencies

- **@sequence/game-logic** — unchanged; consumed for types, display helpers,
  board map.
- **@sequence/api** — type-only `AppRouter`; additive server changes (expo
  plugin, join flag).
- **@sequence/client-state, @sequence/design-tokens** — new; web refactored
  to consume both.
- **apps/web** — two mechanical refactors (tokens, game-state extraction);
  no behavior change.

### Development Dependencies

- **jest-expo, @testing-library/react-native** — mobile tests.
- **expo-mcp, @swmansion/argent** — agent loop (dev-only).
- **oxlint, oxfmt** — repo-standard lint/format.

## Risks and Mitigation

- **RSD on SDK 57 fails the spike:** Probability: Medium | Impact: Medium
  - **Mitigation:** Spike lands in Phase 3 before any chrome is built;
    component kit API is styling-agnostic.
  - **Contingency:** Swap chrome styling to Unistyles v3 over the same
    tokens (pre-agreed); game surface unaffected.
- **Better Auth Expo session persistence misbehaves:** Probability: Medium |
  Impact: High
  - **Mitigation:** Phase 4 is a dedicated vertical slice; versions pinned;
    SecureStore key/size constraints designed around.
  - **Contingency:** Manual session-token handling against Better Auth's
    HTTP API (the cookie is ours to store; the plugin is convenience, not
    load-bearing).
- **Metro can't resolve repo import conventions:** Probability: Low-Medium |
  Impact: Medium
  - **Mitigation:** Phase 1 proves game-logic imports before anything else.
  - **Contingency:** Metro `resolveRequest` shim for explicit-`.ts`
    specifiers; worst case, a build step for consumed packages.
- **WS lifecycle edge cases (incl. tRPC #6962):** Probability: High |
  Impact: Medium
  - **Mitigation:** Watchdog + AppState resubscribe + `lastEventId` resume
    designed in; NFR2 scenario matrix is a phase gate.
  - **Contingency:** Aggressive resnapshot-on-foreground mode (always
    resubscribe fresh), trading bandwidth for certainty.
- **Guest cookie transport surprises:** Probability: Medium | Impact: Medium
  - **Mitigation:** Explicit token return designed in (no reliance on native
    cookie jars); additive API change covered in the existing suite.
  - **Contingency:** `connectionParams`-based WS auth (server reads params in
    `createContext`) if header injection fails.
- **SVG-per-cell board performance:** Probability: Low-Medium | Impact: Low
  - **Mitigation:** Memoization design; Argent profiling in Phase 11.
  - **Contingency:** Rasterized card sprites via expo-image.
- **Scope drag (12 phases):** Probability: Medium | Impact: Medium
  - **Mitigation:** Playable core exists by Phase 7; Phases 10-11 are
    quality gates, not new surface; deferred list already carved to backlog.
  - **Contingency:** Demote P1 items (history/notifications/theme toggle)
    into the iterate stream if the final review demands it.
- **Operator unavailability stalls the finish:** Probability: Low | Impact:
  Low
  - **Mitigation:** NFR7 structure — nothing before Phase 12 waits on the
    operator; the runbook makes Phase 12 a checklist, not a discovery.
  - **Contingency:** Project pauses cleanly at the Phase 11/12 boundary with
    a complete, simulator-verified app.

## References

- Specification: `spec.md`
- Discovery: `discovery.md`
- Architecture: `docs/architecture.md`
- API contract: `docs/api-reference.md`
- Rules engine: `docs/game-logic-reference.md`
- Styling system: `docs/styling.md`
- Web workspace conventions: `apps/web/AGENTS.md`
- Research briefs: brainstorm session 2026-07-02 (summarized in discovery)
