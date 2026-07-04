import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../components/Card.tsx';
import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';
import type { HeadToHeadRow } from './types.ts';

export interface HeadToHeadTableProps {
  rows: HeadToHeadRow[];
  isLoading?: boolean;
}

function gamesLabel(games: number): string {
  return games === 1 ? '1 game' : `${games} games`;
}

export function HeadToHeadTable({
  isLoading = false,
  rows,
}: HeadToHeadTableProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.section} testID={testId('history', 'headToHead')}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
        Head to head
      </Text>
      {isLoading ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Loading...
        </Text>
      ) : rows.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          No head-to-head records yet.
        </Text>
      ) : (
        <Card>
          <View style={styles.table}>
            {rows.map((row) => (
              <View
                key={row.opponentId}
                style={[styles.row, { borderBottomColor: colors.border }]}
                testID={testId('history', 'headToHead', row.opponentId)}
              >
                <View style={styles.opponent}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {row.opponentName}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textMuted }]}>
                    {gamesLabel(row.games)}
                  </Text>
                </View>
                <Text style={[styles.record, { color: colors.text }]}>
                  {row.wins}-{row.losses}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 15,
    lineHeight: 21,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  opponent: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  record: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  row: {
    alignItems: 'center',
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 10,
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
  table: {
    display: 'flex',
    flexDirection: 'column',
  },
});
