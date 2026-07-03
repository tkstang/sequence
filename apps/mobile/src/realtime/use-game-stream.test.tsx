import { gameFixtures, type GameStreamItem } from '@sequence/client-state';
import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from '@testing-library/react-native';

type SubscriptionOptions = {
  onConnectionStateChange?: (state: { state: string }) => void;
  onData?: (item: GameStreamItem | { data: GameStreamItem }) => void;
  onError?: (error: unknown) => void;
  onStarted?: () => void;
};

type SubscriptionInput = {
  gameId: string;
  lastEventId?: number;
};

var mockSubscriptionInputs: SubscriptionInput[] = [];
var mockLatestOptions: SubscriptionOptions | null = null;

jest.mock('@trpc/tanstack-react-query', () => ({
  useSubscription: jest.fn(() => ({ error: null, status: 'pending' })),
}));

jest.mock('../api/client.ts', () => ({
  useTRPC: jest.fn(() => ({
    game: {
      onGameEvent: {
        subscriptionOptions: jest.fn(
          (input: SubscriptionInput, options: SubscriptionOptions) => {
            mockSubscriptionInputs.push(input);
            mockLatestOptions = options;
            return { input, options };
          },
        ),
      },
    },
  })),
}));

import { useGameStream } from './use-game-stream.ts';

const snapshot = gameFixtures[0]!.snapshot;

async function emit(item: GameStreamItem | { data: GameStreamItem }) {
  await act(async () => {
    mockLatestOptions?.onData?.(item);
  });
}

beforeEach(() => {
  mockSubscriptionInputs = [];
  mockLatestOptions = null;
});

afterEach(() => {
  cleanup();
});

describe('useGameStream', () => {
  it('initializes view from a snapshot stream item', async () => {
    const { result } = await renderHook(() => useGameStream('game-1'));

    await emit({ kind: 'snapshot', snapshot });

    await waitFor(() => {
      expect(result.current.view?.gameId).toBe(snapshot.gameId);
    });
    expect(result.current.view?.status).toBe(snapshot.status);
  });

  it('applies events through the stream reducer', async () => {
    const { result } = await renderHook(() => useGameStream('game-1'));

    await emit({ kind: 'snapshot', snapshot });
    await emit({
      kind: 'event',
      event: {
        seq: 7,
        type: 'PlayerDisconnected',
        payload: { seat: 1 },
        version: snapshot.version + 1,
      },
    });

    await waitFor(() => {
      expect(result.current.view?.lastSeq).toBe(7);
    });
    expect(result.current.view?.status).toBe('frozen');
    expect(result.current.view?.players[1]?.connected).toBe(false);
  });

  it('tracks the latest applied event seq for explicit resubscription', async () => {
    const { result } = await renderHook(() => useGameStream('game-1'));

    await emit({ kind: 'snapshot', snapshot });
    await emit({
      data: {
        kind: 'event',
        event: {
          seq: 12,
          type: 'TurnAdvanced',
          payload: { seat: 1, round: 4 },
        },
      },
    });

    await waitFor(() => {
      expect(result.current.lastEventId).toBe(12);
    });
    expect(mockSubscriptionInputs.at(-1)).toEqual({ gameId: 'game-1' });

    await act(async () => {
      result.current.resubscribe();
    });

    expect(mockSubscriptionInputs.at(-1)).toEqual({
      gameId: 'game-1',
      lastEventId: 12,
    });
  });

  it('transitions connection state from connecting to live', async () => {
    const { result } = await renderHook(() => useGameStream('game-1'));

    expect(result.current.connectionState).toBe('connecting');

    await act(async () => {
      mockLatestOptions?.onStarted?.();
    });

    await waitFor(() => {
      expect(result.current.connectionState).toBe('live');
    });
  });

  it('marks the stream live when the tRPC connection reports live data', async () => {
    const { result } = await renderHook(() => useGameStream('game-1'));

    await act(async () => {
      mockLatestOptions?.onConnectionStateChange?.({ state: 'connecting' });
    });
    await emit({ kind: 'snapshot', snapshot });

    await waitFor(() => {
      expect(result.current.connectionState).toBe('live');
    });
  });
});
