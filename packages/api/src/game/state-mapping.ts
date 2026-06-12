/**
 * The single bridge between the in-memory `GameState` (owned by
 * `@sequence/game-logic`) and its persisted jsonb form.
 *
 *  - `loadGameState(tx, gameId)` assembles a `GameState` from the `games` row +
 *    all `game_players.hand` rows.
 *  - `persistGameState(tx, gameId, state, prevVersion)` writes the changed
 *    fields back under an optimistic-concurrency version guard (throws
 *    {@link VersionConflictError} when the row moved on), bumping `version`.
 *  - `appendEvents(tx, gameId, events)` appends events with a monotonic per-game
 *    `seq`, returning the assigned rows.
 *
 * All three take a Drizzle transaction so the move engine (p04-t07) can do
 * load → reduce → persist → append in one atomic unit.
 */

import type {
  Board,
  Card,
  GameSettings,
  GameState,
  PendingChoice,
  Position,
  Sequence,
  Team,
} from '@sequence/game-logic';
import { and, eq, max } from 'drizzle-orm';

import type { Database } from '../db/client.ts';
import { gameEvents } from '../db/schema/game-events.ts';
import { gamePlayers } from '../db/schema/game-players.ts';
import { games } from '../db/schema/games.ts';
import type {
  BoardCellJson,
  BoardJson,
  PendingChoiceJson,
  SequenceJson,
} from './game.types.ts';

/**
 * A Drizzle transaction (or the base db). The mapping helpers accept either so
 * callers can compose them inside `db.transaction(...)` or run them standalone.
 */
export type Tx =
  | Database
  | Parameters<Parameters<Database['transaction']>[0]>[0];

/** Thrown by {@link persistGameState} when `prevVersion` no longer matches. */
export class VersionConflictError extends Error {
  constructor(
    readonly expected: number,
    readonly gameId: string,
  ) {
    super(`version conflict for game ${gameId} (expected ${expected})`);
    this.name = 'VersionConflictError';
  }
}

// ---------------------------------------------------------------------------
// Board (de)serialization
// ---------------------------------------------------------------------------

/** In-memory `Board` (Map keyed by position code) → sparse jsonb object. */
function serializeBoard(board: Board): BoardJson {
  const out: BoardJson = {};
  for (const [pos, cell] of board) {
    const json: BoardCellJson = {};
    if (cell.chip !== undefined) json.chip = cell.chip;
    if (cell.lockedBy !== undefined) json.lockedBy = cell.lockedBy;
    out[pos] = json;
  }
  return out;
}

/** Sparse jsonb object → in-memory `Board` (empty cells simply absent). */
function deserializeBoard(json: BoardJson | null): Board {
  const board = new Map<Position, BoardCellJson>();
  if (json) {
    for (const [pos, cell] of Object.entries(json)) {
      board.set(pos, cell);
    }
  }
  return board;
}

function serializeSequences(sequences: readonly Sequence[]): SequenceJson[] {
  return sequences.map((s) => ({
    id: s.id,
    team: s.team,
    cells: [...s.cells],
  }));
}

function deserializeSequences(json: SequenceJson[] | null): Sequence[] {
  return (json ?? []).map((s) => ({ id: s.id, team: s.team, cells: s.cells }));
}

function serializePendingChoice(
  pc: PendingChoice | undefined,
): PendingChoiceJson | null {
  if (!pc) return null;
  const out: PendingChoiceJson = {
    seat: pc.seat,
    team: pc.team,
    placed: pc.placed,
    cells: [...pc.cells],
  };
  if (pc.additionalRuns) {
    out.additionalRuns = pc.additionalRuns.map((r) => [...r]);
  }
  return out;
}

function deserializePendingChoice(
  json: PendingChoiceJson | null,
): PendingChoice | undefined {
  if (!json) return undefined;
  return {
    seat: json.seat,
    team: json.team,
    placed: json.placed,
    cells: json.cells,
    ...(json.additionalRuns ? { additionalRuns: json.additionalRuns } : {}),
  };
}

// ---------------------------------------------------------------------------
// Load
// ---------------------------------------------------------------------------

/**
 * Assemble the in-memory `GameState` from the persisted row + hands. Throws if
 * the game does not exist. Hands index by seat (gaps filled with empty arrays).
 */
