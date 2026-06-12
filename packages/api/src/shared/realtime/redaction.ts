/**
 * Per-recipient event + snapshot redaction (NFR1).
 *
 * `game_events` stores full truth server-side (including which card a seat
 * drew). The subscription layer redacts at the edge so no event reaching a
 * **non-owning** seat ever carries hand or deck data. Public events
 * (ChipPlaced — the played card is public, TurnAdvanced, SequenceCompleted,
 * PendingChoice, GameWon, all lobby events) pass through unchanged and are
 * identical for every recipient.
 *
 * Local games (FR16) are the one exception: a single connection drives all
 * seats (pass-and-play), so it receives every seat's private events intact.
 */

import type { GameState } from '@sequence/game-logic';

/** A persisted event as it leaves the log: a discriminated payload + its seq. */
export interface LoggedEvent {
  seq: number;
  type: string;
  payload: Record<string, unknown>;
}

/**
 * Event types that reveal a *specific seat's* private card(s). For a non-owning
 * recipient these are reduced to their public skeleton (the seat + type, no
 * card). The owning seat — and any local-game connection — sees them in full.
 */
const PRIVATE_EVENT_TYPES = new Set(['CardDrawn', 'DeadCardSwapped']);

/** Card-bearing fields stripped from a private event for non-owning seats. */
const PRIVATE_FIELDS = ['card', 'drawn', 'discarded'] as const;

/**
 * Redact one logged event for `recipientSeat`. Returns the event unchanged when
 * it is public, owned by the recipient, or the game is local; otherwise strips
 * the card-bearing fields (leaving `{ type, seat, seq }`).
 */
export function redactEvent(
  event: LoggedEvent,
  recipientSeat: number,
  isLocal: boolean,
): LoggedEvent {
  if (isLocal) return event;
  if (!PRIVATE_EVENT_TYPES.has(event.type)) return event;

  const owner = event.payload.seat;
  if (typeof owner === 'number' && owner === recipientSeat) return event;

  // Non-owning recipient: strip private card fields.
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(event.payload)) {
    if ((PRIVATE_FIELDS as readonly string[]).includes(key)) continue;
    redacted[key] = value;
  }
  return { seq: event.seq, type: event.type, payload: redacted };
}

/**
 * A redacted game snapshot for a recipient seat: the full public state plus the
 * recipient's OWN hand only (other hands + the deck are never serialized). For
 * a local game every hand is included (the one connection owns them all).
 */
export interface GameSnapshot {
  status: string;
  currentSeat: number;
  round: number;
  /** Position code → { chip?, lockedBy? }. */
  board: Record<string, { chip?: number; lockedBy?: number }>;
  sequences: { id: number; team: number; cells: string[] }[];
  /** Completed-sequence count per team (public). */
  teams: number[];
  /** The recipient's own hand (local games: every hand, indexed by seat). */
  hand: { rank: string; suit: string }[];
  localHands?: { rank: string; suit: string }[][];
  pendingChoice?: {
    seat: number;
    cells: string[];
  };
  winner?: number;
}

/**
 * Build the redacted snapshot a subscriber receives first (the recovery
 * contract: snapshot, then live stream). Never serializes the deck or any
 * other seat's hand for a non-local game.
 */
export function buildSnapshot(
  state: GameState,
  recipientSeat: number,
): GameSnapshot {
  const board: GameSnapshot['board'] = {};
  for (const [pos, cell] of state.board) {
    const entry: { chip?: number; lockedBy?: number } = {};
    if (cell.chip !== undefined) entry.chip = cell.chip;
    if (cell.lockedBy !== undefined) entry.lockedBy = cell.lockedBy;
    board[pos] = entry;
  }

  const snapshot: GameSnapshot = {
    status: state.status,
    currentSeat: state.currentSeat,
    round: state.round,
    board,
    sequences: state.sequences.map((s) => ({
      id: s.id,
      team: s.team,
      cells: [...s.cells],
    })),
    teams: [...state.teams],
    hand: [...(state.hands[recipientSeat] ?? [])],
  };

  if (state.settings.local) {
    snapshot.localHands = state.hands.map((h) => [...h]);
  }
  if (state.pendingChoice) {
    snapshot.pendingChoice = {
      seat: state.pendingChoice.seat,
      cells: [...state.pendingChoice.cells],
    };
  }
  if (state.winner !== undefined) snapshot.winner = state.winner;

  return snapshot;
}
