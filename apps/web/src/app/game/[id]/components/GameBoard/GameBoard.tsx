'use client';

import type { SnapshotBoardCell } from '@sequence/client-state';
import type { Position } from '@sequence/game-logic';
import * as stylex from '@stylexjs/stylex';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

import {
  color,
  fontSize,
  fontWeight,
  radius,
  shadow,
  space,
} from '@/styles/tokens.stylex.ts';

import { BoardCell } from './components/BoardCell.tsx';
import { allCardAssetPaths, buildBoardCells } from './GameBoard.utils.ts';

// Upright (portrait) the board is capped so its height fits the viewport
// (0.717 = 224.225/312.808). Turned on its side it fills more width; the long
// edge is shared via the `--board-long` custom property. The width cap and the
// vertical reserve are overridable via custom properties so an expanded/maximized
// context (e.g. the playground "Expand" overlay) can let the board grow.
const PORTRAIT_MAX =
  'min(94vw, var(--board-max-width, 460px), calc((100dvh - var(--board-reserve, 22rem)) * 0.717))';
const LANDSCAPE_LONG =
  'min(94vw, var(--board-max-width, 880px), calc((100dvh - var(--board-reserve, 12rem)) * 1.395))';
const PORTRAIT_RATIO = '224.225 / 312.808';
const LANDSCAPE_RATIO = '312.808 / 224.225';

const styles = stylex.create({
  shell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: space.sm,
    marginInline: 'auto',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  frame: {
    position: 'relative',
    width: '100%',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
    gridTemplateRows: 'repeat(10, minmax(0, 1fr))',
    gap: '2px',
    padding: space.xs,
    borderRadius: radius.md,
    backgroundColor: color.feltDark,
    boxShadow: shadow.lg,
    transformOrigin: 'center center',
  },
  rotateButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.xs,
    paddingBlock: space.xs,
    paddingInline: space.sm,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.border,
    borderRadius: radius.pill,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: 1,
    cursor: 'pointer',
    color: color.textMuted,
    backgroundColor: { default: color.surface, ':hover': color.hoverWash },
    transitionProperty: 'background-color, color, border-color',
    transitionDuration: '120ms',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
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
  // Optional whole-board rotation (0 / 90 / 180 / 270) — turn it like a physical
  // board to view from another "seat". Default upright; everything inside the
  // board rotates together, so cards/chips/highlights and tap targets stay correct.
  const [rotation, setRotation] = useState(0);
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

  const quarter = rotation % 180 !== 0;
  // Spotlight: only while a selected card's targets are being previewed
  // (validTargets is empty otherwise — it never auto-lists all plays).
  const spotlight = validTargets.length > 0;
  const shellProps = stylex.props(styles.shell);
  const frameProps = stylex.props(styles.frame);
  const boardProps = stylex.props(styles.board);

  // The shell carries the footprint width (portrait cap vs landscape long edge);
  // the frame inside fills it and sets the aspect ratio for that orientation.
  const shellStyle = {
    ...shellProps.style,
    '--board-long': LANDSCAPE_LONG,
    width: quarter ? 'var(--board-long)' : '100%',
    maxWidth: quarter ? 'none' : PORTRAIT_MAX,
  } as CSSProperties;
  const frameStyle: CSSProperties = {
    ...frameProps.style,
    aspectRatio: quarter ? LANDSCAPE_RATIO : PORTRAIT_RATIO,
  };

  // When turned a quarter-turn, the (portrait) grid is absolutely centered and
  // rotated so it fills the landscape frame; upright it just fills the frame.
  const boardStyle: CSSProperties = quarter
    ? {
        ...boardProps.style,
        // Center via inset:0 + margin:auto (works for any size), then rotate
        // around center. translate(-50%,-50%) would mis-center once rotated.
        position: 'absolute',
        insetBlock: 0,
        insetInline: 0,
        margin: 'auto',
        width: 'calc(var(--board-long) * 0.717)',
        height: 'var(--board-long)',
        transform: `rotate(${rotation}deg)`,
      }
    : {
        ...boardProps.style,
        width: '100%',
        height: '100%',
        transform: `rotate(${rotation}deg)`,
      };

  return (
    <div className={shellProps.className} style={shellStyle}>
      <div {...stylex.props(styles.toolbar)}>
        <button
          type="button"
          onClick={() => setRotation((current) => (current + 90) % 360)}
          aria-label="Rotate board"
          title="Rotate board"
          {...stylex.props(styles.rotateButton)}
        >
          <span aria-hidden>⟳</span> Rotate
        </button>
      </div>
      <div className={frameProps.className} style={frameStyle}>
        <div
          role="grid"
          aria-label="Sequence board"
          className={boardProps.className}
          style={boardStyle}
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
              dimmed={
                spotlight &&
                cell.highlight !== 'valid-target' &&
                cell.highlight !== 'hover-confirm'
              }
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
      </div>
    </div>
  );
}
