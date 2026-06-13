import Link from 'next/link';
import type { ReactNode } from 'react';

export interface AppHeaderProps {
  /** Right-aligned slot — typically an avatar or auth control. */
  right?: ReactNode;
  /** Where the logo links (default dashboard). */
  homeHref?: string;
}

/** Slate chrome header (`#2d3142`) shared across shell screens. */
export function AppHeader({ right, homeHref = '/dashboard' }: AppHeaderProps) {
  return (
    <header className="bg-slate flex items-center px-4 py-3 text-white">
      <Link
        href={homeHref}
        className="text-sm font-extrabold tracking-[0.1em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        SEQUENCE
      </Link>
      {right ? <div className="ml-auto flex items-center">{right}</div> : null}
    </header>
  );
}
