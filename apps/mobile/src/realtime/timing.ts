export const WS_KEEP_ALIVE = {
  enabled: true,
  intervalMs: 5_000,
  pongTimeoutMs: 2_000,
} as const;

export const WS_RETRY_DELAY = {
  initialMs: 250,
  maxMs: 5_000,
} as const;

export const WS_LAZY = {
  enabled: true,
  closeMs: 30_000,
} as const;

export const STREAM_INACTIVITY_WATCHDOG_MS = 15_000;

export function websocketRetryDelayMs(attemptIndex: number): number {
  return Math.min(
    WS_RETRY_DELAY.initialMs * 2 ** Math.max(0, attemptIndex),
    WS_RETRY_DELAY.maxMs,
  );
}
