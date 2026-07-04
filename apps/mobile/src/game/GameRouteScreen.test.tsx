import {
  getGameFixture,
  stateFromSnapshot,
  type GameViewState,
} from '@sequence/client-state';
import type { Card, Move } from '@sequence/game-logic';
import { boardCellsFor } from '@sequence/game-logic';
import { useMutation } from '@tanstack/react-query';
import {
  cleanup,
  render,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import type { GameStreamConnectionState } from '../realtime/use-game-stream.ts';
import { useGameStream } from '../realtime/use-game-stream.ts';
import type { DragLayerProps } from './drag/DragLayer.tsx';
import type { UseMoveSubmitResult } from './use-move-submit.ts';
import { useMoveSubmit } from './use-move-submit.ts';

type MutationOptions = {
  onError?: (error: unknown) => void;
};

var mockGameId = 'game-1';
var mockStreamView: GameViewState | null = null;
var mockConnectionState: GameStreamConnectionState = 'live';
var mockSubmitMove = jest.fn((_move: Move) => false);
var mockMutate = jest.fn();
var mockMutateAsync = jest.fn();
var mockRouterReplace = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn((options: MutationOptions) => ({
    isPending: false,
    mutate: mockMutate,
    mutateAsync: (...args: unknown[]) => mockMutateAsync(...args),
    options,
  })),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: mockGameId }),
  useRouter: () => ({ replace: mockRouterReplace }),
}));

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
  },
  NotificationFeedbackType: {
    Error: 'error',
    Success: 'success',
    Warning: 'warning',
  },
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
}));

jest.mock('../api/client.ts', () => ({
  useTRPC: jest.fn(() => ({
    game: {
      chooseSequenceCells: {
        mutationOptions: (options: MutationOptions) => options,
      },
      concede: {
        mutationOptions: (options: MutationOptions) => options,
      },
      kick: { mutationOptions: (options: MutationOptions) => options },
      randomizeTeams: {
        mutationOptions: (options: MutationOptions) => options,
      },
      rematch: {
        mutationOptions: (options: MutationOptions) => options,
      },
      saveAndExit: {
        mutationOptions: (options: MutationOptions) => options,
      },
      setTeam: { mutationOptions: (options: MutationOptions) => options },
      start: { mutationOptions: (options: MutationOptions) => options },
      turnInDeadCard: {
        mutationOptions: (options: MutationOptions) => options,
      },
    },
  })),
}));

