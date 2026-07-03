import { palette } from '@sequence/design-tokens';
import { css } from 'react-strict-dom';

const DARK = '@media (prefers-color-scheme: dark)';

export const color = css.defineVars({
  scheme: { default: palette.light.scheme, [DARK]: palette.dark.scheme },
  bg: { default: palette.light.bg, [DARK]: palette.dark.bg },
  surface: { default: palette.light.surface, [DARK]: palette.dark.surface },
  surfaceRaised: {
    default: palette.light.surfaceRaised,
    [DARK]: palette.dark.surfaceRaised,
  },
  surfaceSunken: {
    default: palette.light.surfaceSunken,
    [DARK]: palette.dark.surfaceSunken,
  },
  slate: { default: palette.light.slate, [DARK]: palette.dark.slate },
  slateSoft: {
    default: palette.light.slateSoft,
    [DARK]: palette.dark.slateSoft,
  },
  felt: { default: palette.light.felt, [DARK]: palette.dark.felt },
  feltDark: { default: palette.light.feltDark, [DARK]: palette.dark.feltDark },
  text: { default: palette.light.text, [DARK]: palette.dark.text },
  textMuted: {
    default: palette.light.textMuted,
    [DARK]: palette.dark.textMuted,
  },
  textFaint: {
    default: palette.light.textFaint,
    [DARK]: palette.dark.textFaint,
  },
  textOnDark: {
    default: palette.light.textOnDark,
    [DARK]: palette.dark.textOnDark,
  },
  border: { default: palette.light.border, [DARK]: palette.dark.border },
  borderStrong: {
    default: palette.light.borderStrong,
    [DARK]: palette.dark.borderStrong,
  },
  accent: { default: palette.light.accent, [DARK]: palette.dark.accent },
  accentHover: {
    default: palette.light.accentHover,
    [DARK]: palette.dark.accentHover,
  },
  accentText: {
    default: palette.light.accentText,
    [DARK]: palette.dark.accentText,
  },
  danger: { default: palette.light.danger, [DARK]: palette.dark.danger },
  dangerHover: {
    default: palette.light.dangerHover,
    [DARK]: palette.dark.dangerHover,
  },
  dangerText: {
    default: palette.light.dangerText,
    [DARK]: palette.dark.dangerText,
  },
  hoverWash: {
    default: palette.light.hoverWash,
    [DARK]: palette.dark.hoverWash,
  },
  teamBlue: { default: palette.light.teamBlue, [DARK]: palette.dark.teamBlue },
  teamGreen: {
    default: palette.light.teamGreen,
    [DARK]: palette.dark.teamGreen,
  },
  teamRed: { default: palette.light.teamRed, [DARK]: palette.dark.teamRed },
  frozenBg: { default: palette.light.frozenBg, [DARK]: palette.dark.frozenBg },
  frozenFg: { default: palette.light.frozenFg, [DARK]: palette.dark.frozenFg },
  savedBg: { default: palette.light.savedBg, [DARK]: palette.dark.savedBg },
  savedFg: { default: palette.light.savedFg, [DARK]: palette.dark.savedFg },
  neutralBadgeBg: {
    default: palette.light.neutralBadgeBg,
    [DARK]: palette.dark.neutralBadgeBg,
  },
  focusRing: {
    default: palette.light.focusRing,
    [DARK]: palette.dark.focusRing,
  },
  overlay: { default: palette.light.overlay, [DARK]: palette.dark.overlay },
  highlight: {
    default: palette.light.highlight,
    [DARK]: palette.dark.highlight,
  },
});
