'use client';

import type { Position } from '@sequence/game-logic';
import { useEffect, useMemo } from 'react';

import type { SnapshotBoardCell } from '../game-state.ts';
import { BoardCell } from './components/BoardCell.tsx';
import { allCardAssetPaths, buildBoardCells } from './GameBoard.utils.ts';

export interface GameBoardProps {
  board: Record<Position, SnapshotBoardCell>;
  validTargets?: readonly Position[];
  hoverPosition?: Position | null;
  pendingChoiceCells?: readonly Position[];
  winningCells?: readonly Position[];
  onCellSelect?: (position: Position) => void;
  onCellHover?: (position: Position | null) => void;
}

export function usePreloadCardAssets(enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    for (const src of allCardAssetPaths()) {
      const image = new Image();
      image.src = src;
    }
  }, [enabled]);
}

export function GameBoard({
  board,
  validTargets = [],
  hoverPosition = null,
  pendingChoiceCells = [],
  winningCells = [],
  onCellSelect,
  onCellHover,
}: GameBoardProps) {
  usePreloadCardAssets();
  const cells = useMemo(
    () =>
      buildBoardCells({
        board,
        validTargets,
        hoverPosition,
        pendingChoiceCells,
        winningCells,
      }),
    [board, hoverPosition, pendingChoiceCells, validTargets, winningCells],
  );

  return (
    <div
      role="grid"
      aria-label="Sequence board"
      className="bg-felt-dark grid aspect-square w-full max-w-[min(92vw,680px)] grid-cols-10 gap-[2px] rounded-lg p-1.5 shadow-xl"
    >
      {cells.map((cell) => (
        <BoardCell
          key={cell.position}
          position={cell.position}
          isCorner={cell.isCorner}
          cardCode={cell.cardCode}
          assetPath={cell.assetPath}
          rotation={cell.rotation}
          chip={cell.chip}
          lockedBy={cell.lockedBy}
          highlight={cell.highlight}
          winning={cell.winning}
          onSelect={onCellSelect}
          onHover={onCellHover}
        />
      ))}
    </div>
  );
}
