export const space = {
  none: '0',
  xxs: '2px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',
  huge: '48px',
} as const;

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  pill: '999px',
  round: '50%',
} as const;

export const shadow = {
  light: {
    sm: '0 1px 2px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.10)',
    lg: '0 12px 32px rgba(0,0,0,0.16)',
  },
  dark: {
    sm: '0 1px 2px rgba(0,0,0,0.45)',
    md: '0 4px 14px rgba(0,0,0,0.50)',
    lg: '0 14px 36px rgba(0,0,0,0.60)',
  },
} as const;

export const fontFamily = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
} as const;

export const fontSize = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.5rem',
  xxl: '2rem',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '800',
} as const;

export const lineHeight = {
  tight: '1.15',
  snug: '1.3',
  normal: '1.5',
} as const;

export const zIndex = {
  base: '0',
  raised: '10',
  sticky: '100',
  overlay: '1000',
  toast: '2000',
} as const;
