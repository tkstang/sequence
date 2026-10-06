import { StyleSheet, Text, View } from 'react-native';

import type { GameStreamConnectionState } from '../realtime/use-game-stream.ts';
import { testId } from '../test/test-ids.ts';
import {
  nativeRadius,
  nativeSpace,
  nativeTypography,
} from '../theme/native-tokens.ts';
import { useTheme } from '../theme/use-theme.ts';

export interface ConnectionBannerProps {
  connectionState: GameStreamConnectionState;
  disconnectedPlayerName?: string | null;
  expiresAt?: string | null;
  paused?: boolean;
}

const copyByState = {
  connecting: {
    title: 'Connecting',
    detail: 'Opening the live game stream.',
  },
  reconnecting: {
    title: 'Reconnecting',
    detail: 'Recovering the stream and replaying missed events.',
  },
  error: {
    title: 'Connection lost',
    detail: 'Waiting for the live game stream to recover.',
  },
} satisfies Record<
  Exclude<GameStreamConnectionState, 'live'>,
  { detail: string; title: string }
>;

function freezeDetail(disconnectedPlayerName: string | null | undefined) {
  if (disconnectedPlayerName && disconnectedPlayerName.length > 0) {
    return `${disconnectedPlayerName} disconnected. Waiting for everyone to return.`;
  }
  return 'A player disconnected. Waiting for everyone to return.';
}

function formatExpiry(expiresAt: string | null | undefined) {
  if (!expiresAt) return null;
  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) return null;
  const label = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(expires);
  return expires.getTime() <= Date.now()
    ? `Expired ${label}`
    : `Expires ${label}`;
}

export function ConnectionBanner({
  connectionState,
  disconnectedPlayerName = null,
  expiresAt = null,
  paused = false,
}: ConnectionBannerProps) {
  const { colors } = useTheme();

  const frozen =
    paused || disconnectedPlayerName !== null || expiresAt !== null;

  if (connectionState === 'live' && !frozen) {
    return null;
  }

  const copy = frozen
    ? {
        title: 'Game paused',
        detail: freezeDetail(disconnectedPlayerName),
        expiry: formatExpiry(expiresAt),
      }
    : connectionState === 'live'
      ? null
      : { ...copyByState[connectionState], expiry: null };

  if (!copy) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.root,
        { backgroundColor: colors.surfaceRaised, borderColor: colors.accent },
      ]}
      testID={testId('game', 'connection', 'banner')}
    >
      <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
      <Text style={[styles.detail, { color: colors.textMuted }]}>
        {copy.detail}
      </Text>
      {copy.expiry ? (
        <Text style={[styles.detail, { color: colors.textMuted }]}>
          {copy.expiry}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    borderRadius: nativeRadius.md,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: nativeSpace.xxs,
    paddingHorizontal: nativeSpace.md,
    paddingVertical: 10,
  },
  title: {
    ...nativeTypography.bannerTitle,
  },
  detail: {
    ...nativeTypography.detail,
  },
});
