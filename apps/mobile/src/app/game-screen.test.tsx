import {
  getGameFixture,
  stateFromSnapshot,
  type GameViewState,
} from '@sequence/client-state';
import type { Move } from '@sequence/game-logic';
import { boardCellsFor } from '@sequence/game-logic';
import { useMutation } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render } from '@testing-library/react-native';

import type { UseMoveSubmitResult } from '../game/use-move-submit.ts';
import { useMoveSubmit } from '../game/use-move-submit.ts';
import type { GameStreamConnectionState } from '../realtime/use-game-stream.ts';
import { useGameStream } from '../realtime/use-game-stream.ts';

type MutationOptions = {
  onError?: (error: unknown) => void;
};

var mockGameId = 'game-1';
var mockStreamView: GameViewState | null = null;
var mockConnectionState: GameStreamConnectionState = 'live';
var mockSubmitMove = jest.fn((_move: Move) => false);

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn((options: MutationOptions) => ({
    isPending: false,
    mutate: jest.fn(),
    options,
  })),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: mockGameId }),
}));

jest.mock('../api/client.ts', () => ({
  useTRPC: jest.fn(() => ({
    game: {
      kick: { mutationOptions: (options: MutationOptions) => options },
      randomizeTeams: {
        mutationOptions: (options: MutationOptions) => options,
      },
      setTeam: { mutationOptions: (options: MutationOptions) => options },
      start: { mutationOptions: (options: MutationOptions) => options },
    },
  })),
}));

jest.mock('../game/cards/CardFace.tsx', () => {
  const { Text } = require('react-native') as typeof import('react-native');

  return {
    CardFace: ({
      card,
      testID,
    }: {
      card: { rank: string; suit: string };
      testID?: string;
    }) => <Text testID={testID}>{`${card.rank}${card.suit}`}</Text>,
  };
});

jest.mock('../realtime/use-game-stream.ts', () => ({
  useGameStream: jest.fn(() => ({
    connectionState: mockConnectionState,
    lastEventId: null,
    resubscribe: jest.fn(),
    view: mockStreamView,
  })),
}));

jest.mock('../game/use-move-submit.ts', () => ({
  useMoveSubmit: jest.fn(() => ({
    canSubmit: true,
    clearFeedback: jest.fn(),
    feedback: null,
    pendingMove: null,
    selectedCardDisabled: false,
    submitMove: (move: Move) => mockSubmitMove(move),
    submitting: false,
  })),
}));

import GameRouteScreen from './game/[id].tsx';

function defaultMoveSubmitResult(): UseMoveSubmitResult {
  return {
    canSubmit: true,
    clearFeedback: jest.fn(),
    feedback: null,
    pendingMove: null,
    selectedCardDisabled: false,
    submitMove: (...args: [Move]) =>
      mockSubmitMove(...args) as unknown as Promise<boolean>,
    submitting: false,
  };
}

function fixtureView(id: string, overrides: Partial<GameViewState> = {}) {
  const fixture = getGameFixture(id);
  if (!fixture) {
    throw new Error(`missing fixture ${id}`);
  }
  return {
    ...stateFromSnapshot(fixture.snapshot),
    gameId: mockGameId,
    lastSeq: 4,
    version: 12,
    ...overrides,
  };
}

beforeEach(() => {
  mockGameId = 'game-1';
  mockStreamView = null;
  mockConnectionState = 'live';
  mockSubmitMove = jest.fn((_move: Move) => false);
  jest.mocked(useMutation).mockClear();
  jest.mocked(useGameStream).mockClear();
  jest
    .mocked(useMoveSubmit)
    .mockImplementation(() => defaultMoveSubmitResult());
});

afterEach(() => {
  cleanup();
});

