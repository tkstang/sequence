/**
 * API-side game domain types: the serialized (jsonb) shapes of an in-memory
 * `GameState`, plus small helpers shared across the game routes.
 *
 * The pure rules engine (`@sequence/game-logic`) owns the canonical in-memory
 * `GameState` (a `Board` keyed by position code, `Card` objects, etc.). The DB
 * stores the same data as jsonb. `state-mapping.ts` is the single bridge: it
 * assembles a `GameState` from the `games` row + `game_players` rows and writes
 * the changed fields back in one transaction under a version guard.
 */

import type { Position, Team } from '@sequence/game-logic';

/** Serialized board cell (jsonb). `chip`/`lockedBy` absent = empty cell. */
export interface BoardCellJson {
  chip?: Team;
  lockedBy?: number;
}

/**
 * Serialized board (jsonb): position code → cell. A sparse object keyed by the
 * board's own position codes (e.g. `'1AC'`) round-trips the in-memory
 * `ReadonlyMap<Position, BoardCell>` exactly — empty cells are simply absent.
 */
export type BoardJson = Record<Position, BoardCellJson>;

/** Serialized completed sequence (jsonb). */
export interface SequenceJson {
  id: number;
  team: Team;
  cells: Position[];
}

/** Serialized pending >5-run choice (jsonb). Mirrors `PendingChoice`. */
export interface PendingChoiceJson {
  seat: number;
  team: Team;
  placed: Position;
  cells: Position[];
  additionalRuns?: Position[][];
}

/** A persisted game event row's payload — the engine's `GameEvent`, as jsonb. */
export type GameEventPayload = Record<string, unknown>;
