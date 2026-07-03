import type { GameViewState } from '@sequence/client-state';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTRPC } from '../../api/client.ts';
import { mapTRPCErrorToPolicy } from '../../api/error-policy.ts';
import { ConnectionBanner } from '../../components/ConnectionBanner.tsx';
import { Screen } from '../../components/Screen.tsx';
import { LobbyTeams, type LobbyPlayerCount } from '../../game/LobbyTeams.tsx';
import { useGameStream } from '../../realtime/use-game-stream.ts';
import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function isLobbyPlayerCount(value: number): value is LobbyPlayerCount {
  return value === 2 || value === 3 || value === 4 || value === 6;
}

function mutationMessage(error: unknown): string {
  const policy = mapTRPCErrorToPolicy(error);
  if (policy === 'not-participant') {
    return 'You are not allowed to change this lobby.';
  }
  if (policy === 'refetch-feedback') {
    return 'The lobby changed. Live updates will refresh it.';
  }
  if (policy === 'backoff-toast') {
    return 'Too many requests. Wait a moment and try again.';
  }
  if (policy === 'redirect-login') {
    return 'Sign in or rejoin this game to continue.';
  }
  return error instanceof Error ? error.message : 'Could not update lobby.';
}

function Placeholder({ title, view }: { title: string; view: GameViewState }) {
  const { colors } = useTheme();

  return (
    <View style={styles.placeholder} testID={testId('game', 'placeholder')}>
      <Text style={[styles.placeholderTitle, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.placeholderBody, { color: colors.textMuted }]}>
        This game state is live. The full mobile surface lands in a later phase.
      </Text>
      <Text style={[styles.placeholderMeta, { color: colors.textMuted }]}>
        Version {view.version}
      </Text>
    </View>
  );
}

function GameStateView({
  isMutating,
  mutationError,
  onClearError,
  onJoinTeam,
  onKick,
  onRandomize,
  onStart,
  view,
}: {
  isMutating: boolean;
  mutationError: string | null;
  onClearError: () => void;
  onJoinTeam: (team: 1 | 2 | 3) => void;
  onKick: (seat: number) => void;
  onRandomize: () => void;
  onStart: () => void;
  view: GameViewState;
}) {
  const { colors } = useTheme();

  if (view.status === 'lobby') {
    if (!isLobbyPlayerCount(view.playerCount)) {
      return <Placeholder title="Unsupported lobby size" view={view} />;
    }

    return (
      <View style={styles.stack}>
        <LobbyTeams
          inviteCode={view.inviteCode}
          isMutating={isMutating}
          mode={view.mode}
          mySeat={view.mySeat}
          onJoinTeam={(team) => {
            onClearError();
            onJoinTeam(team);
          }}
          onKick={(seat) => {
            onClearError();
            onKick(seat);
          }}
          onRandomize={() => {
            onClearError();
            onRandomize();
          }}
          onStart={() => {
            onClearError();
            onStart();
          }}
          playerCount={view.playerCount}
          players={view.players}
          timerSeconds={view.timerSeconds}
        />
        {mutationError ? (
          <Text
            accessibilityRole="alert"
            style={[styles.error, { color: colors.danger }]}
            testID={testId('lobby', 'error')}
          >
            {mutationError}
          </Text>
        ) : null}
      </View>
    );
  }

  if (view.status === 'active') {
    return <Placeholder title="Game in progress" view={view} />;
  }
  if (view.status === 'finished') {
    return <Placeholder title="Game finished" view={view} />;
  }
  if (view.status === 'frozen') {
    return <Placeholder title="Game frozen" view={view} />;
  }
  return <Placeholder title="Game saved" view={view} />;
}

export default function GameRouteScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const gameId = firstParam(params.id);
  const trpc = useTRPC();
  const { colors } = useTheme();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const stream = useGameStream(gameId);

  const mutationOptions = {
    onError(error: unknown) {
      setMutationError(mutationMessage(error));
    },
  };
  const setTeam = useMutation(
    trpc.game.setTeam.mutationOptions(mutationOptions),
  );
  const kick = useMutation(trpc.game.kick.mutationOptions(mutationOptions));
  const randomizeTeams = useMutation(
    trpc.game.randomizeTeams.mutationOptions(mutationOptions),
  );
  const start = useMutation(trpc.game.start.mutationOptions(mutationOptions));
  const isMutating =
    setTeam.isPending ||
    kick.isPending ||
    randomizeTeams.isPending ||
    start.isPending;

  return (
    <Screen
      header={
        <Screen.Header
          eyebrow="Live game"
          title="Sequence"
          testID={testId('game', 'header')}
        />
      }
      scroll
      testID={testId('game', 'screen')}
    >
      <View style={styles.stack}>
        <ConnectionBanner connectionState={stream.connectionState} />
        {gameId.length === 0 ? (
          <Text style={[styles.error, { color: colors.danger }]}>
            Missing game id.
          </Text>
        ) : stream.view ? (
          <GameStateView
            isMutating={isMutating}
            mutationError={mutationError}
            onClearError={() => setMutationError(null)}
            onJoinTeam={(team) =>
              setTeam.mutate({ gameId, targetSeat: stream.view!.mySeat, team })
            }
            onKick={(targetSeat) => kick.mutate({ gameId, targetSeat })}
            onRandomize={() => randomizeTeams.mutate({ gameId })}
            onStart={() => start.mutate({ gameId })}
            view={stream.view}
          />
        ) : stream.connectionState === 'error' ? (
          <Text style={[styles.error, { color: colors.danger }]}>
            Could not load this game.
          </Text>
        ) : (
          <Text style={[styles.loading, { color: colors.textMuted }]}>
            Loading game...
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  error: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  loading: {
    fontSize: 16,
    lineHeight: 22,
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  placeholderBody: {
    fontSize: 15,
    lineHeight: 21,
  },
  placeholderMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
});
