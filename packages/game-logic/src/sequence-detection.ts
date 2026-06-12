/**
 * Sequence detection and locking.
 *
 * A sequence is five connected same-team chips in a row, column, or diagonal.
 * Rules encoded here (from rules-and-flows.md):
 *  - Corners are wild for ALL teams: a corner counts as a chip of whatever team
 *    is forming the line through it (4 chips + corner = sequence); teams may
 *    share a corner.
 *  - A run of exactly 5 auto-locks; a run longer than 5 requires the placer to
 *    choose which 5 cells lock (turn frozen until resolved).
 *  - One placement may complete two crossing sequences — both are reported.
 *  - Reuse rule: one cell from your first sequence may be part of your second.
 *    A candidate window is a *new* sequence only if it reuses at most one cell
 *    already locked in this team's existing sequences.
 */

import { coordOf, isCorner, positionAt } from './board-map.ts';
import type { Board, Position, Team } from './types.ts';

/** The four line directions (row, column, two diagonals). */
const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal ↘
  [1, -1], // diagonal ↙
];

export type DetectionResult =
  | { readonly kind: 'none' }
  | { readonly kind: 'autoLock'; readonly sequences: readonly Position[][] }
  | {
      readonly kind: 'choiceRequired';
      readonly runLength: number;
      readonly cells: readonly Position[];
    };

/** True if `pos` counts toward `team`'s line: a corner (wild) or a team chip. */
function countsFor(board: Board, pos: Position, team: Team): boolean {
  if (isCorner(pos)) return true;
  return board.get(pos)?.chip === team;
}

/** True if the cell is already locked into one of this team's sequences. */
function isLocked(board: Board, pos: Position): boolean {
  return board.get(pos)?.lockedBy !== undefined;
}

/**
 * Collect the maximal contiguous run of team-owned/corner cells through
 * `placed` along `(dr, dc)`, ordered from one end to the other.
 */
function runThrough(
  board: Board,
  placed: Position,
  team: Team,
  dr: number,
  dc: number,
): Position[] {
  const { row, col } = coordOf(placed);
  const run: Position[] = [placed];

  // Walk forward.
  for (let step = 1; ; step++) {
    const pos = positionAt(row + dr * step, col + dc * step);
    if (pos === undefined || !countsFor(board, pos, team)) break;
    run.push(pos);
  }
  // Walk backward (prepend).
  for (let step = 1; ; step++) {
    const pos = positionAt(row - dr * step, col - dc * step);
    if (pos === undefined || !countsFor(board, pos, team)) break;
    run.unshift(pos);
  }

  return run;
}

/**
 * Count cells in a window already locked in this team's sequences. A window is
 * a fresh sequence only when it reuses at most one such cell.
 */
function lockedCount(board: Board, window: readonly Position[]): number {
  let count = 0;
  for (const pos of window) {
    if (isLocked(board, pos)) count++;
  }
  return count;
}

export function detectSequences(
  board: Board,
  placed: Position,
  team: Team,
): DetectionResult {
  const autoLock: Position[][] = [];
  let longest: { runLength: number; cells: Position[] } | undefined;

  for (const [dr, dc] of DIRECTIONS) {
    const run = runThrough(board, placed, team, dr, dc);
    if (run.length < 5) continue;

    if (run.length === 5) {
      // Exactly five — a fresh sequence only if at most one cell is already
      // locked into a prior sequence of this team.
      if (lockedCount(board, run) <= 1) {
        autoLock.push(run);
      }
      continue;
    }

    // Run longer than five: the placer chooses which 5 cells lock. We surface
    // the whole eligible run and remember the longest across directions.
    if (!longest || run.length > longest.runLength) {
      longest = { runLength: run.length, cells: run };
    }
  }

  if (longest) {
    return {
      kind: 'choiceRequired',
      runLength: longest.runLength,
      cells: longest.cells,
    };
  }

  if (autoLock.length > 0) {
    return { kind: 'autoLock', sequences: autoLock };
  }

  return { kind: 'none' };
}

/**
 * Lock the given cells into a sequence: mark each occupied cell `lockedBy`.
 * Corner cells are never occupied, so they are skipped. Pure — returns a new
 * board.
 */
export function lockSequence(
  board: Board,
  cells: readonly Position[],
  seqId: number,
): Board {
  const next = new Map(board);
  for (const pos of cells) {
    if (isCorner(pos)) continue;
    const cell = next.get(pos);
    if (!cell) continue;
    next.set(pos, { ...cell, lockedBy: seqId });
  }
  return next;
}
