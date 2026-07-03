import {
  gameFixtures,
  stateFromSnapshot,
  type GameViewState,
} from '@sequence/client-state';
import { RULE_VIOLATION_MESSAGES } from '@sequence/client-state';
import type { Card, Move } from '@sequence/game-logic';
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
      makeMove: {
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

import { GAME_UPDATED_FEEDBACK } from './feedback/toasts.ts';
import { useMoveSubmit } from './use-move-submit.ts';

const gameId = '7ed1137a-2334-4bde-82ba-75c742d570d1';
const card = { rank: 'A', suit: 'C' } as const satisfies Card;
const move = {
  card,
  position: '1AC',
  type: 'place',
} as const satisfies Move;

function view(overrides: Partial<GameViewState> = {}): GameViewState {
  return {
    ...stateFromSnapshot({
      ...gameFixtures[0]!.snapshot,
      gameId,
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

describe('useMoveSubmit', () => {
  it('enters submitting state without mutating the local board', async () => {
    let resolveMutation:
      | ((result: { events: unknown[]; version: number }) => void)
      | undefined;
    mockMutateAsync.mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = resolve;
      }),
    );
    const board = Object.freeze({});
    const currentView = view({ board });
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const { result } = await renderHook(() =>
      useMoveSubmit({ gameId, logger, view: currentView }),
    );

    await act(async () => {
      void result.current.submitMove(move);
    });

    expect(result.current.submitting).toBe(true);
    expect(result.current.selectedCardDisabled).toBe(true);
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.pendingMove?.move).toEqual(move);
    expect(mockMutateAsync).toHaveBeenCalledWith({
      gameId,
      move,
      version: 4,
    });
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(currentView.board).toBe(board);

    await act(async () => {
      resolveMutation?.({ events: [], version: 5 });
      mockMutationOptions?.onSuccess?.({ events: [], version: 5 });
    });
  });

  it('clears submitting on the matching server echo and logs round-trip timing in development', async () => {
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const now = jest.fn().mockReturnValueOnce(1_000).mockReturnValueOnce(1_140);
    mockMutateAsync.mockImplementation(async () => {
      mockMutationOptions?.onSuccess?.({ events: [], version: 5 });
      return { events: [], version: 5 };
    });
    let currentView = view();
    const { result, rerender } = await renderHook(() =>
      useMoveSubmit({ gameId, logger, now, view: currentView }),
    );

    await act(async () => {
      await result.current.submitMove(move);
    });

    expect(result.current.submitting).toBe(true);

    currentView = view({
      lastSeq: 11,
      recentEvents: [
        {
          payload: { card, position: '1AC', seat: 0 },
          seq: 11,
          type: 'ChipPlaced',
          version: 5,
        },
      ],
      version: 5,
    });
    await rerender(undefined);

    await waitFor(() => {
      expect(result.current.submitting).toBe(false);
    });
    expect(logger.info).toHaveBeenCalledWith('game.move.round_trip', {
      eventSeq: 11,
      expectedVersion: 5,
      gameId,
      p50Ms: 140,
      roundTripMs: 140,
      submittedVersion: 4,
    });
  });

  it('clears submitting on rule violation errors with catalog feedback', async () => {
    const error = {
      data: {
        code: 'BAD_REQUEST',
        ruleViolation: { code: 'chip-locked' },
      },
    };
    mockMutateAsync.mockImplementation(async () => {
      mockMutationOptions?.onError?.(error);
      throw error;
    });
    const { result } = await renderHook(() =>
      useMoveSubmit({ gameId, view: view() }),
    );

    await act(async () => {
      await result.current.submitMove(move);
    });

    expect(result.current.submitting).toBe(false);
    expect(result.current.feedback?.message).toBe(
      RULE_VIOLATION_MESSAGES['chip-locked'],
    );
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
  });

  it('reports conflicts as game-updated feedback and does not duplicate submit while pending', async () => {
    let rejectMutation: ((error: unknown) => void) | undefined;
    mockMutateAsync.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectMutation = reject;
      }),
    );
    const { result } = await renderHook(() =>
      useMoveSubmit({ gameId, view: view() }),
    );

    await act(async () => {
      void result.current.submitMove(move);
    });
    await act(async () => {
      await result.current.submitMove(move);
    });

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);

    const conflict = { data: { code: 'CONFLICT' } };
    await act(async () => {
      mockMutationOptions?.onError?.(conflict);
      rejectMutation?.(conflict);
    });

    await waitFor(() => {
      expect(result.current.submitting).toBe(false);
    });
    expect(result.current.feedback).toEqual(GAME_UPDATED_FEEDBACK);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('warning');
  });
});
