# Game Logic Reference

`@sequence/game-logic` is the framework-free rules engine shared by the API, the
web app, and any future client (offline host). It is pure TypeScript over
immutable domain state: no React, Next, Fastify, database, or DOM imports. The
API enforces with it, the web app previews with it, and they cannot disagree
because they run the same code.

See [architecture.md](architecture.md) for how the engine fits the runtime
boundaries, and [api-reference.md](api-reference.md) for how rule violations
surface over tRPC.

## Importing

There is a single barrel entry. Import everything from the package root — never
from deep `src/*` paths.

```ts
import { applyMove, createGame, type GameState } from '@sequence/game-logic';
```

The barrel (`packages/game-logic/src/index.ts`) defines the full public surface.
Everything documented here is exported from it; anything not re-exported there is
internal.

## Key Contracts

### `MoveResult` — the reducer's discriminated union

Every reducer entry point returns a `MoveResult` (`types.ts:267`). It is a
discriminated union keyed on `ok`: never throws for rule violations, never
partially mutates.

```ts
type MoveResult =
  | { readonly ok: true; readonly nextState: GameState; readonly events: readonly GameEvent[] }
  | { readonly ok: false; readonly error: RuleViolation };
```

- `ok: true` → the move was applied; `nextState` is the new immutable state and
  `events` is the ordered list the host persists and broadcasts.
- `ok: false` → the move was rejected; `error` carries a `RuleViolation` code and
  no state changed.

### `RuleViolation` — the rejection code catalog

`RuleViolation` (`types.ts:202`) is a union of single-field objects, each a
`code` string. The full catalog (13 codes):

| Code | Meaning |
| --- | --- |
| `not-your-turn` | Acting seat is not `currentSeat` (or not the pending-choice placer). |
| `card-not-in-hand` | The named/required card is not in the seat's hand, or nothing in hand can place here. |
| `space-occupied` | Target cell already holds a chip (also a wild jack targeting a corner). |
| `wrong-card-for-space` | A natural card does not match the target cell. |
| `not-a-one-eyed-jack` | Removal attempted without a one-eyed jack (J♠/J♥) in hand or named. |
| `chip-locked` | Removal target is locked into a completed sequence. |
| `own-chip` | Removal target is the acting team's own chip. |
| `empty-cell` | Removal target has no chip. |
| `not-a-dead-card` | Turn-in card is not genuinely dead, or the per-turn turn-in budget is spent. |
| `pending-choice-unresolved` | A move was attempted while a >5-run choice is frozen. |
| `no-pending-choice` | A choice resolution was attempted with no pending choice. |
| `invalid-sequence-choice` | Chosen cells are not a valid contiguous 5-window (or reuse >1 locked cell). |
| `game-not-active` | The game `status` is not `active`. |

Note: `freed-cell-same-turn` is intentionally absent — a one-eyed removal ends
the turn immediately, so a freed cell can never be replayed in the same turn
(enforced structurally, see `types.ts:211`).

### `GameEvent` — the broadcast event variants

`GameEvent` (`types.ts:224`) is the ordered, persisted event stream a successful
move emits. Eight variants:

```ts
type GameEvent =
  | { type: 'ChipPlaced';       seat: Seat; team: Team; position: Position; card: Card }
  | { type: 'ChipRemoved';      seat: Seat; position: Position; card: Card }
  | { type: 'CardDrawn';        seat: Seat; card: Card }
  | { type: 'DeadCardSwapped';  seat: Seat; discarded: Card; drawn: Card }
  | { type: 'SequenceCompleted'; team: Team; sequenceId: number; cells: readonly Position[] }
  | { type: 'PendingChoice';    seat: Seat; cells: readonly Position[] }
  | { type: 'TurnAdvanced';     seat: Seat; round: number }
  | { type: 'GameWon';          team: Team };
```

