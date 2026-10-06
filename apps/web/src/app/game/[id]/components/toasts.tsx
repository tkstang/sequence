'use client';

import * as stylex from '@stylexjs/stylex';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useState } from 'react';

import {
  color,
  fontSize,
  fontWeight,
  radius,
  shadow,
  space,
  zIndex,
} from '@/styles/tokens.stylex.ts';

export type ToastTone = 'success' | 'error' | 'info';
export type ConnectionBannerState =
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'error';

export interface ToastMessage {
  id: string;
  tone: ToastTone;
  title: string;
  detail?: string;
}

export type ToastInput = Omit<ToastMessage, 'id'> & { id?: string };

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const pushToast = useCallback((toast: ToastInput) => {
    const id =
      toast.id ??
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`);
    setToasts((current) => [...current.slice(-2), { ...toast, id }]);
    return id;
  }, []);
  return { toasts, pushToast, dismissToast };
}

export interface ToastViewportProps {
  toasts: readonly ToastMessage[];
  onDismiss: (id: string) => void;
}

const styles = stylex.create({
  viewport: {
    pointerEvents: 'none',
    position: 'fixed',
    insetBlockStart: space.lg,
    insetInlineEnd: space.lg,
    zIndex: zIndex.toast,
    display: 'flex',
    width: 'min(92vw, 22rem)',
    flexDirection: 'column',
    gap: space.sm,
  },
  toast: {
    pointerEvents: 'auto',
    borderRadius: radius.lg,
    borderWidth: '1px',
    borderStyle: 'solid',
    paddingInline: space.lg,
    paddingBlock: space.md,
    boxShadow: shadow.lg,
    color: color.textOnDark,
  },
  toastSuccess: {
    borderColor: color.teamGreen,
    backgroundColor: color.teamGreen,
  },
  toastError: {
    borderColor: color.teamRed,
    backgroundColor: color.teamRed,
  },
  toastInfo: {
    borderColor: color.slate,
    backgroundColor: color.slate,
  },
  toastRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
  },
  toastTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
  },
  toastDetail: {
    marginBlockStart: space.xxs,
    fontSize: fontSize.xs,
    opacity: 0.8,
  },
  dismiss: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    color: 'inherit',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    opacity: { default: 0.7, ':hover': 1 },
    cursor: 'pointer',
    transitionProperty: 'opacity',
    transitionDuration: '140ms',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.textOnDark,
    outlineOffset: '2px',
  },
  banner: {
    pointerEvents: 'none',
    position: 'fixed',
    insetBlockStart: space.md,
    insetInlineStart: '50%',
    zIndex: zIndex.toast,
    width: 'min(92vw, 28rem)',
    borderRadius: radius.lg,
    paddingInline: space.lg,
    paddingBlock: space.md,
    textAlign: 'center',
    backgroundColor: color.slate,
    color: color.textOnDark,
    boxShadow: shadow.lg,
  },
  bannerTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  bannerDetail: {
    marginBlockStart: space.xxs,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
  },
});

const TONE_STYLE: Record<ToastTone, ReturnType<typeof stylex.props>> = {
  success: stylex.props(styles.toast, styles.toastSuccess),
  error: stylex.props(styles.toast, styles.toastError),
  info: stylex.props(styles.toast, styles.toastInfo),
};

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div
      aria-live="polite"
      aria-relevant="additions text"
      {...stylex.props(styles.viewport)}
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className={TONE_STYLE[toast.tone].className}
            style={TONE_STYLE[toast.tone].style}
          >
            <div {...stylex.props(styles.toastRow)}>
              <div>
                <p {...stylex.props(styles.toastTitle)}>{toast.title}</p>
                {toast.detail ? (
                  <p {...stylex.props(styles.toastDetail)}>{toast.detail}</p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => onDismiss(toast.id)}
                {...stylex.props(styles.dismiss)}
              >
                x
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ConnectionBanner({ state }: { state: ConnectionBannerState }) {
  if (state === 'live') return null;
  const title =
    state === 'error' ? 'Connection interrupted' : 'Reconnecting...';
  const banner = stylex.props(styles.banner);
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, x: '-50%' }}
        animate={{ opacity: 1, y: 0, x: '-50%' }}
        exit={{ opacity: 0, y: -10, x: '-50%' }}
        transition={{ duration: 0.16 }}
        className={banner.className}
        style={banner.style}
      >
        <p {...stylex.props(styles.bannerTitle)}>{title}</p>
        <p {...stylex.props(styles.bannerDetail)}>
          Your game state will resume from the server stream.
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
