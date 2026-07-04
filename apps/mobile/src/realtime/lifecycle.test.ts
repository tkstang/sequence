import {
  createRealtimeLifecycle,
  type AppStateLike,
  type RealtimeSocketState,
} from './lifecycle.ts';
import { STREAM_INACTIVITY_WATCHDOG_MS } from './timing.ts';

function createMockAppState(): {
  appState: AppStateLike;
  emit: (
    state: Parameters<AppStateLike['addEventListener']>[1] extends (
      state: infer State,
    ) => void
      ? State
      : never,
  ) => void;
  remove: jest.Mock;
} {
  let listener: Parameters<AppStateLike['addEventListener']>[1] | null = null;
  const remove = jest.fn();

  return {
    appState: {
      currentState: 'active',
      addEventListener: jest.fn((_event, nextListener) => {
        listener = nextListener;
        return { remove };
      }),
    },
    emit: (state) => {
      listener?.(state);
    },
    remove,
  };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-07-03T12:00:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('createRealtimeLifecycle', () => {
  it('checks liveness on foreground and resubscribes when the socket is closed', () => {
    const { appState, emit, remove } = createMockAppState();
    const resubscribe = jest.fn();
    const getSocketState = jest.fn<RealtimeSocketState, []>(() => 'closed');
    const states: string[] = [];

    const lifecycle = createRealtimeLifecycle({
      appState,
      getSocketState,
      logger: { info: jest.fn() },
      onConnectionStateChange: (state) => states.push(state),
      onResubscribe: resubscribe,
    });

    lifecycle.start();
    emit('background');
    emit('active');

    expect(getSocketState).toHaveBeenCalledWith();
    expect(states).toEqual(['reconnecting']);
    expect(resubscribe).toHaveBeenCalledWith('app-active');

    lifecycle.stop();
    expect(remove).toHaveBeenCalledWith();
  });

  it('resubscribes after background even when the socket still reports live', () => {
    const { appState, emit } = createMockAppState();
    const resubscribe = jest.fn();
    const getSocketState = jest.fn<RealtimeSocketState, []>(() => 'live');
    const states: string[] = [];

    const lifecycle = createRealtimeLifecycle({
      appState,
      getSocketState,
      logger: { info: jest.fn() },
      onConnectionStateChange: (state) => states.push(state),
      onResubscribe: resubscribe,
    });

    lifecycle.start();
    emit('background');
    emit('active');

    expect(getSocketState).toHaveBeenCalledWith();
    expect(states).toEqual(['reconnecting']);
    expect(resubscribe).toHaveBeenCalledWith('app-active');
  });

  it('keeps a quiet live socket connected at the inactivity ceiling', () => {
    const { appState } = createMockAppState();
    const resubscribe = jest.fn();
    const states: string[] = [];

    const lifecycle = createRealtimeLifecycle({
      appState,
      getSocketState: () => 'live',
      logger: { info: jest.fn() },
      onConnectionStateChange: (state) => states.push(state),
      onResubscribe: resubscribe,
    });

    lifecycle.start();
    lifecycle.markLive('subscription-started');
    jest.advanceTimersByTime(STREAM_INACTIVITY_WATCHDOG_MS);

    expect(resubscribe).not.toHaveBeenCalled();
    expect(states).toEqual(['live']);

    lifecycle.stop();
  });

  it('resubscribes at the inactivity ceiling when the socket is no longer live', () => {
    const { appState } = createMockAppState();
    const resubscribe = jest.fn();
    const states: string[] = [];

    const lifecycle = createRealtimeLifecycle({
      appState,
      getSocketState: () => 'closed',
      logger: { info: jest.fn() },
      onConnectionStateChange: (state) => states.push(state),
      onResubscribe: resubscribe,
    });

    lifecycle.start();
    lifecycle.markLive('subscription-started');
    jest.advanceTimersByTime(STREAM_INACTIVITY_WATCHDOG_MS);

    expect(states).toEqual(['live', 'reconnecting']);
    expect(resubscribe).toHaveBeenCalledWith('watchdog-timeout');
  });

  it.each([
    ['connecting', (lifecycle) => lifecycle.markConnecting('transport')],
    ['reconnecting', (lifecycle) => lifecycle.markReconnecting('transport')],
    ['error', (lifecycle) => lifecycle.markError('transport')],
  ] satisfies [
    string,
    (lifecycle: ReturnType<typeof createRealtimeLifecycle>) => void,
  ][])(
    'resubscribes at the inactivity ceiling while %s',
    (_label, markState) => {
      const { appState } = createMockAppState();
      const resubscribe = jest.fn();
      const states: string[] = [];

      const lifecycle = createRealtimeLifecycle({
        appState,
        getSocketState: () => 'closed',
        logger: { info: jest.fn() },
        onConnectionStateChange: (state) => states.push(state),
        onResubscribe: resubscribe,
      });

      lifecycle.start();
      markState(lifecycle);
      jest.advanceTimersByTime(STREAM_INACTIVITY_WATCHDOG_MS);

      expect(states.at(-1)).toBe('reconnecting');
      expect(resubscribe).toHaveBeenCalledWith('watchdog-timeout');
    },
  );

  it('keeps re-arming the watchdog while recovery remains non-live', () => {
    const { appState } = createMockAppState();
    const resubscribe = jest.fn();

    const lifecycle = createRealtimeLifecycle({
      appState,
      getSocketState: () => 'closed',
      logger: { info: jest.fn() },
      onConnectionStateChange: jest.fn(),
      onResubscribe: resubscribe,
    });

    lifecycle.start();
    lifecycle.markReconnecting('transport-idle');
    jest.advanceTimersByTime(STREAM_INACTIVITY_WATCHDOG_MS * 2);

    expect(resubscribe).toHaveBeenCalledTimes(2);
    expect(resubscribe).toHaveBeenNthCalledWith(1, 'watchdog-timeout');
    expect(resubscribe).toHaveBeenNthCalledWith(2, 'watchdog-timeout');
  });

  it('logs live to reconnecting to live transitions with timestamps', () => {
    const { appState } = createMockAppState();
    const logger = { info: jest.fn() };

    const lifecycle = createRealtimeLifecycle({
      appState,
      getSocketState: () => 'live',
      logger,
      onConnectionStateChange: jest.fn(),
      onResubscribe: jest.fn(),
    });

    lifecycle.start();
    lifecycle.markLive('subscription-started');
    jest.advanceTimersByTime(STREAM_INACTIVITY_WATCHDOG_MS);
    expect(logger.info).toHaveBeenCalledTimes(1);
    lifecycle.recordStreamItem();

    expect(logger.info).toHaveBeenNthCalledWith(
      1,
      'realtime.connection_state',
      expect.objectContaining({
        nextState: 'live',
        reason: 'subscription-started',
        timestamp: '2026-07-03T12:00:00.000Z',
      }),
    );
  });
});
