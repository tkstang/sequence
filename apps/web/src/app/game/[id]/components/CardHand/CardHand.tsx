'use client';

import type { Card } from '@sequence/game-logic';
import Image from 'next/image';
import { useState, type DragEvent } from 'react';

import { cardAssetPath } from '../GameBoard/GameBoard.utils.ts';

export interface CardHandProps {
  hand: readonly Card[];
  mode: 'tap' | 'drag';
  selectedIndex?: number | null;
  deadCardIndexes?: readonly number[];
  onSelectCard?: (card: Card, index: number) => void;
  onCardDragStart?: (card: Card, index: number) => void;
  onCardDragEnd?: () => void;
}

function cardCode(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function transformFor(index: number, total: number, raised: boolean): string {
  const center = (total - 1) / 2;
  const offset = index - center;
  const rotation = offset * 4;
  const y = raised ? Math.abs(offset) * 4 : 18 + Math.abs(offset) * 7;
  return `translateY(${y}px) rotate(${rotation}deg)`;
}

/**
 * Peeking hand fan (p06-t04): cards overlap the lower board edge, tap the fan
 * to raise/lower, and tap a card to select it for default mode.
 */
export function CardHand({
  hand,
  mode,
  selectedIndex = null,
  deadCardIndexes = [],
  onSelectCard,
  onCardDragStart,
  onCardDragEnd,
}: CardHandProps) {
  const [raised, setRaised] = useState(false);
  const dead = new Set(deadCardIndexes);

  return (
    <section
      aria-label="Your hand"
      className={`relative mx-auto flex min-h-24 w-full max-w-[min(94vw,680px)] items-end justify-center overflow-visible px-2 pt-4 pb-2 transition-transform sm:min-h-28 sm:px-3 ${
        raised ? 'translate-y-0' : 'translate-y-4'
      }`}
    >
      <button
        type="button"
        aria-label={raised ? 'Lower hand' : 'Raise hand'}
        onClick={() => setRaised((current) => !current)}
        className="focus-visible:outline-slate absolute top-1 rounded-full px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span
          aria-hidden
          className="block h-1.5 w-12 rounded-full bg-black/25"
        />
      </button>
      <div className="flex justify-center gap-0">
        {hand.map((card, index) => {
          const code = cardCode(card);
          const selected = selectedIndex === index;
          const isDead = mode === 'tap' && dead.has(index);
          const draggable = mode === 'drag' && onCardDragStart !== undefined;
          const handleDragStart = (event: DragEvent<HTMLButtonElement>) => {
            if (!draggable) return;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', code);
            onCardDragStart?.(card, index);
          };
          return (
            <button
              key={`${code}-${index}`}
              type="button"
              aria-label={`${code}${isDead ? ' dead card' : ''}`}
              aria-pressed={selected}
              draggable={draggable}
              onClick={(event) => {
                event.stopPropagation();
                setRaised(true);
                onSelectCard?.(card, index);
              }}
              onDragStart={handleDragStart}
              onDragEnd={onCardDragEnd}
              className={`relative -mx-1 h-[78px] w-[52px] shrink-0 rounded-md bg-white shadow-lg transition-transform sm:h-[118px] sm:w-[80px] ${
                selected ? 'ring-team-green z-20 ring-2' : ''
              }`}
              style={{ transform: transformFor(index, hand.length, raised) }}
            >
              <Image
                src={cardAssetPath(code)}
                alt=""
                fill
                sizes="(min-width: 640px) 80px, 52px"
                unoptimized
                className="rounded-md object-contain"
              />
              {isDead ? (
                <span className="bg-team-red absolute top-1 right-1 rounded px-1 text-[0.6rem] font-black text-white uppercase">
                  dead
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
