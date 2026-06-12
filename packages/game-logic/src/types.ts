/**
 * Domain types for the Sequence rules engine.
 *
 * Pure data shapes — no framework imports. These types are the multi-client
 * contract (API enforcement + web display) and the future offline host all
 * consume them, so they stay framework-free.
 */

import type { PositionId } from './board-map.ts';
import type { GameStatus } from './state-machine.ts';

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

/** Card rank. `T` is ten; `J` is jack (jacks never appear on the board). */
export type Rank =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'T'
  | 'J'
  | 'Q'
  | 'K';

export type Suit = 'C' | 'D' | 'H' | 'S';

/** A playing card. The deck holds two copies of each of the 52 faces. */
export interface Card {
  readonly rank: Rank;
  readonly suit: Suit;
}

/** A board position code, re-exported for ergonomic single-import use. */
export type Position = PositionId;

// ---------------------------------------------------------------------------
// Teams & seats
// ---------------------------------------------------------------------------

/** Team id. 1–3 (2- and 4-player games use teams 1–2; 3- and 6-player use 1–3). */
export type Team = 1 | 2 | 3;

/** A seat is a zero-based player index in turn order. */
export type Seat = number;

/** A completed, locked sequence of five cells owned by one team. */
export interface Sequence {
  readonly id: number;
  readonly team: Team;
  readonly cells: readonly Position[];
}

// ---------------------------------------------------------------------------
// Settings & seeds
// ---------------------------------------------------------------------------

export type PlayerCount = 2 | 3 | 4 | 6;

/** `tap` = default tap-to-reveal mode; `drag` = hard mode. */
export type GameMode = 'tap' | 'drag';

export interface GameSettings {
  readonly playerCount: PlayerCount;
  readonly mode: GameMode;
  /** Per-turn timer in seconds; `null` = untimed. */
  readonly timerSeconds: number | null;
  /** True for local pass-and-play (FR16): both seats are the creator's. */
  readonly local: boolean;
}

