import type { Position } from '@sequence/game-logic';
import * as stylex from '@stylexjs/stylex';
import Image from 'next/image';
import type { DragEvent } from 'react';

import { color, fontWeight, shadow } from '@/styles/tokens.stylex.ts';

import type { CellHighlight } from '../GameBoard.utils.ts';
import { Chip } from './Chip.tsx';

export interface BoardCellProps {
  position: Position;
  isCorner: boolean;
  cardCode: string | null;
  assetPath: string | null;
  chip?: 1 | 2 | 3;
  lockedBy?: number;
  highlight?: CellHighlight;
  winning?: boolean;
  draggable?: boolean;
  onSelect?: (position: Position) => void;
  onHover?: (position: Position | null) => void;
  onDragStart?: (position: Position) => void;
  onDragEnd?: () => void;
  onDragOver?: (position: Position | null) => void;
  onDrop?: (position: Position) => void;
}

const styles = stylex.create({
  cell: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '3px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.border,
    backgroundColor: color.surface,
    boxShadow: shadow.sm,
    padding: 0,
    cursor: 'pointer',
    transitionProperty: 'box-shadow, filter, outline-color',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '1px',
  },
  corner: {
    backgroundColor: '#e8d9b5',
  },
  highlightValid: {
    boxShadow: `inset 0 0 0 2px ${color.highlight}`,
  },
  highlightPending: {
    boxShadow: 'inset 0 0 0 2px #ffffff',
  },
  highlightConfirm: {
    boxShadow: `inset 0 0 0 2px ${color.teamGreen}`,
    filter: 'brightness(1.1)',
  },
  winning: {
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineColor: color.highlight,
    outlineOffset: '1px',
  },
  image: {
    objectFit: 'contain',
  },
  wild: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(0.45rem, 1.6vw, 0.8rem)',
    fontWeight: fontWeight.black,
    color: color.textFaint,
  },
});

const HIGHLIGHT_STYLE = {
  'valid-target': styles.highlightValid,
  'hover-confirm': styles.highlightConfirm,
  'pending-choice': styles.highlightPending,
  'choice-selected': styles.highlightConfirm,
} satisfies Record<CellHighlight, unknown>;

export function BoardCell({
  position,
  isCorner,
  cardCode,
  assetPath,
  chip,
  lockedBy,
  highlight,
  winning = false,
  draggable = false,
  onSelect,
  onHover,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: BoardCellProps) {
  const label = isCorner ? 'wild corner' : (cardCode ?? position);
  const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
    if (!draggable) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', position);
    onDragStart?.(position);
  };
  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    if (!onDrop) return;
    event.preventDefault();
    onDragOver?.(position);
  };
  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    if (!onDrop) return;
    event.preventDefault();
    onDragOver?.(null);
    onDrop(position);
  };

  const imageProps = stylex.props(styles.image);

  return (
    <button
      type="button"
      aria-label={`${label} ${position}`}
      data-position={position}
      data-highlight={highlight}
      draggable={draggable}
      onClick={() => onSelect?.(position)}
      onPointerEnter={() => onHover?.(position)}
      onPointerLeave={() => onHover?.(null)}
      onDragStart={handleDragStart}
      onDragEnd={() => {
        onDragOver?.(null);
        onDragEnd?.();
      }}
      onDragOver={handleDragOver}
      onDragLeave={() => onDragOver?.(null)}
      onDrop={handleDrop}
      {...stylex.props(
        styles.cell,
        isCorner && styles.corner,
        highlight ? HIGHLIGHT_STYLE[highlight] : null,
        winning && styles.winning,
      )}
    >
      {assetPath ? (
        <Image
          src={assetPath}
          alt=""
          fill
          sizes="7vw"
          unoptimized
          className={imageProps.className}
          style={imageProps.style}
        />
      ) : (
        <span aria-hidden {...stylex.props(styles.wild)}>
          W
        </span>
      )}
      {chip ? (
        <Chip team={chip} locked={lockedBy !== undefined} winning={winning} />
      ) : null}
    </button>
  );
}
