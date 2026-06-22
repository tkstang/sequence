import * as stylex from '@stylexjs/stylex';

import { color, fontSize, fontWeight, space } from '@/styles/tokens.stylex.ts';

import { Overview } from './_playground/overview.tsx';
import { ViewportPreview } from './_playground/viewport-preview.tsx';

const styles = stylex.create({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.xxl,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
  },
  heading: {
    margin: 0,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: color.text,
  },
  lede: {
    margin: 0,
    maxWidth: '42rem',
    fontSize: fontSize.sm,
    lineHeight: 1.5,
    color: color.textMuted,
  },
});

/** Playground landing: overview and links into each preview section. */
export default function DevIndexPage() {
  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <h2 {...stylex.props(styles.heading)}>Component playground</h2>
        <p {...stylex.props(styles.lede)}>
          Render the shared UI and game components in isolation across their key
          visual states — no login, no live game subscription. Previews use the
          production StyleX token and theming pipeline, so they are visually
          faithful to what ships. This subtree is excluded from production
          builds.
        </p>
      </header>
      <ViewportPreview slug="overview">
        <Overview />
      </ViewportPreview>
    </div>
  );
}
