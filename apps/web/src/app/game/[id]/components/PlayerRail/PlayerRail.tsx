'use client';

import type { Card, Team } from '@sequence/game-logic';
import * as stylex from '@stylexjs/stylex';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import {
  color,
  fontFamily,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

import type { SnapshotPlayer, SnapshotSequence } from '../game-state.ts';
import { cardAssetPath } from '../GameBoard/GameBoard.utils.ts';

export interface PlayerRailProps {
  players: readonly SnapshotPlayer[];
  currentSeat: number;
  round: number;
  sequences: readonly SnapshotSequence[];
  lastPlayedCards?: Record<number, Card>;
  timerSeconds: number | null;
  turnDeadlineAt?: string | null;
  turnRemainingMs?: number | null;
  status: string;
  nowMs?: number;
}

const TEAM_COLOR: Record<Team, string> = {
  1: color.teamBlue,
  2: color.teamGreen,
  3: color.teamRed,
};

function cardCode(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function formatRemaining(ms: number): string {
  const safe = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function sequenceCounts(sequences: readonly SnapshotSequence[]) {
  const counts: Record<Team, number> = { 1: 0, 2: 0, 3: 0 };
  for (const sequence of sequences) {
    counts[sequence.team] += 1;
  }
  return counts;
}

const styles = stylex.create({
  header: {
    display: 'flex',
    flexDirection: { default: 'column', '@media (min-width: 640px)': 'row' },
    alignItems: {
      default: 'stretch',
      '@media (min-width: 640px)': 'center',
    },
    gap: space.sm,
    borderRadius: radius.lg,
    padding: space.sm,
    backgroundColor: color.slate,
    color: color.textOnDark,
  },
  playerGroup: {
    display: { default: 'grid', '@media (min-width: 640px)': 'flex' },
    flexWrap: { default: null, '@media (min-width: 640px)': 'wrap' },
    gridTemplateColumns: {
      default: 'repeat(2, minmax(0, 1fr))',
      '@media (min-width: 640px)': null,
    },
    minWidth: 0,
    flex: '1 1 0%',
    gap: space.sm,
  },
  player: {
    display: 'flex',
    minWidth: 0,
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    paddingBlock: space.xs,
    paddingInline: space.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    fontSize: fontSize.xs,
    outlineStyle: 'solid',
    outlineWidth: 0,
    outlineOffset: '-2px',
    transitionProperty: 'outline-width, outline-color',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
  },
  playerActive: {
    outlineWidth: 2,
    outlineColor: color.frozenFg,
  },
  swatch: {
    height: '10px',
    width: '10px',
    flexShrink: 0,
    borderRadius: radius.round,
  },
  name: {
    maxWidth: '5rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: fontWeight.bold,
  },
  lastCard: {
    position: 'relative',
    height: '24px',
    width: '16px',
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: '2px',
    backgroundColor: color.surface,
  },
  lastCardImage: {
    objectFit: 'contain',
  },
  lastCardEmpty: {
    fontSize: '0.62rem',
    color: 'rgba(255,255,255,0.4)',
  },
  metaGroup: {
    display: { default: 'grid', '@media (min-width: 640px)': 'flex' },
    gridTemplateColumns: {
      default: 'repeat(3, minmax(0, 1fr))',
      '@media (min-width: 640px)': null,
    },
    alignItems: { default: null, '@media (min-width: 640px)': 'center' },
    gap: space.sm,
  },
  stat: {
    borderRadius: radius.md,
    paddingBlock: space.xs,
    paddingInline: space.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    textAlign: 'end',
  },
  statLabel: {
    fontSize: '0.62rem',
    fontWeight: fontWeight.bold,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.55)',
  },
  statValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
  },
  statValueMono: {
    fontFamily: fontFamily.mono,
  },
});

const swatchStyles = stylex.create({
  tint: (tint: string) => ({ backgroundColor: tint }),
});

function TimerDisplay({
  timerSeconds,
  turnDeadlineAt,
  turnRemainingMs,
  status,
  nowMs,
}: Pick<
  PlayerRailProps,
  'timerSeconds' | 'turnDeadlineAt' | 'turnRemainingMs' | 'status' | 'nowMs'
>) {
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    if (nowMs !== undefined || timerSeconds === null) return;
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [nowMs, timerSeconds]);

  if (timerSeconds === null) return null;

  const paused = status === 'frozen' || status === 'saved';
  const baseNow = nowMs ?? tick;
  const remaining =
    paused && turnRemainingMs !== null && turnRemainingMs !== undefined
      ? turnRemainingMs
      : turnDeadlineAt
        ? new Date(turnDeadlineAt).getTime() - baseNow
        : timerSeconds * 1000;

  return (
    <div {...stylex.props(styles.stat)}>
      <div {...stylex.props(styles.statLabel)}>
        {paused ? 'Paused' : 'Timer'}
      </div>
      <div {...stylex.props(styles.statValue, styles.statValueMono)}>
        {formatRemaining(remaining)}
      </div>
    </div>
  );
}

/**
 * Top player rail (p06-t05): per-player color/name/last-played card, turn
 * highlight, round, sequence counts, and server-driven timer.
 */
export function PlayerRail({
  players,
  currentSeat,
  round,
  sequences,
  lastPlayedCards = {},
  timerSeconds,
  turnDeadlineAt,
  turnRemainingMs,
  status,
  nowMs,
}: PlayerRailProps) {
  const counts = useMemo(() => sequenceCounts(sequences), [sequences]);

  return (
    <header {...stylex.props(styles.header)}>
      <div {...stylex.props(styles.playerGroup)}>
        {players.map((player) => {
          const last = lastPlayedCards[player.seat];
          const active = player.seat === currentSeat;
          return (
            <div
              key={player.seat}
              {...stylex.props(styles.player, active && styles.playerActive)}
            >
              <span
                {...stylex.props(
                  styles.swatch,
                  swatchStyles.tint(TEAM_COLOR[player.team]),
                )}
                aria-hidden
              />
              <span {...stylex.props(styles.name)}>{player.name}</span>
              {last ? (
                <span {...stylex.props(styles.lastCard)}>
                  <Image
                    src={cardAssetPath(cardCode(last))}
                    alt={`${cardCode(last)} last played`}
                    fill
                    sizes="16px"
                    unoptimized
                    {...stylex.props(styles.lastCardImage)}
                  />
                </span>
              ) : (
                <span {...stylex.props(styles.lastCardEmpty)}>--</span>
              )}
            </div>
          );
        })}
      </div>

      <div {...stylex.props(styles.metaGroup)}>
        <div {...stylex.props(styles.stat)}>
          <div {...stylex.props(styles.statLabel)}>Round</div>
          <div {...stylex.props(styles.statValue)}>{round}</div>
        </div>
        <div {...stylex.props(styles.stat)}>
          <div {...stylex.props(styles.statLabel)}>Seq</div>
          <div {...stylex.props(styles.statValue)}>
            {counts[1]}/{counts[2]}/{counts[3]}
          </div>
        </div>
        <TimerDisplay
          timerSeconds={timerSeconds}
          turnDeadlineAt={turnDeadlineAt}
          turnRemainingMs={turnRemainingMs}
          status={status}
          nowMs={nowMs}
        />
      </div>
    </header>
  );
}