describe('GameRouteScreen active turn flow', () => {
  it('shows pending feedback and blocks new selection while a move is submitting', async () => {
    mockStreamView = fixtureView('active-your-turn');
    jest.mocked(useMoveSubmit).mockReturnValue({
      ...defaultMoveSubmitResult(),
      canSubmit: false,
      pendingMove: {
        move: {
          card: { rank: '5', suit: 'C' },
          position: '15C',
          type: 'place',
        },
        submittedAtMs: 1_000,
        submittedSeq: 4,
        submittedVersion: 12,
      },
      selectedCardDisabled: true,
      submitting: true,
    });

    const { getByTestId, getByText } = await render(<GameRouteScreen />);

    expect(getByText('Submitting move...')).toBeTruthy();
    expect(getByTestId('hand.card.5C').props.accessibilityState).toMatchObject({
      disabled: true,
    });

    await act(async () => {
      fireEvent.press(getByTestId('hand.card.5C'));
    });
    expect(mockSubmitMove).not.toHaveBeenCalled();
  });

  it('assembles the active game surface and submits a selected legal target on my turn', async () => {
    mockStreamView = fixtureView('active-your-turn');
    const [firstFiveClubsTarget] = boardCellsFor('5', 'C');
    if (!firstFiveClubsTarget) {
      throw new Error('5C fixture target is missing');
    }

    const { getByTestId } = await render(<GameRouteScreen />);

    expect(getByTestId('board.grid')).toBeTruthy();
    expect(getByTestId('game.rail')).toBeTruthy();
    expect(getByTestId('game.timer')).toBeTruthy();
    expect(getByTestId('hand.dock')).toBeTruthy();
    expect(getByTestId('game.turn.banner')).toBeTruthy();
    expect(getByTestId('game.controls')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('hand.card.5C'));
    });

    expect(
      getByTestId(`board.cell.${firstFiveClubsTarget}.spotlight.target`),
    ).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId(`board.cell.${firstFiveClubsTarget}`));
    });

    const expectedMove = {
      card: { rank: '5', suit: 'C' },
      position: firstFiveClubsTarget,
      type: 'place',
    } satisfies Move;
    expect(mockSubmitMove).toHaveBeenCalledWith(expectedMove);
    expect(useGameStream).toHaveBeenCalledWith(mockGameId);
    expect(useMoveSubmit).toHaveBeenLastCalledWith({
      gameId: mockGameId,
      view: expect.objectContaining({ version: 12 }),
    });
  });

  it('keeps the board visible but disables move submission on an opponent turn', async () => {
    mockStreamView = fixtureView('active-not-your-turn');
    const [firstFiveClubsTarget] = boardCellsFor('5', 'C');
    if (!firstFiveClubsTarget) {
      throw new Error('5C fixture target is missing');
    }

    const { getByTestId, queryByTestId } = await render(<GameRouteScreen />);

    expect(getByTestId('board.grid')).toBeTruthy();
    expect(getByTestId('hand.card.5C').props.accessibilityState).toMatchObject({
      disabled: true,
    });

    await act(async () => {
      fireEvent.press(getByTestId('hand.card.5C'));
    });
    expect(
      queryByTestId(`board.cell.${firstFiveClubsTarget}.spotlight.target`),
    ).toBeNull();

    await act(async () => {
      fireEvent.press(getByTestId(`board.cell.${firstFiveClubsTarget}`));
    });
    expect(mockSubmitMove).not.toHaveBeenCalled();
  });

  it('keeps lobby and non-active status branches intact', async () => {
    mockStreamView = fixtureView('lobby');
    const lobby = await render(<GameRouteScreen />);

    expect(lobby.getByTestId('lobby.screen')).toBeTruthy();
    expect(lobby.queryByTestId('board.grid')).toBeNull();

    cleanup();
    mockStreamView = fixtureView('game-over');
    const finished = await render(<GameRouteScreen />);

    expect(finished.getByTestId('game.placeholder')).toBeTruthy();
    expect(finished.getByText('Game finished')).toBeTruthy();
  });
});
