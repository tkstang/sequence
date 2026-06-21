import {
  isDeadCard,
  isOneEyedJack,
  validPlacements,
  type Board,
  type BoardCell,
  type Card,
  type Move,
  type Position,
  type Team,
} from '@sequence/game-logic';

import type { SnapshotBoardCell } from '../game-state.ts';

export interface TapSelection {
  selectedIndex: number;
  card: Card;
  validTargets: Position[];
  moveType: Move['type'];
}

export interface TapSelectionInput {
  hand: readonly Card[];
  board: Record<Position, SnapshotBoardCell>;
  team: Team;
  selectedIndex: number | null;
}

export function boardRecordToMap(
  board: Record<Position, SnapshotBoardCell>,
): Board {
  const map = new Map<Position, BoardCell>();
  for (const [position, cell] of Object.entries(board)) {
    map.set(position as Position, cell);
  }
  return map;
}

export function createTapSelection({
  hand,
  board,
  team,
  selectedIndex,
}: TapSelectionInput): TapSelection | null {
  if (selectedIndex === null) return null;
  const card = hand[selectedIndex];
  if (!card) return null;
  const logicBoard = boardRecordToMap(board);
  const placements = validPlacements(hand, logicBoard, team);
  const validTargets = placements.get(card) ?? [];
  return {
    selectedIndex,
    card,
    validTargets,
    moveType: isOneEyedJack(card) ? 'removeChip' : 'place',
  };
}

export function buildTapMove(
  selection: TapSelection | null,
  position: Position,
): Move | null {
  if (!selection?.validTargets.includes(position)) return null;
  if (selection.moveType === 'removeChip') {
    return { type: 'removeChip', position, card: selection.card };
  }
  return { type: 'place', position, card: selection.card };
}

export function deadCardIndexes(
  hand: readonly Card[],
  board: Record<Position, SnapshotBoardCell>,
): number[] {
  const logicBoard = boardRecordToMap(board);
  const out: number[] = [];
  for (let index = 0; index < hand.length; index++) {
    const card = hand[index]!;
    if (isDeadCard(card, logicBoard)) out.push(index);
  }
  return out;
}
