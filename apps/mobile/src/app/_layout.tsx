import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';

import {
  createSequenceQueryClient,
  createSequenceTRPCClient,
  TRPCProvider,
} from '../api/client.ts';
import { ThemeProvider } from '../theme/theme-provider.tsx';

export default function RootLayout() {
  const [queryClient] = useState(() => createSequenceQueryClient());
  const [trpcClient] = useState(() => createSequenceTRPCClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}
