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

import type { GameMode, GameStatus } from '../../db/schema/games.ts';

/** A persisted event as it leaves the log: a discriminated payload + its seq. */
export interface LoggedEvent {
  seq: number;
  type: string;
  payload: Record<string, unknown>;
  /**
   * The game's `version` immediately AFTER the reduction that produced this
   * event (set on live broadcast by the move engine / lifecycle writers). It is
   * global per-game — safe for every seat, never redacted — so a client tracking
   * the live stream always knows the `version` to submit its next move with. Not
   * persisted per-event, so gap-replayed events from the log omit it (the
   * recovery snapshot supplies the version in that path).
   */
  version?: number;
}

/**
 * Event types that reveal a *specific seat's* private card(s). For a non-owning
 * recipient these are reduced to their public skeleton (the seat + type, no
 * card). The owning seat — and any local-game connection — sees them in full.
 */
const PRIVATE_EVENT_TYPES = new Set([
  'CardDrawn',
  'DeadCardSwapped',
  'HandUpdated',
]);

/** Card-bearing fields stripped from a private event for non-owning seats. */
const PRIVATE_FIELDS = ['card', 'drawn', 'discarded', 'hand'] as const;

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

  // Non-owning recipient: strip private card fields (the public version field,
  // when present, is preserved — it is global per-game, not seat-private).
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(event.payload)) {
    if ((PRIVATE_FIELDS as readonly string[]).includes(key)) continue;
    redacted[key] = value;
  }
  const out: LoggedEvent = {
    seq: event.seq,
    type: event.type,
    payload: redacted,
  };
  if (event.version !== undefined) out.version = event.version;
  return out;
}

/**
 * A redacted game snapshot for a recipient seat: the full public state plus the
 * recipient's OWN hand only (other hands + the deck are never serialized). For
 * a local game every hand is included (the one connection owns them all).
 */
export interface GameSnapshot {
  gameId: string;
  inviteCode: string;
  status: string;
  playerCount: number;
  mode: GameMode;
  timerSeconds: number | null;
  local: boolean;
  mySeat: number;
  currentSeat: number;
  round: number;
  /**
   * The game's current optimistic-concurrency `version`. A move mutation
   * requires the caller's last-seen `version`; the recovery snapshot is the
   * client's read path for it (the live stream keeps it current thereafter), so
   * a freshly-subscribed client can submit its next move without a DB read.
   * Global per-game — identical for every seat, nothing redacted.
   */
  version: number;
  /** Position code → { chip?, lockedBy? }. */
  board: Record<string, { chip?: number; lockedBy?: number }>;
  sequences: { id: number; team: number; cells: string[] }[];
  players: SnapshotPlayer[];
  /** Completed-sequence count per team (public). */
  teams: number[];
  /** The recipient's own hand (local games: every hand, indexed by seat). */
  hand: { rank: string; suit: string }[];
  localHands?: { rank: string; suit: string }[][];
  pendingChoice?: {
    seat: number;
    cells: string[];
    /** The cell just placed that opened the >5 run (lets the placer rebuild). */
    placed: string;
    /** Further >5 runs queued to resolve after this one (chained sequences). */
    additionalRuns?: string[][];
  };
  winner?: number;
  winnerTeam?: number | null;
  concededTeam?: number | null;
  endReason?: string | null;
  expiresAt?: string | null;
  turnDeadlineAt?: string | null;
  turnRemainingMs?: number | null;
}

export interface SnapshotPlayer {
  seat: number;
  team: number;
  name: string;
  isCreator: boolean;
  isGuest: boolean;
  connected: boolean;
}

export interface SnapshotMetadata {
  gameId: string;
  inviteCode: string;
  status: GameStatus;
  playerCount: number;
  mode: GameMode;
  timerSeconds: number | null;
  local: boolean;
  players: SnapshotPlayer[];
  winnerTeam: number | null;
  concededTeam?: number | null;
  endReason: string | null;
  expiresAt: Date | null;
  turnDeadlineAt: Date | null;
  turnRemainingMs: number | null;
}

/**
 * Build the redacted snapshot a subscriber receives first (the recovery
 * contract: snapshot, then live stream). Never serializes the deck or any
 * other seat's hand for a non-local game.
 */
export function buildSnapshot(
  state: GameState,
  recipientSeat: number,
  version: number,
  metadata?: SnapshotMetadata,
): GameSnapshot {
  const board: GameSnapshot['board'] = {};
  for (const [pos, cell] of state.board) {
    const entry: { chip?: number; lockedBy?: number } = {};
    if (cell.chip !== undefined) entry.chip = cell.chip;
    if (cell.lockedBy !== undefined) entry.lockedBy = cell.lockedBy;
    board[pos] = entry;
  }

  const snapshot: GameSnapshot = {
    gameId: metadata?.gameId ?? '',
    inviteCode: metadata?.inviteCode ?? '',
    status: state.status,
    playerCount: metadata?.playerCount ?? state.settings.playerCount,
    mode: metadata?.mode ?? state.settings.mode,
    timerSeconds: metadata?.timerSeconds ?? state.settings.timerSeconds,
    local: metadata?.local ?? state.settings.local,
    mySeat: recipientSeat,
    currentSeat: state.currentSeat,
    round: state.round,
    version,
    board,
    sequences: state.sequences.map((s) => ({
      id: s.id,
      team: s.team,
      cells: [...s.cells],
    })),
    players:
      metadata?.players ??
      state.teams.map((team, seat) => ({
        seat,
        team,
        name: `Player ${seat + 1}`,
        isCreator: seat === 0,
        isGuest: false,
        connected: false,
      })),
    teams: [...state.teams],
    hand: [...(state.hands[recipientSeat] ?? [])],
    winnerTeam: metadata?.winnerTeam ?? state.winner ?? null,
    concededTeam: metadata?.concededTeam ?? null,
    endReason: metadata?.endReason ?? null,
    expiresAt: metadata?.expiresAt?.toISOString() ?? null,
    turnDeadlineAt: metadata?.turnDeadlineAt?.toISOString() ?? null,
    turnRemainingMs: metadata?.turnRemainingMs ?? null,
  };

  if (state.settings.local) {
    snapshot.localHands = state.hands.map((h) => [...h]);
  }
  if (state.pendingChoice) {
    snapshot.pendingChoice = {
      seat: state.pendingChoice.seat,
      cells: [...state.pendingChoice.cells],
      placed: state.pendingChoice.placed,
      ...(state.pendingChoice.additionalRuns
        ? {
            additionalRuns: state.pendingChoice.additionalRuns.map((r) => [
              ...r,
            ]),
          }
        : {}),
    };
  }
  if (state.winner !== undefined) snapshot.winner = state.winner;

  return snapshot;
}
