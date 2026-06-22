'use client';

import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

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
  /** Width in px (and the alt width via `height` when rotated); null = Fit. */
  width: number | null;
  height: number | null;
}

const DEVICES: Device[] = [
  { id: 'fit', label: 'Fit', glyph: '▢', width: null, height: null },
  { id: 'mobile', label: 'Mobile', glyph: '▯', width: 390, height: 844 },
  { id: 'mobileL', label: 'Mobile L', glyph: '▯', width: 430, height: 932 },
  { id: 'tablet', label: 'Tablet', glyph: '▭', width: 768, height: 1024 },
  { id: 'desktop', label: 'Desktop', glyph: '▭', width: 1280, height: 900 },
];

const FIT = DEVICES[0]!;

const styles = stylex.create({
  wrap: { display: 'flex', flexDirection: 'column', gap: space.lg },
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
  control: {
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
    cursor: 'pointer',
    color: color.textMuted,
    backgroundColor: { default: color.surface, ':hover': color.hoverWash },
    transitionProperty: 'background-color, color, border-color',
    transitionDuration: '120ms',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '1px',
  },
  controlDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  dims: {
    fontSize: fontSize.xs,
    color: color.textFaint,
    fontVariantNumeric: 'tabular-nums',
  },
  stage: {
    width: '100%',
  },
  stageFullscreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: color.bg,
  },
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
  iframe: {
    display: 'block',
    borderWidth: 0,
    transformOrigin: 'top left',
  },
});

/**
 * Wraps a playground story with a device-viewport switcher. "Fit" renders the
 * story inline. Device presets render it inside an iframe at the real device
 * width — so media queries respond to that width — auto-grown to the content
 * height (no clipping) and scaled to fit the panel. "Rotate" swaps to the
 * device's alternate width; "Fullscreen" shows it at the true screen viewport.
 */
export function ViewportPreview({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [deviceId, setDeviceId] = useState<DeviceId>('fit');
  const [swapped, setSwapped] = useState(false);
  const [stageWidth, setStageWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const contentObserver = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setStageWidth(entries[0]?.contentRect.width ?? 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      contentObserver.current?.disconnect();
    };
  }, []);

  const handleIframeLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const measure = () => setContentHeight(doc.documentElement.scrollHeight);
    measure();
    contentObserver.current?.disconnect();
    const observer = new ResizeObserver(measure);
    observer.observe(doc.documentElement);
    contentObserver.current = observer;
  };

  const device = DEVICES.find((d) => d.id === deviceId) ?? FIT;
  // A mutable `let` (not a foldable const) so the StyleX compiler doesn't try to
  // statically evaluate `width == null` in the stylex.props condition below.
  let width: number | null = null;
  if (device.width != null && device.height != null) {
    width = swapped ? device.height : device.width;
  }
  const scale =
    width != null && stageWidth > 0 ? Math.min(1, stageWidth / width) : 1;
  const height = contentHeight ?? (width != null ? Math.round(width * 1.3) : 0);

  const scaledStyle: CSSProperties = isFullscreen
    ? { width: '100%', height: '100%', border: 'none', borderRadius: 0 }
    : {
        width: `${Math.round((width ?? 0) * scale)}px`,
        height: `${Math.round(height * scale)}px`,
      };
  const iframeStyle: CSSProperties = isFullscreen
    ? { width: '100%', height: '100%', transform: 'none' }
    : {
        width: `${width ?? 0}px`,
        height: `${height}px`,
        transform: `scale(${scale})`,
      };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void stageRef.current?.requestFullscreen?.();
    }
  };

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
          onClick={() => setSwapped((v) => !v)}
          disabled={width == null}
          {...stylex.props(
            styles.control,
            width == null && styles.controlDisabled,
          )}
        >
          <span aria-hidden>⟳</span> Rotate
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          {...stylex.props(styles.control)}
        >
          <span aria-hidden>⛶</span>
          {isFullscreen ? 'Exit' : 'Fullscreen'}
        </button>
        {width != null ? (
          <span {...stylex.props(styles.dims)}>
            {width}px wide{scale < 1 ? ` · ${Math.round(scale * 100)}%` : ''}
          </span>
        ) : null}
      </div>

      <div
        ref={stageRef}
        {...stylex.props(styles.stage, isFullscreen && styles.stageFullscreen)}
      >
        {width != null ? (
          <div {...stylex.props(styles.scaled)} style={scaledStyle}>
            {/* No sandbox: first-party, dev-only route that must stay same-origin
                (shared theme via localStorage) and run scripts (React). */}
            {/* eslint-disable-next-line react/iframe-missing-sandbox */}
            <iframe
              ref={iframeRef}
              onLoad={handleIframeLoad}
              {...stylex.props(styles.iframe)}
              style={iframeStyle}
              src={`/dev-frame/${slug}`}
              title={`${slug} preview at ${width}px wide`}
            />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
