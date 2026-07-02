'use client';

import * as stylex from '@stylexjs/stylex';
import Link from 'next/link';

import { Card } from '@/components/card.tsx';
import {
  color,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

import type { SnapshotPlayer } from '../game-state.ts';

export interface GameOverProps {
  winnerTeam?: number | null;
  endReason?: string | null;
  concededTeam?: number | null;
  players: readonly SnapshotPlayer[];
  isRematching?: boolean;
  onRematch: () => void;
}

const styles = stylex.create({
  card: {
    marginInline: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: space.lg,
    width: '100%',
    maxWidth: 'min(94vw, 680px)',
    borderColor: color.teamGreen,
  },
  eyebrow: {
    margin: 0,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.black,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: color.textFaint,
  },
  title: {
    margin: 0,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    lineHeight: lineHeight.tight,
    color: color.text,
  },
  winners: {
    marginBlock: 0,
    marginBlockStart: space.xs,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: color.textMuted,
  },
  conceded: {
    marginBlock: 0,
    marginBlockStart: space.xs,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: color.teamRed,
  },
  actions: {
    display: 'flex',
    flexDirection: { default: 'column', '@media (min-width: 640px)': 'row' },
    flexWrap: { default: 'nowrap', '@media (min-width: 640px)': 'wrap' },
    gap: space.sm,
  },
  actionBase: {
    borderRadius: radius.md,
    paddingBlock: space.sm,
    paddingInline: space.lg,
    fontFamily: 'inherit',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    textDecoration: 'none',
    transitionProperty: 'background-color, border-color, color, filter',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  rematch: {
    borderWidth: 0,
    borderStyle: 'solid',
    backgroundColor: {
      default: color.teamGreen,
      ':hover': color.accentHover,
    },
    color: color.accentText,
    cursor: 'pointer',
  },
  rematchDisabled: {
    backgroundColor: { default: color.slateSoft, ':hover': color.slateSoft },
    color: color.textFaint,
    cursor: 'not-allowed',
  },
  dashboard: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: color.border, ':hover': color.borderStrong },
    backgroundColor: { default: 'transparent', ':hover': color.hoverWash },
    color: color.textMuted,
  },
});

function resultTitle(winnerTeam?: number | null, endReason?: string | null) {
  if (endReason === 'concede') return 'Game conceded';
  if (winnerTeam) return `Team ${winnerTeam} wins`;
  return 'Game over';
}

export function GameOver({
  winnerTeam,
  endReason,
  concededTeam,
  players,
  isRematching = false,
  onRematch,
}: GameOverProps) {
  const winners = winnerTeam
    ? players.filter((player) => player.team === winnerTeam)
    : [];

  return (
    <Card {...stylex.props(styles.card)}>
      <div>
        <p {...stylex.props(styles.eyebrow)}>Final</p>
        <h1 {...stylex.props(styles.title)}>
          {resultTitle(winnerTeam, endReason)}
        </h1>
        {winners.length > 0 ? (
          <p {...stylex.props(styles.winners)}>
            {winners.map((player) => player.name).join(', ')}
          </p>
        ) : null}
        {endReason === 'concede' && concededTeam ? (
          <p {...stylex.props(styles.conceded)}>Team {concededTeam} conceded</p>
        ) : null}
      </div>
      <div {...stylex.props(styles.actions)}>
        <button
          type="button"
          disabled={isRematching}
          onClick={onRematch}
          {...stylex.props(
            styles.actionBase,
            styles.rematch,
            isRematching && styles.rematchDisabled,
          )}
        >
          Rematch
        </button>
        <Link
          href="/dashboard"
          {...stylex.props(styles.actionBase, styles.dashboard)}
        >
          Dashboard
        </Link>
      </div>
    </Card>
  );
}
