import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTRPC } from '../api/client.ts';

export default function HomeScreen() {
  const trpc = useTRPC();
  const ping = useQuery(trpc.health.ping.queryOptions());

  const pingStatus = ping.isPending
    ? 'pinging...'
    : ping.isError
      ? `error: ${ping.error.message}`
      : ping.data?.pong
        ? 'pong: true'
        : 'pong: false';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Sequence Online</Text>
        <Text style={styles.status} testID="home.ping">
          {pingStatus}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  status: {
    marginTop: 8,
    fontSize: 20,
  },
});