export async function loadGameState(
  tx: Tx,
  gameId: string,
): Promise<GameState> {
  const [row] = await tx.select().from(games).where(eq(games.id, gameId));
  if (!row) throw new Error(`game not found: ${gameId}`);

  const playerRows = await tx
    .select({
      seat: gamePlayers.seat,
      team: gamePlayers.team,
      hand: gamePlayers.hand,
    })
    .from(gamePlayers)
    .where(eq(gamePlayers.gameId, gameId))
    .orderBy(gamePlayers.seat);

  const seatCount = row.playerCount;
  const hands: Card[][] = Array.from({ length: seatCount }, () => []);
  const teams: Team[] = Array.from({ length: seatCount }, () => 1 as Team);
  for (const p of playerRows) {
    hands[p.seat] = (p.hand ?? []) as Card[];
    teams[p.seat] = p.team as Team;
  }

  const settings: GameSettings = {
    playerCount: row.playerCount as GameSettings['playerCount'],
    mode: row.mode,
    timerSeconds: row.timerSeconds,
    local: row.local,
  };

  const state: GameState = {
    settings,
    status: row.status,
    board: deserializeBoard(row.board as BoardJson | null),
    hands,
    deck: (row.deck ?? []) as Card[],
    played: (row.played ?? []) as Card[],
    sequences: deserializeSequences(row.sequences as SequenceJson[] | null),
    teams,
    currentSeat: row.currentSeat ?? 0,
    round: row.round,
    nextSequenceId: row.nextSequenceId,
    ...(row.pendingChoice
      ? {
          pendingChoice: deserializePendingChoice(
            row.pendingChoice as PendingChoiceJson,
          ),
        }
      : {}),
    ...(row.winnerTeam ? { winner: row.winnerTeam as Team } : {}),
  };

  return state;
}

// ---------------------------------------------------------------------------
// Persist
// ---------------------------------------------------------------------------

/**
 * Write the game's mutable state back, guarded on `prevVersion`. Updates the
 * `games` jsonb columns + status/seat/round/etc. and each seat's hand, bumping
 * `version` to `prevVersion + 1`. Throws {@link VersionConflictError} if the
 * row's version is not `prevVersion` (a concurrent write won the race).
 */
export async function persistGameState(
  tx: Tx,
  gameId: string,
  state: GameState,
  prevVersion: number,
): Promise<number> {
  const nextVersion = prevVersion + 1;

  // The version guard is the WHERE predicate: the UPDATE only matches the row
  // when its current version equals `prevVersion`. A concurrent writer that
  // already bumped the version makes this match zero rows → CONFLICT. This is
  // the optimistic-concurrency primitive the move engine relies on.
  const updated = await tx
    .update(games)
    .set({
      status: state.status,
      version: nextVersion,
      currentSeat: state.currentSeat,
      round: state.round,
      board: serializeBoard(state.board),
      deck: [...state.deck],
      played: [...state.played],
      sequences: serializeSequences(state.sequences),
      nextSequenceId: state.nextSequenceId,
      pendingChoice: serializePendingChoice(state.pendingChoice),
      winnerTeam: state.winner ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(games.id, gameId), eq(games.version, prevVersion)))
    .returning({ id: games.id, version: games.version });

  if (updated.length === 0) {
    throw new VersionConflictError(prevVersion, gameId);
  }

  // Persist each seat's hand (private state lives in game_players).
  for (let seat = 0; seat < state.hands.length; seat++) {
    await tx
      .update(gamePlayers)
      .set({ hand: [...(state.hands[seat] ?? [])] })
      .where(and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.seat, seat)));
  }

  return nextVersion;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * The minimal shape the event log requires: a discriminator `type` and an
 * optional `seat` (stamped into `actor_seat`). Both the rules-engine
 * `GameEvent` and the API `LobbyEvent` satisfy this, so they share one log and
 * one subscription (design §Event stream contract).
 */
export interface LoggableEvent {
  readonly type: string;
  readonly seat?: number;
}

/** A persisted event row, as returned by {@link appendEvents}. */
export interface AppendedEvent {
  seq: number;
  type: string;
  payload: LoggableEvent;
  actorSeat: number | null;
}

/**
 * Append `events` to the game's log with a monotonic per-game `seq`. Reads the
 * current max seq under the transaction, then inserts sequentially. The
 * `actor_seat` column is stamped from the event's own `seat` when present.
 */
export async function appendEvents<E extends LoggableEvent>(
  tx: Tx,
  gameId: string,
  events: readonly E[],
): Promise<AppendedEvent[]> {
  if (events.length === 0) return [];

  const [{ value: currentMax } = { value: null }] = await tx
    .select({ value: max(gameEvents.seq) })
    .from(gameEvents)
    .where(eq(gameEvents.gameId, gameId));

  let seq = currentMax ?? 0;
  const rows = events.map((event) => {
    seq += 1;
    const actorSeat = event.seat ?? null;
    return {
      gameId,
      seq,
      type: event.type,
      payload: event as unknown as Record<string, unknown>,
      actorSeat,
    };
  });

  await tx.insert(gameEvents).values(rows);

  return rows.map((r, i) => ({
    seq: r.seq,
    type: r.type,
    payload: events[i]!,
    actorSeat: r.actorSeat,
  }));
}
