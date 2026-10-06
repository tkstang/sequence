import { render, userEvent, waitFor } from '@testing-library/react-native';

type MockQueryResult = {
  data?: unknown;
  error?: unknown;
  isError: boolean;
  isFetching: boolean;
  isPending: boolean;
  refetch: jest.Mock;
};

var mockRouterReplace = jest.fn();
var mockRouterPush = jest.fn();
var mockSignOut = jest.fn();
var mockQueries: Record<string, MockQueryResult> = {};

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn((options: { queryKey: string[] }) => {
    const key = options.queryKey.join('.');
    return mockQueries[key];
  }),
}));

jest.mock('../api/client.ts', () => ({
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

jest.mock('../auth/client.ts', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
  useSession: jest.fn(() => ({
    data: { user: { email: 'ada@example.test' } },
    error: null,
    isPending: false,
    isRefetching: false,
  })),
}));

import HomeScreen from '../app/index.tsx';

beforeEach(() => {
  mockQueries = {
    'game.myGames': {
      data: {
        recents: [],
        resumables: [],
      },
      isError: false,
      isFetching: false,
      isPending: false,
      refetch: jest.fn(),
    },
  };
  mockRouterReplace = jest.fn();
  mockRouterPush = jest.fn();
  mockSignOut = jest.fn();
});

describe('HomeScreen', () => {
  it('renders the dashboard shell and empty states', async () => {
    const { getByTestId, getByText } = await render(<HomeScreen />);

    expect(getByText('Sequence Online')).toBeTruthy();
    expect(getByText('No games to resume right now.')).toBeTruthy();
    expect(getByText('No finished games yet.')).toBeTruthy();
    expect(getByTestId('dashboard.settings')).toBeTruthy();
  });

  it('redirects to login when the dashboard query is unauthorized', async () => {
    mockQueries['game.myGames'] = {
      error: { data: { code: 'UNAUTHORIZED' } },
      isError: true,
      isFetching: false,
      isPending: false,
      refetch: jest.fn(),
    };

    await render(<HomeScreen />);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('./login');
    });
  });

  it('opens settings from the dashboard actions', async () => {
    const user = userEvent.setup();
    const { getByTestId } = await render(<HomeScreen />);

    await user.press(getByTestId('dashboard.settings'));

    expect(mockRouterPush).toHaveBeenCalledWith('./settings');
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
