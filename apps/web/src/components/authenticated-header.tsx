'use client';

import { AppHeader } from './app-header.tsx';

export interface AuthenticatedHeaderProps {
  userInitial: string;
  onLogout: () => void;
  isSigningOut?: boolean;
  homeHref?: string;
}

/** Header for authenticated shell pages: account mark plus reachable logout. */
export function AuthenticatedHeader({
  userInitial,
  onLogout,
  isSigningOut = false,
  homeHref = '/dashboard',
}: AuthenticatedHeaderProps) {
  return (
    <AppHeader
      homeHref={homeHref}
      right={
        <div className="flex items-center gap-3">
          <span
            className="bg-team-blue flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
            aria-label="Your account"
          >
            {userInitial}
          </span>
          <button
            type="button"
            onClick={onLogout}
            disabled={isSigningOut}
            className="rounded-lg px-2 py-1 text-xs font-bold text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningOut ? 'Signing out...' : 'Log out'}
          </button>
        </div>
      }
    />
  );
}
