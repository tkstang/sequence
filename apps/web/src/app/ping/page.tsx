'use client';

import * as stylex from '@stylexjs/stylex';
import { useQuery } from '@tanstack/react-query';

import { useTRPC } from '@/lib/trpc/client.ts';
import { color, fontSize, fontWeight, space } from '@/styles/tokens.stylex.ts';

/**
 * Transport smoke page (p05-t02 verify): renders `health.ping` over the HTTP
 * batch link. Confirms the tRPC client + React Query provider are wired.
 * Not a product screen — a developer probe.
 */
const styles = stylex.create({
  main: {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xxxl,
    backgroundColor: color.bg,
    color: color.text,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  status: {
    fontSize: fontSize.lg,
    color: color.textMuted,
  },
});

export default function PingPage() {
  const trpc = useTRPC();
  const ping = useQuery(trpc.health.ping.queryOptions());

  return (
    <main {...stylex.props(styles.main)}>
      <h1 {...stylex.props(styles.title)}>tRPC ping</h1>
      <p {...stylex.props(styles.status)} data-testid="ping-status">
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
