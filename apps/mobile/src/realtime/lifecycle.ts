import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';

import { logger as defaultLogger, type Logger } from '../lib/logger.ts';
import { STREAM_INACTIVITY_WATCHDOG_MS } from './timing.ts';

export type RealtimeLifecycleConnectionState =
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'error';

export type RealtimeSocketState = 'connecting' | 'live' | 'closed' | 'errored';

export type RealtimeResubscribeReason = 'app-active' | 'watchdog-timeout';

export type AppStateLike = {
  currentState: AppStateStatus;
  addEventListener: (
    event: 'change',
    listener: (state: AppStateStatus) => void,
  ) => { remove: () => void };
};

type RealtimeLifecycleOptions = {
  appState?: AppStateLike;
  getSocketState: () => RealtimeSocketState;
  logger?: Pick<Logger, 'info'>;
  now?: () => number;
  onConnectionStateChange: (state: RealtimeLifecycleConnectionState) => void;
  onResubscribe: (reason: RealtimeResubscribeReason) => void;
  watchdogMs?: number;
};

export type RealtimeLifecycle = {
  checkLiveness: (reason: RealtimeResubscribeReason) => void;
  markConnecting: (reason: string) => void;
  markError: (reason: string) => void;
  markLive: (reason: string) => void;
  markReconnecting: (reason: string) => void;
  recordStreamItem: () => void;
  start: () => void;
  stop: () => void;
};

export function createRealtimeLifecycle({
  appState = AppState,
  getSocketState,
  logger = defaultLogger,
  now = Date.now,
  onConnectionStateChange,
  onResubscribe,
  watchdogMs = STREAM_INACTIVITY_WATCHDOG_MS,
}: RealtimeLifecycleOptions): RealtimeLifecycle {
  let appStateSubscription: { remove: () => void } | null = null;
  let appWasBackgrounded = appState.currentState !== 'active';
  let connectionState: RealtimeLifecycleConnectionState | null = null;
  let watchdogTimer: ReturnType<typeof setTimeout> | null = null;

  function clearWatchdog(): void {
    if (watchdogTimer !== null) {
      clearTimeout(watchdogTimer);
      watchdogTimer = null;
    }
  }

  function timestamp(): string {
    return new Date(now()).toISOString();
  }

  function transition(
    nextState: RealtimeLifecycleConnectionState,
    reason: string,
  ): void {
    if (connectionState === nextState) {
      return;
    }

    const previousState = connectionState;
    connectionState = nextState;
    logger.info('realtime.connection_state', {
      nextState,
      previousState,
      reason,
      timestamp: timestamp(),
    });
    onConnectionStateChange(nextState);
  }

  function scheduleWatchdog(): void {
    clearWatchdog();
    watchdogTimer = setTimeout(() => {
      transition('reconnecting', 'watchdog-timeout');
      onResubscribe('watchdog-timeout');
    }, watchdogMs);
  }

  function markLive(reason: string): void {
    transition('live', reason);
    scheduleWatchdog();
  }

  function checkLiveness(reason: RealtimeResubscribeReason): void {
    const socketState = getSocketState();
    const shouldResubscribe =
      socketState !== 'live' || (reason === 'app-active' && appWasBackgrounded);

    appWasBackgrounded = false;

    if (!shouldResubscribe) {
      return;
    }

    clearWatchdog();
    transition('reconnecting', reason);
    onResubscribe(reason);
  }

  return {
    checkLiveness,
    markConnecting(reason) {
      clearWatchdog();
      transition('connecting', reason);
    },
    markError(reason) {
      clearWatchdog();
      transition('error', reason);
    },
    markLive,
    markReconnecting(reason) {
      clearWatchdog();
      transition('reconnecting', reason);
    },
    recordStreamItem() {
      markLive('stream-item');
    },
    start() {
      if (appStateSubscription !== null) {
        return;
      }

      appStateSubscription = appState.addEventListener(
        'change',
        (nextState) => {
          if (nextState === 'active') {
            checkLiveness('app-active');
            return;
          }
          appWasBackgrounded = true;
        },
      );
    },
    stop() {
      clearWatchdog();
      appStateSubscription?.remove();
      appStateSubscription = null;
    },
  };
}
