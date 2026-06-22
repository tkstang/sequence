'use client';

import * as stylex from '@stylexjs/stylex';
import { useQuery } from '@tanstack/react-query';

import { useTRPC } from '@/lib/trpc/client.ts';
import { useLogout } from '@/lib/use-logout.ts';
import { useRequireSession } from '@/lib/use-session.ts';
import { color, fontSize, space } from '@/styles/tokens.stylex.ts';

import { DashboardView } from './dashboard-view.tsx';
import type { DashboardGame } from './dashboard-view.tsx';

const styles = stylex.create({
  loading: {
    display: 'flex',
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxxl,
    fontSize: fontSize.sm,
    color: color.textMuted,
  },
});

/**
 * Dashboard page (p05-t05). Gated on a session; fetches `game.myGames` and
 * renders the approved wireframe via {@link DashboardView}.
 */
export default function DashboardPage() {
  const session = useRequireSession();
  const { logout, isSigningOut } = useLogout();
  const trpc = useTRPC();
  const myGames = useQuery({
    ...trpc.game.myGames.queryOptions(),
    enabled: session.isAuthenticated,
  });

  // While the session resolves (or redirects), show a minimal placeholder.
  if (session.isPending || !session.isAuthenticated) {
    return <main {...stylex.props(styles.loading)}>Loading…</main>;
  }

  const data = myGames.data;
  return (
    <DashboardView
      userInitial={(session.user?.name ?? '?').charAt(0).toUpperCase()}
      onLogout={logout}
      isSigningOut={isSigningOut}
      resumables={(data?.resumables ?? []) as DashboardGame[]}
      recents={(data?.recents ?? []) as DashboardGame[]}
      isLoading={myGames.isPending}
    />
  );
}
