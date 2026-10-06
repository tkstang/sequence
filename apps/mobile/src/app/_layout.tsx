import 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  createSequenceQueryClient,
  createSequenceTRPCClient,
  TRPCProvider,
} from '../api/client.ts';
import { useSession } from '../auth/client.ts';
import { ThemeProvider } from '../theme/theme-provider.tsx';

export default function RootLayout() {
  const [queryClient] = useState(() => createSequenceQueryClient());
  const [trpcClient] = useState(() => createSequenceTRPCClient());
  const session = useSession();
  const isSignedIn = Boolean(session.data?.user);

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Protected guard={isSignedIn}>
                <Stack.Screen name="index" />
                <Stack.Screen name="create" />
                <Stack.Screen name="history" />
                <Stack.Screen name="settings" />
              </Stack.Protected>
              <Stack.Protected guard={!isSignedIn}>
                <Stack.Screen name="(auth)/login" />
                <Stack.Screen name="(auth)/signup" />
              </Stack.Protected>
              <Stack.Protected guard>
                <Stack.Screen name="join/index" />
                <Stack.Screen name="join/[code]" />
                <Stack.Screen name="game/[id]" />
              </Stack.Protected>
            </Stack>
          </ThemeProvider>
        </TRPCProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
