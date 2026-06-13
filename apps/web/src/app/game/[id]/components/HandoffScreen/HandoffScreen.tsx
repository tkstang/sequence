'use client';

import type { Card } from '@sequence/game-logic';

import { Card as Surface } from '@/components/card.tsx';

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

export function HandoffScreen({
  playerName,
  lastMoveLabel,
  onReveal,
}: HandoffScreenProps) {
  return (
    <Surface className="bg-slate mx-auto flex w-full max-w-[min(94vw,680px)] flex-col items-center gap-3 px-4 py-5 text-center text-white">
      {lastMoveLabel ? (
        <p className="text-xs font-semibold text-white/65">{lastMoveLabel}</p>
      ) : null}
      <p className="text-lg font-black">Pass to {playerName}</p>
      <button
        type="button"
        onClick={onReveal}
        className="bg-team-green rounded-md px-5 py-2 text-sm font-bold text-white"
      >
        Show hand
      </button>
    </Surface>
  );
}
