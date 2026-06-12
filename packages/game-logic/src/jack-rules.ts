/**
 * Jack rules.
 *
 *  - Two-eyed jack (wild): place a chip on any open cell. Corners are never
 *    placed on (they are free wild spaces, not occupiable).
 *  - One-eyed jack: remove an opponent's chip that is not part of a completed
 *    (locked) sequence; cannot target your own chip, a locked chip, or an empty
 *    cell. With no legal target the jack is simply unplayable that turn — it is
 *    NOT a dead card (it regains value the instant an opponent places a chip).
 */

import { ALL_POSITIONS, isCorner } from './board-map.ts';
import type { Board, Position, RuleViolation, Team } from './types.ts';

export type Verdict =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: RuleViolation };

const OK: Verdict = { ok: true };

/** May a two-eyed (wild) jack place a chip on `position`? */
export function canPlaceWild(board: Board, position: Position): Verdict {
  // Corners are free spaces — they are never placed on. An occupied card cell
  // is likewise unavailable. Both surface as `space-occupied`.
  if (isCorner(position) || board.get(position)?.chip !== undefined) {
    return { ok: false, error: { code: 'space-occupied' } };
  }
  return OK;
}

/** May a one-eyed jack played by `team` remove the chip at `position`? */
export function canRemoveChip(
  board: Board,
  position: Position,
  team: Team,
): Verdict {
  const cell = board.get(position);
  if (!cell || cell.chip === undefined) {
    return { ok: false, error: { code: 'empty-cell' } };
  }
  if (cell.chip === team) {
    return { ok: false, error: { code: 'own-chip' } };
  }
  if (cell.lockedBy !== undefined) {
    return { ok: false, error: { code: 'chip-locked' } };
  }
  return OK;
}

/**
 * All cells a one-eyed jack played by `team` could legally clear: opponent
 * chips that are not locked into a sequence. Empty on a fresh board.
 */
export function oneEyedTargets(board: Board, team: Team): Position[] {
  const targets: Position[] = [];
  for (const position of ALL_POSITIONS) {
    if (canRemoveChip(board, position, team).ok) {
      targets.push(position);
    }
  }
  return targets;
}
