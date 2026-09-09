import type { AppRouter } from '@sequence/api';
import { QueryClient } from '@tanstack/react-query';
import {
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  loggerLink,
  splitLink,
  wsLink,
} from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';

import { buildCookieHeader, getActiveGameCookieGameId } from './cookies.ts';
import { getApiEnv, type ApiEnv } from './env.ts';
import { createWebSocketClientOptions } from './ws.ts';

type TRPCHeaderOperation = {
  input?: unknown;
};

function gameIdFromInput(input: unknown): string | undefined {
  if (typeof input !== 'object' || input === null) return undefined;
  const gameId = 'gameId' in input ? input.gameId : undefined;
  return typeof gameId === 'string' ? gameId : undefined;
}

export function getGameIdForCookieHeader(
  opList: readonly TRPCHeaderOperation[] | undefined,
): string | undefined {
  return (
    opList?.map((op) => gameIdFromInput(op.input)).find(Boolean) ??
    getActiveGameCookieGameId()
  );
}

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
  const httpLink = httpBatchLink<AppRouter>({
    url: `${env.apiUrl}/trpc`,
    async headers({ opList }) {
      const cookie = await buildCookieHeader({
        gameId: getGameIdForCookieHeader(opList),
      });
      return cookie ? { Cookie: cookie } : {};
    },
    fetch(url, options) {
      const requestInit = options as RequestInit | undefined;
      return fetch(url, { ...requestInit, credentials: 'omit' });
    },
  });
  const wsClient = createWSClient(createWebSocketClientOptions(env));

  return [
    loggerLink<AppRouter>({
      enabled: (op) =>
        process.env.NODE_ENV === 'development' ||
        (op.direction === 'down' && op.result instanceof Error),
    }),
    splitLink<AppRouter>({
      condition: (op) => op.type === 'subscription',
      true: wsLink<AppRouter>({ client: wsClient }),
      false: httpLink,
    }),
  ];
}

export function createSequenceTRPCClient() {
  return createTRPCClient<AppRouter>({ links: createTRPCLinks() });
}

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();
