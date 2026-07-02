'use client';

import type { Card } from '@sequence/game-logic';
import * as stylex from '@stylexjs/stylex';
import Image from 'next/image';
import { useState, type DragEvent } from 'react';

import {
  color,
  fontWeight,
  radius,
  shadow,
  space,
  zIndex,
} from '@/styles/tokens.stylex.ts';

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

const styles = stylex.create({
  section: {
    position: 'relative',
    marginInline: 'auto',
    display: 'flex',
    minHeight: { default: '6rem', '@media (min-width: 640px)': '7rem' },
    width: '100%',
    maxWidth: 'min(94vw, 680px)',
    alignItems: 'flex-end',
    justifyContent: 'center',
    overflow: 'visible',
    paddingInline: { default: space.sm, '@media (min-width: 640px)': space.md },
    paddingTop: space.lg,
    paddingBottom: space.sm,
    transitionProperty: 'transform',
    transitionDuration: '160ms',
    transitionTimingFunction: 'ease',
    transform: 'translateY(16px)',
  },
  sectionRaised: {
    transform: 'translateY(0)',
  },
  handle: {
    position: 'absolute',
    top: space.xs,
    borderRadius: radius.pill,
    borderWidth: 0,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    paddingInline: space.md,
    paddingBlock: space.sm,
    cursor: 'pointer',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  handleGrip: {
    display: 'block',
    height: '6px',
    width: '48px',
    borderRadius: radius.pill,
    backgroundColor: color.borderStrong,
  },
  fan: {
    display: 'flex',
    justifyContent: 'center',
    gap: space.none,
  },
  card: {
    position: 'relative',
    marginInline: '-4px',
    height: { default: '78px', '@media (min-width: 640px)': '118px' },
    width: { default: '52px', '@media (min-width: 640px)': '80px' },
    flexShrink: 0,
    borderRadius: radius.md,
    borderWidth: 0,
    borderStyle: 'solid',
    padding: 0,
    backgroundColor: color.surface,
    boxShadow: shadow.lg,
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  cardSelected: {
    zIndex: zIndex.raised,
    boxShadow: `0 0 0 2px ${color.teamGreen}, ${shadow.lg}`,
  },
  cardImage: {
    borderRadius: radius.md,
    objectFit: 'contain',
  },
  deadBadge: {
    position: 'absolute',
    top: space.xs,
    insetInlineEnd: space.xs,
    borderRadius: radius.sm,
    paddingInline: space.xs,
    backgroundColor: color.teamRed,
    fontSize: '0.6rem',
    fontWeight: fontWeight.black,
    textTransform: 'uppercase',
    color: color.textOnDark,
  },
});

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
      {...stylex.props(styles.section, raised && styles.sectionRaised)}
    >
      <button
        type="button"
        aria-label={raised ? 'Lower hand' : 'Raise hand'}
        onClick={() => setRaised((current) => !current)}
        {...stylex.props(styles.handle)}
      >
        <span aria-hidden {...stylex.props(styles.handleGrip)} />
      </button>
      <div {...stylex.props(styles.fan)}>
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
          const cardProps = stylex.props(
            styles.card,
            selected && styles.cardSelected,
          );
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
              className={cardProps.className}
              style={{
                ...cardProps.style,
                transform: transformFor(index, hand.length, raised),
              }}
            >
              <Image
                src={cardAssetPath(code)}
                alt=""
                fill
                sizes="(min-width: 640px) 80px, 52px"
                unoptimized
                {...stylex.props(styles.cardImage)}
              />
              {isDead ? (
                <span {...stylex.props(styles.deadBadge)}>dead</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
