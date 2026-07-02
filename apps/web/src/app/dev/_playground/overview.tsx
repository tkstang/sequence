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

import { SECTIONS } from './sections.ts';

const styles = stylex.create({
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

/** The grid of links into each playground section (also the viewport-preview target). */
export function Overview() {
  return (
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
  );
}
