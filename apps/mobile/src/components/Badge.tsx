import type { ReactNode } from 'react';
import { css, html } from 'react-strict-dom';

import { color } from '../theme/vars.css.ts';

export type BadgeVariant =
  | 'neutral'
  | 'accent'
  | 'saved'
  | 'frozen'
  | 'teamBlue'
  | 'teamGreen'
  | 'teamRed';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  testID?: string;
}

export function Badge({
  children,
  size = 'md',
  testID,
  variant = 'neutral',
}: BadgeProps) {
  const textStyle =
    variant === 'saved'
      ? styles.savedText
      : variant === 'frozen'
        ? styles.frozenText
        : variant === 'neutral'
          ? styles.neutralText
          : styles.fillText;

  return (
    <html.div
      data-testid={testID}
      style={[styles.root, styles[variant], styles[size]]}
    >
      <html.span style={[styles.label, styles[`${size}Label`], textStyle]}>
        {children}
      </html.span>
    </html.div>
  );
}

const styles = css.create({
  root: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    display: 'flex',
    justifyContent: 'center',
  },
  neutral: {
    backgroundColor: color.neutralBadgeBg,
  },
  accent: {
    backgroundColor: color.accent,
  },
  saved: {
    backgroundColor: color.savedBg,
  },
  frozen: {
    backgroundColor: color.frozenBg,
  },
  teamBlue: {
    backgroundColor: color.teamBlue,
  },
  teamGreen: {
    backgroundColor: color.teamGreen,
  },
  teamRed: {
    backgroundColor: color.teamRed,
  },
  sm: {
    minHeight: 24,
    paddingBlock: 4,
    paddingInline: 8,
  },
  md: {
    minHeight: 28,
    paddingBlock: 5,
    paddingInline: 10,
  },
  lg: {
    minHeight: 32,
    paddingBlock: 6,
    paddingInline: 12,
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
  smLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  mdLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  lgLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  neutralText: {
    color: color.text,
  },
  fillText: {
    color: color.accentText,
  },
  savedText: {
    color: color.savedFg,
  },
  frozenText: {
    color: color.frozenFg,
  },
});
