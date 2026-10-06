import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { useTRPC } from '../../api/client.ts';
import { Card } from '../../components/Card.tsx';
import { Screen } from '../../components/Screen.tsx';
import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';
import { GamesList } from './GamesList.tsx';
import { HeadToHeadTable } from './HeadToHeadTable.tsx';
import { RecordCard } from './RecordCard.tsx';
import type {
  HeadToHeadRow,
  HistoryGameRow,
  HistoryPage,
  RecordSummary,
} from './types.ts';

export function HistoryScreen() {
  const { colors } = useTheme();
  const trpc = useTRPC();
  const record = useQuery(trpc.history.myRecord.queryOptions());
  const headToHead = useQuery(trpc.history.headToHead.queryOptions());
  const games = useInfiniteQuery({
    ...trpc.history.myGames.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (last: HistoryPage) => last.nextCursor ?? undefined,
      },
    ),
  });

  const pages = (games.data?.pages ?? []) as HistoryPage[];
  const allGames: HistoryGameRow[] = pages.flatMap((page) => page.items);
  const hasError = record.isError || headToHead.isError || games.isError;

  return (
    <Screen
      header={
        <Screen.Header
          eyebrow="History"
          title="Your results"
          testID={testId('history', 'header')}
        />
      }
      scroll
      testID={testId('history', 'screen')}
    >
      <View style={styles.content}>
        {hasError ? (
          <Card variant="sunken" testID={testId('history', 'error')}>
            <View style={styles.stateCard}>
              <Text style={[styles.stateTitle, { color: colors.text }]}>
                Could not load history
              </Text>
              <Text
                accessibilityRole="alert"
                style={[styles.stateBody, { color: colors.textMuted }]}
              >
                Refresh from the dashboard or try again in a moment.
              </Text>
            </View>
          </Card>
        ) : (
          <>
            <RecordCard
              isLoading={record.isPending}
              record={record.data as RecordSummary | undefined}
            />
            <HeadToHeadTable
              isLoading={headToHead.isPending}
              rows={(headToHead.data ?? []) as HeadToHeadRow[]}
            />
            <GamesList
              games={allGames}
              hasMore={Boolean(games.hasNextPage)}
              isLoading={games.isPending}
              isLoadingMore={games.isFetchingNextPage}
              onLoadMore={() => {
                void games.fetchNextPage();
              }}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    paddingBottom: 24,
  },
  stateBody: {
    fontSize: 15,
    lineHeight: 21,
  },
  stateCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
});
