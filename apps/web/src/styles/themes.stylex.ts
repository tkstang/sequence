import * as stylex from '@stylexjs/stylex';

import { color } from './tokens.stylex.ts';

/**
 * Explicit theme overrides for the user-facing light/dark toggle.
 *
 * The base `color` tokens already flip on `prefers-color-scheme`, so "System"
 * mode applies neither theme. Selecting Light or Dark applies one of these,
 * pinning every variable to a single value so the choice wins regardless of the
 * OS setting. Values mirror the `default` / dark pairs in `tokens.stylex.ts`.
 */

export const lightTheme = stylex.createTheme(color, {
  scheme: 'light',
  bg: '#f6f3ee',
  surface: '#ffffff',
  surfaceRaised: '#ffffff',
  surfaceSunken: '#efe9df',
  slate: '#2d3142',
  slateSoft: '#3a3f54',
  felt: '#2e7d4f',
  feltDark: '#1f5c39',
  text: '#2d3142',
  textMuted: 'rgba(45,49,66,0.64)',
  textFaint: 'rgba(45,49,66,0.45)',
  textOnDark: '#ffffff',
  border: 'rgba(0,0,0,0.10)',
  borderStrong: 'rgba(0,0,0,0.25)',
  accent: '#2e9e5b',
  accentHover: '#1f5c39',
  accentText: '#ffffff',
  danger: '#c0453c',
  dangerHover: '#a63930',
  dangerText: '#ffffff',
  hoverWash: 'rgba(0,0,0,0.05)',
  teamBlue: '#3a6ea5',
  teamGreen: '#2e9e5b',
  teamRed: '#c0453c',
  frozenBg: '#fdebc8',
  frozenFg: '#9a6b00',
  savedBg: '#ddeafa',
  savedFg: '#2d5b96',
  neutralBadgeBg: 'rgba(0,0,0,0.08)',
  focusRing: '#2d3142',
  overlay: 'rgba(20,22,29,0.55)',
  highlight: '#2563eb',
});

export const darkTheme = stylex.createTheme(color, {
  scheme: 'dark',
  bg: '#14161d',
  surface: '#1e212b',
  surfaceRaised: '#272b38',
  surfaceSunken: '#0f1118',
  slate: '#0f1118',
  slateSoft: '#2a2f40',
  felt: '#27693f',
  feltDark: '#17472c',
  text: '#eceef3',
  textMuted: 'rgba(236,238,243,0.66)',
  textFaint: 'rgba(236,238,243,0.46)',
  textOnDark: '#f3f4f7',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.30)',
  accent: '#37b268',
  accentHover: '#2c9355',
  accentText: '#08160d',
  danger: '#d75a51',
  dangerHover: '#e0695f',
  dangerText: '#1a0c0a',
  hoverWash: 'rgba(255,255,255,0.08)',
  teamBlue: '#5b8fc4',
  teamGreen: '#3bb96e',
  teamRed: '#d75a51',
  frozenBg: '#3a2e12',
  frozenFg: '#f0c469',
  savedBg: '#142a44',
  savedFg: '#8fb6e6',
  neutralBadgeBg: 'rgba(255,255,255,0.12)',
  focusRing: '#8fb6e6',
  overlay: 'rgba(0,0,0,0.66)',
  highlight: '#3b82f6',
});
