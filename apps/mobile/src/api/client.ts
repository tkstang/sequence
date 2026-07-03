import type { AppRouter } from '@sequence/api';
import { QueryClient } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';

import { buildCookieHeader } from './cookies.ts';
import { getApiEnv, type ApiEnv } from './env.ts';

export function createSequenceQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}

export function createTRPCLinks(env: ApiEnv = getApiEnv()) {
  return [
    loggerLink<AppRouter>({
      enabled: (op) =>
        process.env.NODE_ENV === 'development' ||
        (op.direction === 'down' && op.result instanceof Error),
    }),
    httpBatchLink<AppRouter>({
      url: `${env.apiUrl}/trpc`,
      async headers() {
        const cookie = await buildCookieHeader();
        return cookie ? { Cookie: cookie } : {};
      },
      fetch(url, options) {
        const requestInit = options as RequestInit | undefined;
        return fetch(url, { ...requestInit, credentials: 'omit' });
      },
    }),
  ];
}

export function createSequenceTRPCClient() {
  return createTRPCClient<AppRouter>({ links: createTRPCLinks() });
}

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();
