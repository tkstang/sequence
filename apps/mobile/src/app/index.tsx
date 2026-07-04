import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTRPC } from '../api/client.ts';
import { mapTRPCErrorToPolicy } from '../api/error-policy.ts';
import { useSession } from '../auth/client.ts';
import { Button } from '../components/Button.tsx';
import { Card } from '../components/Card.tsx';
import { Screen } from '../components/Screen.tsx';
import {
  GameCard,
  type DashboardGame,
} from '../features/dashboard/GameCard.tsx';
import { testId } from '../test/test-ids.ts';
import { useTheme } from '../theme/use-theme.ts';

function gameRoute(game: DashboardGame): string {
  const id = encodeURIComponent(game.gameId);
  if (game.status === 'finished') {
    return `/game/${id}?view=game-over`;
  }
  return `/game/${id}`;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const trpc = useTRPC();
  const myGames = useQuery(trpc.game.myGames.queryOptions());
  const session = useSession();
  const user = session.data?.user;
  const data = myGames.data as
    | { recents?: DashboardGame[]; resumables?: DashboardGame[] }
    | undefined;
  const resumables = data?.resumables ?? [];
  const recents = data?.recents ?? [];
  const dashboardError =
    myGames.isError && mapTRPCErrorToPolicy(myGames.error) !== 'redirect-login';

  useEffect(() => {
    if (
      myGames.isError &&
      mapTRPCErrorToPolicy(myGames.error) === 'redirect-login'
    ) {
      router.replace('./login');
    }
  }, [myGames.error, myGames.isError]);

  function openGame(game: DashboardGame) {
    router.push(gameRoute(game) as Href);
  }

  return (
    <Screen
      header={
        <Screen.Header
          eyebrow={
            user?.email ??
            user?.name ??
            (session.isPending ? 'Loading' : 'Mobile')
          }
          title="Sequence Online"
          testID={testId('dashboard', 'header')}
        />
      }
      testID={testId('dashboard', 'screen')}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void myGames.refetch();
            }}
            refreshing={myGames.isFetching}
            tintColor={colors.accent}
          />
        }
        testID={testId('dashboard', 'scroll')}
      >
        <View style={styles.actions}>
          <Button
            onPress={() => router.push('./create')}
            size="lg"
            testID={testId('dashboard', 'create')}
          >
            Create game
          </Button>
          <Button
            onPress={() => router.push('./join')}
            testID={testId('dashboard', 'join')}
            variant="secondary"
          >
            Join game
          </Button>
          <Button
            onPress={() => router.push('./history')}
            testID={testId('dashboard', 'history')}
            variant="secondary"
          >
            History
          </Button>
          <Button
            onPress={() => router.push('./settings')}
            testID={testId('dashboard', 'settings')}
            variant="secondary"
          >
            Settings
          </Button>
        </View>

        {dashboardError ? (
          <Card variant="sunken" testID={testId('dashboard', 'error')}>
            <View style={styles.stateCard}>
              <Text style={[styles.stateTitle, { color: colors.text }]}>
                Could not load games
              </Text>
              <Text style={[styles.empty, { color: colors.textMuted }]}>
                Pull to refresh or try again in a moment.
              </Text>
            </View>
          </Card>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                Your games
              </Text>
              {myGames.isPending ? (
                <Text style={[styles.empty, { color: colors.textMuted }]}>
                  Loading...
                </Text>
              ) : resumables.length === 0 ? (
                <Text style={[styles.empty, { color: colors.textMuted }]}>
                  No games to resume right now.
                </Text>
              ) : (
                <View style={styles.stack}>
                  {resumables.map((game) => (
                    <GameCard
                      game={game}
                      key={game.gameId}
                      kind="resumable"
                      onPress={openGame}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                Recent results
              </Text>
              {myGames.isPending ? (
                <Text style={[styles.empty, { color: colors.textMuted }]}>
                  Loading...
                </Text>
              ) : recents.length === 0 ? (
                <Text style={[styles.empty, { color: colors.textMuted }]}>
                  No finished games yet.
                </Text>
              ) : (
                <View style={styles.stack}>
                  {recents.map((game) => (
                    <GameCard
                      game={game}
                      key={game.gameId}
                      kind="recent"
                      onPress={openGame}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  empty: {
    fontSize: 15,
    lineHeight: 21,
  },
  scrollContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    paddingBottom: 24,
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
