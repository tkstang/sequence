import {
  applyStreamItem,
  type GameStreamItem,
  type GameViewState,
} from '@sequence/client-state';
import { useSubscription } from '@trpc/tanstack-react-query';
import { useCallback, useReducer, useState } from 'react';

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
  view: GameViewState | null;
} {
  const trpc = useTRPC();
  const [view, dispatch] = useReducer(reducer, null);
  const [lastEventId, setLastEventId] = useState<number | null>(null);
  const [connectionState, setConnectionState] =
    useState<GameStreamConnectionState>('connecting');

  const handleData = useCallback((rawItem: TrackedStreamItem) => {
    const item = unwrapStreamItem(rawItem);

    dispatch(item);
    if (item.kind === 'event') {
      setLastEventId(item.event.seq);
    }
    setConnectionState('live');
  }, []);

  useSubscription(
    trpc.game.onGameEvent.subscriptionOptions(
      lastEventId === null ? { gameId } : { gameId, lastEventId },
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

  return { view, connectionState };
}
