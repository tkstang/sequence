'use client';

import * as stylex from '@stylexjs/stylex';
import { notFound, useParams } from 'next/navigation';

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
