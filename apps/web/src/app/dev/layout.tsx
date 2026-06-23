import * as stylex from '@stylexjs/stylex';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/theme/theme-toggle.tsx';
import {
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

import { SECTIONS } from './_playground/sections.ts';

// Dev-only title. Resolved via generateMetadata (not a static `metadata` export)
// and omitted in production so it never appears on the 404 the guard returns —
// route metadata is collected statically even when the component calls notFound().
export function generateMetadata() {
  if (process.env.NODE_ENV === 'production') return {};
  return { title: 'UI Playground · Sequence' };
}

const styles = stylex.create({
  root: {
    backgroundColor: color.bg,
    color: color.text,
    minHeight: '100vh',
  },
  shell: {
    marginInline: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: '72rem',
    flexDirection: { default: 'column', '@media (min-width: 640px)': 'row' },
    gap: space.xxl,
    padding: { default: space.lg, '@media (min-width: 640px)': space.xxl },
  },
  sidebar: {
    width: { default: null, '@media (min-width: 640px)': '14rem' },
    flexShrink: { default: null, '@media (min-width: 640px)': 0 },
  },
  themeBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBlockEnd: space.lg,
    paddingBlock: space.xs,
    paddingInline: space.sm,
    backgroundColor: color.slate,
    borderRadius: radius.pill,
  },
  brand: {
    display: 'block',
    textDecoration: 'none',
  },
  eyebrow: {
    margin: 0,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.black,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: color.textFaint,
  },
  title: {
    margin: 0,
    marginBlockStart: space.xxs,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: color.text,
  },
  nav: {
    marginBlockStart: space.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: space.xxs,
  },
  navLink: {
    color: color.text,
    textDecoration: 'none',
    borderRadius: radius.md,
    paddingInline: space.md,
    paddingBlock: space.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    backgroundColor: { default: 'transparent', ':hover': color.hoverWash },
    transitionProperty: 'background-color',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  main: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
  },
});

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
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.shell)}>
        <aside {...stylex.props(styles.sidebar)}>
          <div {...stylex.props(styles.themeBar)}>
            <ThemeToggle />
          </div>
          <Link href="/dev" {...stylex.props(styles.brand)}>
            <p {...stylex.props(styles.eyebrow)}>Dev only</p>
            <h1 {...stylex.props(styles.title)}>UI Playground</h1>
          </Link>
          <nav {...stylex.props(styles.nav)}>
            {SECTIONS.map((section) => (
              <Link
                key={section.slug}
                href={`/dev/${section.slug}`}
                {...stylex.props(styles.navLink)}
              >
                {section.title}
              </Link>
            ))}
          </nav>
        </aside>
        <main {...stylex.props(styles.main)}>{children}</main>
      </div>
    </div>
  );
}
