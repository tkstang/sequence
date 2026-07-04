# Architecture

Sequence Online is a pnpm workspace with four runtime boundaries and two shared
client packages:

- `apps/web` renders the browser experience with Next.js.
- `apps/mobile` renders the iOS experience with Expo Router and React Native.
- `packages/api` hosts auth, tRPC HTTP/WS, game persistence, timers, and
  realtime fanout.
- `packages/game-logic` owns the pure rules engine used by API, web, and mobile.
- `packages/client-state` owns the shared redacted game-view state helpers.
- `packages/design-tokens` owns shared palette and dimension tokens.

The production MVP deploys the web app to Vercel, the API to Railway, the
database to Neon Postgres, and the iOS app through Expo Application Services
(EAS) / TestFlight in the final operator phase.

## Workspace Boundaries

### Web

The web app is a Next.js App Router client. It imports `AppRouter` as a type
from `@sequence/api`, but it does not ship API runtime code in the browser.

The tRPC client uses a split transport:

- HTTP batch link for queries and mutations with `credentials: include`
- WebSocket link for `game.onGameEvent` subscriptions

The WebSocket client is lazy so auth pages do not open unauthenticated sockets
before a session cookie exists.

The web game route consumes `@sequence/client-state` for snapshot/event
projection and `@sequence/design-tokens` through generated StyleX token files.

### Mobile

The mobile app is an Expo SDK 57 iOS client under `apps/mobile`. Expo Router
owns route files under `apps/mobile/src/app`, and the installed development
client uses the native bundle identifier `com.tkstang.sequenceonline` and scheme
`sequence`.

The mobile client talks to the same API contract as the web client:

- tRPC HTTP for queries and mutations.
- tRPC WebSocket subscriptions for `game.onGameEvent`.
- Better Auth email/password REST calls under `/api/auth/*`.
- Game-scoped guest tokens attached to HTTP and WebSocket requests when a guest
  joins an invite.

The mobile runtime imports shared workspace packages:

- `@sequence/client-state` for redacted game state, stream projection, fixtures,
  and rule-violation copy.
- `@sequence/design-tokens` for the light/dark palette and native theme values.
- `@sequence/game-logic` for framework-free rule types and board metadata.

Mobile credentials are stored with Expo SecureStore through `@better-auth/expo`
and the guest-token store. AsyncStorage is used only for non-secret preferences
and guest-game registry metadata.

### API

The API is a Fastify server with:

- Better Auth mounted at `/api/auth/*`
- tRPC HTTP and WebSocket mounted at `/trpc`
- `GET /health` for deployment health checks
- credentialed CORS for the configured web origin
- global rate-limit support enabled per route
- server timing headers for latency smoke checks

The game router is organized as one route file per action under
`packages/api/src/game/routes/`.

### Game Logic

`@sequence/game-logic` is framework-free TypeScript over immutable domain state.
The API uses it as the authoritative rules engine. The web and mobile clients
use its types, board metadata, and display helpers without owning server
authority.

### Shared Client State and Tokens

`@sequence/client-state` applies the already-redacted snapshot/event stream that
clients receive. It defines `GameSnapshotView`, produces `GameViewState`,
applies `GameStreamItem` events, maps route screens with `screenForState`, and
exports fixtures used by tests and dev playgrounds. It must stay framework-free;
the API remains the authority for redaction and validation.

`@sequence/design-tokens` defines the shared light/dark palette and static
dimensions. Mobile imports the token package directly. Web generates
`apps/web/src/styles/tokens.stylex.ts` and
`apps/web/src/styles/themes.stylex.ts` from the same source with
`pnpm --filter @sequence/design-tokens generate:web-stylex`.

## Game Data Flow

1. A logged-in user creates a game through `game.create`.
2. The API persists the game, players, hands, board, events, and versioned state
   in Postgres.
3. Remote players join with an invite code through `game.preview` and
   `game.join`; guests get a game-scoped cookie.
4. The game route subscribes to `game.onGameEvent`.
5. The subscription sends a snapshot first, then tracked events.
6. Mutations such as `game.makeMove`, `game.chooseSequenceCells`,
   `game.turnInDeadCard`, `game.saveAndExit`, and `game.concede` validate
   against the authenticated seat and the client-supplied version.
7. Accepted moves persist events and broadcast updates to subscribers.

Reconnect recovery is snapshot-first. The tRPC subscription transport resends
the last tracked event id on reconnect, and the server can replay from that
cursor or send a fresh snapshot when needed.

## Auth and Guests

Email/password auth is enabled through Better Auth. GitHub and Google OAuth
providers register automatically when both their client id and secret are set;
the production MVP sets neither, so it runs email/password only.

Guest joins are scoped to a game. The API signs guest tokens with
`BETTER_AUTH_SECRET` and sends them as httpOnly cookies using the same cookie
mode as session cookies.

Production uses cross-site cookies between Vercel and Railway:

- `AUTH_COOKIE_SAME_SITE=none`
- `AUTH_COOKIE_SECURE=true`

For a same-site deployment, `AUTH_COOKIE_SAME_SITE=lax` is available.

## Realtime, Presence, and Timers

Realtime rooms are process-local in the API service. Presence hooks mark seats
connected and disconnected from the subscription lifecycle. Remote games freeze
when a player disconnects and resume when the original roster returns.

Turn timers are coordinated by `TimerService`. The move engine calls a timer
hook after committed turns so the API can schedule the next deadline. Timers are
rehydrated from the database on boot to avoid stranding active timed games after
a redeploy.

## UI State Shape

The web and mobile game routes consume a single `GameSnapshotView` shape from
`@sequence/client-state` and update it with streamed events through
`applyStreamItem`. Leaf game UI components are prop-driven, including:

- `GameBoard`
- `CardHand`
- `PlayerRail`
- `LobbyTeams`
- `GameOver`
- `HandoffScreen`

This shape backs the dev-only UI playground at `/dev`, which renders the leaf
components in isolation from reusable fixtures (viewport switcher, per-component
Expand, and a chrome-less `/dev-frame` target). See
[`development.md`](development.md#dev-ui-playground). The web UI is styled with
StyleX generated from shared design tokens; see [`styling.md`](styling.md). The
mobile UI uses React Native primitives, React Strict DOM token variables, and
the same shared palette.

## Current Scaling Limits

The MVP intentionally runs one Railway API service instance. These surfaces are
process-local today:

- realtime rooms
- presence tracking
- turn timer scheduling
- in-memory rate-limit buckets

Horizontal scaling would need external pub/sub, durable timer coordination, and
distributed rate limiting.

## Production Security Notes

Production currently keeps `TRUST_PROXY=false`. Railway was observed forwarding
client-supplied `X-Forwarded-For` in a way that made IP-keyed anonymous invite
rate limits forgeable when `TRUST_PROXY=1`. Anonymous invite preview/join
traffic therefore shares one anonymous limiter bucket in production.

Private hands are redacted by the API response mapping. The client never gets
other remote players' hands. Local pass-and-play is the exception where one
device owns multiple seats; the mobile handoff screen hides outgoing and
incoming hands between turns.
