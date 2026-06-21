import Link from 'next/link';

import { SECTIONS } from './_playground/sections.ts';

/** Playground landing: overview and links into each preview section. */
export default function DevIndexPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-black text-black">Component playground</h2>
        <p className="max-w-2xl text-sm text-black/60">
          Render the shared UI and game components in isolation across their key
          visual states — no login, no live game subscription. Previews use the
          production Tailwind/typography pipeline, so they are visually faithful
          to what ships. This subtree is excluded from production builds.
        </p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <li key={section.slug}>
            <Link
              href={`/dev/${section.slug}`}
              className="block h-full rounded-xl border border-black/10 bg-white p-4 shadow-sm hover:border-black/25"
            >
              <p className="text-sm font-bold text-black">{section.title}</p>
              <p className="mt-1 text-xs text-black/55">{section.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
