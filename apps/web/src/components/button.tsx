import * as stylex from '@stylexjs/stylex';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import {
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.lg,
    borderWidth: 0,
    borderStyle: 'solid',
    fontFamily: 'inherit',
    fontWeight: fontWeight.semibold,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, color, filter',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  disabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  primary: {
    backgroundColor: { default: color.accent, ':hover': color.accentHover },
    color: color.accentText,
  },
  secondary: {
    backgroundColor: { default: color.surface, ':hover': color.surfaceSunken },
    color: color.text,
    borderWidth: '1.5px',
    borderColor: color.borderStrong,
  },
  ghost: {
    backgroundColor: { default: 'transparent', ':hover': color.hoverWash },
    color: color.text,
  },
  danger: {
    backgroundColor: { default: color.danger, ':hover': color.dangerHover },
    color: color.dangerText,
  },
  md: {
    paddingBlock: space.sm,
    paddingInline: space.lg,
    fontSize: fontSize.sm,
  },
  lg: {
    paddingBlock: space.md,
    paddingInline: space.xl,
    fontSize: fontSize.md,
  },
});

interface ButtonStyleArgs {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
}

/**
 * StyleX props (`{ className, style }`) for the shared button look. Spread onto
 * any element — useful for styling `<Link>`/`<a>` as a button.
 */
export function buttonProps({
  variant = 'primary',
  size = 'md',
  disabled = false,
}: ButtonStyleArgs = {}) {
  return stylex.props(
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
  );
}

/**
 * Back-compat class-string helper (used to style `<Link>` as a button). Prefer
 * spreading {@link buttonProps} on new code.
 */
export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className = '',
}: ButtonStyleArgs & { className?: string } = {}) {
  return `${buttonProps({ variant, size }).className ?? ''} ${className}`.trim();
}

/** Shared button primitive across the shell (CTAs, form submits). */
export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const props = buttonProps({ variant, size, disabled: Boolean(disabled) });
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      className={`${props.className ?? ''} ${className}`.trim()}
      style={props.style}
    >
      {children}
    </button>
  );
}
