import { useMutation, useQuery } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  userEvent,
  waitFor,
} from '@testing-library/react-native';

import type { JoinPreview } from './PreviewCard.tsx';

type MockQueryResult = {
  data?: JoinPreview;
  error?: unknown;
  isError: boolean;
  isPending: boolean;
  refetch: jest.Mock;
};

var mockRouterPush = jest.fn();
var mockRouterReplace = jest.fn();
var mockQueryResult: MockQueryResult;
var mockJoinResult: {
  guestToken?: string;
  gameId: string;
  isGuest: boolean;
  seat: number;
  team: number;
};
var mockJoinError: unknown;
var mockRouteParams: Record<string, string | string[] | undefined> = {};
var mockSession: { data: { user?: unknown } | null } = {
  data: { user: { email: 'ada@example.test' } },
};
var mockSaveGuestGame = jest.fn();
var mockSaveGuestToken = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(
    (options: {
      onError?: (error: unknown) => void;
      onSuccess?: (result: unknown) => void;
    }) => ({
      isPending: false,
      mutateAsync: jest.fn(async (_values: unknown) => {
        if (mockJoinError) {
          options.onError?.(mockJoinError);
          throw mockJoinError;
        }
        options.onSuccess?.(mockJoinResult);
        return mockJoinResult;
      }),
    }),
  ),
  useQuery: jest.fn(() => mockQueryResult),
}));

jest.mock('../../api/client.ts', () => ({
  useTRPC: jest.fn(() => ({
    game: {
      join: {
        mutationOptions: jest.fn((options: unknown) => options),
      },
      preview: {
        queryOptions: jest.fn((input: unknown) => ({
          queryKey: ['game', 'preview', input],
          queryFn: jest.fn(),
        })),
      },
    },
  })),
}));

jest.mock('../../auth/client.ts', () => ({
  useSession: () => mockSession,
}));

jest.mock('../../auth/guest-store.ts', () => ({
  saveGuestGame: (...args: unknown[]) => mockSaveGuestGame(...args),
  saveGuestToken: (...args: unknown[]) => mockSaveGuestToken(...args),
}));

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
    replace: (...args: unknown[]) => mockRouterReplace(...args),
  },
  useLocalSearchParams: () => mockRouteParams,
}));

import JoinPreviewScreen from '../../app/join/[code].tsx';
import JoinCodeEntryScreen from '../../app/join/index.tsx';

function preview(overrides: Partial<JoinPreview> = {}): JoinPreview {
  return {
    gameId: 'game-123',
    inviteCode: 'ABCD2345EF',
    local: false,
    mode: 'tap',
    playerCount: 4,
    players: [
      {
        isCreator: true,
        isGuest: false,
        name: 'Ada',
        seat: 0,
        team: 1,
      },
      {
        isCreator: false,
        isGuest: true,
        name: 'Couch Guest',
        seat: 1,
        team: 2,
      },
    ],
    status: 'lobby',
    timerSeconds: 90,
    ...overrides,
  };
}

beforeEach(() => {
  mockRouterPush = jest.fn();
  mockRouterReplace = jest.fn();
  mockRouteParams = {};
  mockJoinError = undefined;
  mockJoinResult = {
    gameId: 'game-123',
    isGuest: false,
    seat: 1,
    team: 2,
  };
  mockSession = { data: { user: { email: 'ada@example.test' } } };
  mockSaveGuestGame = jest.fn();
  mockSaveGuestToken = jest.fn();
  mockQueryResult = {
    data: preview(),
    isError: false,
    isPending: false,
    refetch: jest.fn(),
  };
  jest.mocked(useMutation).mockClear();
  jest.mocked(useQuery).mockClear();
});

afterEach(() => {
  cleanup();
});