/** Minimal per-player input to {@link createGame}. */
export interface PlayerSeed {
  readonly seat: Seat;
  readonly team: Team;
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

/**
 * One playable board cell. Corners are never stored here — they are wild for
 * all teams and modelled by the board map, not by chip occupancy.
 */
export interface BoardCell {
  /** The team whose chip occupies this cell, if any. */
  readonly chip?: Team;
  /** The sequence id this chip is locked into, if any (locked = immovable). */
  readonly lockedBy?: number;
}

/** The mutable board: position code → cell. Absent key = empty cell. */
export type Board = ReadonlyMap<Position, BoardCell>;

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

/**
 * A frozen sub-state for a placement that produced a run longer than five.
 * The placer must choose exactly five straight cells (including the placed
 * chip) to lock. The turn does not advance until resolved.
 */
export interface PendingChoice {
  readonly seat: Seat;
  readonly team: Team;
  /** The cell the placer just covered (must be in the chosen sequence). */
  readonly placed: Position;
  /** The eligible run of cells (length > 5) the player chooses 5 from. */
  readonly cells: readonly Position[];
  /**
   * Further >5 runs (crossing directions) the same placement produced, resolved
   * one at a time after this choice locks. Each entry is an eligible run the
   * placer will then pick a 5-window from. Empty in the common single-choice
   * case.
   */
  readonly additionalRuns?: readonly (readonly Position[])[];
}

export interface GameState {
  readonly settings: GameSettings;
  readonly status: GameStatus;
  readonly board: Board;
  /** Per-seat hands, indexed by seat. */
  readonly hands: readonly (readonly Card[])[];
  /** Draw deck, top of deck = index 0. Server secret. */
  readonly deck: readonly Card[];
  /** Discard / played pile, reshuffled into the deck on depletion. */
  readonly played: readonly Card[];
  /** Completed sequences across all teams. */
  readonly sequences: readonly Sequence[];
  /** Per-seat team assignment, indexed by seat. */
  readonly teams: readonly Team[];
  readonly currentSeat: Seat;
  /** Round number (increments when turn order wraps to the first seat). */
  readonly round: number;
  /** Monotonic id for the next completed sequence. */
  readonly nextSequenceId: number;
  /** Present only while a >5-run choice is unresolved (turn frozen). */
  readonly pendingChoice?: PendingChoice;
  /**
   * True once the current seat has manually turned in a dead card this turn
   * (hard mode). Caps turn-ins at one per turn; cleared on turn advance.
   */
  readonly deadCardTurnedIn?: boolean;
  /** Set once the game is won. */
  readonly winner?: Team;
}

// ---------------------------------------------------------------------------
// Moves
// ---------------------------------------------------------------------------

/**
 * Place a chip. `card` is OPTIONAL on the wire:
 *  - explicit (tap mode): the named card is consumed as sent — a deliberate
 *    two-eyed jack play is honored even while holding the natural card.
 *  - absent (drag mode): the consumed card is inferred via natural-over-jack —
 *    a jack is never spent implicitly.
 */
export interface PlaceMove {
  readonly type: 'place';
  readonly position: Position;
  readonly card?: Card;
  /**
   * The acting seat. When present, `applyMove` rejects the move with
   * `not-your-turn` unless it equals `state.currentSeat` — the engine owns turn
   * ownership (NFR1). Optional for backward compatibility; the API host always
   * sets it from the authenticated seat.
   */
  readonly seat?: Seat;
}

/** Remove an opponent's unlocked chip (consumes a one-eyed jack). */
export interface RemoveChipMove {
  readonly type: 'removeChip';
  readonly position: Position;
  readonly card?: Card;
  /** The acting seat — see {@link PlaceMove.seat}. */
  readonly seat?: Seat;
}

export type Move = PlaceMove | RemoveChipMove;

/** A bare placement intent (used by consumption inference helpers). */
export interface Placement {
  readonly position: Position;
  readonly card?: Card;
}

// ---------------------------------------------------------------------------
// Rule violations
// ---------------------------------------------------------------------------

export type RuleViolation =
  | { readonly code: 'not-your-turn' }
  | { readonly code: 'card-not-in-hand' }
  | { readonly code: 'space-occupied' }
  | { readonly code: 'wrong-card-for-space' }
  | { readonly code: 'not-a-one-eyed-jack' }
  | { readonly code: 'chip-locked' }
  | { readonly code: 'own-chip' }
  | { readonly code: 'empty-cell' }
  // `freed-cell-same-turn` is intentionally absent: a one-eyed removal ends the
  // turn (applyRemove advances immediately), so a freed cell can never be
  // replayed in the same turn — the rule is enforced structurally, not by a code.
  | { readonly code: 'not-a-dead-card' }
  | { readonly code: 'pending-choice-unresolved' }
  | { readonly code: 'no-pending-choice' }
  | { readonly code: 'invalid-sequence-choice' }
  | { readonly code: 'game-not-active' };

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type GameEvent =
  | {
      readonly type: 'ChipPlaced';
      readonly seat: Seat;
      readonly team: Team;
      readonly position: Position;
      readonly card: Card;
    }
  | {
      readonly type: 'ChipRemoved';
      readonly seat: Seat;
      readonly position: Position;
      readonly card: Card;
    }
  | { readonly type: 'CardDrawn'; readonly seat: Seat; readonly card: Card }
  | {
      readonly type: 'DeadCardSwapped';
      readonly seat: Seat;
      readonly discarded: Card;
      readonly drawn: Card;
    }
  | {
      readonly type: 'SequenceCompleted';
      readonly team: Team;
      readonly sequenceId: number;
      readonly cells: readonly Position[];
    }
  | {
      readonly type: 'PendingChoice';
      readonly seat: Seat;
      readonly cells: readonly Position[];
    }
  | {
      readonly type: 'TurnAdvanced';
      readonly seat: Seat;
      readonly round: number;
    }
  | { readonly type: 'GameWon'; readonly team: Team };

// ---------------------------------------------------------------------------
// Reducer result
// ---------------------------------------------------------------------------

export type MoveResult =
  | {
      readonly ok: true;
      readonly nextState: GameState;
      readonly events: readonly GameEvent[];
    }
  | { readonly ok: false; readonly error: RuleViolation };
