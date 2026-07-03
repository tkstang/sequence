import { render, userEvent, waitFor } from '@testing-library/react-native';

import type { DashboardGame } from './GameCard.tsx';

type MockQueryResult = {
  data?: { recents: DashboardGame[]; resumables: DashboardGame[] };
  error?: unknown;
  isError: boolean;
  isFetching: boolean;
  isPending: boolean;
  refetch: jest.Mock;
};

var mockRouterPush = jest.fn();
var mockRouterReplace = jest.fn();
var mockSignOut = jest.fn();
var mockMyGamesQuery: MockQueryResult;

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => mockMyGamesQuery),
}));

jest.mock('../../api/client.ts', () => ({
  useTRPC: jest.fn(() => ({
    game: {
      myGames: {
        queryOptions: jest.fn(() => ({
          queryKey: ['game', 'myGames'],
          queryFn: jest.fn(),
        })),
      },
    },
  })),
}));

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
    replace: (...args: unknown[]) => mockRouterReplace(...args),
  },
}));

jest.mock('../../auth/client.ts', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
  useSession: jest.fn(() => ({
    data: { user: { email: 'ada@example.test', name: 'Ada Lovelace' } },
    error: null,
    isPending: false,
  })),
}));

import HomeScreen from '../../app/index.tsx';

function game(overrides: Partial<DashboardGame>): DashboardGame {
  return {
    gameId: 'saved-1',
    inviteCode: 'abc123',
    status: 'saved',
    playerCount: 4,
    mode: 'tap',
    local: false,
    round: 3,
    expiresAt: null,
    finishedAt: null,
    winnerTeam: null,
    endReason: null,
    mySeat: 0,
    myTeam: 1,
    opponents: ['Maya'],
    result: 'none',
    ...overrides,
  };
}

beforeEach(() => {
  mockRouterPush = jest.fn();
  mockRouterReplace = jest.fn();
  mockSignOut = jest.fn();
  mockMyGamesQuery = {
    data: {
      resumables: [
        game({
          gameId: 'lobby-1',
          opponents: ['Maya', 'Ben'],
          status: 'lobby',
        }),
        game({
          gameId: 'saved-1',
          opponents: ['Sam'],
          status: 'saved',
        }),
      ],
      recents: [
        game({
          endReason: 'win',
          gameId: 'finished-1',
          opponents: ['Nia'],
          result: 'win',
          status: 'finished',
          winnerTeam: 1,
        }),
      ],
    },
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: jest.fn(),
  };
});

describe('DashboardScreen', () => {
  it('renders resumables and recents with status, roster, and result', async () => {
    const { getByTestId, getByText } = await render(<HomeScreen />);

    expect(getByText('Your games')).toBeTruthy();
    expect(getByTestId('dashboard.resumable.lobby-1')).toBeTruthy();
    expect(getByText('LOBBY')).toBeTruthy();
    expect(getByText('vs Maya, Ben')).toBeTruthy();
    expect(getByTestId('dashboard.resumable.saved-1')).toBeTruthy();
    expect(getByText('SAVED')).toBeTruthy();
    expect(getByTestId('dashboard.recent.finished-1')).toBeTruthy();
    expect(getByText('W')).toBeTruthy();
    expect(getByText('vs Nia')).toBeTruthy();
  });

  it('navigates lobby cards to the game route and finished cards to game-over', async () => {
    const user = userEvent.setup();
    const { getByTestId } = await render(<HomeScreen />);

    await user.press(getByTestId('dashboard.resumable.lobby-1'));
    expect(mockRouterPush).toHaveBeenCalledWith('/game/lobby-1');

    await user.press(getByTestId('dashboard.recent.finished-1'));
    expect(mockRouterPush).toHaveBeenCalledWith(
      '/game/finished-1?view=game-over',
    );
  });

  it('renders empty states for both sections', async () => {
    mockMyGamesQuery.data = { recents: [], resumables: [] };
    const { getByText } = await render(<HomeScreen />);

    expect(getByText('No games to resume right now.')).toBeTruthy();
    expect(getByText('No finished games yet.')).toBeTruthy();
  });

  it('refreshes the myGames query from pull-to-refresh', async () => {
    const { getByTestId } = await render(<HomeScreen />);

    getByTestId('dashboard.scroll').props.refreshControl.props.onRefresh();

    expect(mockMyGamesQuery.refetch).toHaveBeenCalledWith();
  });

  it('redirects to login on unauthorized dashboard errors', async () => {
    mockMyGamesQuery = {
      ...mockMyGamesQuery,
      error: { data: { code: 'UNAUTHORIZED' } },
      isError: true,
    };

    await render(<HomeScreen />);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('./login');
    });
  });

  it('signs out from the dashboard header', async () => {
    const user = userEvent.setup();
    const { getByTestId } = await render(<HomeScreen />);

    await user.press(getByTestId('dashboard.logout'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith();
    });
    expect(mockRouterReplace).toHaveBeenCalledWith('./login');
  });
});
