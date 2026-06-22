'use client';

import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';
import type { ReactNode } from 'react';

import {
  color,
  fontSize,
  fontWeight,
  radius,
  shadow,
  space,
} from '@/styles/tokens.stylex.ts';

type DeviceId = 'mobile' | 'tablet' | 'desktop';

interface Device {
  id: DeviceId;
  label: string;
  glyph: string;
  /** Viewport width in px; null renders the story inline at full width. */
  width: number | null;
}

const DESKTOP: Device = {
  id: 'desktop',
  label: 'Desktop',
  glyph: '▢',
  width: null,
};

const DEVICES: Device[] = [
  { id: 'mobile', label: 'Mobile', glyph: '▯', width: 390 },
  { id: 'tablet', label: 'Tablet', glyph: '▭', width: 768 },
  DESKTOP,
];

const styles = stylex.create({
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.lg,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: space.sm,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: color.textFaint,
  },
  segment: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.xxs,
    margin: 0,
    padding: space.xxs,
    borderWidth: 0,
    borderRadius: radius.pill,
    minInlineSize: 0,
    backgroundColor: color.surfaceSunken,
  },
  segButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.xs,
    borderWidth: 0,
    borderRadius: radius.pill,
    paddingBlock: space.xs,
    paddingInline: space.md,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: 1,
    cursor: 'pointer',
    color: color.textMuted,
    backgroundColor: { default: 'transparent', ':hover': color.hoverWash },
    transitionProperty: 'background-color, color',
    transitionDuration: '120ms',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '1px',
  },
  segButtonActive: {
    backgroundColor: color.surface,
    color: color.text,
    boxShadow: shadow.sm,
  },
  dims: {
    fontSize: fontSize.xs,
    color: color.textFaint,
    fontVariantNumeric: 'tabular-nums',
  },
  stageArea: {
    display: 'flex',
    justifyContent: 'center',
  },
  frame: {
    height: 'calc(100vh - 12rem)',
    minHeight: '420px',
    maxWidth: '100%',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.borderStrong,
    borderRadius: radius.lg,
    overflow: 'hidden',
    boxShadow: shadow.lg,
    backgroundColor: color.surface,
  },
  frameWidth: (w: number) => ({ width: `${w}px` }),
  iframe: {
    display: 'block',
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
});

/**
 * Wraps a playground story with a device-viewport switcher. "Desktop" renders
 * the story inline at full width; "Mobile"/"Tablet" render it inside an iframe
 * sized to the device width, so real CSS media queries respond to that width
 * (a plain max-width container would not trigger them).
 */
export function ViewportPreview({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [deviceId, setDeviceId] = useState<DeviceId>('desktop');
  const device = DEVICES.find((d) => d.id === deviceId) ?? DESKTOP;

  return (
    <div {...stylex.props(styles.wrap)}>
      <div {...stylex.props(styles.toolbar)}>
        <span {...stylex.props(styles.label)}>Viewport</span>
        <fieldset
          {...stylex.props(styles.segment)}
          aria-label="Preview viewport size"
        >
          {DEVICES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDeviceId(d.id)}
              aria-pressed={d.id === deviceId}
              {...stylex.props(
                styles.segButton,
                d.id === deviceId && styles.segButtonActive,
              )}
            >
              <span aria-hidden>{d.glyph}</span>
              {d.label}
            </button>
          ))}
        </fieldset>
        {device.width ? (
          <span {...stylex.props(styles.dims)}>{device.width}px wide</span>
        ) : null}
      </div>

      {device.width == null ? (
        children
      ) : (
        <div {...stylex.props(styles.stageArea)}>
          <div {...stylex.props(styles.frame, styles.frameWidth(device.width))}>
            {/* No sandbox: this is a first-party, dev-only route that must stay
                same-origin (shared theme via localStorage) and run scripts
                (React) — the two attributes a sandbox would strip. */}
            {/* eslint-disable-next-line react/iframe-missing-sandbox */}
            <iframe
              {...stylex.props(styles.iframe)}
              src={`/dev-frame/${slug}`}
              title={`${slug} preview at ${device.width}px wide`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
