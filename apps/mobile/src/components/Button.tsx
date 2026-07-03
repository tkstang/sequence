import type { ReactNode } from 'react';
import { css, html } from 'react-strict-dom';

import { color } from '../theme/vars.css.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  onPress?: () => void;
}

export function Button({
  accessibilityLabel,
  children,
  disabled = false,
  onPress,
  size = 'md',
  testID,
  variant = 'primary',
}: ButtonProps) {
  const labelStyle =
    disabled || variant === 'secondary'
      ? styles.labelOnSurface
      : styles.labelOnFill;

  return (
    <html.button
      aria-disabled={disabled}
      aria-label={accessibilityLabel}
      data-testid={testID}
      disabled={disabled}
      onClick={disabled ? undefined : onPress}
      style={[
        styles.root,
        styles[variant],
        styles[size],
        disabled ? styles.disabled : null,
      ]}
      type="button"
    >
      <html.span style={[styles.label, labelStyle]}>{children}</html.span>
    </html.button>
  );
}

const styles = css.create({
  root: {
    alignItems: 'center',
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: color.accent,
    borderColor: color.accent,
  },
  secondary: {
    backgroundColor: color.surfaceRaised,
    borderColor: color.borderStrong,
  },
  destructive: {
    backgroundColor: color.danger,
    borderColor: color.danger,
  },
  sm: {
    minHeight: 36,
    paddingBlock: 8,
    paddingInline: 12,
  },
  md: {
    minHeight: 44,
    paddingBlock: 10,
    paddingInline: 16,
  },
  lg: {
    minHeight: 52,
    paddingBlock: 12,
    paddingInline: 20,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    textAlign: 'center',
  },
  labelOnFill: {
    color: color.accentText,
  },
  labelOnSurface: {
    color: color.text,
  },
});
