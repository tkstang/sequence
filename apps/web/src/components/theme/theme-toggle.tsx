'use client';

import * as stylex from '@stylexjs/stylex';

import {
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

import { useTheme } from './theme-provider.tsx';
import type { ThemeMode } from './theme-provider.tsx';

const OPTIONS: { value: ThemeMode; label: string; glyph: string }[] = [
  { value: 'light', label: 'Light theme', glyph: '☀' },
  { value: 'system', label: 'System theme', glyph: '◐' },
  { value: 'dark', label: 'Dark theme', glyph: '☾' },
];

const styles = stylex.create({
  group: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.xxs,
    margin: 0,
    padding: space.xxs,
    borderWidth: 0,
    borderRadius: radius.pill,
    minInlineSize: 0,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderWidth: 0,
    borderRadius: radius.pill,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: 1,
    cursor: 'pointer',
    color: 'rgba(255,255,255,0.72)',
    backgroundColor: {
      default: 'transparent',
      ':hover': 'rgba(255,255,255,0.14)',
    },
    transitionProperty: 'background-color, color',
    transitionDuration: '120ms',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: '#ffffff',
    outlineOffset: '1px',
  },
  active: {
    backgroundColor: '#ffffff',
    color: color.slate,
  },
});

/** Segmented light / system / dark control for the app header (slate chrome). */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  return (
    <fieldset {...stylex.props(styles.group)} aria-label="Color theme">
      {OPTIONS.map((option) => {
        const active = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            aria-label={option.label}
            aria-pressed={active}
            title={option.label}
            {...stylex.props(styles.button, active && styles.active)}
          >
            <span aria-hidden>{option.glyph}</span>
          </button>
        );
      })}
    </fieldset>
  );
}
