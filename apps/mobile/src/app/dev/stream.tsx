import type { GameStreamItem } from '@sequence/client-state';
import { useSubscription } from '@trpc/tanstack-react-query';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTRPC } from '../../api/client.ts';
import { Button } from '../../components/Button.tsx';
import { Card } from '../../components/Card.tsx';
import { ConnectionBanner } from '../../components/ConnectionBanner.tsx';
import { Screen } from '../../components/Screen.tsx';
import { TextField } from '../../components/TextField.tsx';
import { useGameStream } from '../../realtime/use-game-stream.ts';
import { useTheme } from '../../theme/use-theme.ts';

type RawStreamItem = GameStreamItem | { data: GameStreamItem };

function firstSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

function parseLastEventId(value: string | string[] | undefined): number | null {
  const raw = firstSearchParam(value).trim();
  if (raw.length === 0) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function stringifyRawItem(item: RawStreamItem): string {
  return JSON.stringify(item, null, 2) ?? String(item);
}

function DevStreamFeed({
  gameId,
  initialLastEventId,
}: {
  gameId: string;
  initialLastEventId: number | null;
}) {
  const trpc = useTRPC();
  const { colors } = useTheme();
  const gameStream = useGameStream(gameId, { initialLastEventId });
  const [items, setItems] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  useEffect(() => {
    setItems([]);
    setStartedAt(null);
  }, [gameId]);

  const appendItem = useCallback((item: RawStreamItem) => {
    setItems((currentItems) =>
      [
        `${new Date().toISOString()}\n${stringifyRawItem(item)}`,
        ...currentItems,
      ].slice(0, 50),
    );
  }, []);

  const subscription = useSubscription(
    trpc.game.onGameEvent.subscriptionOptions(
      initialLastEventId === null
        ? { gameId }
        : { gameId, lastEventId: initialLastEventId },
      {
        onData: (item) => appendItem(item as RawStreamItem),
        onStarted: () => setStartedAt(new Date().toISOString()),
      },
    ),
  );

  return (
    <View style={styles.stack}>
      <ConnectionBanner connectionState={gameStream.connectionState} />
      <Card testID="dev.stream.status" variant="raised">
        <View style={styles.status}>
          <Text style={[styles.label, { color: colors.text }]}>
            Joined game
          </Text>
          <Text style={[styles.mono, { color: colors.textMuted }]}>
            {gameId}
          </Text>
          <Text style={[styles.mono, { color: colors.textMuted }]}>
            status: {subscription.status}
          </Text>
          <Text style={[styles.mono, { color: colors.textMuted }]}>
            requestedLastEventId: {initialLastEventId ?? 'none'}
          </Text>
          <Text style={[styles.mono, { color: colors.textMuted }]}>
            lifecycle: {gameStream.connectionState}
          </Text>
          <Text style={[styles.mono, { color: colors.textMuted }]}>
            lastEventId: {gameStream.lastEventId ?? 'none'}
          </Text>
          <Text style={[styles.mono, { color: colors.textMuted }]}>
            snapshot: {gameStream.view?.gameId ?? 'none'}
          </Text>
          {startedAt === null ? null : (
            <Text style={[styles.mono, { color: colors.textMuted }]}>
              started: {startedAt}
            </Text>
          )}
        </View>
      </Card>
      {items.length === 0 ? (
        <Card testID="dev.stream.empty">Waiting for stream items.</Card>
      ) : (
        items.map((item, index) => (
          <Card key={`${gameId}:${index}:${item}`} testID="dev.stream.item">
            <Text style={[styles.eventText, { color: colors.text }]}>
              {item}
            </Text>
          </Card>
        ))
      )}
    </View>
  );
}

export default function DevStreamScreen() {
  const params = useLocalSearchParams<{
    gameId?: string | string[];
    lastEventId?: string | string[];
  }>();
  const initialGameId = firstSearchParam(params.gameId).trim();
  const initialLastEventId = parseLastEventId(params.lastEventId);
  const [draftGameId, setDraftGameId] = useState(initialGameId);
  const [joinedGameId, setJoinedGameId] = useState(initialGameId);
  const { colors } = useTheme();

  const joinStream = useCallback(() => {
    setJoinedGameId(draftGameId.trim());
  }, [draftGameId]);

  return (
    <Screen
      header={
        <Screen.Header eyebrow="Development only" title="Raw event stream" />
      }
      scroll
      testID="dev.stream"
    >
      <Card testID="dev.stream.join">
        <View style={styles.joinCard}>
          <Text style={[styles.label, { color: colors.text }]}>Game id</Text>
          <View style={styles.joinControls}>
            <TextField
              accessibilityLabel="Game id"
              onChangeText={setDraftGameId}
              placeholder="Paste a game id"
              testID="dev.stream.game-id"
              value={draftGameId}
            />
            <Button
              accessibilityLabel="Join raw stream"
              disabled={draftGameId.trim().length === 0}
              onPress={joinStream}
              testID="dev.stream.join.submit"
            >
              Join stream
            </Button>
          </View>
        </View>
      </Card>
      {joinedGameId.length === 0 ? (
        <Card testID="dev.stream.not-joined">
          Enter a game id to subscribe.
        </Card>
      ) : (
        <DevStreamFeed
          gameId={joinedGameId}
          initialLastEventId={initialLastEventId}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  joinCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  joinControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  status: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  mono: {
    fontFamily: 'Courier',
    fontSize: 12,
    lineHeight: 18,
  },
  eventText: {
    fontFamily: 'Courier',
    fontSize: 12,
    lineHeight: 18,
  },
});
