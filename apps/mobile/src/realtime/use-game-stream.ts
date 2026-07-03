import {
  applyStreamItem,
  type GameStreamItem,
  type GameViewState,
} from '@sequence/client-state';
import { useSubscription } from '@trpc/tanstack-react-query';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { useTRPC } from '../api/client.ts';
import {
  createRealtimeLifecycle,
  type RealtimeLifecycle,
  type RealtimeResubscribeReason,
  type RealtimeSocketState,
} from './lifecycle.ts';

export type GameStreamConnectionState =
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'error';

type TrackedStreamItem = GameStreamItem | { data: GameStreamItem };

export type UseGameStreamOptions = {
  initialLastEventId?: number | null;
};

function unwrapStreamItem(item: TrackedStreamItem): GameStreamItem {
  return 'data' in item ? item.data : item;
}

function reducer(
  state: GameViewState | null,
  item: GameStreamItem,
): GameViewState | null {
  return applyStreamItem(state, item);
}

export function useGameStream(
  gameId: string,
  options: UseGameStreamOptions = {},
): {
  connectionState: GameStreamConnectionState;
  lastEventId: number | null;
  resubscribe: () => void;
  view: GameViewState | null;
} {
  const trpc = useTRPC();
  const [view, dispatch] = useReducer(reducer, null);
  const initialLastEventId = options.initialLastEventId ?? null;
  const lastEventIdRef = useRef<number | null>(initialLastEventId);
  const socketStateRef = useRef<RealtimeSocketState>('connecting');
  const resubscribeRef = useRef<(reason?: RealtimeResubscribeReason) => void>(
    () => {},
  );
  const [recoveryEventId, setRecoveryEventId] = useState<number | null>(
    initialLastEventId,
  );
  const [connectionState, setConnectionState] =
    useState<GameStreamConnectionState>('connecting');
  const connectionStateRef = useRef<GameStreamConnectionState>(connectionState);
  const lifecycleRef = useRef<RealtimeLifecycle | null>(null);

  lifecycleRef.current ??= createRealtimeLifecycle({
    getSocketState: () => socketStateRef.current,
    onConnectionStateChange: (nextState) => {
      connectionStateRef.current = nextState;
      setConnectionState(nextState);
    },
    onResubscribe: (reason) => resubscribeRef.current(reason),
  });
  const lifecycle = lifecycleRef.current;

  const handleData = useCallback(
    (rawItem: TrackedStreamItem) => {
      const item = unwrapStreamItem(rawItem);

      dispatch(item);
      if (item.kind === 'event') {
        lastEventIdRef.current = item.event.seq;
      }
      socketStateRef.current = 'live';
      lifecycle.recordStreamItem();
    },
    [lifecycle],
  );

  const subscription = useSubscription(
    trpc.game.onGameEvent.subscriptionOptions(
      recoveryEventId === null
        ? { gameId }
        : { gameId, lastEventId: recoveryEventId },
      {
        onStarted: () => {
          socketStateRef.current = 'live';
          lifecycle.markLive('subscription-started');
        },
        onData: (item) => handleData(item as TrackedStreamItem),
        onError: () => {
          socketStateRef.current = 'errored';
          lifecycle.markError('subscription-error');
        },
        onConnectionStateChange: (next) => {
          if (next.state === 'connecting') {
            socketStateRef.current = 'connecting';
            if (connectionStateRef.current === 'live') {
              lifecycle.markReconnecting('transport-connecting');
              return;
            }
            lifecycle.markConnecting('transport-connecting');
          }
          if (next.state === 'idle') {
            socketStateRef.current = 'closed';
            lifecycle.markReconnecting('transport-idle');
          }
        },
      },
    ),
  );

  const resubscribe = useCallback(() => {
    const nextEventId = lastEventIdRef.current;
    if (nextEventId === recoveryEventId) {
      subscription.reset();
      return;
    }
    setRecoveryEventId(nextEventId);
  }, [recoveryEventId, subscription]);
  resubscribeRef.current = resubscribe;

  useEffect(() => {
    lifecycle.start();
    return () => lifecycle.stop();
  }, [lifecycle]);

  return {
    view,
    connectionState,
    lastEventId: lastEventIdRef.current,
    resubscribe,
  };
}
