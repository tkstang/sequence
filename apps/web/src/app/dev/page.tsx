import * as stylex from '@stylexjs/stylex';
import Link from 'next/link';

import {
  color,
  fontSize,
  fontWeight,
  radius,
  shadow,
  space,
} from '@/styles/tokens.stylex.ts';

import { SECTIONS } from './_playground/sections.ts';

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
  grid: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gap: space.md,
    gridTemplateColumns: {
      default: '1fr',
      '@media (min-width: 640px)': 'repeat(2, minmax(0, 1fr))',
    },
  },
  card: {
    display: 'block',
    height: '100%',
    textDecoration: 'none',
    borderRadius: radius.lg,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: color.border, ':hover': color.borderStrong },
    backgroundColor: color.surface,
    padding: space.lg,
    boxShadow: shadow.sm,
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  cardTitle: {
    margin: 0,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: color.text,
  },
  cardBlurb: {
    margin: 0,
    marginBlockStart: space.xs,
    fontSize: fontSize.xs,
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
      <ul {...stylex.props(styles.grid)}>
        {SECTIONS.map((section) => (
          <li key={section.slug}>
            <Link href={`/dev/${section.slug}`} {...stylex.props(styles.card)}>
              <p {...stylex.props(styles.cardTitle)}>{section.title}</p>
              <p {...stylex.props(styles.cardBlurb)}>{section.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
