import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTRPC } from '../api/client.ts';
import { mapTRPCErrorToPolicy } from '../api/error-policy.ts';
import { signOut, useSession } from '../auth/client.ts';
import { Button } from '../components/Button.tsx';
import { Card } from '../components/Card.tsx';
import { Screen } from '../components/Screen.tsx';
import { testId } from '../test/test-ids.ts';
import { useTheme } from '../theme/use-theme.ts';

async function logout() {
  await signOut();
  router.replace('./login');
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const trpc = useTRPC();
  const ping = useQuery(trpc.health.ping.queryOptions());
  const me = useQuery(trpc.health.me.queryOptions());
  const session = useSession();
  const user = me.data?.user ?? session.data?.user;

  useEffect(() => {
    if (me.isError && mapTRPCErrorToPolicy(me.error) === 'redirect-login') {
      router.replace('./login');
    }
  }, [me.error, me.isError]);

  const pingStatus = ping.isPending
    ? 'pinging...'
    : ping.isError
      ? `error: ${ping.error.message}`
      : ping.data?.pong
        ? 'pong: true'
        : 'pong: false';

  return (
    <Screen
      header={
        <Screen.Header
          actions={
            <Button
              onPress={logout}
              testID={testId('home', 'logout')}
              variant="secondary"
            >
              Log out
            </Button>
          }
          eyebrow="Mobile"
          title="Sequence Online"
          testID={testId('home', 'header')}
        />
      }
      testID={testId('home', 'screen')}
    >
      <Card testID={testId('home', 'session')}>
        <View style={styles.cardContent}>
          <Text style={[styles.title, { color: colors.text }]}>Signed in</Text>
          <Text style={[styles.body, { color: colors.textMuted }]}>
            {me.isPending
              ? 'Checking session...'
              : (user?.email ?? user?.name ?? 'Authenticated session')}
          </Text>
        </View>
      </Card>
      <Text
        style={[styles.status, { color: colors.text }]}
        testID={testId('home', 'ping')}
      >
        {pingStatus}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  status: {
    fontSize: 16,
    lineHeight: 22,
  },
});
