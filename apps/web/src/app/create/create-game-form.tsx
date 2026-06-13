'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '@/components/button.tsx';
import { Card } from '@/components/card.tsx';

import { timerOptions } from './timer-options.ts';

export type PlayerCount = 2 | 3 | 4 | 6;
export type PlayMode = 'tap' | 'drag';

export interface CreateGameValues {
  playerCount: PlayerCount;
  mode: PlayMode;
  timerSeconds: number | null;
  local: boolean;
  opponentName?: string;
}

export interface CreateGameFormProps {
  /** Pre-select local pass-and-play (e.g. from the dashboard "Pass & play" CTA). */
  defaultLocal?: boolean;
  onCreate: (values: CreateGameValues) => Promise<void>;
  submitError?: string | null;
  isSubmitting?: boolean;
}

const PLAYER_COUNTS: PlayerCount[] = [2, 3, 4, 6];

const MODE_EXPLANATION: Record<PlayMode, string> = {
  tap: 'Tap a card to reveal its legal cells, then tap a cell to play. Dead cards are marked for you. The friendlier mode.',
  drag: 'Drag a chip onto the board — no hints. You judge legality yourself and the server confirms. The harder, table-like mode.',
};

/**
 * The create-game form (p05-t06, FR2). Player count, play mode with an in-UI
 * explanation, the timer picker, and the local pass-and-play toggle (2p only,
 * with an opponent-name field). Presentational — submits via `onCreate`.
 */
export function CreateGameForm({
  defaultLocal = false,
  onCreate,
  submitError,
  isSubmitting = false,
}: CreateGameFormProps) {
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);
  const [mode, setMode] = useState<PlayMode>('tap');
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [local, setLocal] = useState(defaultLocal);
  const [opponentName, setOpponentName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const options = timerOptions();
  // Local pass-and-play is a two-player-only mode.
  const localAvailable = playerCount === 2;

  function chooseCount(count: PlayerCount) {
    setPlayerCount(count);
    if (count !== 2 && local) setLocal(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (local && !opponentName.trim()) {
      setError('Enter a name for your opponent');
      return;
    }
    await onCreate({
      playerCount,
      mode,
      timerSeconds,
      local,
      opponentName: local ? opponentName.trim() : undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-5"
      aria-label="Create game"
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Players</legend>
        <div className="flex gap-2">
          {PLAYER_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              aria-pressed={playerCount === count}
              onClick={() => chooseCount(count)}
              className={`flex-1 rounded-lg border-[1.5px] py-2 font-semibold ${
                playerCount === count
                  ? 'border-slate bg-slate text-white'
                  : 'text-slate border-black/20 bg-white'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Play mode</legend>
        <div className="flex gap-2">
          {(['tap', 'drag'] as PlayMode[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg border-[1.5px] py-2 font-semibold capitalize ${
                mode === m
                  ? 'border-slate bg-slate text-white'
                  : 'text-slate border-black/20 bg-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <Card className="bg-cream p-3 text-xs text-black/70">
          {MODE_EXPLANATION[mode]}
        </Card>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="timer-select" className="text-sm font-semibold">
          Turn timer
        </label>
        <select
          id="timer-select"
          value={timerSeconds === null ? 'off' : String(timerSeconds)}
          onChange={(e) =>
            setTimerSeconds(
              e.target.value === 'off' ? null : Number(e.target.value),
            )
          }
          className="rounded-lg border border-black/20 bg-white px-3 py-2"
        >
          {options.map((o) => (
            <option
              key={o.seconds ?? 'off'}
              value={o.seconds === null ? 'off' : String(o.seconds)}
            >
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            aria-label="Pass and play on this device"
            checked={local}
            disabled={!localAvailable}
            onChange={(e) => setLocal(e.target.checked)}
          />
          Pass &amp; play on this device
          {!localAvailable ? (
            <span className="text-xs font-normal text-black/50">
              (2 players only)
            </span>
          ) : null}
        </label>
        {local ? (
          <div className="flex flex-col gap-1">
            <label htmlFor="opponent-name" className="text-sm">
              Opponent name
            </label>
            <input
              id="opponent-name"
              type="text"
              value={opponentName}
              aria-label="Opponent name"
              onChange={(e) => setOpponentName(e.target.value)}
              placeholder="e.g. Sarah"
              className="rounded-lg border border-black/20 bg-white px-3 py-2"
            />
          </div>
        ) : null}
      </div>

      {(error ?? submitError) ? (
        <p role="alert" className="text-team-red text-sm">
          {error ?? submitError}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting
          ? 'Creating…'
          : local
            ? 'Start local game'
            : 'Create game'}
      </Button>
    </form>
  );
}
