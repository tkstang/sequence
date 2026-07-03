import {
  applyStreamItem,
  type GameStreamItem,
  type GameViewState,
} from '@sequence/client-state';
import { useSubscription } from '@trpc/tanstack-react-query';
import { useCallback, useReducer, useRef, useState } from 'react';

import { useTRPC } from '../api/client.ts';

export type GameStreamConnectionState =
  | 'connecting'
  | 'live'
  | 'reconnecting'
  | 'error';

type TrackedStreamItem = GameStreamItem | { data: GameStreamItem };

function unwrapStreamItem(item: TrackedStreamItem): GameStreamItem {
  return 'data' in item ? item.data : item;
}

function reducer(
  state: GameViewState | null,
  item: GameStreamItem,
): GameViewState | null {
  return applyStreamItem(state, item);
}

export function useGameStream(gameId: string): {
  connectionState: GameStreamConnectionState;
  lastEventId: number | null;
  resubscribe: () => void;
  view: GameViewState | null;
} {
  const trpc = useTRPC();
  const [view, dispatch] = useReducer(reducer, null);
  const lastEventIdRef = useRef<number | null>(null);
  const [recoveryEventId, setRecoveryEventId] = useState<number | null>(null);
  const [connectionState, setConnectionState] =
    useState<GameStreamConnectionState>('connecting');

  const handleData = useCallback((rawItem: TrackedStreamItem) => {
    const item = unwrapStreamItem(rawItem);

    dispatch(item);
    if (item.kind === 'event') {
      lastEventIdRef.current = item.event.seq;
    }
    setConnectionState('live');
  }, []);

  const subscription = useSubscription(
    trpc.game.onGameEvent.subscriptionOptions(
      recoveryEventId === null
        ? { gameId }
        : { gameId, lastEventId: recoveryEventId },
      {
        onStarted: () => setConnectionState('live'),
        onData: (item) => handleData(item as TrackedStreamItem),
        onError: () => setConnectionState('error'),
        onConnectionStateChange: (next) => {
          if (next.state === 'connecting') {
            setConnectionState((current) =>
              current === 'live' ? 'reconnecting' : 'connecting',
            );
          }
          if (next.state === 'idle') {
            setConnectionState('reconnecting');
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

  return {
    view,
    connectionState,
    lastEventId: lastEventIdRef.current,
    resubscribe,
  };
}
