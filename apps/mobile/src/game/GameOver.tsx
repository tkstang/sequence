import type { SnapshotPlayer, SnapshotSequence } from '@sequence/client-state';
import type { Team } from '@sequence/game-logic';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button.tsx';
import { testId } from '../test/test-ids.ts';
import { useTheme } from '../theme/use-theme.ts';

export interface GameOverProps {
  concededTeam?: Team | null;
  endReason?: string | null;
  isRematching?: boolean;
  mySeat: number;
  myTeam?: Team | null;
  onDashboard: () => void;
  onRematch: () => void;
  players: readonly SnapshotPlayer[];
  sequences: readonly SnapshotSequence[];
  winnerTeam?: Team | null;
}

function resultTitle(winnerTeam?: Team | null, endReason?: string | null) {
  if (endReason === 'concede') return 'Game conceded';
  if (winnerTeam) return `Team ${winnerTeam} wins`;
  return 'Game over';
}

function reasonLabel(endReason?: string | null): string | null {
  if (endReason === 'expired') return 'Timer expired.';
  if (endReason === 'win') return 'Completed by sequence.';
  return null;
}

function localOutcome({
  concededTeam,
  myTeam,
  winnerTeam,
}: {
  concededTeam?: Team | null;
  myTeam?: Team | null;
  winnerTeam?: Team | null;
}): string {
  if (winnerTeam && myTeam) {
    return winnerTeam === myTeam ? 'Your team won.' : 'Your team lost.';
  }
  if (concededTeam && myTeam && concededTeam === myTeam) {
    return 'Your team lost.';
  }
  return 'No winner was recorded.';
}

function playerNamesForTeam(
  players: readonly SnapshotPlayer[],
  team?: Team | null,
): string | null {
  if (!team) return null;
  const names = players
    .filter((player) => player.team === team)
    .map((player) => player.name);
  return names.length > 0 ? names.join(', ') : null;
}

export function GameOver({
  concededTeam = null,
  endReason = null,
  isRematching = false,
  mySeat,
  myTeam = null,
  onDashboard,
  onRematch,
  players,
  sequences,
  winnerTeam = null,
}: GameOverProps) {
  const { colors } = useTheme();
  const winnerNames = playerNamesForTeam(players, winnerTeam);
  const winningSequences = winnerTeam
    ? sequences.filter((sequence) => sequence.team === winnerTeam)
    : [];
  const seatLabel = players.find((player) => player.seat === mySeat)?.name;
  const detail = reasonLabel(endReason);

  return (
    <View
      accessibilityLabel="Final game result"
      style={[
        styles.root,
        { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
      ]}
      testID={testId('game', 'over')}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: colors.textMuted }]}>Final</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {resultTitle(winnerTeam, endReason)}
        </Text>
        <Text style={[styles.outcome, { color: colors.text }]}>
          {localOutcome({ concededTeam, myTeam, winnerTeam })}
        </Text>
        {seatLabel ? (
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            Seat {mySeat + 1}: {seatLabel}
          </Text>
        ) : null}
        {detail ? (
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {detail}
          </Text>
        ) : null}
      </View>

      {winnerNames ? (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            Winners
          </Text>
          <Text style={[styles.sectionValue, { color: colors.text }]}>
            {winnerNames}
          </Text>
        </View>
      ) : null}

      {endReason === 'concede' && concededTeam ? (
        <Text style={[styles.conceded, { color: colors.danger }]}>
          Team {concededTeam} conceded
        </Text>
      ) : null}

      {winningSequences.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            Winning sequences
          </Text>
          {winningSequences.map((sequence) => (
            <View
              key={sequence.id}
              style={[styles.sequence, { borderColor: colors.borderStrong }]}
              testID={testId('game', 'over', 'sequence', sequence.id)}
            >
              <Text style={[styles.sequenceTitle, { color: colors.text }]}>
                Sequence {sequence.id}
              </Text>
              <Text style={[styles.sequenceCells, { color: colors.textMuted }]}>
                {sequence.cells.join(', ')}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          disabled={isRematching}
          onPress={onRematch}
          testID={testId('game', 'over', 'rematch')}
        >
          Rematch
        </Button>
        <Button
          onPress={onDashboard}
          testID={testId('game', 'over', 'dashboard')}
          variant="secondary"
        >
          Dashboard
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 8,
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conceded: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  meta: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  outcome: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  sectionValue: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  sequence: {
    borderRadius: 8,
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sequenceCells: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  sequenceTitle: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
});
