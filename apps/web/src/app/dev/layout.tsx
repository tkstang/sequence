import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { SECTIONS } from './_playground/sections.ts';

export const metadata = {
  title: 'UI Playground · Sequence',
};

/**
 * Dev-only component playground shell.
 *
 * Gated on `NODE_ENV` so the entire `/dev` subtree 404s in production builds
 * and never ships to users. The nav lists each preview section; pages render
 * the real components driven by shared fixtures — no auth guard, no tRPC.
 */
export default function DevLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <div className="bg-cream text-slate min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:flex-row sm:p-6">
        <aside className="sm:w-56 sm:shrink-0">
          <Link href="/dev" className="block">
            <p className="text-xs font-black tracking-wide text-black/45 uppercase">
              Dev only
            </p>
            <h1 className="text-lg font-black text-black">UI Playground</h1>
          </Link>
          <nav className="mt-4 flex flex-col gap-1">
            {SECTIONS.map((section) => (
              <Link
                key={section.slug}
                href={`/dev/${section.slug}`}
                className="text-slate rounded-lg px-3 py-2 text-sm font-semibold hover:bg-black/5"
              >
                {section.title}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
