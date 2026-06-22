'use client';

import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import {
  color,
  fontSize,
  fontWeight,
  radius,
  shadow,
  space,
} from '@/styles/tokens.stylex.ts';

type DeviceId = 'fit' | 'mobile' | 'mobileL' | 'tablet' | 'desktop';

interface Device {
  id: DeviceId;
  label: string;
  glyph: string;
  /** Portrait dimensions in px; null = "Fit" (render inline, fluid). */
  width: number | null;
  height: number | null;
}

const DEVICES: Device[] = [
  { id: 'fit', label: 'Fit', glyph: '▢', width: null, height: null },
  { id: 'mobile', label: 'Mobile', glyph: '▯', width: 390, height: 844 },
  { id: 'mobileL', label: 'Mobile L', glyph: '▯', width: 430, height: 932 },
  { id: 'tablet', label: 'Tablet', glyph: '▭', width: 768, height: 1024 },
  { id: 'desktop', label: 'Desktop', glyph: '▭', width: 1280, height: 800 },
];

const FIT = DEVICES[0]!;

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
  // Full-width measuring container.
  stage: {
    width: '100%',
  },
  // Scaled device footprint, centered. Holds the (transform-scaled) iframe.
  scaled: {
    marginInline: 'auto',
    overflow: 'hidden',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.borderStrong,
    borderRadius: radius.lg,
    boxShadow: shadow.lg,
    backgroundColor: color.surface,
  },
  scaledSize: (w: number, h: number) => ({ width: `${w}px`, height: `${h}px` }),
  iframe: {
    display: 'block',
    borderWidth: 0,
    transformOrigin: 'top left',
  },
  iframeSize: (w: number, h: number, scale: number) => ({
    width: `${w}px`,
    height: `${h}px`,
    transform: `scale(${scale})`,
  }),
});

/**
 * Wraps a playground story with a device-viewport switcher. "Fit" renders the
 * story inline (fluid). Each device preset renders it inside an iframe at the
 * real device width — so CSS media queries respond to that width — then scales
 * the iframe down to fit the available panel (e.g. a 1280px desktop shown shrunk
 * to fit, rather than cramped by the sidebar). Rotate swaps the orientation.
 */
export function ViewportPreview({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [deviceId, setDeviceId] = useState<DeviceId>('fit');
  const [landscape, setLandscape] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(0);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setStageWidth(entries[0]?.contentRect.width ?? 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const device = DEVICES.find((d) => d.id === deviceId) ?? FIT;
  let width: number | null = null;
  let height: number | null = null;
  if (device.width != null && device.height != null) {
    width = landscape ? device.height : device.width;
    height = landscape ? device.width : device.height;
  }
  const scale =
    width != null && stageWidth > 0 ? Math.min(1, stageWidth / width) : 1;

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
          disabled={width == null}
          aria-pressed={landscape}
          {...stylex.props(
            styles.rotate,
            width == null && styles.rotateDisabled,
          )}
        >
          <span aria-hidden>⟳</span>
          {landscape ? 'Portrait' : 'Landscape'}
        </button>
        {width != null && height != null ? (
          <span {...stylex.props(styles.dims)}>
            {width} × {height}
            {scale < 1 ? ` · ${Math.round(scale * 100)}%` : ''}
          </span>
        ) : null}
      </div>

      <div ref={stageRef} {...stylex.props(styles.stage)}>
        {width != null && height != null ? (
          <div
            {...stylex.props(
              styles.scaled,
              styles.scaledSize(
                Math.round(width * scale),
                Math.round(height * scale),
              ),
            )}
          >
            {/* No sandbox: first-party, dev-only route that must stay same-origin
                (shared theme via localStorage) and run scripts (React). */}
            {/* eslint-disable-next-line react/iframe-missing-sandbox */}
            <iframe
              {...stylex.props(
                styles.iframe,
                styles.iframeSize(width, height, scale),
              )}
              src={`/dev-frame/${slug}`}
              title={`${slug} preview at ${width}×${height}`}
            />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
