'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useState } from 'react';

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

const RULE_VIOLATION_MESSAGES: Record<string, string> = {
  'not-your-turn': 'It is not your turn.',
  'card-not-in-hand': 'That card is no longer in your hand.',
  'space-occupied': 'That space is already occupied.',
  'wrong-card-for-space': 'That card cannot be played there.',
  'not-a-one-eyed-jack': 'A one-eyed jack is required.',
  'chip-locked': 'That chip is locked in a sequence.',
  'own-chip': 'You can only remove an opponent chip.',
  'empty-cell': 'There is no chip to remove.',
  'not-a-dead-card': 'That card is still playable.',
  'pending-choice-unresolved': 'Resolve the sequence choice first.',
  'no-pending-choice': 'There is no sequence choice to resolve.',
  'invalid-sequence-choice': 'Choose exactly five valid sequence cells.',
  'game-not-active': 'This game is not active.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function ruleViolationMessage(error: unknown): string {
  if (!isRecord(error)) return 'Move failed.';
  const data = isRecord(error.data) ? error.data : undefined;
  const violation = isRecord(data?.ruleViolation)
    ? data.ruleViolation
    : undefined;
  const code = typeof violation?.code === 'string' ? violation.code : undefined;
  if (code && RULE_VIOLATION_MESSAGES[code]) {
    return RULE_VIOLATION_MESSAGES[code];
  }
  if (data?.code === 'CONFLICT') return 'Game changed. Try again.';
  return typeof error.message === 'string' ? error.message : 'Move failed.';
}

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

const TONE_CLASS: Record<ToastTone, string> = {
  success: 'border-team-green bg-team-green text-white',
  error: 'border-team-red bg-team-red text-white',
  info: 'border-slate bg-slate text-white',
};

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  return (
    <div
      aria-live="polite"
      aria-relevant="additions text"
      className="pointer-events-none fixed top-4 right-4 z-50 flex w-[min(92vw,22rem)] flex-col gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-lg ${TONE_CLASS[toast.tone]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black">{toast.title}</p>
                {toast.detail ? (
                  <p className="mt-0.5 text-xs opacity-80">{toast.detail}</p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => onDismiss(toast.id)}
                className="text-sm font-black opacity-70"
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
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.16 }}
        className="bg-slate pointer-events-none fixed top-3 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-lg px-4 py-3 text-center text-white shadow-xl"
      >
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-xs text-white/70">
          Your game state will resume from the server stream.
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
