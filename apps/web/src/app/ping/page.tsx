'use client';

import { useQuery } from '@tanstack/react-query';

import { useTRPC } from '@/lib/trpc/client.ts';

/**
 * Transport smoke page (p05-t02 verify): renders `health.ping` over the HTTP
 * batch link. Confirms the tRPC client + React Query provider are wired.
 * Not a product screen — a developer probe.
 */
export default function PingPage() {
  const trpc = useTRPC();
  const ping = useQuery(trpc.health.ping.queryOptions());

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8">
      <h1 className="text-2xl font-bold">tRPC ping</h1>
      <p className="text-lg" data-testid="ping-status">
        {ping.isPending
          ? 'pinging…'
          : ping.isError
            ? `error: ${ping.error.message}`
            : ping.data?.pong
              ? 'pong ✓'
              : 'no pong'}
      </p>
    </main>
  );
}
