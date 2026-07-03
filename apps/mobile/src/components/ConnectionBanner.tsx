import { StyleSheet, Text, View } from 'react-native';

import type { GameStreamConnectionState } from '../realtime/use-game-stream.ts';
import { testId } from '../test/test-ids.ts';
import { useTheme } from '../theme/use-theme.ts';

export interface ConnectionBannerProps {
  connectionState: GameStreamConnectionState;
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

export function ConnectionBanner({ connectionState }: ConnectionBannerProps) {
  const { colors } = useTheme();

  if (connectionState === 'live') {
    return null;
  }

  const copy = copyByState[connectionState];

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  detail: {
    fontSize: 13,
    lineHeight: 18,
  },
});
