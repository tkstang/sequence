# API Reference

The Sequence Online API is a [tRPC](https://trpc.io) router served by Fastify. It
is consumed type-safely by the web app, which imports only the `AppRouter` _type_
from `@sequence/api` (no runtime API code ships to the browser). The router is the
multi-client contract — a future React Native client imports the same type.

See [architecture.md](architecture.md) for request/event flow, the transport
split, and realtime/presence/timer behavior. Persisted shapes are documented in
[data-model.md](data-model.md). Rule-violation codes and domain types come from
[game-logic-reference.md](game-logic-reference.md).

## Transport and base URLs

The Fastify server mounts:

| Surface | Path | Transport |
| --- | --- | --- |
| tRPC queries + mutations | `/trpc` | HTTP batch |
| tRPC subscriptions | `/trpc` | WebSocket (`useWSS: true`, same prefix) |
| Better Auth | `/api/auth/*` | HTTP (REST, not wrapped in tRPC) |
| Health probe | `/health` | HTTP `GET` → `{ status: 'ok' }` |

- The default dev API origin is `http://localhost:3001` (`PORT` and
  `BETTER_AUTH_URL` default to `:3001`); the WebSocket URL is `ws://localhost:3001`.
- CORS is credentialed (`credentials: true`) and restricted to `WEB_ORIGIN`
  (default `http://localhost:3000`, the web app). Exposed headers:
  `Server-Timing`, `X-Sequence-Server-Duration-Ms`.
- The HTTP client uses `credentials: include`; the WebSocket upgrade carries the
  same cookie jar (session cookie and, for guests, the game-scoped cookie), so WS
  authenticates identically to HTTP.
- A ~20s WebSocket keepalive ping satisfies tRPC liveness and survives the edge's
  idle drops.

Source: `packages/api/src/server.ts:78-174`, `packages/api/src/env.ts:21-25`.

## Procedure builders and auth levels

Three builders in `packages/api/src/trpc.ts` define the auth tiers used below:

| Builder | Auth level | Behavior |
| --- | --- | --- |
| `publicProcedure` | **public** | Any caller, no identity required. |
| `authedProcedure` | **authenticated** | Requires a Better Auth session; throws `UNAUTHORIZED` when absent. Narrows `ctx.user` to non-null. |
| `gamePlayerProcedure` | **game-player-seat** | Requires `input.gameId` (UUID); resolves the caller to a seat in that game or throws `FORBIDDEN`. Attaches `ctx.seat = { gameId, seat, team, isLocal }`. |

Seat resolution (`gamePlayerProcedure` and the manual `resolveSeatFromLoadedGame`
helper) resolves a caller to a seat in this order
(`packages/api/src/trpc.ts:296-397`):

1. **Local game** — the creator's session controls every seat (returns the
   game's current seat, or the lowest seat).
2. **Registered user** — their `game_players` row in this game.
3. **Guest** — verify the game-scoped token from the `sequence_guest` cookie,
   then match its hash against the seat's stored hash.

If none match, the procedure throws `FORBIDDEN`.

The session is resolved from the request cookie via Better Auth and cached
in-process for 10s (`packages/api/src/trpc.ts:69-109`).

## `health` router

| Procedure | Kind | Auth | Input | Output |
| --- | --- | --- | --- | --- |
| `health.ping` | query | public | — | `{ pong: true }` |
| `health.me` | query | authenticated | — | `{ user: { id, email, name } }` |

`health.ping` smoke-tests the transport; `health.me` is a session probe that
succeeds only with a valid session and returns the resolved user.

Source: `packages/api/src/app-router.ts:13-17`.

## `game` router

Source: `packages/api/src/game/game.router.ts:40-56` and each route file under
`packages/api/src/game/routes/`.

| Procedure | Kind | Auth | Source |
| --- | --- | --- | --- |
| `game.create` | mutation | authenticated | `create-game.ts:62` |
| `game.preview` | query | public (rate-limited) | `preview.ts:37` |
| `game.join` | mutation | public (rate-limited) | `join-game.ts:35` |
| `game.setTeam` | mutation | game-player-seat | `set-team.ts:19` |
| `game.kick` | mutation | game-player-seat (creator-only) | `kick-player.ts:19` |
| `game.randomizeTeams` | mutation | game-player-seat (creator-only) | `randomize-teams.ts:34` |
| `game.start` | mutation | game-player-seat (creator-only) | `start-game.ts:27` |
| `game.makeMove` | mutation | seat-authorized (public builder) | `make-move.ts:59` |
| `game.chooseSequenceCells` | mutation | game-player-seat | `choose-sequence-cells.ts:19` |
| `game.turnInDeadCard` | mutation | game-player-seat | `turn-in-dead-card.ts:35` |
| `game.saveAndExit` | mutation | game-player-seat | `save-and-exit.ts:26` |
| `game.concede` | mutation | game-player-seat | `concede.ts:26` |
| `game.rematch` | mutation | game-player-seat | `rematch.ts:21` |
| `game.myGames` | query | authenticated | `my-games.ts:65` |
| `game.onGameEvent` | subscription | game-player-seat | `on-game-event.ts:48` |

> `game.makeMove` uses the `publicProcedure` builder but is still seat-authorized:
> it loads the game, resolves the caller's seat via `resolveSeatFromLoadedGame`,
> and throws `FORBIDDEN` for a non-participant. The public builder is a hot-path
> optimization (one joined load instead of the middleware's repeated reads), not a
> relaxation of authorization. Source: `make-move.ts:59-89`.

### Lifecycle and lobby

#### `game.create`

Creator opens a new game.

```ts
// input
{
  playerCount: 2 | 3 | 4 | 6;
  mode: 'tap' | 'drag';
  timerSeconds?: number | null;   // null = off; else 30s steps ≤180, then 60s steps
  local?: boolean;                // default false; requires playerCount 2 + opponentName
  opponentName?: string;          // 1..40 chars; required when local
}
// output
{ gameId: string; inviteCode: string; status: string; local: boolean }
```

A normal game starts in `lobby` with the creator at seat 0. A **local** game
(FR16, pass-and-play) skips the lobby: both seats are created, hands dealt, and
status goes straight to `active`. Source: `create-game.ts:25-148`.

#### `game.preview`

Public invite-landing preview — roster, settings, status. Never returns hands,
the deck, or tokens.

```ts
// input
{ inviteCode: string }       // min length 1
// output (GamePreview)
{
  gameId: string;
  inviteCode: string;
  status: string;
  playerCount: number;
  mode: string;
  timerSeconds: number | null;
  local: boolean;
  players: { seat: number; team: number; name: string; isCreator: boolean; isGuest: boolean }[];
}
```

Unknown invite code → `NOT_FOUND`. Shares the anonymous rate-limit bucket (below).
Source: `preview.ts:11-85`.

#### `game.join`

Join via invite code.

```ts
// input
{ inviteCode: string; guestName?: string }   // guestName 1..40 chars
// output (JoinResult)
{ gameId: string; seat: number; team: number; isGuest: boolean }
```

- Authenticated user → next open seat; idempotent (re-joining returns the
  existing seat).
- Anonymous + `guestName` → issues a signed, game-scoped guest token, stores its
  hash on the seat, and sets the httpOnly `sequence_guest` cookie.

Errors: unknown code → `NOT_FOUND`; local game → `FORBIDDEN` (local games cannot
be joined); full or already-started game → `CONFLICT`; anonymous without
`guestName` → `BAD_REQUEST`. Emits `PlayerJoined`. Shares the anonymous
rate-limit bucket. Source: `join-game.ts:15-162`.

#### `game.setTeam`

Lobby team self-sort and creator control.

```ts
// input
{ gameId: string /* uuid */; targetSeat: number /* int ≥0 */; team: 1 | 2 | 3 }
// output
{ seat: number; team: number }
```

A player may set their own team; the creator may move anyone. Moving another
seat as a non-creator → `FORBIDDEN`. Only in the lobby (else `CONFLICT`). Emits
`TeamChanged`. Source: `set-team.ts:19-79`.

#### `game.kick`

Creator-only lobby removal.

```ts
// input
{ gameId: string /* uuid */; targetSeat: number /* int ≥0 */ }
// output
{ kickedSeat: number }
```

Frees the target seat. Non-creator → `FORBIDDEN`; kicking yourself →
`BAD_REQUEST`; not in lobby → `CONFLICT`; unknown seat → `NOT_FOUND`. Emits
`PlayerKicked`. Source: `kick-player.ts:19-71`.

#### `game.randomizeTeams`

Creator-only lobby tiebreaker — shuffles seated players into balanced,
seat-alternating teams.

```ts
// input
{ gameId: string /* uuid */ }
// output
{ ok: true }
```

Non-creator → `FORBIDDEN`; not in lobby → `CONFLICT`. Players keep their seats
(guest tokens are seat-bound); only team labels rotate. Emits a `TeamChanged`
per seat. Source: `randomize-teams.ts:34-87`.

#### `game.start`

Creator-only — deals hands and begins play.

```ts
// input
{ gameId: string /* uuid */ }
// output
{ status: 'active'; currentSeat: number; version: number }
```

Requires a full lobby with a legal team layout. Delegates dealing and turn order
to game-logic `createGame`. Non-creator → `FORBIDDEN`; not in lobby → `CONFLICT`;
lobby not full or illegal team setup → `BAD_REQUEST`. Returns the post-start
`version` so the first mover can act without a separate read. Emits `GameStarted`
plus per-seat `HandUpdated`. Source: `start-game.ts:27-126`.

### Gameplay

These mutations carry a `version` and run through the move engine (load → reduce →
persist with version guard → append events → broadcast). See
[the version contract](#optimistic-concurrency-the-version-contract) below.

#### `game.makeMove`

```ts
// input
{
  gameId: string /* uuid */;
  version: number /* int ≥0 */;
  move:
    | { type: 'place'; position: string; card?: Card }
    | { type: 'removeChip'; position: string; card?: Card };
}
// where Card = { rank: 'A'|'2'..'9'|'T'|'J'|'Q'|'K'; suit: 'C'|'D'|'H'|'S' }
// output
{ version: number; events: GameEvent[] }
```

`card` is optional: tap mode sends the explicitly selected card (a deliberate
jack is honored); drag mode omits it and the server infers the consumed card. The
mode never changes the procedure or message shape. The authenticated seat is
stamped onto the move so the rules engine enforces turn ownership. Rule
violations → `BAD_REQUEST` with a typed `ruleViolation`; stale/raced `version` →
`CONFLICT`. Source: `make-move.ts:37-89`.

#### `game.chooseSequenceCells`

Resolve a pending >5-run lock (only the placer may resolve).

```ts
// input
{ gameId: string /* uuid */; version: number /* int ≥0 */; cells: string[] /* exactly 5 */ }
// output
{ version: number; events: GameEvent[] }
```

The five cells must form a straight window including the just-placed chip; an
invalid set → `invalid-sequence-choice` (`BAD_REQUEST`). Resolving one run may
emit a fresh `PendingChoice` for the next (the turn stays frozen until all are
resolved). Source: `choose-sequence-cells.ts:19-40`.

#### `game.turnInDeadCard`

Hard-mode manual dead-card swap.

```ts
// input
{ gameId: string /* uuid */; version: number /* int ≥0 */; card: Card }
// output
{ version: number; events: GameEvent[] }
```

The engine validates the card is genuinely dead for the acting seat, swaps it for
a fresh draw, and the turn **continues** (no advance). A card that isn't dead, or
a second turn-in this turn → `not-a-dead-card` (`BAD_REQUEST`). Source:
`turn-in-dead-card.ts:35-56`.

#### `game.saveAndExit`

Suspend an active game for later resume (FR10).

```ts
// input
{ gameId: string /* uuid */; version: number /* int ≥0 */ }
// output
{ status: 'saved' }
```

Status → `saved`, `expires_at = +1 week`. Non-local games with any guest seat are
rejected (`BAD_REQUEST`) — resuming requires a login-only roster. Local games can
save. Illegal transition → `CONFLICT`; stale `version` → `CONFLICT`. Emits
`GameSaved`. Source: `save-and-exit.ts:17-94`.

#### `game.concede`

Any participant may concede (FR11).

```ts
// input
{ gameId: string /* uuid */; version: number /* int ≥0 */ }
// output
{ status: 'finished'; concedingTeam: number }
```

The conceding team takes the recorded loss; status → `finished`,
`end_reason = 'concede'`. In a 2-team game the other team wins
(`winner_team` set); in a 3-team FFA there is no single winner (`winner_team`
stays null). Illegal transition or stale `version` → `CONFLICT`. Emits
`GameConceded` (and `GameWon` when there is a single winner). Source:
`concede.ts:26-98`.

#### `game.rematch`

One-tap rematch of a finished game (FR12).

```ts
// input
{ gameId: string /* uuid */ }
// output
{ gameId: string; inviteCode: string; rematchOf: string; status: 'lobby' | 'active' }
```

Creates a new game with the same roster and settings, linked via `rematch_of`,
with the first player rotated. A normal rematch opens in `lobby` (prior roster
pre-seated; the creator starts it). A local rematch deals and goes straight to
`active`. Only a finished game can be rematched (else `CONFLICT`); unknown game →
`NOT_FOUND`. Note: this mutation does not take a `version` — it reads a finished
game and writes a new one. Source: `rematch.ts:21-103`.

### Dashboard

#### `game.myGames`

```ts
// input — none
// output
{ resumables: MyGameCard[]; recents: MyGameCard[] }
// MyGameCard
{
  gameId: string; inviteCode: string; status: string;
  playerCount: number; mode: string; local: boolean; round: number;
  expiresAt: string | null; finishedAt: string | null;
  winnerTeam: number | null; endReason: string | null;
  mySeat: number; myTeam: number;
  opponents: string[];               // other players' display names, seat order
  result: 'win' | 'loss' | 'none';
}
```

`resumables` are the user's `frozen`/`saved` games; `recents` are their 10 most
recent `finished` games. Both scoped to games where the user holds a seat. Never
returns hands or the deck. Source: `my-games.ts:9-166`.

### Subscription: `game.onGameEvent`

The single live stream for a game (seat-authorized).

```ts
// input
{ gameId: string /* uuid */; lastEventId?: number /* int ≥0, coerced */ }
// stream item (StreamItem)
| { kind: 'snapshot'; snapshot: GameSnapshot }
| { kind: 'event'; event: LoggedEvent }
```

Recovery contract (`on-game-event.ts:48-242`):

- **Snapshot-first** — with no `lastEventId`, or one older than the retained
  replay window (`REPLAY_WINDOW = 500` events), the first item is a full redacted
  snapshot, followed by the live stream.
- **Gap replay** — a recent `lastEventId` replays missed events (`seq >
  lastEventId`) from `game_events`, then emits a current snapshot so the client
  recovers `version` before its next mutation.

Every item is `tracked()` by its `seq`, so the tRPC subscription transport resends
the last event id on reconnect and resumes precisely. The live loop de-dupes by
`seq` against what the snapshot already covered.

**Redaction (NFR1):** snapshots carry public state plus the recipient's own hand
only; private events (`CardDrawn`, `DeadCardSwapped`, `HandUpdated`) are stripped
of card-bearing fields for non-owning seats. Public events pass through unchanged.
Local games are the exception — the one connection receives every seat's private
data. The per-event `version` (set on live broadcast) is global per-game and never
redacted, so a live client always knows the version to submit its next move with;
gap-replayed events omit it (the recovery snapshot supplies it). Source:
`packages/api/src/shared/realtime/redaction.ts:19-79`.

Connecting marks the seat present; the connection's teardown marks it
disconnected (the presence/freeze signal — see [architecture.md](architecture.md)).

## `history` router

All authenticated queries over the finished-games join; aggregated at query time
(no stats table). Source: `packages/api/src/history/history.router.ts:10-14`.

| Procedure | Kind | Auth | Input | Source |
| --- | --- | --- | --- | --- |
| `history.myRecord` | query | authenticated | — | `my-record.ts:30` |
| `history.myGames` | query | authenticated | `{ cursor?, limit? }` | `my-games.ts:73` |
| `history.headToHead` | query | authenticated | — | `head-to-head.ts:36` |

#### `history.myRecord`

```ts
// output (MyRecord)
{ wins: number; losses: number; total: number }
```

Aggregate W-L over finished, **non-local** games (FR14). `winner_team` set →
win/loss decisively; for a no-winner FFA concede only the conceding team takes
the loss (read from the persisted `GameConceded` payload). Source:
`my-record.ts:9-76`.

#### `history.myGames`

```ts
// input
{ cursor?: string; limit?: number /* 1..50, default 20 */ }
// output
{ items: HistoryGame[]; nextCursor: string | null }
// HistoryGame
{
  gameId: string; finishedAt: string | null;
  playerCount: number; mode: string; local: boolean;
  winnerTeam: number | null; endReason: string | null;
  myTeam: number; result: 'win' | 'loss' | 'none';
}
```

The user's finished games, newest first, keyset-paginated by
`(finished_at desc, id desc)`. The cursor is the prior page's last
`"<iso>|<id>"` keyset (a total order, so `finished_at` ties never skip a row).
Local games **are** listed here (flagged `local: true`); they're excluded only
from aggregates and head-to-head. Source: `history/routes/my-games.ts:9-166`.

#### `history.headToHead`

```ts
// output (HeadToHead[])
{ opponentId: string; opponentName: string; wins: number; losses: number; games: number }[]
```

Per-opponent records over shared finished, non-local games where both seats are
registered users (guests and local opponents excluded). Same conceder-only-loss
scoring as `myRecord`; sorted by games played, descending. Source:
`head-to-head.ts:9-107`.

## Optimistic concurrency: the `version` contract

Stateful mutations carry the `version` the caller last saw. The persist step's
version predicate makes a stale or duplicate submit lose cleanly — **first commit
wins, deterministically** (`packages/api/src/game/move-engine.ts:108-161`).

Procedures that take and enforce `version`:

| Procedure | Effect on mismatch |
| --- | --- |
| `game.makeMove` | `CONFLICT` (`stale version`) |
| `game.chooseSequenceCells` | `CONFLICT` |
| `game.turnInDeadCard` | `CONFLICT` |
| `game.saveAndExit` | `CONFLICT` |
| `game.concede` | `CONFLICT` |

The guard is checked twice: an up-front read of `games.version` against
`expectedVersion` for a clean early `CONFLICT`, and again atomically in the
persist `UPDATE` predicate (a concurrent committer that won the race raises
`VersionConflictError`, which is mapped to `CONFLICT` rather than a 500). Source:
`move-engine.ts:115-161`, `225-227`, `245-250`.

`game.start` also writes under a version guard (using the pre-start `version`)
but takes no `version` input — it transitions a lobby, not a live turn. `game.create`,
`game.join`, lobby routes (`setTeam`, `kick`, `randomizeTeams`), `game.rematch`,
and all queries do not participate in the `version` protocol.

Every committed reduction returns the new `version` and broadcasts it on each
event, so clients always have the value to submit their next move with.

## Error contract: `RuleViolation` → `BAD_REQUEST`

Game-logic returns a typed `RuleViolation` when a move breaks the rules. The move
engine wraps it as `RuleViolationError` and the gameplay routes map it through
`toTrpcError` (`move-engine.ts:317-328`):

- A `RuleViolationError` becomes a tRPC `BAD_REQUEST`. Its `message` is the
  violation `code`.
- The tRPC error formatter surfaces the violation under
  `error.data.ruleViolation` (`{ code, ... }`) so clients render feedback from
  **codes**, never by string-matching messages (`trpc.ts:200-215`).
- An existing `TRPCError` passes through; anything else →
  `INTERNAL_SERVER_ERROR`.

The violation codes themselves are defined by the rules engine — see
[game-logic-reference.md](game-logic-reference.md). Examples surfaced by routes:
`invalid-sequence-choice` (`game.chooseSequenceCells`), `not-a-dead-card`
(`game.turnInDeadCard`).

Lifecycle/state errors that are not rule violations use their own codes directly:
`NOT_FOUND` (unknown game/seat/code), `CONFLICT` (illegal transition or stale
version), `FORBIDDEN` (not a participant / not the creator), `UNAUTHORIZED` (no
session), `TOO_MANY_REQUESTS` (rate limit), `BAD_REQUEST` (bad input, e.g. missing
`guestName`, self-kick, lobby not full).

## Rate limiting

| Scope | Limit | Key |
| --- | --- | --- |
| `game.preview` + `game.join` (shared) | 30 calls / 60s | `user:<id>` when authed, else the single bucket `anonymous:join-preview` |
| Better Auth (`/api/auth/*`) | 20 / 1 min (default) | per IP (Fastify rate-limit plugin) |

`game.preview` and `game.join` share one in-memory sliding-window limiter (the
`joinPreviewLimiter`) to throttle invite-code enumeration. Authenticated callers
key by user id; **all anonymous callers share one bucket**
(`anonymous:join-preview`) because production proxy/socket IPs were not stable
enough to key a public bucket safely. Exceeding either limit → `TOO_MANY_REQUESTS`.
Buckets are process-local (single MVP instance). Source:
`game.router.ts:32-43`, `shared/rate-limit-middleware.ts:30-88`,
`server.ts:114-148`.

## Better Auth surface (`/api/auth/*`)

Authentication is provided by [Better Auth](https://www.better-auth.com), mounted
as a standard REST handler at `/api/auth/*` (not wrapped in tRPC). The server
bridges Fastify requests to/from the WHATWG `Request`/`Response` Better Auth
expects (`server.ts:129-148`). Mutating calls clear the in-process session cache.

At a high level:

- **Email/password sessions** — Better Auth issues an httpOnly session cookie.
  `health.me` and every `authedProcedure` resolve the user from it. Optional
  GitHub/Google OAuth variables exist but social providers are not configured for
  the MVP.
- **Guest cookies** — separate from Better Auth, the API signs game-scoped guest
  tokens with `BETTER_AUTH_SECRET` and sets them as httpOnly `sequence_guest`
  cookies on `game.join`, using the same cookie attributes (`SameSite`/`Secure`)
  as session cookies so guest WS upgrades work cross-site.

The specific Better Auth endpoints are owned by the library and not enumerated
here. See [architecture.md](architecture.md) for the auth/guest model and the
cross-site cookie configuration.
