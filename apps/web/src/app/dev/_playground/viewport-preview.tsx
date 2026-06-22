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

type DeviceId = 'mobile' | 'mobileL' | 'tablet' | 'desktop';

interface Device {
  id: DeviceId;
  label: string;
  glyph: string;
  /** Portrait dimensions in px; null on desktop renders the story inline. */
  width: number | null;
  height: number | null;
}

const DESKTOP: Device = {
  id: 'desktop',
  label: 'Desktop',
  glyph: '▢',
  width: null,
  height: null,
};

const DEVICES: Device[] = [
  { id: 'mobile', label: 'Mobile', glyph: '▯', width: 390, height: 844 },
  { id: 'mobileL', label: 'Mobile L', glyph: '▯', width: 430, height: 932 },
  { id: 'tablet', label: 'Tablet', glyph: '▭', width: 768, height: 1024 },
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
  rotate: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: space.xs,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.border,
    borderRadius: radius.pill,
    paddingBlock: space.xs,
    paddingInline: space.md,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: 1,
    color: color.textMuted,
    backgroundColor: { default: color.surface, ':hover': color.hoverWash },
    cursor: 'pointer',
    transitionProperty: 'background-color, color, border-color',
    transitionDuration: '120ms',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '1px',
  },
  rotateDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  dims: {
    fontSize: fontSize.xs,
    color: color.textFaint,
    fontVariantNumeric: 'tabular-nums',
  },
  stageArea: {
    display: 'flex',
    // Keep the true device width (so media queries are accurate); scroll
    // horizontally when it exceeds the panel. `safe center` avoids clipping the
    // left edge when the frame is wider than the container.
    justifyContent: 'safe center',
    overflowX: 'auto',
  },
  frame: {
    flexShrink: 0,
    maxHeight: 'calc(100vh - 11rem)',
    minHeight: '360px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.borderStrong,
    borderRadius: radius.lg,
    overflow: 'hidden',
    boxShadow: shadow.lg,
    backgroundColor: color.surface,
  },
  frameDims: (w: number, h: number) => ({ width: `${w}px`, height: `${h}px` }),
  iframe: {
    display: 'block',
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
});

/**
 * Wraps a playground story with a device-viewport switcher. "Desktop" renders
 * the story inline at full width; the device presets render it inside an iframe
 * sized to the device width, so real CSS media queries respond to that width (a
 * plain max-width container would not trigger them). Rotate swaps the
 * orientation.
 */
export function ViewportPreview({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [deviceId, setDeviceId] = useState<DeviceId>('desktop');
  const [landscape, setLandscape] = useState(false);
  const device = DEVICES.find((d) => d.id === deviceId) ?? DESKTOP;

  let width: number | null = null;
  let height: number | null = null;
  if (device.width != null && device.height != null) {
    width = landscape ? device.height : device.width;
    height = landscape ? device.width : device.height;
  }
  const isDevice = width != null && height != null;

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
        <button
          type="button"
          onClick={() => setLandscape((v) => !v)}
          disabled={!isDevice}
          aria-pressed={landscape}
          {...stylex.props(styles.rotate, !isDevice && styles.rotateDisabled)}
        >
          <span aria-hidden>⟳</span>
          {landscape ? 'Portrait' : 'Landscape'}
        </button>
        {isDevice ? (
          <span {...stylex.props(styles.dims)}>
            {width} × {height}
          </span>
        ) : null}
      </div>

      {width != null && height != null ? (
        <div {...stylex.props(styles.stageArea)}>
          <div {...stylex.props(styles.frame, styles.frameDims(width, height))}>
            {/* No sandbox: this is a first-party, dev-only route that must stay
                same-origin (shared theme via localStorage) and run scripts
                (React) — the two attributes a sandbox would strip. */}
            {/* eslint-disable-next-line react/iframe-missing-sandbox */}
            <iframe
              {...stylex.props(styles.iframe)}
              src={`/dev-frame/${slug}`}
              title={`${slug} preview at ${width}×${height}`}
            />
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
