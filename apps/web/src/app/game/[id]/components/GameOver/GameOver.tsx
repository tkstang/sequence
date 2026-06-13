'use client';

import Link from 'next/link';

import { Card } from '@/components/card.tsx';

import type { SnapshotPlayer } from '../game-state.ts';

export interface GameOverProps {
  winnerTeam?: number | null;
  endReason?: string | null;
  concededTeam?: number | null;
  players: readonly SnapshotPlayer[];
  isRematching?: boolean;
  onRematch: () => void;
}

function resultTitle(winnerTeam?: number | null, endReason?: string | null) {
  if (winnerTeam) return `Team ${winnerTeam} wins`;
  if (endReason === 'concede') return 'Game conceded';
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
    <Card className="border-team-green mx-auto flex w-full max-w-[min(94vw,680px)] flex-col gap-4 bg-white">
      <div>
        <p className="text-xs font-black tracking-wide text-black/45 uppercase">
          Final
        </p>
        <h1 className="text-2xl font-black text-black">
          {resultTitle(winnerTeam, endReason)}
        </h1>
        {winners.length > 0 ? (
          <p className="mt-1 text-sm font-medium text-black/60">
            {winners.map((player) => player.name).join(', ')}
          </p>
        ) : null}
        {endReason === 'concede' && concededTeam ? (
          <p className="text-team-red mt-1 text-sm font-bold">
            Team {concededTeam} conceded
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={isRematching}
          onClick={onRematch}
          className="bg-team-green disabled:bg-slate/30 rounded-md px-4 py-2 text-sm font-bold text-white disabled:text-black/40"
        >
          Rematch
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-black/15 px-4 py-2 text-center text-sm font-bold text-black/70"
        >
          Dashboard
        </Link>
      </div>
    </Card>
  );
}
