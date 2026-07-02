'use client';

import * as stylex from '@stylexjs/stylex';
import { notFound, useParams } from 'next/navigation';

import { Overview } from '@/app/dev/_playground/overview.tsx';
import { STORIES } from '@/app/dev/_playground/stories.tsx';
import { color, space } from '@/styles/tokens.stylex.ts';

const styles = stylex.create({
  body: {
    minHeight: '100vh',
    backgroundColor: color.bg,
    color: color.text,
    padding: space.lg,
  },
});

/** Bare render of a single playground section, loaded inside the viewport iframe. */
export default function DevFramePage() {
  const params = useParams<{ section: string }>();
  // Exclude the playground from production payloads (guard before rendering).
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  if (params.section === 'overview') {
    return (
      <div {...stylex.props(styles.body)}>
        <Overview />
      </div>
    );
  }
  const Story = STORIES[params.section];
  if (!Story) {
    notFound();
  }
  return (
    <div {...stylex.props(styles.body)}>
      <Story />
    </div>
  );
}
