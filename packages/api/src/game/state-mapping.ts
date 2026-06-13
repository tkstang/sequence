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
import { and, eq, max, sql } from 'drizzle-orm';

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
// Version-guarded lifecycle transitions
// ---------------------------------------------------------------------------

/**
 * Apply a status/lifecycle write to the `games` row under the SAME
 * optimistic-concurrency version guard the move engine uses: the UPDATE only
 * matches when `version === prevVersion`, and it bumps `version` to
 * `prevVersion + 1`. A concurrent committed move (which already bumped the
 * version) makes this match zero rows → {@link VersionConflictError}, so a
 * concede / save / freeze / resume can never be silently clobbered by — or
 * silently clobber — a racing move. Returns the new version.
 *
 * `set` carries the lifecycle-specific columns (status, endReason, winnerTeam,
 * expiresAt, finishedAt, …); `version` + `updatedAt` are applied here.
 */
export async function persistLifecycleTransition(
  tx: Tx,
  gameId: string,
  prevVersion: number,
  set: Partial<typeof games.$inferInsert>,
): Promise<number> {
  const nextVersion = prevVersion + 1;
  const updated = await tx
    .update(games)
    .set({ ...set, version: nextVersion, updatedAt: new Date() })
    .where(and(eq(games.id, gameId), eq(games.version, prevVersion)))
    .returning({ id: games.id });

  if (updated.length === 0) {
    throw new VersionConflictError(prevVersion, gameId);
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

export interface LoadedPlayerState {
  seat: number;
  team: number;
  userId: string | null;
  guestTokenHash: string | null;
}

export interface LoadedGameState {
  gameId: string;
  state: GameState;
  version: number;
  local: boolean;
  createdBy: string;
  currentSeat: number | null;
  players: LoadedPlayerState[];
}

interface JoinedGameStateRow {
  id: string;
  local: boolean;
  createdBy: string;
  playerCount: number;
  mode: GameSettings['mode'];
  timerSeconds: number | null;
  status: GameState['status'];
  version: number;
  currentSeat: number | null;
  round: number;
  nextSequenceId: number;
  pendingChoice: PendingChoiceJson | null;
  board: BoardJson | null;
  deck: Card[] | null;
  played: Card[] | null;
  sequences: SequenceJson[] | null;
  winnerTeam: number | null;
  seat: number | null;
  team: number | null;
  userId: string | null;
  guestTokenHash: string | null;
  hand: Card[] | null;
}

interface AppendedEventRow {
  seq: number;
  type: string;
  actorSeat: number | null;
}

function firstGameRow(rows: readonly JoinedGameStateRow[]): JoinedGameStateRow {
  const first = rows[0];
  if (!first) throw new Error('missing joined game row');
  return first;
}

function stateFromJoinedRows(rows: readonly JoinedGameStateRow[]): GameState {
  const first = firstGameRow(rows);
  const seatCount = first.playerCount;
  const hands: Card[][] = Array.from({ length: seatCount }, () => []);
  const teams: Team[] = Array.from({ length: seatCount }, () => 1 as Team);

  for (const row of rows) {
    if (row.seat === null || row.team === null) continue;
    hands[row.seat] = row.hand ?? [];
    teams[row.seat] = row.team as Team;
  }

  return {
    settings: {
      playerCount: first.playerCount as GameSettings['playerCount'],
      mode: first.mode,
      timerSeconds: first.timerSeconds,
      local: first.local,
    },
    status: first.status,
    board: deserializeBoard(first.board),
    hands,
    deck: first.deck ?? [],
    played: first.played ?? [],
    sequences: deserializeSequences(first.sequences),
    teams,
    currentSeat: first.currentSeat ?? 0,
    round: first.round,
    nextSequenceId: first.nextSequenceId,
    ...(first.pendingChoice
      ? { pendingChoice: deserializePendingChoice(first.pendingChoice) }
      : {}),
    ...(first.winnerTeam ? { winner: first.winnerTeam as Team } : {}),
  };
}

/**
 * Load a game's mutable state and all seat identity rows in one round trip.
 * The generic helpers above keep public behavior simple; the production move
 * hot path uses this combined load to avoid repeated game/player queries.
 */
export async function loadGameStateWithPlayers(
  tx: Tx,
  gameId: string,
): Promise<LoadedGameState | null> {
  const rows = (await tx.execute(sql`
    select
      g.id,
      g.local,
      g.created_by as "createdBy",
      g.player_count as "playerCount",
      g.mode,
      g.timer_seconds as "timerSeconds",
      g.status,
      g.version,
      g.current_seat as "currentSeat",
      g.round,
      g.next_sequence_id as "nextSequenceId",
      g.pending_choice as "pendingChoice",
      g.board,
      g.deck,
      g.played,
      g.sequences,
      g.winner_team as "winnerTeam",
      p.seat,
      p.team,
      p.user_id as "userId",
      p.guest_token_hash as "guestTokenHash",
      p.hand
    from games g
    left join game_players p on p.game_id = g.id
    where g.id = ${gameId}
    order by p.seat
  `)) as unknown as JoinedGameStateRow[];

  if (rows.length === 0) return null;
  return {
    gameId: rows[0]!.id,
    state: stateFromJoinedRows(rows),
    version: rows[0]!.version,
    local: rows[0]!.local,
    createdBy: rows[0]!.createdBy,
    currentSeat: rows[0]!.currentSeat,
    players: rows
      .filter((row) => row.seat !== null && row.team !== null)
      .map((row) => ({
        seat: row.seat!,
        team: row.team!,
        userId: row.userId,
        guestTokenHash: row.guestTokenHash,
      })),
  };
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

/**
 * Persist state and append emitted events in a single SQL statement. This keeps
 * the move hot path to one load round trip plus one atomic write round trip.
 */
export async function persistGameStateAndAppendEvents<E extends LoggableEvent>(
  tx: Tx,
  gameId: string,
  state: GameState,
  prevVersion: number,
  events: readonly E[],
): Promise<{ version: number; appended: AppendedEvent[] }> {
  if (events.length === 0) {
    const version = await persistGameState(tx, gameId, state, prevVersion);
    return { version, appended: [] };
  }

  const nextVersion = prevVersion + 1;
  const handValues = sql.join(
    state.hands.map(
      (hand, seat) => sql`(${seat}::smallint, ${JSON.stringify(hand)}::jsonb)`,
    ),
    sql`, `,
  );
  const eventValues = sql.join(
    events.map((event, index) => {
      const actorSeat = event.seat ?? null;
      return sql`(${index + 1}::integer, ${event.type}::text, ${JSON.stringify(event)}::jsonb, ${actorSeat}::smallint)`;
    }),
    sql`, `,
  );

  const rows = (await tx.execute(sql`
    with updated_game as (
      update games
      set
        status = ${state.status},
        version = ${nextVersion},
        current_seat = ${state.currentSeat},
        round = ${state.round},
        board = ${JSON.stringify(serializeBoard(state.board))}::jsonb,
        deck = ${JSON.stringify([...state.deck])}::jsonb,
        played = ${JSON.stringify([...state.played])}::jsonb,
        sequences = ${JSON.stringify(serializeSequences(state.sequences))}::jsonb,
        next_sequence_id = ${state.nextSequenceId},
        pending_choice = ${JSON.stringify(serializePendingChoice(state.pendingChoice))}::jsonb,
        winner_team = ${state.winner ?? null},
        updated_at = now()
      where id = ${gameId} and version = ${prevVersion}
      returning id
    ),
    hand_values(seat, hand) as (
      values ${handValues}
    ),
    updated_hands as (
      update game_players gp
      set hand = hv.hand
      from hand_values hv, updated_game ug
      where gp.game_id = ug.id and gp.seat = hv.seat
      returning gp.seat
    ),
    current_seq as (
      select coalesce(max(seq), 0) as base
      from game_events
      where game_id = ${gameId}
    ),
    event_values(ord, type, payload, actor_seat) as (
      values ${eventValues}
    )
    insert into game_events (game_id, seq, type, payload, actor_seat)
    select
      ${gameId},
      current_seq.base + event_values.ord,
      event_values.type,
      event_values.payload,
      event_values.actor_seat
    from event_values, current_seq, updated_game
    returning seq, type, actor_seat as "actorSeat"
  `)) as unknown as AppendedEventRow[];

  if (rows.length === 0) {
    throw new VersionConflictError(prevVersion, gameId);
  }

  return {
    version: nextVersion,
    appended: rows.map((row, index) => ({
      seq: row.seq,
      type: row.type,
      payload: events[index]!,
      actorSeat: row.actorSeat,
    })),
  };
}
