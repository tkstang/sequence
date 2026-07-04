import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../components/Card.tsx';
import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';
import type { RecordSummary } from './types.ts';

export interface RecordCardProps {
  record?: RecordSummary;
  isLoading?: boolean;
}

export function RecordCard({ isLoading = false, record }: RecordCardProps) {
  const { colors } = useTheme();
  const wins = record?.wins ?? 0;
  const losses = record?.losses ?? 0;
  const total = record?.total ?? 0;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
        Your record
      </Text>
      <Card testID={testId('history', 'record')}>
        {isLoading ? (
          <Text
            style={[styles.empty, { color: colors.textMuted }]}
            testID={testId('history', 'record', 'loading')}
          >
            Loading...
          </Text>
        ) : (
          <View style={styles.recordRow}>
            <Stat label="Wins" value={wins} />
            <Stat label="Losses" value={losses} />
            <Stat label="Games" value={total} />
          </View>
        )}
      </Card>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { colors } = useTheme();

  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 15,
    lineHeight: 21,
  },
  recordRow: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  stat: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
});