Ordering matters: `TurnAdvanced` precedes any `DeadCardSwapped` attributed to the
incoming player, so consumers reconstruct per-turn state in order
(`apply-move.ts:531`).

### `Rng` — the determinism contract

Every non-deterministic operation (deck reshuffle on depletion, dead-card swap
draw, initial shuffle) is threaded with an injected `Rng` (`deck.ts:57`):

```ts
interface Rng {
  next(): number; // float in [0, 1)
}
```

`createSeededRng(seed)` builds a deterministic mulberry32 source, so every
scenario is reproducible from a seed. The reducer entry points (`applyMove`,
`resolveSequenceChoice`, `turnInDeadCard`, `forfeitTurn`) take `rng` optionally:
when omitted they derive a default seed from coarse state, so two-arg callers
still get determinism (`apply-move.ts:50`).

## Reducer / Turn Loop (`apply-move.ts`)

The reducer owns the whole turn loop: placement/removal, sequence detection and
locking, win detection, auto-draw, default-mode dead-card auto-swap for the
incoming player, and turn advancement.

```ts
function applyMove(state: GameState, move: Move, rng?: Rng): MoveResult
```
Validate and apply a move (`place` or `removeChip`), returning the next state and
ordered events. Rejects up front on inactive game, unresolved pending choice, or
wrong seat. (`apply-move.ts:63`)

```ts
function resolveSequenceChoice(
  state: GameState,
  cells: readonly Position[],
  rng?: Rng,
  actorSeat?: Seat,
): MoveResult
```
Resolve a frozen >5-run choice: the placer picks exactly five contiguous cells
(including the just-placed cell) to lock. Locks, checks the win, chains any
further queued runs, else completes the turn. (`apply-move.ts:146`)

```ts
function turnInDeadCard(state: GameState, seat: Seat, card: Card, rng?: Rng): MoveResult
```
Hard-mode manual dead-card turn-in: validates the card is genuinely dead, swaps
it for a fresh draw, and continues the same turn (no advance). At most one
turn-in per turn. (`apply-move.ts:288`)

```ts
function forfeitTurn(state: GameState, rng?: Rng): MoveResult
```
Forfeit the current turn (timer expiry): advance without any play or draw.
(`apply-move.ts:340`)

```ts
function drawForSeat(state: GameState, seat: Seat, rng: Rng, events: GameEvent[]): GameState
```
Draw one card for the seat (auto-draw), pushing a `CardDrawn` event. No-op if no
card is available. (`apply-move.ts:492`)

```ts
function advanceTurn(state: GameState, rng: Rng, events: GameEvent[]): GameState
```
Advance to the next seat (wrapping increments `round`), reset the per-turn
turn-in budget, emit `TurnAdvanced`, then run default-mode auto-swap for the
incoming player. (`apply-move.ts:514`)

## Game Creation (`create-game.ts`)

```ts
function createGame(
  settings: GameSettings,
  players: readonly PlayerSeed[],
  rng: Rng,
): GameState
```
Deal hands (2p→7, 3p→6, 4p→6, 6p→5) and derive seat-ordered, alternating-team
turn order directly from the seeds. Throws on unsupported player count, seed
count mismatch, non-contiguous seats/teams, illegal or uneven team counts, or
non-alternating order. Returns a fresh `active` state. (`create-game.ts:123`)

## Board (`board-map.ts`)

The 10×10 board layout. Every cell is a position code: a leading copy index
(1–4) plus either `WW` (a wild corner) or a two-character card code.

```ts
const BOARD_SIZE: number               // 10
const BOARD_MAP: readonly (readonly PositionId[])[]  // 10×10 grid of position codes
const ALL_POSITIONS: readonly PositionId[]           // flattened, row-major
```

```ts
function boardCellsFor(rank: BoardRank | 'J', suit: BoardSuit): readonly PositionId[]
```
The two board cells a card can be placed on; empty array for jacks.
(`board-map.ts:110`)

