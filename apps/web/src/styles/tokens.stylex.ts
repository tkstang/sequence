import * as stylex from '@stylexjs/stylex';

/**
 * Design tokens for Sequence Online.
 *
 * Framework-agnostic by intent: this file defines CSS variables via StyleX
 * `defineVars` and is the single source of truth for the visual language. It is
 * deliberately free of React/Next/DOM specifics so a future React Native app
 * (via React Strict DOM) can consume or mirror the same token shapes. See
 * `docs/styling.md`.
 *
 * Colors carry a `default` (light) and a `@media (prefers-color-scheme: dark)`
 * value, so system dark mode works with zero JS. An explicit user override
 * (light/dark toggle) is layered on top via `themes.stylex.ts`.
 */

const DARK = '@media (prefers-color-scheme: dark)';

export const color = stylex.defineVars({
  // Drives the native `color-scheme` property (form controls, scrollbars).
  scheme: { default: 'light', [DARK]: 'dark' },

  // Surfaces
  bg: { default: '#f6f3ee', [DARK]: '#14161d' },
  surface: { default: '#ffffff', [DARK]: '#1e212b' },
  surfaceRaised: { default: '#ffffff', [DARK]: '#272b38' },
  surfaceSunken: { default: '#efe9df', [DARK]: '#0f1118' },

  // Slate chrome (headers, dark bars)
  slate: { default: '#2d3142', [DARK]: '#0f1118' },
  slateSoft: { default: '#3a3f54', [DARK]: '#2a2f40' },

  // Felt board greens
  felt: { default: '#2e7d4f', [DARK]: '#27693f' },
  feltDark: { default: '#1f5c39', [DARK]: '#17472c' },

  // Text
  text: { default: '#2d3142', [DARK]: '#eceef3' },
  textMuted: {
    default: 'rgba(45,49,66,0.64)',
    [DARK]: 'rgba(236,238,243,0.66)',
  },
  textFaint: {
    default: 'rgba(45,49,66,0.45)',
    [DARK]: 'rgba(236,238,243,0.46)',
  },
  textOnDark: { default: '#ffffff', [DARK]: '#f3f4f7' },

  // Lines / borders
  border: { default: 'rgba(0,0,0,0.10)', [DARK]: 'rgba(255,255,255,0.12)' },
  borderStrong: {
    default: 'rgba(0,0,0,0.25)',
    [DARK]: 'rgba(255,255,255,0.30)',
  },

  // Primary action (felt green family)
  accent: { default: '#2e9e5b', [DARK]: '#37b268' },
  accentHover: { default: '#1f5c39', [DARK]: '#2c9355' },
  accentText: { default: '#ffffff', [DARK]: '#08160d' },

  // Danger
  danger: { default: '#c0453c', [DARK]: '#d75a51' },
  dangerHover: { default: '#a63930', [DARK]: '#e0695f' },
  dangerText: { default: '#ffffff', [DARK]: '#1a0c0a' },

  // Subtle interactive wash (ghost hovers, hover rows)
  hoverWash: { default: 'rgba(0,0,0,0.05)', [DARK]: 'rgba(255,255,255,0.08)' },

  // Team colors
  teamBlue: { default: '#3a6ea5', [DARK]: '#5b8fc4' },
  teamGreen: { default: '#2e9e5b', [DARK]: '#3bb96e' },
  teamRed: { default: '#c0453c', [DARK]: '#d75a51' },

  // Status badges
  frozenBg: { default: '#fdebc8', [DARK]: '#3a2e12' },
  frozenFg: { default: '#9a6b00', [DARK]: '#f0c469' },
  savedBg: { default: '#ddeafa', [DARK]: '#142a44' },
  savedFg: { default: '#2d5b96', [DARK]: '#8fb6e6' },
  neutralBadgeBg: {
    default: 'rgba(0,0,0,0.08)',
    [DARK]: 'rgba(255,255,255,0.12)',
  },

  // Focus + overlay
  focusRing: { default: '#2d3142', [DARK]: '#8fb6e6' },
  overlay: { default: 'rgba(20,22,29,0.55)', [DARK]: 'rgba(0,0,0,0.66)' },

  // Board selection / winning highlight — blue for legibility on the white card
  // faces and green felt (replaces the previous low-contrast yellow).
  highlight: { default: '#2563eb', [DARK]: '#3b82f6' },
});

export const space = stylex.defineVars({
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
});

export const radius = stylex.defineVars({
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  pill: '999px',
  round: '50%',
});

export const shadow = stylex.defineVars({
  sm: {
    default: '0 1px 2px rgba(0,0,0,0.06)',
    [DARK]: '0 1px 2px rgba(0,0,0,0.45)',
  },
  md: {
    default: '0 4px 12px rgba(0,0,0,0.10)',
    [DARK]: '0 4px 14px rgba(0,0,0,0.50)',
  },
  lg: {
    default: '0 12px 32px rgba(0,0,0,0.16)',
    [DARK]: '0 14px 36px rgba(0,0,0,0.60)',
  },
});

export const fontFamily = stylex.defineVars({
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
});

export const fontSize = stylex.defineVars({
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.5rem',
  xxl: '2rem',
});

export const fontWeight = stylex.defineVars({
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '800',
});

export const lineHeight = stylex.defineVars({
  tight: '1.15',
  snug: '1.3',
  normal: '1.5',
});

export const zIndex = stylex.defineVars({
  base: '0',
  raised: '10',
  sticky: '100',
  overlay: '1000',
  toast: '2000',
});
