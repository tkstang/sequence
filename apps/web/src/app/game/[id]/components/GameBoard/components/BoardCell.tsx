import type { Position } from '@sequence/game-logic';
import Image from 'next/image';
import type { DragEvent } from 'react';

import type { CellHighlight } from '../GameBoard.utils.ts';
import { Chip } from './Chip.tsx';

export interface BoardCellProps {
  position: Position;
  isCorner: boolean;
  cardCode: string | null;
  assetPath: string | null;
  rotation: number;
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

const HIGHLIGHT_CLASS: Record<CellHighlight, string> = {
  'valid-target': 'ring-2 ring-yellow-300',
  'hover-confirm': 'ring-2 ring-team-green brightness-110',
  'pending-choice': 'ring-2 ring-white',
};

export function BoardCell({
  position,
  isCorner,
  cardCode,
  assetPath,
  rotation,
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
      className={`relative aspect-square overflow-hidden rounded-[3px] border border-black/15 bg-white shadow-sm transition ${
        isCorner ? 'bg-[#e8d9b5]' : ''
      } ${highlight ? HIGHLIGHT_CLASS[highlight] : ''} ${
        winning ? 'outline-2 outline-offset-1 outline-yellow-300' : ''
      }`}
    >
      {assetPath ? (
        <Image
          src={assetPath}
          alt=""
          fill
          sizes="7vw"
          unoptimized
          className="object-cover"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center text-[clamp(0.45rem,1.6vw,0.8rem)] font-black text-black/35"
        >
          W
        </span>
      )}
      {chip ? (
        <Chip team={chip} locked={lockedBy !== undefined} winning={winning} />
      ) : null}
    </button>
  );
}
