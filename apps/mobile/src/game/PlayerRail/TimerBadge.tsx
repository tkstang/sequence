import type { GameViewStatus } from '@sequence/client-state';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';

export interface TimerBadgeProps {
  nowMs?: number;
  status: GameViewStatus;
  timerSeconds: number | null;
  turnDeadlineAt?: string | null;
  turnRemainingMs?: number | null;
}

export function formatRemaining(ms: number): string {
  const safeSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function TimerBadge({
  nowMs,
  status,
  timerSeconds,
  turnDeadlineAt,
  turnRemainingMs,
}: TimerBadgeProps) {
  const { colors } = useTheme();
  const [currentNowMs, setCurrentNowMs] = useState(() => nowMs ?? Date.now());
  const paused = status === 'frozen' || status === 'saved';

  useEffect(() => {
    setCurrentNowMs(nowMs ?? Date.now());
  }, [nowMs, turnDeadlineAt, turnRemainingMs]);

  useEffect(() => {
    if (timerSeconds === null || paused || nowMs !== undefined) return;

    const intervalId = setInterval(() => {
      setCurrentNowMs(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [nowMs, paused, timerSeconds, turnDeadlineAt]);

  if (timerSeconds === null) return null;

  const deadlineMs =
    turnDeadlineAt === null || turnDeadlineAt === undefined
      ? null
      : new Date(turnDeadlineAt).getTime();
  const remainingMs =
    paused && turnRemainingMs !== null && turnRemainingMs !== undefined
      ? turnRemainingMs
      : deadlineMs === null || Number.isNaN(deadlineMs)
        ? timerSeconds * 1000
        : deadlineMs - currentNowMs;

  return (
    <View
      accessibilityLabel={`${paused ? 'paused' : 'turn'} timer ${formatRemaining(
        remainingMs,
      )}`}
      style={[
        styles.root,
        {
          backgroundColor: paused ? colors.savedBg : colors.surfaceRaised,
          borderColor: paused ? colors.savedFg : colors.border,
        },
      ]}
      testID={testId('game', 'timer')}
    >
      <Text
        style={[
          styles.label,
          { color: paused ? colors.savedFg : colors.textMuted },
        ]}
        testID={testId('game', 'timer', 'label')}
      >
        {paused ? 'Paused' : 'Timer'}
      </Text>
      <Text
        style={[styles.value, { color: colors.text }]}
        testID={testId('game', 'timer', 'value')}
      >
        {formatRemaining(remainingMs)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 74,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: 'monospace',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 20,
  },
});
