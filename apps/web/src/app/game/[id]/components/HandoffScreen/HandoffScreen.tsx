'use client';

import type { Card } from '@sequence/game-logic';
import * as stylex from '@stylexjs/stylex';

import {
  color,
  fontSize,
  fontWeight,
  radius,
  shadow,
  space,
} from '@/styles/tokens.stylex.ts';

export interface VisibleHandInput {
  local: boolean;
  localHands?: readonly (readonly Card[])[];
  fallbackHand: readonly Card[];
  seat: number;
  veiled: boolean;
}

export function visibleHandForSeat({
  local,
  localHands,
  fallbackHand,
  seat,
  veiled,
}: VisibleHandInput): readonly Card[] {
  if (veiled) return [];
  if (!local) return fallbackHand;
  return localHands?.[seat] ?? [];
}

export interface HandoffScreenProps {
  playerName: string;
  lastMoveLabel?: string;
  onReveal: () => void;
}

const styles = stylex.create({
  surface: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: space.md,
    marginInline: 'auto',
    width: '100%',
    maxWidth: 'min(94vw, 680px)',
    paddingInline: space.lg,
    paddingBlock: space.xl,
    borderRadius: radius.lg,
    backgroundColor: color.slate,
    color: color.textOnDark,
    textAlign: 'center',
    boxShadow: shadow.lg,
  },
  lastMove: {
    margin: 0,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: color.textMuted,
  },
  prompt: {
    margin: 0,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
  },
  button: {
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: radius.md,
    paddingInline: space.xl,
    paddingBlock: space.sm,
    backgroundColor: {
      default: color.teamGreen,
      ':hover': color.accentHover,
    },
    color: color.textOnDark,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    cursor: 'pointer',
    transitionProperty: 'background-color, filter',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
});

export function HandoffScreen({
  playerName,
  lastMoveLabel,
  onReveal,
}: HandoffScreenProps) {
  return (
    <div {...stylex.props(styles.surface)}>
      {lastMoveLabel ? (
        <p {...stylex.props(styles.lastMove)}>{lastMoveLabel}</p>
      ) : null}
      <p {...stylex.props(styles.prompt)}>Pass to {playerName}</p>
      <button type="button" onClick={onReveal} {...stylex.props(styles.button)}>
        Show hand
      </button>
    </div>
  );
}
