import {
  isDeadCard,
  type Card,
  type Move,
  type Position,
  type Team,
} from '@sequence/game-logic';

import type { SnapshotBoardCell } from '../game-state.ts';
import { boardRecordToMap } from './tap-controller.ts';

export type DragIntent =
  | { kind: 'place' }
  | { kind: 'removeChip'; position: Position }
  | { kind: 'turnInDeadCard'; card: Card; index: number };

export function buildDragPlacementMove(position: Position | null): Move | null {
  if (!position) return null;
  return { type: 'place', position };
}

export function canDragChipForRemoval(
  board: Record<Position, SnapshotBoardCell>,
  position: Position,
  team: Team,
): boolean {
  const cell = board[position];
  return (
    cell?.chip !== undefined &&
    cell.chip !== team &&
    cell.lockedBy === undefined
  );
}

export function buildChipRemovalMove(
  board: Record<Position, SnapshotBoardCell>,
  position: Position,
  team: Team,
): Move | null {
  if (!canDragChipForRemoval(board, position, team)) return null;
  return { type: 'removeChip', position };
}

export function buildDeadCardTurnIn(
  hand: readonly Card[],
  board: Record<Position, SnapshotBoardCell>,
  index: number,
): Card | null {
  const card = hand[index];
  if (!card) return null;
  return isDeadCard(card, boardRecordToMap(board)) ? card : null;
}

export function dragHoverTarget(
  intent: DragIntent | null,
  position: Position | null,
): Position | null {
  return intent?.kind === 'place' ? position : null;
}
