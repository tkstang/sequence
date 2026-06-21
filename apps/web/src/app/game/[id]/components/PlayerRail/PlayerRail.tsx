'use client';

import type { Card, Team } from '@sequence/game-logic';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

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
  1: 'var(--color-team-blue)',
  2: 'var(--color-team-green)',
  3: 'var(--color-team-red)',
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
    <div className="rounded-lg bg-white/10 px-2 py-1 text-right">
      <div className="text-[0.62rem] font-bold tracking-wide text-white/45 uppercase">
        {paused ? 'Paused' : 'Timer'}
      </div>
      <div className="font-mono text-sm font-black">
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
    <header className="bg-slate flex flex-col items-stretch gap-2 rounded-lg p-2 text-white sm:flex-row sm:items-center">
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
        {players.map((player) => {
          const last = lastPlayedCards[player.seat];
          const active = player.seat === currentSeat;
          return (
            <div
              key={player.seat}
              className={`flex min-w-0 items-center gap-1.5 rounded-lg bg-white/8 px-2 py-1 text-xs ${
                active ? 'ring-2 ring-yellow-300' : ''
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: TEAM_COLOR[player.team] }}
                aria-hidden
              />
              <span className="max-w-20 truncate font-bold">{player.name}</span>
              {last ? (
                <span className="relative h-6 w-4 shrink-0 overflow-hidden rounded-[2px] bg-white">
                  <Image
                    src={cardAssetPath(cardCode(last))}
                    alt={`${cardCode(last)} last played`}
                    fill
                    sizes="16px"
                    unoptimized
                    className="object-contain"
                  />
                </span>
              ) : (
                <span className="text-[0.62rem] text-white/35">--</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
        <div className="rounded-lg bg-white/10 px-2 py-1 text-right">
          <div className="text-[0.62rem] font-bold tracking-wide text-white/45 uppercase">
            Round
          </div>
          <div className="text-sm font-black">{round}</div>
        </div>
        <div className="rounded-lg bg-white/10 px-2 py-1 text-right">
          <div className="text-[0.62rem] font-bold tracking-wide text-white/45 uppercase">
            Seq
          </div>
          <div className="text-sm font-black">
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
