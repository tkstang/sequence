import {
  BOARD_MAP,
  BOARD_SIZE,
  isCorner,
  parseBoardCell,
  type Position,
} from '@sequence/game-logic';

import type { SnapshotBoardCell } from '../game-state.ts';

export type CellHighlight =
  | 'valid-target'
  | 'hover-confirm'
  | 'pending-choice'
  | 'choice-selected';

export interface BoardCellView {
  position: Position;
  row: number;
  col: number;
  isCorner: boolean;
  cardCode: string | null;
  assetPath: string | null;
  rotation: number;
  chip?: SnapshotBoardCell['chip'];
  lockedBy?: number;
  highlight?: CellHighlight;
  winning: boolean;
}

export interface BuildBoardCellsOptions {
  board: Record<Position, SnapshotBoardCell>;
  validTargets?: readonly Position[];
  hoverPosition?: Position | null;
  pendingChoiceCells?: readonly Position[];
  choiceSelectedCells?: readonly Position[];
  winningCells?: readonly Position[];
}

export function cardAssetPath(cardCode: string): string {
  return `/cards/${cardCode}.svg`;
}

function rotationFor(row: number, col: number): number {
  if (row === 0) return 180;
  if (row === BOARD_SIZE - 1) return 0;
  if (col === 0) return 90;
  if (col === BOARD_SIZE - 1) return -90;
  return 0;
}

export function buildBoardCells({
  board,
  validTargets = [],
  hoverPosition = null,
  pendingChoiceCells = [],
  choiceSelectedCells = [],
  winningCells = [],
}: BuildBoardCellsOptions): BoardCellView[] {
  const valid = new Set(validTargets);
  const pending = new Set(pendingChoiceCells);
  const selectedChoice = new Set(choiceSelectedCells);
  const winning = new Set(winningCells);
  const out: BoardCellView[] = [];

  for (let row = 0; row < BOARD_MAP.length; row++) {
    const cells = BOARD_MAP[row]!;
    for (let col = 0; col < cells.length; col++) {
      const position = cells[col]! as Position;
      const parsed = parseBoardCell(position);
      const cardCode =
        parsed.kind === 'card' ? `${parsed.rank}${parsed.suit}` : null;
      const cell = board[position];
      const highlight =
        hoverPosition === position
          ? 'hover-confirm'
          : selectedChoice.has(position)
            ? 'choice-selected'
            : pending.has(position)
              ? 'pending-choice'
              : valid.has(position)
                ? 'valid-target'
                : undefined;
      out.push({
        position,
        row,
        col,
        isCorner: isCorner(position),
        cardCode,
        assetPath: cardCode ? cardAssetPath(cardCode) : null,
        rotation: rotationFor(row, col),
        chip: cell?.chip,
        lockedBy: cell?.lockedBy,
        highlight,
        winning: winning.has(position),
      });
    }
  }

  return out;
}

export function allCardAssetPaths(): string[] {
  const paths = new Set<string>();
  for (const row of BOARD_MAP) {
    for (const position of row) {
      const parsed = parseBoardCell(position);
      if (parsed.kind === 'card') {
        paths.add(cardAssetPath(`${parsed.rank}${parsed.suit}`));
      }
    }
  }
  return [...paths];
}
