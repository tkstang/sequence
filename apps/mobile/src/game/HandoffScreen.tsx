import type { Card } from '@sequence/game-logic';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button.tsx';
import { testId } from '../test/test-ids.ts';
import { useTheme } from '../theme/use-theme.ts';

export interface VisibleHandInput {
  fallbackHand: readonly Card[];
  local: boolean;
  localHands?: readonly (readonly Card[])[];
  seat: number;
  veiled: boolean;
}

export function visibleHandForSeat({
  fallbackHand,
  local,
  localHands,
  seat,
  veiled,
}: VisibleHandInput): readonly Card[] {
  if (veiled) return [];
  if (!local) return fallbackHand;
  return localHands?.[seat] ?? [];
}

export interface HandoffScreenProps {
  lastMoveLabel?: string;
  onReveal: () => void;
  playerName: string;
}

export function HandoffScreen({
  lastMoveLabel,
  onReveal,
  playerName,
}: HandoffScreenProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityLabel={`Pass to ${playerName}`}
      style={styles.root}
      testID={testId('handoff', 'screen')}
    >
      <View
        style={[
          styles.surface,
          { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
        ]}
      >
        {lastMoveLabel ? (
          <Text style={[styles.lastMove, { color: colors.textMuted }]}>
            {lastMoveLabel}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: colors.text }]}>
          Pass to {playerName}
        </Text>
        <Button
          accessibilityLabel={`Show ${playerName}'s hand`}
          onPress={onReveal}
          testID={testId('handoff', 'confirm')}
        >
          Show hand
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'stretch',
    display: 'flex',
    minHeight: 420,
    justifyContent: 'center',
    width: '100%',
  },
  surface: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  lastMove: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
    textAlign: 'center',
  },
});