describe('JoinCodeEntryScreen', () => {
  it('validates non-empty invite codes', async () => {
    const user = userEvent.setup();
    const { getByTestId, getByText } = await render(<JoinCodeEntryScreen />);

    await user.press(getByTestId('join.entry.submit'));

    expect(getByTestId('join.entry.error')).toBeTruthy();
    expect(getByText('Enter an invite code.')).toBeTruthy();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('normalizes lower-case pasted codes with spaces and hyphens', async () => {
    const user = userEvent.setup();
    const { getByTestId } = await render(<JoinCodeEntryScreen />);

    await user.type(getByTestId('join.entry.code'), ' abcd-2345 ef ');
    await user.press(getByTestId('join.entry.submit'));

    expect(mockRouterPush).toHaveBeenCalledWith('/join/ABCD2345EF');
  });
});

describe('JoinPreviewScreen', () => {
  it('renders preview roster and settings from game.preview', async () => {
    mockRouteParams = { code: 'abcd-2345 ef' };

    const { getByLabelText, getByTestId, getByText } = await render(
      <JoinPreviewScreen />,
    );

    expect(jest.mocked(useQuery).mock.calls[0]![0]).toMatchObject({
      enabled: true,
      queryKey: [
        'game',
        'preview',
        {
          inviteCode: 'ABCD2345EF',
        },
      ],
    });
    expect(getByText('ABCD2345EF')).toBeTruthy();
    expect(getByText('4 players')).toBeTruthy();
    expect(getByText('tap mode')).toBeTruthy();
    expect(getByText('90s turns')).toBeTruthy();
    expect(getByText('Ada')).toBeTruthy();
    expect(getByText('Host')).toBeTruthy();
    expect(getByText('Couch Guest')).toBeTruthy();
    expect(getByText('guest')).toBeTruthy();
    expect(getByLabelText('Join game')).toBeTruthy();
    expect(getByTestId('join.preview.join')).toBeTruthy();
  });

  it('maps NOT_FOUND to an unknown-code state', async () => {
    mockRouteParams = { code: 'NOPE' };
    mockQueryResult = {
      error: { data: { code: 'NOT_FOUND' } },
      isError: true,
      isPending: false,
      refetch: jest.fn(),
    };

    const { getByText } = await render(<JoinPreviewScreen />);

    expect(getByText('Unknown invite code')).toBeTruthy();
    expect(
      getByText('Check the code and try again, or ask the host for a new one.'),
    ).toBeTruthy();
  });

  it('renders generic preview errors separately from unknown invite codes', async () => {
    const user = userEvent.setup();
    mockRouteParams = { code: 'ABCD2345EF' };
    mockQueryResult = {
      error: { data: { code: 'INTERNAL_SERVER_ERROR' } },
      isError: true,
      isPending: false,
      refetch: jest.fn(),
    };

    const { getByTestId, getByText, queryByText } = await render(
      <JoinPreviewScreen />,
    );

    expect(getByTestId('join.preview.error')).toBeTruthy();
    expect(getByText('Could not load invite')).toBeTruthy();
    expect(queryByText('Unknown invite code')).toBeNull();

    await user.press(getByTestId('join.preview.retry'));

    expect(mockQueryResult.refetch).toHaveBeenCalledWith();
  });

  it('joins as a registered user and navigates to the game route', async () => {
    mockRouteParams = { code: 'ABCD2345EF' };
    const user = userEvent.setup();
    const { getByTestId } = await render(<JoinPreviewScreen />);

    await user.press(getByTestId('join.preview.join'));

    const mutation = jest.mocked(useMutation).mock.results.at(-1)!.value;
    await waitFor(() => {
      expect(mutation.mutateAsync).toHaveBeenCalledWith({
        inviteCode: 'ABCD2345EF',
      });
      expect(mockRouterReplace).toHaveBeenCalledWith('/game/game-123');
    });
  });

  it('uses the preview invite code for join mutations', async () => {
    mockRouteParams = { code: 'route-code' };
    mockQueryResult.data = preview({ inviteCode: 'SERVERCODE' });
    const user = userEvent.setup();
    const { getByTestId } = await render(<JoinPreviewScreen />);

    await user.press(getByTestId('join.preview.join'));

    const mutation = jest.mocked(useMutation).mock.results.at(-1)!.value;
    await waitFor(() => {
      expect(mutation.mutateAsync).toHaveBeenCalledWith({
        inviteCode: 'SERVERCODE',
      });
    });
  });

  it('stores token and registry metadata when joining as a guest', async () => {
    mockSession = { data: null };
    mockRouteParams = { code: 'ABCD2345EF' };
    mockJoinResult = {
      gameId: 'game-123',
      guestToken: 'raw-guest-token',
      isGuest: true,
      seat: 2,
      team: 2,
    };
    const user = userEvent.setup();
    const { getByTestId } = await render(<JoinPreviewScreen />);

    fireEvent.changeText(getByTestId('join.preview.guestName'), 'Couch Friend');
    await user.press(getByTestId('join.preview.guestJoin'));

    const mutation = jest.mocked(useMutation).mock.results.at(-1)!.value;
    await waitFor(() => {
      expect(mutation.mutateAsync).toHaveBeenCalledWith({
        guestName: 'Couch Friend',
        inviteCode: 'ABCD2345EF',
        returnGuestToken: true,
      });
      expect(mockSaveGuestToken).toHaveBeenCalledWith(
        'game-123',
        'raw-guest-token',
      );
      expect(mockSaveGuestGame).toHaveBeenCalledWith(
        expect.objectContaining({
          gameId: 'game-123',
          guestName: 'Couch Friend',
          inviteCode: 'ABCD2345EF',
          lastKnownStatus: 'lobby',
        }),
      );
      expect(mockRouterReplace).toHaveBeenCalledWith('/game/game-123');
    });
  });

  it('renders a friendly full-game state', async () => {
    mockRouteParams = { code: 'FULLGAME' };
    mockQueryResult.data = preview({
      playerCount: 2,
      players: preview().players.slice(0, 2),
    });

    const { getByText } = await render(<JoinPreviewScreen />);

    expect(getByText('This game is full.')).toBeTruthy();
  });

  it('renders a friendly started-game state', async () => {
    mockRouteParams = { code: 'STARTED' };
    mockQueryResult.data = preview({ status: 'active' });

    const started = await render(<JoinPreviewScreen />);

    expect(
      started.getByText('This game has already started and cannot be joined.'),
    ).toBeTruthy();
  });

  it('renders a friendly local-game state', async () => {
    mockRouteParams = { code: 'LOCALGAME' };
    mockQueryResult.data = preview({ local: true });

    const local = await render(<JoinPreviewScreen />);

    expect(
      local.getByText(
        'This is a local pass-and-play game and cannot be joined remotely.',
      ),
    ).toBeTruthy();
  });

  it('maps CONFLICT join errors to friendly messages', async () => {
    mockRouteParams = { code: 'ABCD2345EF' };
    mockJoinError = { data: { code: 'CONFLICT' }, message: 'game is full' };
    const user = userEvent.setup();
    const { getByTestId, getByText } = await render(<JoinPreviewScreen />);

    await user.press(getByTestId('join.preview.join'));

    await waitFor(() => {
      expect(getByTestId('join.preview.joinError')).toBeTruthy();
      expect(
        getByText(
          'This game is no longer available to join. Refresh and try again.',
        ),
      ).toBeTruthy();
    });
  });
});
