import * as stylex from '@stylexjs/stylex';
import type { ReactNode } from 'react';

import {
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

type BadgeTone = 'frozen' | 'saved' | 'neutral' | 'win' | 'loss';

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const styles = stylex.create({
  base: {
    display: 'inline-block',
    borderRadius: radius.md,
    paddingInline: space.sm,
    paddingBlock: space.xxs,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  frozen: {
    backgroundColor: color.frozenBg,
    color: color.frozenFg,
  },
  saved: {
    backgroundColor: color.savedBg,
    color: color.savedFg,
  },
  neutral: {
    backgroundColor: color.neutralBadgeBg,
    color: color.slate,
  },
  win: {
    backgroundColor: color.teamGreen,
    color: color.textOnDark,
  },
  loss: {
    backgroundColor: color.teamRed,
    color: color.textOnDark,
  },
});

/** Small status pill (dashboard FROZEN/SAVED, history W/L, etc.). */
export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: BadgeProps) {
  const props = stylex.props(styles.base, styles[tone]);
  return (
    <span
      className={`${props.className ?? ''} ${className}`.trim()}
      style={props.style}
    >
      {children}
    </span>
  );
}
