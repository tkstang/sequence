# Sequence Game Rules

This is the Sequence board game ruleset adapted for the digital MVP. It describes
what the rules engine in `packages/game-logic` actually enforces, not the full
physical tabletop game. The engine is the authority: it deals, draws, reshuffles,
detects sequences, and advances turns for you.

A **sequence** is a connected line of five same-color chips — horizontal,
vertical, or diagonal — on the 10x10 board.

The four corners are printed wild spaces. Every team treats a corner as one of
its own chips, so a line through a corner needs only four placed chips to make a
sequence. More than one team may use the same corner.

## Object of the Game

Be the first team to complete the required number of sequences:

- **2 teams** — complete **two** sequences to win.
- **3 teams** — complete **one** sequence to win.

A team's first and second sequences may share at most one board cell.

## Players and Teams

The digital MVP supports **2, 3, 4, or 6 players**. Seats are arranged so teams
alternate around the table; the engine validates this when the game is created.

| Players | Teams | Layout |
|---|---|---|
| 2 | 2 | 1v1 |
| 3 | 3 | free-for-all (three teams of 1) |
| 4 | 2 | 2v2 |
| 6 | 2 or 3 | 3v3, or three teams of 2 |

## The Deck and the Deal

The game uses two standard 52-card decks (104 cards). Jacks never appear on the
board.

When a game starts, the engine shuffles the deck and deals each player a hand:

| Players | Cards dealt each |
|---|---:|
| 2 | 7 |
| 3 | 6 |
| 4 | 6 |
| 6 | 5 |

## A Turn

On your turn you play one card to place or remove a chip. The card you play goes
to the discard pile, and the engine then draws you a replacement automatically —
you never lose a card by forgetting to draw.

Each non-jack card matches two cells on the board (the card is printed twice).
You may take either matching cell, as long as it is not already covered. Once a
chip is placed, an opponent can only remove it with a one-eyed jack, and never if
it is part of a completed sequence — a completed sequence can never be broken.

## The Jacks

There are 8 jacks. They never match a board cell; they are action cards.

- **Two-eyed jacks (J of diamonds / clubs) are wild.** Play one to place a chip
  on any open cell. Corners are wild free spaces and are never placed on.
- **One-eyed jacks (J of spades / hearts) are anti-wild.** Play one to remove a
  single opponent chip from the board. You cannot remove your own chip, an empty
  cell, or a chip that is locked into a completed sequence. A one-eyed jack
  removal ends your turn, so you cannot re-cover the freed cell on the same turn.

If a one-eyed jack has no legal target (no removable opponent chip on the board),
it simply cannot be played that turn. It is not a dead card — it regains value
the moment an opponent places a chip.

## Dead Cards

A card is **dead** when both of its board cells are already covered, so it can
never be played. Jacks are never dead.

Dead-card handling depends on the input mode:

- **Tap mode (default):** at the start of your turn the engine automatically
  swaps one dead card from your hand for a fresh draw.
- **Drag mode (hard mode):** you must notice and turn the card in yourself, at
  most once per turn. The engine validates that the card is genuinely dead.

Dead status is re-checked every turn, never flagged permanently: a one-eyed jack
that frees a cell can bring a previously dead card back to life.

## Completing Sequences

When you place a chip that completes a line of five, the engine detects and locks
it automatically.

- A line of exactly five locks immediately.
- A single placement can complete two crossing sequences at once; both are
  recorded, and if that meets your win threshold you win on the spot.
- One cell of your first sequence may be reused in your second. A new sequence is
  valid only if it reuses at most one cell already locked in your earlier
  sequences.

## Game Flow

- Turns advance automatically in seat order once a play resolves.
- When the draw deck runs out, the discard pile is automatically reshuffled into
  a new draw deck.
- Play continues until a team reaches the required number of sequences and wins.

These are all handled server-side. There is no physical seating, manual
shuffling, table-talk forfeit, or loss-of-card penalty in the digital game — the
engine deals, draws, reshuffles, and enforces turn ownership for you.

## Digital Play

A few concepts exist only in the digital game:

- **Input mode.** Games run in `tap` mode (the default, with automatic dead-card
  swaps) or `drag` mode (hard mode, where you manage dead cards manually).

- **Choosing your sequence cells.** If a placement creates a straight run *longer
  than five*, the engine freezes your turn and asks you to pick exactly five
  contiguous cells (including the cell you just covered) to lock as the sequence.
  The turn does not advance until you resolve this choice. If a single placement
  produces more than one such run, you resolve them one at a time.

- **Natural-card-over-jack consumption.** In drag mode the engine infers which
  card you spent: it prefers the natural matching card for the cell, and only
  falls back to a two-eyed (wild) jack when you hold no natural match. A jack is
  never spent implicitly. In tap mode you name the card explicitly, so you can
  deliberately spend a wild jack even while holding the natural card.

---

See `architecture.md` for how the rules engine enforces these rules, and
`game-logic-reference.md` for the engine API.
