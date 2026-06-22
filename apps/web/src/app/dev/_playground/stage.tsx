'use client';

import * as stylex from '@stylexjs/stylex';
import type { ReactNode } from 'react';

import {
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

type StageBackground = 'cream' | 'slate' | 'felt' | 'white';

const styles = stylex.create({
  figure: {
    margin: 0,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.border,
    backgroundColor: color.surface,
  },
  caption: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.xxs,
    borderBlockEndWidth: '1px',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: color.border,
    paddingInline: space.lg,
    paddingBlock: space.sm,
  },
  captionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: color.text,
  },
  captionDescription: {
    fontSize: fontSize.xs,
    color: color.textMuted,
  },
  surface: {
    display: 'flex',
    justifyContent: 'center',
    padding: space.lg,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.xxl,
  },
});

/** Preview surfaces, keyed by name, matching where the component lives in prod. */
const backgrounds = stylex.create({
  cream: { backgroundColor: color.bg },
  slate: { backgroundColor: color.slate },
  felt: { backgroundColor: color.felt },
  white: { backgroundColor: color.surface },
});

export interface StageProps {
  title: string;
  description?: string;
  /** Surface behind the preview, matching where the component lives in prod. */
  background?: StageBackground;
  children: ReactNode;
}

/**
 * Frames a single preview variant: a caption plus a production-faithful
 * surface (same StyleX tokens as the live app) so the rendered component is
 * pixel-identical to what ships.
 */
export function Stage({
  title,
  description,
  background = 'cream',
  children,
}: StageProps) {
  return (
    <figure {...stylex.props(styles.figure)}>
      <figcaption {...stylex.props(styles.caption)}>
        <span {...stylex.props(styles.captionTitle)}>{title}</span>
        {description ? (
          <span {...stylex.props(styles.captionDescription)}>
            {description}
          </span>
        ) : null}
      </figcaption>
      <div {...stylex.props(styles.surface, backgrounds[background])}>
        {children}
      </div>
    </figure>
  );
}

/** Vertical stack of stages for a section page. */
export function StageGrid({ children }: { children: ReactNode }) {
  return <div {...stylex.props(styles.grid)}>{children}</div>;
}
