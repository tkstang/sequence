import * as stylex from '@stylexjs/stylex';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { color, fontSize, fontWeight, space } from '@/styles/tokens.stylex.ts';

import { ThemeToggle } from './theme/theme-toggle.tsx';

export interface AppHeaderProps {
  /** Right-aligned slot — typically an avatar or auth control. */
  right?: ReactNode;
  /** Where the logo links (default dashboard). */
  homeHref?: string;
}

const styles = stylex.create({
  header: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: color.slate,
    paddingInline: space.lg,
    paddingBlock: space.md,
    color: color.textOnDark,
  },
  brand: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    letterSpacing: '0.1em',
    color: color.textOnDark,
    textDecorationLine: 'none',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.textOnDark,
    outlineOffset: '2px',
  },
  cluster: {
    marginInlineStart: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: space.md,
  },
});

/** Slate chrome header (`#2d3142`) shared across shell screens. */
export function AppHeader({ right, homeHref = '/dashboard' }: AppHeaderProps) {
  return (
    <header {...stylex.props(styles.header)}>
      <Link href={homeHref} {...stylex.props(styles.brand)}>
        SEQUENCE
      </Link>
      <div {...stylex.props(styles.cluster)}>
        <ThemeToggle />
        {right}
      </div>
    </header>
  );
}
