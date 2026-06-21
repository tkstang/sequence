'use client';

import type { AppRouter } from '@sequence/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient } from '@trpc/client';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { links, TRPCProvider } from './client.ts';

/**
 * App-wide tRPC + React Query provider (p05-t02).
 *
 * One `QueryClient` and one tRPC client per browser session, created in state so
 * they survive re-renders but are not shared across requests on the server.
 * Wraps the shell so any client component can call `useTRPC()`.
 */
export function TRPCReactProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Friend-group scale; modest caching, no aggressive refetch.
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient<AppRouter>({ links }));

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
