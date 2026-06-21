import type { AppRouter } from '@sequence/api';
import {
  createTRPCClient,
  createWSClient,
  httpBatchLink,
  loggerLink,
  splitLink,
  wsLink,
} from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';

/**
 * The web tRPC client (p05-t02).
 *
 * `AppRouter` is imported **type-only** from `@sequence/api` — the API package
 * is a devDependency; no API runtime code ships in the web bundle. This is the
 * multi-client contract surface.
 *
 * Transport is a **split link**:
 *  - subscriptions → a reconnecting WS client (`wsLink`), so the live
 *    `game.onGameEvent` stream is the only thing on the socket;
 *  - everything else (queries + mutations) → `httpBatchLink` with
 *    `credentials: 'include'` so the Better Auth session cookie (and any
 *    game-scoped guest cookie) rides every HTTP call.
 *
 * The WS client passes `lastEventId` through automatically: tRPC's subscription
 * transport resends the last `tracked()` id on reconnect, driving the
 * server's snapshot-first / gap-replay recovery (design §Error Handling).
 */

const httpUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001';

/**
 * Lazily create the reconnecting WS client in the browser only. On the server
 * (SSR) there is no socket; subscriptions only run client-side.
 */
function createWsLink() {
  const wsClient = createWSClient({
    url: `${wsUrl}/trpc`,
    // Do not open a socket at app-shell load time. Auth pages construct the
    // shared tRPC client before a session cookie exists; an eager socket can
    // then carry no cookies into the later game subscription.
    lazy: { enabled: true, closeMs: 1000 },
    // Reconnect with backoff; the blocking "Reconnecting…" overlay (p06) is
    // driven off connection state. `lastEventId` is handled by tRPC's
    // subscription transport on resubscribe.
    retryDelayMs: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
  });
  return wsLink<AppRouter>({ client: wsClient });
}

const httpLink = httpBatchLink<AppRouter>({
  url: `${httpUrl}/trpc`,
  // Carry the session / guest cookie on every query + mutation.
  fetch(url, options) {
    return fetch(url, { ...options, credentials: 'include' });
  },
});

const links = [
  loggerLink<AppRouter>({
    enabled: (op) =>
      process.env.NODE_ENV === 'development' ||
      (op.direction === 'down' && op.result instanceof Error),
  }),
  // Subscriptions ride the WS client; queries/mutations ride HTTP batch.
  splitLink<AppRouter>({
    condition: (op) => op.type === 'subscription',
    true:
      typeof window === 'undefined'
        ? // No socket during SSR — fall back to the HTTP link so the client is
          // still constructable; subscriptions are only ever invoked in the
          // browser.
          httpLink
        : createWsLink(),
    false: httpLink,
  }),
];

/** A standalone vanilla client (server components, tests, one-off calls). */
export const trpcClient = createTRPCClient<AppRouter>({ links });

/**
 * React Query bindings for tRPC (the `@trpc/tanstack-react-query` integration).
 * `TRPCProvider` wires the client + query client into context; `useTRPC`
 * returns the typed query/mutation option factories.
 */
export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();

export { links };
