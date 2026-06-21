'use client';

import { notFound, useParams } from 'next/navigation';

import { getSectionMeta } from '../_playground/sections.ts';
import { STORIES } from '../_playground/stories.tsx';

/** Renders the previews for a single playground section. */
export default function DevSectionPage() {
  const params = useParams<{ section: string }>();
  const slug = params.section;
  const meta = getSectionMeta(slug);
  const Story = STORIES[slug];
  if (!meta || !Story) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-black">{meta.title}</h2>
        <p className="max-w-2xl text-sm text-black/60">{meta.blurb}</p>
      </header>
      <Story />
    </div>
  );
}
