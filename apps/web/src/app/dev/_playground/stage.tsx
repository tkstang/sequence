'use client';

import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

import {
  color,
  fontSize,
  fontWeight,
  radius,
  space,
  zIndex,
} from '@/styles/tokens.stylex.ts';

type StageBackground = 'cream' | 'slate' | 'felt' | 'white';

// In the Expand overlay, raise the board's width cap and shrink its vertical
// reserve so it grows to fill the available space (see GameBoard's caps).
const EXPANDED_VARS = {
  '--board-max-width': '1400px',
  '--board-reserve': '7rem',
} as CSSProperties;

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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
    borderBlockEndWidth: '1px',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: color.border,
    paddingInline: space.lg,
    paddingBlock: space.sm,
  },
  captionText: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.xxs,
    minWidth: 0,
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
  pill: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.xs,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.border,
    borderRadius: radius.pill,
    paddingBlock: space.xs,
    paddingInline: space.sm,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: 1,
    cursor: 'pointer',
    color: color.textMuted,
    backgroundColor: { default: color.surface, ':hover': color.hoverWash },
    transitionProperty: 'background-color, color, border-color',
    transitionDuration: '120ms',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '1px',
  },
  surface: {
    display: 'flex',
    justifyContent: 'center',
    padding: space.lg,
  },
  placeholder: {
    fontSize: fontSize.xs,
    color: color.textFaint,
  },
  overlay: {
    position: 'fixed',
    insetBlock: 0,
    insetInline: 0,
    zIndex: zIndex.overlay,
    display: 'flex',
    flexDirection: 'column',
    padding: space.lg,
    gap: space.md,
  },
  overlayBar: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  overlayTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: color.text,
  },
  overlayContent: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
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
 * Frames a single preview variant: a caption plus a production-faithful surface
 * (same StyleX tokens as the live app). "Expand" maximizes just this variant
 * into an in-app overlay that covers the layout (not OS fullscreen), where the
 * component is allowed to grow to fill the space.
 */
export function Stage({
  title,
  description,
  background = 'cream',
  children,
}: StageProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  return (
    <figure {...stylex.props(styles.figure)}>
      <figcaption {...stylex.props(styles.caption)}>
        <span {...stylex.props(styles.captionText)}>
          <span {...stylex.props(styles.captionTitle)}>{title}</span>
          {description ? (
            <span {...stylex.props(styles.captionDescription)}>
              {description}
            </span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label={`Expand ${title}`}
          {...stylex.props(styles.pill)}
        >
          <span aria-hidden>⛶</span> Expand
        </button>
      </figcaption>
      <div {...stylex.props(styles.surface, backgrounds[background])}>
        {expanded ? (
          <span {...stylex.props(styles.placeholder)}>
            Expanded — press Esc or Close to return
          </span>
        ) : (
          children
        )}
      </div>
      {expanded ? (
        <div {...stylex.props(styles.overlay, backgrounds[background])}>
          <div {...stylex.props(styles.overlayBar)}>
            <span {...stylex.props(styles.overlayTitle)}>{title}</span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Close expanded preview"
              {...stylex.props(styles.pill)}
            >
              <span aria-hidden>✕</span> Close
            </button>
          </div>
          <div {...stylex.props(styles.overlayContent)} style={EXPANDED_VARS}>
            {children}
          </div>
        </div>
      ) : null}
    </figure>
  );
}

/** Vertical stack of stages for a section page. */
export function StageGrid({ children }: { children: ReactNode }) {
  return <div {...stylex.props(styles.grid)}>{children}</div>;
}
