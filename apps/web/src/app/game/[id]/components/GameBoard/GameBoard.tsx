'use client';

import type { Position } from '@sequence/game-logic';
import * as stylex from '@stylexjs/stylex';
import { useEffect, useMemo } from 'react';

import { color, radius, shadow, space } from '@/styles/tokens.stylex.ts';

import type { SnapshotBoardCell } from '../game-state.ts';
import { BoardCell } from './components/BoardCell.tsx';
import { allCardAssetPaths, buildBoardCells } from './GameBoard.utils.ts';

const styles = stylex.create({
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
    gridTemplateRows: 'repeat(10, minmax(0, 1fr))',
    // Cards are upright (portrait), so each cell — and the whole 10×10 board —
    // takes the playing-card aspect ratio. No rotation, no dead space; the board
    // is rectangular rather than square.
    aspectRatio: '224.225 / 312.808',
    width: '100%',
    gap: '2px',
    padding: space.xs,
    borderRadius: radius.md,
    backgroundColor: color.feltDark,
    boxShadow: shadow.lg,
  },
});

export interface GameBoardProps {
  board: Record<Position, SnapshotBoardCell>;
  validTargets?: readonly Position[];
  hoverPosition?: Position | null;
  pendingChoiceCells?: readonly Position[];
  choiceSelectedCells?: readonly Position[];
  winningCells?: readonly Position[];
  canDragCell?: (position: Position) => boolean;
  onCellSelect?: (position: Position) => void;
  onCellHover?: (position: Position | null) => void;
  onCellDragStart?: (position: Position) => void;
  onCellDragEnd?: () => void;
  onCellDragOver?: (position: Position | null) => void;
  onCellDrop?: (position: Position) => void;
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
  choiceSelectedCells = [],
  winningCells = [],
  canDragCell,
  onCellSelect,
  onCellHover,
  onCellDragStart,
  onCellDragEnd,
  onCellDragOver,
  onCellDrop,
}: GameBoardProps) {
  usePreloadCardAssets();
  const boardProps = stylex.props(styles.board);
  const cells = useMemo(
    () =>
      buildBoardCells({
        board,
        validTargets,
        hoverPosition,
        pendingChoiceCells,
        choiceSelectedCells,
        winningCells,
      }),
    [
      board,
      choiceSelectedCells,
      hoverPosition,
      pendingChoiceCells,
      validTargets,
      winningCells,
    ],
  );

  return (
    <div
      role="grid"
      aria-label="Sequence board"
      className={boardProps.className}
      style={{
        ...boardProps.style,
        // Portrait board: height = width × 312.808/224.225 (≈1.395). Cap width so
        // that height fits the available space (the 0.717 factor = 224.225/312.808).
        maxWidth: 'min(94vw, 460px, calc((100dvh - 22rem) * 0.717))',
      }}
    >
      {cells.map((cell) => (
        <BoardCell
          key={cell.position}
          position={cell.position}
          isCorner={cell.isCorner}
          cardCode={cell.cardCode}
          assetPath={cell.assetPath}
          chip={cell.chip}
          lockedBy={cell.lockedBy}
          highlight={cell.highlight}
          winning={cell.winning}
          draggable={canDragCell?.(cell.position) ?? false}
          onSelect={onCellSelect}
          onHover={onCellHover}
          onDragStart={onCellDragStart}
          onDragEnd={onCellDragEnd}
          onDragOver={onCellDragOver}
          onDrop={onCellDrop}
        />
      ))}
    </div>
  );
}