```ts
function coordOf(position: PositionId): Coord
```
Position code → `{ row, col }`. Throws on an unknown code. (`board-map.ts:118`)

```ts
function positionAt(row: number, col: number): PositionId | undefined
```
The position code at a coordinate, or `undefined` if off-board.
(`board-map.ts:127`)

```ts
function isCorner(position: PositionId): boolean
```
True when the code denotes a wild corner (`*WW`). (`board-map.ts:135`)

```ts
function parseBoardCell(position: PositionId): ParsedBoardCell
```
Parse a code into corner/card meaning, dropping the copy index. Throws on an
invalid code. (`board-map.ts:143`)

Types:

- `PositionId = string` — a raw position code, e.g. `'1AC'` or `'1WW'`.
  (`board-map.ts:15`)
- `BoardRank` — `'A' | '2'…'9' | 'T' | 'Q' | 'K'` (no jack on the board).
  (`board-map.ts:17`)
- `BoardSuit` — `'C' | 'D' | 'H' | 'S'`. (`board-map.ts:31`)
- `Coord` — `{ readonly row: number; readonly col: number }`, zero-based, row 0 =
  top. (`board-map.ts:69`)
- `ParsedBoardCell` — `{ kind: 'corner' } | { kind: 'card'; rank: BoardRank; suit:
  BoardSuit }`. (`board-map.ts:33`)

## Deck + RNG (`deck.ts`)

Sequence uses two standard 52-card decks (104 cards). Jacks never appear on the
board: two-eyed jacks (♦/♣) are wild placements; one-eyed jacks (♠/♥) remove an
opponent chip.

```ts
function buildDeck(): Card[]
```
Build two full 52-card decks (104 cards). (`deck.ts:30`)

```ts
function createSeededRng(seed: number): Rng
```
A deterministic mulberry32 RNG, reproducible from a seed. (`deck.ts:65`)

```ts
function shuffle<T>(cards: readonly T[], rng: Rng): T[]
```
Pure Fisher–Yates shuffle using the injected RNG; returns a new array.
(`deck.ts:82`)

```ts
function drawCard(deck: readonly Card[], played: readonly Card[], rng: Rng): DrawResult
```
Draw the top card, reshuffling the played pile into a fresh deck if the deck is
empty. Returns `card: undefined` when both are empty. Pure. (`deck.ts:108`)

```ts
function isOneEyedJack(card: Card): boolean   // J♠ / J♥ — removal
function isTwoEyedJack(card: Card): boolean   // J♦ / J♣ — wild placement
```
(`deck.ts:43`, `deck.ts:48`)

Types:

- `Rng` — `{ next(): number }`, float in `[0, 1)`. (`deck.ts:57`)
- `DrawResult` — `{ readonly card: Card | undefined; readonly deck: readonly
  Card[]; readonly played: readonly Card[] }`. (`deck.ts:94`)

## Sequence Detection (`sequence-detection.ts`)

A sequence is five connected same-team chips in a row, column, or diagonal.
Corners are wild for all teams; a run of exactly 5 auto-locks; a run >5 requires
the placer to choose which 5 lock. One placement may complete two crossing
sequences.

```ts
function detectSequences(board: Board, placed: Position, team: Team): DetectionResult
```
Inspect the four line directions through the placed cell and classify the result
as `none`, `autoLock`, or `choiceRequired`. (`sequence-detection.ts:128`)

```ts
function lockSequence(board: Board, cells: readonly Position[], seqId: number): Board
```
Mark each occupied cell `lockedBy: seqId` (corners skipped). Pure — returns a new
board. (`sequence-detection.ts:182`)

Types:

- `ChoiceRun` — `{ readonly runLength: number; readonly cells: readonly Position[]
  }`, an eligible >5 run the placer picks a 5-window from.
  (`sequence-detection.ts:29`)
