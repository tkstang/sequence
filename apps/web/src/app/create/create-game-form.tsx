'use client';

import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '@/components/button.tsx';
import { Card } from '@/components/card.tsx';
import {
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

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

const styles = stylex.create({
  form: {
    display: 'flex',
    width: '100%',
    maxWidth: '28rem',
    flexDirection: 'column',
    gap: space.xl,
  },
  fieldset: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
    borderWidth: 0,
    margin: 0,
    padding: 0,
  },
  legend: {
    padding: 0,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: color.text,
  },
  optionRow: {
    display: 'flex',
    gap: space.sm,
  },
  optionButton: {
    flex: 1,
    borderRadius: radius.md,
    borderStyle: 'solid',
    borderWidth: '1.5px',
    paddingBlock: space.sm,
    paddingInline: space.sm,
    fontFamily: 'inherit',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, color',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  optionButtonIdle: {
    backgroundColor: { default: color.surface, ':hover': color.surfaceSunken },
    color: color.text,
    borderColor: color.borderStrong,
  },
  optionButtonActive: {
    backgroundColor: color.slate,
    color: color.textOnDark,
    borderColor: color.slate,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  explanationCard: {
    backgroundColor: color.bg,
    fontSize: fontSize.xs,
    color: color.textMuted,
    lineHeight: 1.5,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: color.text,
  },
  control: {
    borderRadius: radius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: color.borderStrong,
    backgroundColor: color.surface,
    color: color.text,
    paddingBlock: space.sm,
    paddingInline: space.md,
    fontFamily: 'inherit',
    fontSize: fontSize.sm,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  toggleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: space.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: color.text,
  },
  hint: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    color: color.textMuted,
  },
  error: {
    fontSize: fontSize.sm,
    color: color.teamRed,
  },
});

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

  const explanationProps = stylex.props(styles.explanationCard);

  return (
    <form
      onSubmit={handleSubmit}
      {...stylex.props(styles.form)}
      aria-label="Create game"
    >
      <fieldset {...stylex.props(styles.fieldset)}>
        <legend {...stylex.props(styles.legend)}>Players</legend>
        <div {...stylex.props(styles.optionRow)}>
          {PLAYER_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              aria-pressed={playerCount === count}
              onClick={() => chooseCount(count)}
              {...stylex.props(
                styles.optionButton,
                playerCount === count
                  ? styles.optionButtonActive
                  : styles.optionButtonIdle,
              )}
            >
              {count}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset {...stylex.props(styles.fieldset)}>
        <legend {...stylex.props(styles.legend)}>Play mode</legend>
        <div {...stylex.props(styles.optionRow)}>
          {(['tap', 'drag'] as PlayMode[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              {...stylex.props(
                styles.optionButton,
                styles.capitalize,
                mode === m
                  ? styles.optionButtonActive
                  : styles.optionButtonIdle,
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <Card
          className={explanationProps.className}
          style={explanationProps.style}
        >
          {MODE_EXPLANATION[mode]}
        </Card>
      </fieldset>

      <div {...stylex.props(styles.field)}>
        <label htmlFor="timer-select" {...stylex.props(styles.label)}>
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
          {...stylex.props(styles.control)}
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

      <div {...stylex.props(styles.toggleGroup)}>
        <label {...stylex.props(styles.toggleLabel)}>
          <input
            type="checkbox"
            aria-label="Pass and play on this device"
            checked={local}
            disabled={!localAvailable}
            onChange={(e) => setLocal(e.target.checked)}
          />
          Pass &amp; play on this device
          {!localAvailable ? (
            <span {...stylex.props(styles.hint)}>(2 players only)</span>
          ) : null}
        </label>
        {local ? (
          <div {...stylex.props(styles.field)}>
            <label htmlFor="opponent-name" {...stylex.props(styles.label)}>
              Opponent name
            </label>
            <input
              id="opponent-name"
              type="text"
              value={opponentName}
              aria-label="Opponent name"
              onChange={(e) => setOpponentName(e.target.value)}
              placeholder="e.g. Sarah"
              {...stylex.props(styles.control)}
            />
          </div>
        ) : null}
      </div>

      {(error ?? submitError) ? (
        <p role="alert" {...stylex.props(styles.error)}>
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
