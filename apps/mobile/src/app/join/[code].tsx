import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTRPC } from '../../api/client.ts';
import { mapTRPCErrorToPolicy } from '../../api/error-policy.ts';
import { useSession } from '../../auth/client.ts';
import { saveGuestGame, saveGuestToken } from '../../auth/guest-store.ts';
import { Button } from '../../components/Button.tsx';
import { Card } from '../../components/Card.tsx';
import { Screen } from '../../components/Screen.tsx';
import { TextField } from '../../components/TextField.tsx';
import {
  getPreviewUnavailableMessage,
  normalizeInviteCode,
  PreviewCard,
  type JoinPreview,
} from '../../features/join/PreviewCard.tsx';
import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function getErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const data = 'data' in error ? error.data : undefined;
  if (typeof data !== 'object' || data === null) return null;
  const code = 'code' in data ? data.code : undefined;
  return typeof code === 'string' ? code : null;
}

function messageForJoinError(error: unknown): string {
  const code = getErrorCode(error);
  if (code === 'CONFLICT') {
    return 'This game is no longer available to join. Refresh and try again.';
  }
  if (code === 'FORBIDDEN') {
    return 'This game cannot be joined from another device.';
  }
  if (code === 'NOT_FOUND') {
    return 'Unknown invite code.';
  }
  if (mapTRPCErrorToPolicy(error) === 'backoff-toast') {
    return 'Too many invite attempts. Wait a moment and try again.';
  }
  return error instanceof Error ? error.message : 'Could not join this game.';
}

export default function JoinPreviewScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const inviteCode = normalizeInviteCode(firstParam(params.code));
  const trpc = useTRPC();
  const session = useSession();
  const isSignedIn = Boolean(session.data?.user);
  const [guestName, setGuestName] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  const preview = useQuery({
    ...trpc.game.preview.queryOptions({ inviteCode }),
    enabled: inviteCode.length > 0,
  });
  const join = useMutation(
    trpc.game.join.mutationOptions({
      onError(error) {
        setJoinError(messageForJoinError(error));
      },
    }),
  );

  async function joinAsUser(previewData: JoinPreview) {
    setJoinError(null);
    try {
      const result = (await join.mutateAsync({
        inviteCode: previewData.inviteCode,
      })) as {
        gameId: string;
      };
      router.replace(`/game/${encodeURIComponent(result.gameId)}` as Href);
    } catch {
      // Mutation onError maps API failures into friendly route state.
    }
  }

  async function joinAsGuest(previewData: JoinPreview) {
    const nextGuestName = guestName.trim();

    if (nextGuestName.length === 0) {
      setJoinError('Enter a guest name.');
      return;
    }

    setJoinError(null);
    try {
      const result = (await join.mutateAsync({
        guestName: nextGuestName,
        inviteCode: previewData.inviteCode,
        returnGuestToken: true,
      })) as { gameId: string; guestToken?: string };

      if (!result.guestToken) {
        setJoinError('Could not save guest access. Try again.');
        return;
      }

      await saveGuestToken(result.gameId, result.guestToken);
      await saveGuestGame({
        gameId: result.gameId,
        guestName: nextGuestName,
        inviteCode: previewData.inviteCode,
        joinedAt: new Date().toISOString(),
        lastKnownStatus: previewData.status,
      });
      router.replace(`/game/${encodeURIComponent(result.gameId)}` as Href);
    } catch {
      // Mutation onError maps API failures into friendly route state.
    }
  }

  const data = preview.data as JoinPreview | undefined;
  const unavailableMessage = data ? getPreviewUnavailableMessage(data) : null;
  const errorCode = preview.isError ? getErrorCode(preview.error) : null;
  const genericPreviewError = preview.isError && errorCode !== 'NOT_FOUND';

  return (
    <Screen
      header={
        <Screen.Header
          eyebrow="Invite"
          title="Game preview"
          testID={testId('join', 'preview', 'header')}
        />
      }
      testID={testId('join', 'preview', 'screen')}
    >
      {preview.isPending ? (
        <Text
          style={[styles.body, { color: colors.textMuted }]}
          testID={testId('join', 'preview', 'loading')}
        >
          Loading game...
        </Text>
      ) : genericPreviewError ? (
        <Card variant="raised" testID={testId('join', 'preview', 'error')}>
          <View style={styles.stateCard}>
            <Text style={[styles.stateTitle, { color: colors.text }]}>
              Could not load invite
            </Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>
              Check your connection and try again.
            </Text>
            <Button
              onPress={() => {
                void preview.refetch();
              }}
              testID={testId('join', 'preview', 'retry')}
              variant="secondary"
            >
              Try again
            </Button>
          </View>
        </Card>
      ) : errorCode === 'NOT_FOUND' || !data ? (
        <Card variant="raised" testID={testId('join', 'preview', 'notFound')}>
          <View style={styles.stateCard}>
            <Text style={[styles.stateTitle, { color: colors.text }]}>
              Unknown invite code
            </Text>
            <Text style={[styles.body, { color: colors.textMuted }]}>
              Check the code and try again, or ask the host for a new one.
            </Text>
          </View>
        </Card>
      ) : (
        <View style={styles.stack}>
          <PreviewCard preview={data} />
          {unavailableMessage ? (
            <Card variant="sunken" testID={testId('join', 'preview', 'closed')}>
              <Text style={[styles.body, { color: colors.textMuted }]}>
                {unavailableMessage}
              </Text>
            </Card>
          ) : (
            <View style={styles.stack}>
              {isSignedIn ? (
                <Button
                  accessibilityLabel="Join game"
                  disabled={join.isPending}
                  onPress={() => {
                    void joinAsUser(data);
                  }}
                  size="lg"
                  testID={testId('join', 'preview', 'join')}
                >
                  {join.isPending ? 'Joining...' : 'Join game'}
                </Button>
              ) : (
                <Card
                  variant="sunken"
                  testID={testId('join', 'preview', 'guest')}
                >
                  <View style={styles.guestForm}>
                    <Text style={[styles.stateTitle, { color: colors.text }]}>
                      Join as guest
                    </Text>
                    <TextField
                      accessibilityLabel="Guest name"
                      onChangeText={setGuestName}
                      placeholder="Guest name"
                      testID={testId('join', 'preview', 'guestName')}
                      value={guestName}
                    />
                    <Button
                      accessibilityLabel="Continue as guest"
                      disabled={join.isPending}
                      onPress={() => {
                        void joinAsGuest(data);
                      }}
                      size="lg"
                      testID={testId('join', 'preview', 'guestJoin')}
                    >
                      {join.isPending ? 'Joining...' : 'Continue as guest'}
                    </Button>
                  </View>
                </Card>
              )}
            </View>
          )}
          {joinError ? (
            <Text
              accessibilityRole="alert"
              style={[styles.error, { color: colors.danger }]}
              testID={testId('join', 'preview', 'joinError')}
            >
              {joinError}
            </Text>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  stateCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
  guestForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
});