- `DetectionResult` — discriminated on `kind`: (`sequence-detection.ts:34`)
  ```ts
  type DetectionResult =
    | { readonly kind: 'none' }
    | { readonly kind: 'autoLock'; readonly sequences: readonly Position[][] }
    | {
        readonly kind: 'choiceRequired';
        readonly runLength: number;
        readonly cells: readonly Position[];
        readonly autoLock: readonly Position[][];        // exactly-5 sequences locked outright
        readonly additionalChoices: readonly ChoiceRun[]; // further >5 runs, resolved sequentially
      };
  ```

## Jack Rules (`jack-rules.ts`)

```ts
function canPlaceWild(board: Board, position: Position): Verdict
```
May a two-eyed (wild) jack place a chip on `position`? Corners and occupied cells
fail as `space-occupied`. (`jack-rules.ts:22`)

```ts
function canRemoveChip(board: Board, position: Position, team: Team): Verdict
```
May a one-eyed jack played by `team` remove the chip at `position`? Fails with
`empty-cell`, `own-chip`, or `chip-locked`. (`jack-rules.ts:32`)

```ts
function oneEyedTargets(board: Board, team: Team): Position[]
```
All cells a one-eyed jack played by `team` could legally clear (unlocked opponent
chips). (`jack-rules.ts:54`)

Type:

- `Verdict` — `{ readonly ok: true } | { readonly ok: false; readonly error:
  RuleViolation }`. (`jack-rules.ts:15`)

## Dead Cards (`dead-cards.ts`)

A card is dead when both its board cells are covered. Status is evaluated
per-turn (a one-eyed removal can resurrect it); jacks are never dead.

```ts
function isDeadCard(card: Card, board: Board): boolean
```
True when both of the card's board cells are covered by a chip. (`dead-cards.ts:20`)

```ts
function findDeadCards(hand: readonly Card[], board: Board): Card[]
```
The dead cards within a hand, in hand order. (`dead-cards.ts:31`)

```ts
function autoSwapDeadCard(state: GameState, seat: Seat, rng: Rng): SwapResult
```
Auto-swap a single dead card for the seat (default mode): discard the first dead
card and draw a replacement, emitting `DeadCardSwapped`. Identity state when
nothing is dead or no replacement is drawable. (`dead-cards.ts:45`)

Type:

- `SwapResult` — `{ readonly nextState: GameState; readonly events: readonly
  GameEvent[] }`. (`dead-cards.ts:35`)

## Win Conditions (`win-conditions.ts`)

```ts
function sequencesToWin(teamCount: number): number
```
Sequences required to win: 1 for 3+ teams, 2 otherwise. (`win-conditions.ts:17`)

```ts
function checkWin(state: GameState, team: Team): boolean
```
Has `team` completed enough sequences to win? (`win-conditions.ts:27`)

## Card Consumption (`card-consumption.ts`)

The natural-over-jack rule: when a placement names no card (drag mode), prefer
the natural matching card and fall back to a two-eyed jack only when no natural
card is held — a one-eyed jack is never spent implicitly.

```ts
function cardMatchesPosition(card: Card, position: string): boolean
```
True when a (non-jack) card's natural board cell includes `position`.
(`card-consumption.ts:22`)

```ts
function wouldConsumeCard(placement: Placement, hand: readonly Card[]): Card | undefined
```
The card a placement would consume: explicit card returned as-is (throws if not
in hand); else natural card if held, else a two-eyed jack if held, else
`undefined`. (`card-consumption.ts:32`)

## State Machine (`state-machine.ts`)

The single source of truth for legal game-status transitions. The API host calls
`canTransition` before mutating `games.status`.

```ts
function canTransition(from: GameStatus, to: GameStatus): boolean
```
True if `from → to` is a legal lifecycle transition. (`state-machine.ts:31`)

Type:

- `GameStatus` — `'lobby' | 'active' | 'frozen' | 'saved' | 'finished'`.
  Legal transitions: `lobby→active`; `active→{frozen,saved,finished}`;
  `frozen→active`; `saved→active`; `finished` is terminal. (`state-machine.ts:9`)

