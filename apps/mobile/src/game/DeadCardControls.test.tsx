import {
  RULE_VIOLATION_MESSAGES,
  gameFixtures,
  stateFromSnapshot,
  type GameViewState,
} from '@sequence/client-state';
import type { Card } from '@sequence/game-logic';
import { useMutation } from '@tanstack/react-query';
import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

type MutationOptions = {
  onError?: (error: unknown) => void;
  onSuccess?: (result: { events: unknown[]; version: number }) => void;
};

var mockMutationOptions: MutationOptions | null = null;
var mockMutationOptionsFactory = jest.fn((options: MutationOptions) => {
  mockMutationOptions = options;
  return options;
});
var mockMutateAsync = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn((options: MutationOptions) => ({
    isPending: false,
    mutateAsync: (...args: unknown[]) => mockMutateAsync(...args),
    options,
  })),
}));

jest.mock('../api/client.ts', () => ({
  useTRPC: jest.fn(() => ({
    game: {
      turnInDeadCard: {
        mutationOptions: (options: MutationOptions) =>
          mockMutationOptionsFactory(options),
      },
    },
  })),
}));

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
  },
  NotificationFeedbackType: {
    Error: 'error',
    Warning: 'warning',
  },
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
}));

import {
  AUTO_SWAP_FEEDBACK,
  useDeadCardControls,
} from './DeadCardControls.tsx';

const gameId = '7ed1137a-2334-4bde-82ba-75c742d570d1';
const deadCard = { rank: '5', suit: 'C' } as const satisfies Card;
const drawnCard = { rank: '9', suit: 'H' } as const satisfies Card;

function view(overrides: Partial<GameViewState> = {}): GameViewState {
  const fixture = gameFixtures.find(
    (candidate) => candidate.id === 'dead-card',
  );
  if (!fixture) {
    throw new Error('missing dead-card fixture');
  }
  return {
    ...stateFromSnapshot({
      ...fixture.snapshot,
      gameId,
      mode: 'drag',
      status: 'active',
      version: 4,
    }),
    lastSeq: 10,
    recentEvents: [],
    ...overrides,
  };
}

beforeEach(() => {
  mockMutationOptions = null;
  mockMutationOptionsFactory = jest.fn((options: MutationOptions) => {
    mockMutationOptions = options;
    return options;
  });
  mockMutateAsync = jest.fn();
  jest.mocked(useMutation).mockClear();
  jest.mocked(Haptics.impactAsync).mockClear();
  jest.mocked(Haptics.notificationAsync).mockClear();
});

afterEach(() => {
  cleanup();
});

describe('useDeadCardControls', () => {
  it('turns in a dead card without advancing the local turn', async () => {
    let resolveMutation:
      | ((result: { events: unknown[]; version: number }) => void)
      | undefined;
    mockMutateAsync.mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = resolve;
      }),
    );
    const currentView = view();
    const { result } = await renderHook(() =>
      useDeadCardControls({ gameId, view: currentView }),
    );

    await act(async () => {
      void result.current.turnInDeadCard(deadCard);
    });

    expect(result.current.submitting).toBe(true);
    expect(mockMutateAsync).toHaveBeenCalledWith({
      card: deadCard,
      gameId,
      version: 4,
    });
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(currentView.currentSeat).toBe(0);
    expect(currentView.version).toBe(4);

    await act(async () => {
      resolveMutation?.({ events: [], version: 5 });
      mockMutationOptions?.onSuccess?.({ events: [], version: 5 });
    });

    await waitFor(() => {
      expect(result.current.submitting).toBe(false);
    });
  });

  it('shows not-a-dead-card feedback when a same-turn second attempt is rejected', async () => {
    const error = {
      data: {
        code: 'BAD_REQUEST',
        ruleViolation: { code: 'not-a-dead-card' },
      },
    };
    mockMutateAsync.mockImplementation(async () => {
      mockMutationOptions?.onError?.(error);
      throw error;
    });
    const { result } = await renderHook(() =>
      useDeadCardControls({ gameId, view: view() }),
    );

    await act(async () => {
      await result.current.turnInDeadCard(deadCard);
    });

    expect(result.current.submitting).toBe(false);
    expect(result.current.feedback?.message).toBe(
      RULE_VIOLATION_MESSAGES['not-a-dead-card'],
    );
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
  });

  it('surfaces default-mode auto-swaps once per streamed event', async () => {
    let currentView = view({
      mode: 'tap',
      recentEvents: [
        {
          payload: { discarded: deadCard, drawn: drawnCard, seat: 0 },
          seq: 11,
          type: 'DeadCardSwapped',
          version: 5,
        },
      ],
    });
    const { result, rerender } = await renderHook(() =>
      useDeadCardControls({ gameId, view: currentView }),
    );

    await waitFor(() => {
      expect(result.current.feedback).toEqual(AUTO_SWAP_FEEDBACK);
    });
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('warning');

    await rerender(undefined);

    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);

    currentView = view({
      mode: 'tap',
      recentEvents: [
        {
          payload: { discarded: deadCard, drawn: drawnCard, seat: 0 },
          seq: 12,
          type: 'DeadCardSwapped',
          version: 6,
        },
      ],
    });
    await rerender(undefined);

    await waitFor(() => {
      expect(Haptics.notificationAsync).toHaveBeenCalledTimes(2);
    });
  });
});
