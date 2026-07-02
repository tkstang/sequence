'use client';

import * as stylex from '@stylexjs/stylex';
import { notFound, useParams } from 'next/navigation';

import { color, fontSize, fontWeight, space } from '@/styles/tokens.stylex.ts';

import { getSectionMeta } from '../_playground/sections.ts';
import { STORIES } from '../_playground/stories.tsx';
import { ViewportPreview } from '../_playground/viewport-preview.tsx';

const styles = stylex.create({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.xxl,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.xs,
  },
  heading: {
    margin: 0,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: color.text,
  },
  blurb: {
    margin: 0,
    maxWidth: '42rem',
    fontSize: fontSize.sm,
    color: color.textMuted,
  },
});

/** Renders the previews for a single playground section. */
export default function DevSectionPage() {
  const params = useParams<{ section: string }>();
  const slug = params.section;
  const meta = getSectionMeta(slug);
  const Story = STORIES[slug];
  if (!meta || !Story) {
    notFound();
  }
  // Exclude the playground from production payloads (guard before rendering;
  // the /dev layout guard alone runs after this page has already rendered).
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <h2 {...stylex.props(styles.heading)}>{meta.title}</h2>
        <p {...stylex.props(styles.blurb)}>{meta.blurb}</p>
      </header>
      <ViewportPreview slug={slug}>
        <Story />
      </ViewportPreview>
    </div>
  );
}