## Display Helpers (`display-helpers.ts`)

```ts
function validPlacements(hand: readonly Card[], board: Board, team: Team): Map<Card, Position[]>
```
The legal target cells for each card in `hand` (natural → open board cells,
two-eyed jack → every open cell, one-eyed jack → removable opponent chips). Dead
cards and cards with no legal target are omitted. Backed by the same rule
functions the reducer uses, so client previews never disagree with the server.
(`display-helpers.ts:26`)

## Domain Types (`types.ts`)

| Type | Shape / description | Source |
| --- | --- | --- |
| `Rank` | `'A' \| '2'…'9' \| 'T' \| 'J' \| 'Q' \| 'K'` (`T` = ten, `J` = jack). | `types.ts:17` |
| `Suit` | `'C' \| 'D' \| 'H' \| 'S'`. | `types.ts:32` |
| `Card` | `{ readonly rank: Rank; readonly suit: Suit }`. | `types.ts:35` |
| `Position` | Alias of `PositionId` (board position code), re-exported for ergonomic single-import use. | `types.ts:41` |
| `Team` | `1 \| 2 \| 3`. | `types.ts:48` |
| `Seat` | `number` — zero-based player index in turn order. | `types.ts:51` |
| `Sequence` | `{ readonly id: number; readonly team: Team; readonly cells: readonly Position[] }` — a completed, locked five-cell line. | `types.ts:54` |
| `PlayerCount` | `2 \| 3 \| 4 \| 6`. | `types.ts:64` |
| `GameMode` | `'tap' \| 'drag'` (`tap` = default tap-to-reveal; `drag` = hard mode). | `types.ts:67` |
| `GameSettings` | `{ playerCount: PlayerCount; mode: GameMode; timerSeconds: number \| null; local: boolean }`. | `types.ts:69` |
| `PlayerSeed` | `{ readonly seat: Seat; readonly team: Team }` — minimal per-player input to `createGame`. | `types.ts:79` |
| `BoardCell` | `{ readonly chip?: Team; readonly lockedBy?: number }` — corners are never stored. | `types.ts:92` |
| `Board` | `ReadonlyMap<Position, BoardCell>` — absent key = empty cell. | `types.ts:100` |
| `PendingChoice` | `{ seat: Seat; team: Team; placed: Position; cells: readonly Position[]; additionalRuns?: readonly (readonly Position[])[] }` — a frozen >5-run choice. | `types.ts:111` |
| `GameState` | The full immutable game state: `settings`, `status`, `board`, `hands`, `deck`, `played`, `sequences`, `teams`, `currentSeat`, `round`, `nextSequenceId`, optional `pendingChoice`, `deadCardTurnedIn`, `winner`. | `types.ts:127` |
| `PlaceMove` | `{ type: 'place'; position: Position; card?: Card; seat?: Seat }` — `card` optional (explicit in tap mode, inferred in drag mode). | `types.ts:168` |
| `RemoveChipMove` | `{ type: 'removeChip'; position: Position; card?: Card; seat?: Seat }` — consumes a one-eyed jack. | `types.ts:182` |
| `Move` | `PlaceMove \| RemoveChipMove`. | `types.ts:190` |
| `Placement` | `{ readonly position: Position; readonly card?: Card }` — a bare placement intent for consumption inference. | `types.ts:193` |
| `RuleViolation` | Union of `{ code }` rejection codes — see [the catalog above](#ruleviolation--the-rejection-code-catalog). | `types.ts:202` |
| `GameEvent` | Union of broadcast events — see [the variant list above](#gameevent--the-broadcast-event-variants). | `types.ts:224` |
| `MoveResult` | The reducer's ok/error union — see [the contract above](#moveresult--the-reducers-discriminated-union). | `types.ts:267` |
