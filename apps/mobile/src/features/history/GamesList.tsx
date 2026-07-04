import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '../../components/Badge.tsx';
import { Button } from '../../components/Button.tsx';
import { Card } from '../../components/Card.tsx';
import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';
import type { HistoryGameRow } from './types.ts';

export interface GamesListProps {
  games: HistoryGameRow[];
  hasMore?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

function resultLabel(result: HistoryGameRow['result']): string {
  if (result === 'win') return 'W';
  if (result === 'loss') return 'L';
  return 'No result';
}

function resultVariant(result: HistoryGameRow['result']) {
  if (result === 'win') return 'teamGreen';
  if (result === 'loss') return 'teamRed';
  return 'neutral';
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Finished';
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

function describeGame(game: HistoryGameRow): string {
  const kind = game.local ? 'Local game' : `${game.playerCount}-player`;
  const notes = [`${kind}`, `${game.mode} mode`, `Team ${game.myTeam}`];
  if (game.endReason === 'concede') notes.push('concede');
  return notes.join(' · ');
}

export function GamesList({
  games,
  hasMore = false,
  isLoading = false,
  isLoadingMore = false,
  onLoadMore,
}: GamesListProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.section} testID={testId('history', 'games')}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
        Completed games
      </Text>
      {isLoading ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          Loading...
        </Text>
      ) : games.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          No finished games yet.
        </Text>
      ) : (
        <View style={styles.stack}>
          {games.map((game) => (
            <Card
              key={game.gameId}
              testID={testId('history', 'game', game.gameId)}
            >
              <View style={styles.gameContent}>
                <View style={styles.gameHeader}>
                  <View style={styles.badges}>
                    <Badge
                      size="sm"
                      testID={testId('history', 'game', game.gameId, 'result')}
                      variant={resultVariant(game.result)}
                    >
                      {resultLabel(game.result)}
                    </Badge>
                    {game.local ? (
                      <Badge
                        size="sm"
                        testID={testId('history', 'game', game.gameId, 'local')}
                        variant="accent"
                      >
                        LOCAL
                      </Badge>
                    ) : null}
                  </View>
                  <Text style={[styles.date, { color: colors.textMuted }]}>
                    {formatDate(game.finishedAt)}
                  </Text>
                </View>
                <Text style={[styles.gameDescription, { color: colors.text }]}>
                  {describeGame(game)}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}
      {hasMore ? (
        <Button
          disabled={isLoadingMore}
          onPress={onLoadMore}
          testID={testId('history', 'loadMore')}
          variant="secondary"
        >
          {isLoadingMore ? 'Loading...' : 'Load more'}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badges: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    flexShrink: 0,
    flexWrap: 'wrap',
    gap: 6,
  },
  date: {
    fontSize: 13,
    lineHeight: 18,
  },
  empty: {
    fontSize: 15,
    lineHeight: 21,
  },
  gameContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  gameDescription: {
    fontSize: 15,
    lineHeight: 21,
  },
  gameHeader: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
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
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
});
