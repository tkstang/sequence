'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession as useBetterAuthSession } from './auth-client.ts';

export interface SessionState {
  /** True while the session is being resolved (first load). */
  isPending: boolean;
  /** The authenticated user, or null when signed out. */
  user: { id: string; name: string; email: string } | null;
  isAuthenticated: boolean;
}

/**
 * Read the current session (p05-t03). A thin, typed wrapper over Better Auth's
 * `useSession` so screens don't reach into the raw client shape.
 */
export function useSession(): SessionState {
  const { data, isPending } = useBetterAuthSession();
  const user = data?.user
    ? {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
      }
    : null;
  return { isPending, user, isAuthenticated: user !== null };
}

/**
 * Gate an authed screen: redirects to `/login` once the session resolves and no
 * user is present. Returns the session state so the caller can render a loading
 * placeholder while `isPending`. Authed shell pages (dashboard, create, history)
 * call this at the top of the component.
 */
export function useRequireSession(redirectTo = '/login'): SessionState {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session.isPending && !session.isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [session.isPending, session.isAuthenticated, router, redirectTo]);

  return session;
}