jest.mock('./cards/CardFace.tsx', () => {
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

jest.mock('./use-move-submit.ts', () => ({
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

jest.mock('./drag/DragLayer.tsx', () => {
  const { Pressable, View } =
    require('react-native') as typeof import('react-native');

  return {
    DragLayer: ({ card, children, onDrop }: DragLayerProps) => (
      <View testID="drag.layer.mock">
        {children}
        {card ? <View testID="drag.ghost.mock" /> : null}
        <Pressable
          onPress={() => {
            onDrop?.('15C');
          }}
          testID="drag.drop.15C"
        />
      </View>
    ),
  };
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native') as typeof import('react-native');

  return {
    __esModule: true,
    default: {
      View,
    },
    useAnimatedStyle: (factory: () => unknown) => factory(),
    useSharedValue: (value: unknown) => ({ value }),
    withTiming: (value: unknown) => value,
  };
});

import GameRouteScreen from '../app/game/[id].tsx';

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

function localTurnView(
  currentSeat: number,
  overrides: Partial<GameViewState> = {},
) {
  const outgoingHand = [
    { rank: '5', suit: 'C' },
    { rank: 'T', suit: 'H' },
  ] as const satisfies readonly Card[];
  const incomingHand = [
    { rank: 'A', suit: 'H' },
    { rank: 'K', suit: 'D' },
  ] as const satisfies readonly Card[];

  return fixtureView('active-your-turn', {
    currentSeat,
    hand: [...outgoingHand],
    local: true,
    localHands: [[...outgoingHand], [...incomingHand]],
    mySeat: 0,
    players: [
      {
        connected: true,
        isCreator: true,
        isGuest: false,
        name: 'You',
        seat: 0,
        team: 1,
      },
      {
        connected: true,
        isCreator: false,
        isGuest: true,
        name: 'Riya',
        seat: 1,
        team: 2,
      },
    ],
    playerCount: 2,
    teams: [1, 2],
    ...overrides,
  });
}

beforeEach(() => {
  mockGameId = 'game-1';
  mockStreamView = null;
  mockConnectionState = 'live';
  mockSubmitMove = jest.fn((_move: Move) => false);
  mockMutate = jest.fn();
  mockMutateAsync = jest.fn();
  mockRouterReplace = jest.fn();
  jest.mocked(useMutation).mockClear();
  jest.mocked(useGameStream).mockClear();
  jest
    .mocked(useMoveSubmit)
    .mockImplementation(() => defaultMoveSubmitResult());
  jest.mocked(Haptics.notificationAsync).mockClear();
});

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

describe('GameRouteScreen active turn flow', () => {
  it('shows pending feedback and blocks new selection while a move is submitting', async () => {
    const user = userEvent.setup();
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

    await user.press(getByTestId('hand.card.5C'));
    expect(mockSubmitMove).not.toHaveBeenCalled();
  });

  it('assembles the active game surface and submits a selected legal target on my turn', async () => {
    const user = userEvent.setup();
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

    await user.press(getByTestId('hand.card.5C'));

    expect(
      getByTestId(`board.cell.${firstFiveClubsTarget}.spotlight.target`),
    ).toBeTruthy();

    await user.press(getByTestId(`board.cell.${firstFiveClubsTarget}`));

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

  it('saves the active game with the current version and navigates home', async () => {
    const user = userEvent.setup();
    const activeView = fixtureView('active-your-turn');
    mockStreamView = {
      ...activeView,
      players: activeView.players.map((player) => ({
        ...player,
        isGuest: false,
      })),
    };
    mockMutateAsync.mockResolvedValue({ status: 'saved' });

    const { getByTestId } = await render(<GameRouteScreen />);

    await user.press(getByTestId('game.lifecycle.save'));
    await user.press(getByTestId('game.lifecycle.save.confirm'));

    expect(mockMutateAsync).toHaveBeenCalledWith({
      gameId: mockGameId,
      version: 12,
    });
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/');
    });
  });

  it('shows active-game copy when save and exit hits a version conflict', async () => {
    const user = userEvent.setup();
    const activeView = fixtureView('active-your-turn');
    mockStreamView = {
      ...activeView,
      players: activeView.players.map((player) => ({
        ...player,
        isGuest: false,
      })),
    };
    mockMutateAsync.mockRejectedValue({ data: { code: 'CONFLICT' } });

    const { getByTestId, getByText } = await render(<GameRouteScreen />);

    await user.press(getByTestId('game.lifecycle.save'));
    await user.press(getByTestId('game.lifecycle.save.confirm'));

    await waitFor(() => {
      expect(
        getByText('Game changed. Live updates will refresh it.'),
      ).toBeTruthy();
    });
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('concedes the active game with the current version without leaving the route', async () => {
    const user = userEvent.setup();
    mockStreamView = fixtureView('active-your-turn');
    mockMutateAsync.mockResolvedValue({ status: 'finished' });

    const { getByTestId } = await render(<GameRouteScreen />);

    await user.press(getByTestId('game.lifecycle.concede'));
    await user.press(getByTestId('game.lifecycle.concede.confirm'));

    expect(mockMutateAsync).toHaveBeenCalledWith({
      gameId: mockGameId,
      version: 12,
    });
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('keeps the board visible but disables move submission on an opponent turn', async () => {
    const user = userEvent.setup();
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

    await user.press(getByTestId('hand.card.5C'));
    expect(
      queryByTestId(`board.cell.${firstFiveClubsTarget}.spotlight.target`),
    ).toBeNull();

    await user.press(getByTestId(`board.cell.${firstFiveClubsTarget}`));
    expect(mockSubmitMove).not.toHaveBeenCalled();
  });

  it('notifies when a live stream event advances the turn to me', async () => {
    mockStreamView = fixtureView('active-not-your-turn', {
      currentSeat: 1,
      lastSeq: 4,
      recentEvents: [],
    });

    const { getByText, queryByText, rerender } = await render(
      <GameRouteScreen />,
    );

    expect(queryByText('Your turn.')).toBeNull();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();

    mockStreamView = fixtureView('active-your-turn', {
      currentSeat: 0,
      lastSeq: 5,
      recentEvents: [
        {
          payload: { round: 2, seat: 0 },
          seq: 5,
          type: 'TurnAdvanced',
          version: 13,
        },
      ],
      version: 13,
    });
    await rerender(<GameRouteScreen />);

    await waitFor(() => {
      expect(getByText('Your turn.')).toBeTruthy();
    });
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  it('does not notify for already-applied events in the initial stream view', async () => {
    mockStreamView = fixtureView('active-your-turn', {
      currentSeat: 0,
      lastSeq: 5,
      recentEvents: [
        {
          payload: { round: 2, seat: 0 },
          seq: 5,
          type: 'TurnAdvanced',
          version: 13,
        },
      ],
      version: 13,
    });

    const { queryByText } = await render(<GameRouteScreen />);

    expect(queryByText('Your turn.')).toBeNull();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  it('veils both local hands between pass-and-play turns until the incoming player confirms', async () => {
    const user = userEvent.setup();
    mockStreamView = localTurnView(0);

    const { getByTestId, getByText, queryByTestId, queryByText, rerender } =
      await render(<GameRouteScreen />);

    expect(getByTestId('hand.card.5C')).toBeTruthy();
    expect(queryByTestId('hand.card.AH')).toBeNull();

    mockStreamView = localTurnView(1, {
      lastMove: {
        label: '5C to 15C',
        seat: 0,
      },
    });
    await rerender(<GameRouteScreen />);

    expect(getByText('Pass to Riya')).toBeTruthy();
    expect(getByText('5C to 15C')).toBeTruthy();
    expect(getByTestId('handoff.confirm')).toBeTruthy();
    expect(queryByTestId('hand.dock')).toBeNull();
    expect(queryByTestId('hand.card.5C')).toBeNull();
    expect(queryByTestId('hand.card.AH')).toBeNull();
    expect(queryByText('5C')).toBeNull();
    expect(queryByText('AH')).toBeNull();

    await user.press(getByTestId('handoff.confirm'));

    expect(getByTestId('hand.card.AH')).toBeTruthy();
    expect(queryByTestId('hand.card.5C')).toBeNull();
  });

  it('resumes a local game behind the handoff veil when another seat is active', async () => {
    const user = userEvent.setup();
    mockStreamView = localTurnView(1);

    const { getByTestId, getByText, queryByTestId, queryByText } = await render(
      <GameRouteScreen />,
    );

    expect(getByText('Pass to Riya')).toBeTruthy();
    expect(getByTestId('handoff.confirm')).toBeTruthy();
    expect(queryByTestId('hand.dock')).toBeNull();
    expect(queryByTestId('hand.card.AH')).toBeNull();
    expect(queryByText('AH')).toBeNull();

    await user.press(getByTestId('handoff.confirm'));

    expect(getByTestId('hand.card.AH')).toBeTruthy();
    expect(queryByTestId('hand.card.5C')).toBeNull();
  });

  it('selects drag mode and submits a cardless move when a dragged chip drops on a cell', async () => {
    const user = userEvent.setup();
    mockStreamView = fixtureView('active-your-turn', { mode: 'drag' });
    mockSubmitMove = jest.fn((_move: Move) => true);

    const { getByTestId, queryByTestId } = await render(<GameRouteScreen />);

    expect(getByTestId('drag.layer.mock')).toBeTruthy();
    expect(queryByTestId('drag.ghost.mock')).toBeNull();

    await user.press(getByTestId('hand.card.5C'));

    expect(getByTestId('drag.ghost.mock')).toBeTruthy();
    expect(queryByTestId('board.cell.15C.spotlight.target')).toBeNull();

    await user.press(getByTestId('drag.drop.15C'));

    expect(mockSubmitMove).toHaveBeenCalledWith({
      position: '15C',
      type: 'place',
    });
  });

  it('turns in a drag-mode dead card through the versioned mutation', async () => {
    const user = userEvent.setup();
    mockStreamView = fixtureView('dead-card', { mode: 'drag' });
    mockMutateAsync.mockResolvedValue({ events: [], version: 13 });

    const { getByTestId } = await render(<GameRouteScreen />);

    expect(getByTestId('hand.card.5C.dead')).toBeTruthy();

    await user.press(getByTestId('hand.card.5C.turnIn'));

    expect(mockMutateAsync).toHaveBeenCalledWith({
      card: { rank: '5', suit: 'C' },
      gameId: mockGameId,
      version: 12,
    });
    expect(mockSubmitMove).not.toHaveBeenCalled();
  });

  it('keeps the dragged chip selected when a drag-mode drop is rejected', async () => {
    const user = userEvent.setup();
    mockStreamView = fixtureView('active-your-turn', { mode: 'drag' });
    mockSubmitMove = jest.fn((_move: Move) => false);
    jest.mocked(useMoveSubmit).mockReturnValue({
      ...defaultMoveSubmitResult(),
      feedback: {
        haptic: 'error',
        message: 'That space is already occupied.',
        tone: 'error',
      },
      submitMove: (...args: [Move]) =>
        mockSubmitMove(...args) as unknown as Promise<boolean>,
    });

    const { getByTestId, getByText, queryByTestId } = await render(
      <GameRouteScreen />,
    );

    await user.press(getByTestId('hand.card.5C'));
    await user.press(getByTestId('drag.drop.15C'));

    expect(mockSubmitMove).toHaveBeenCalledWith({
      position: '15C',
      type: 'place',
    });
    expect(getByTestId('drag.ghost.mock')).toBeTruthy();
    expect(getByTestId('hand.card.5C').props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(getByText('That space is already occupied.')).toBeTruthy();
    expect(queryByTestId('board.cell.15C.chip')).toBeNull();
  });

  it('submits a pending sequence choice for my seat and highlights the selected cells', async () => {
    const user = userEvent.setup();
    mockStreamView = fixtureView('sequence-choice');

    const { getByTestId } = await render(<GameRouteScreen />);

    expect(getByTestId('sequenceChoice.sheet')).toBeTruthy();
    expect(getByTestId('hand.card.5C').props.accessibilityState).toMatchObject({
      disabled: true,
    });
    expect(getByTestId('board.cell.19C.spotlight.target')).toBeTruthy();

    await user.press(getByTestId('sequenceChoice.submit'));

    expect(mockMutate).toHaveBeenCalledWith({
      cells: ['1AC', '1KC', '1QC', '1TC', '19C'],
      gameId: mockGameId,
      version: 12,
    });
  });

  it('shows a frozen sequence-choice banner without the sheet for another seat', async () => {
    mockStreamView = fixtureView('sequence-choice', {
      pendingChoice: {
        cells: ['23H', '24H', '25H', '26H', '27H', '28H'],
        placed: '23H',
        seat: 1,
      },
    });

    const { getByTestId, queryByTestId } = await render(<GameRouteScreen />);

    expect(queryByTestId('sequenceChoice.sheet')).toBeNull();
    expect(getByTestId('sequenceChoice.frozen')).toBeTruthy();
  });

  it('keeps the lobby branch intact', async () => {
    mockStreamView = fixtureView('lobby');
    const { getByTestId, queryByTestId } = await render(<GameRouteScreen />);

    expect(getByTestId('lobby.screen')).toBeTruthy();
    expect(queryByTestId('board.grid')).toBeNull();
  });

  it('keeps frozen games visible but disables play until the stream resumes', async () => {
    const user = userEvent.setup();
    const activeView = fixtureView('active-your-turn');
    const frozenView = {
      ...activeView,
      expiresAt: '2026-07-03T13:00:00.000Z',
      players: activeView.players.map((player) =>
        player.seat === 1 ? { ...player, connected: false } : player,
      ),
      status: 'frozen' as const,
    };
    mockStreamView = frozenView;
    const [firstFiveClubsTarget] = boardCellsFor('5', 'C');
    if (!firstFiveClubsTarget) {
      throw new Error('5C fixture target is missing');
    }

    const { getByTestId, getByText, queryByTestId, rerender } = await render(
      <GameRouteScreen />,
    );

    expect(getByTestId('board.grid')).toBeTruthy();
    expect(getByText('Game paused')).toBeTruthy();
    expect(
      getByText('Riya disconnected. Waiting for everyone to return.'),
    ).toBeTruthy();
    expect(getByTestId('hand.card.5C').props.accessibilityState).toMatchObject({
      disabled: true,
    });

    await user.press(getByTestId('hand.card.5C'));
    expect(
      queryByTestId(`board.cell.${firstFiveClubsTarget}.spotlight.target`),
    ).toBeNull();
    await user.press(getByTestId(`board.cell.${firstFiveClubsTarget}`));
    expect(mockSubmitMove).not.toHaveBeenCalled();

    mockStreamView = { ...activeView, status: 'active' };
    await rerender(<GameRouteScreen />);

    expect(getByText('Your turn')).toBeTruthy();
    expect(queryByTestId('game.connection.banner')).toBeNull();

    await user.press(getByTestId('hand.card.5C'));
    expect(
      getByTestId(`board.cell.${firstFiveClubsTarget}.spotlight.target`),
    ).toBeTruthy();
  });

  it('shows a resumable saved state with expiry messaging', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-03T12:00:00.000Z'));
    const expiresAt = '2026-07-05T12:00:00.000Z';
    const expectedExpiry = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(expiresAt));
    mockStreamView = fixtureView('active-your-turn', {
      expiresAt,
      status: 'saved',
    });

    const { getByTestId, getByText, queryByTestId } = await render(
      <GameRouteScreen />,
    );

    expect(getByTestId('game.saved')).toBeTruthy();
    expect(getByText('Game saved')).toBeTruthy();
    expect(getByText('Ready to resume')).toBeTruthy();
    expect(getByText(`Expires ${expectedExpiry}`)).toBeTruthy();
    expect(queryByTestId('game.placeholder')).toBeNull();
  });

  it('renders the finished game-over screen and dashboard action', async () => {
    const user = userEvent.setup();
    mockStreamView = fixtureView('game-over');
    const { getByTestId, getByText, queryByTestId } = await render(
      <GameRouteScreen />,
    );

    expect(getByTestId('game.over')).toBeTruthy();
    expect(getByText('Team 1 wins')).toBeTruthy();
    expect(getByText('Your team won.')).toBeTruthy();
    expect(queryByTestId('game.placeholder')).toBeNull();

    await user.press(getByTestId('game.over.dashboard'));

    expect(mockRouterReplace).toHaveBeenCalledWith('/');
  });

  it('starts a rematch from a finished game and navigates to the returned route', async () => {
    const user = userEvent.setup();
    mockStreamView = fixtureView('game-over');
    mockMutateAsync.mockResolvedValue({
      gameId: 'rematch-game-2',
      inviteCode: 'REMATCH2',
      rematchOf: mockGameId,
      status: 'lobby',
    });

    const { getByTestId } = await render(<GameRouteScreen />);

    await user.press(getByTestId('game.over.rematch'));

    expect(mockMutateAsync).toHaveBeenCalledWith({ gameId: mockGameId });
    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/game/rematch-game-2');
    });
  });

  it('shows finished-game rematch copy when rematch is no longer available', async () => {
    const user = userEvent.setup();
    mockStreamView = fixtureView('game-over');
    mockMutateAsync.mockRejectedValue({ data: { code: 'CONFLICT' } });

    const { getByTestId, getByText } = await render(<GameRouteScreen />);

    await user.press(getByTestId('game.over.rematch'));

    await waitFor(() => {
      expect(
        getByText('Rematch unavailable. This game is not finished yet.'),
      ).toBeTruthy();
    });
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});
