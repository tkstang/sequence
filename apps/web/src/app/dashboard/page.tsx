'use client';

import { useQuery } from '@tanstack/react-query';

import { useTRPC } from '@/lib/trpc/client.ts';
import { useLogout } from '@/lib/use-logout.ts';
import { useRequireSession } from '@/lib/use-session.ts';

import { DashboardView } from './dashboard-view.tsx';
import type { DashboardGame } from './dashboard-view.tsx';

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
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-sm text-black/50">
        Loading…
      </main>
    );
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
