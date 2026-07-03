import { render, userEvent, waitFor } from '@testing-library/react-native';

type MockQueryResult = {
  data?: unknown;
  error?: unknown;
  isError: boolean;
  isPending: boolean;
};

var mockRouterReplace = jest.fn();
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
    health: {
      me: {
        queryOptions: jest.fn(() => ({
          queryKey: ['health', 'me'],
          queryFn: jest.fn(),
        })),
      },
      ping: {
        queryOptions: jest.fn(() => ({
          queryKey: ['health', 'ping'],
          queryFn: jest.fn(),
        })),
      },
    },
  })),
}));

jest.mock('expo-router', () => ({
  router: {
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
    'health.me': {
      data: { user: { email: 'probe@example.test', name: 'Probe User' } },
      isError: false,
      isPending: false,
    },
    'health.ping': {
      data: { pong: true },
      isError: false,
      isPending: false,
    },
  };
  mockRouterReplace = jest.fn();
  mockSignOut = jest.fn();
});

describe('HomeScreen', () => {
  it('renders the app name, health.me email, and ping result', async () => {
    const { getByTestId, getByText } = await render(<HomeScreen />);

    expect(getByText('Sequence Online')).toBeTruthy();
    expect(getByText('probe@example.test')).toBeTruthy();
    expect(getByText('pong: true')).toBeTruthy();
    expect(getByTestId('home.ping')).toBeTruthy();
    expect(getByTestId('home.logout')).toBeTruthy();
  });

  it('redirects to login when the session probe is unauthorized', async () => {
    mockQueries['health.me'] = {
      error: { data: { code: 'UNAUTHORIZED' } },
      isError: true,
      isPending: false,
    };

    await render(<HomeScreen />);

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('./login');
    });
  });

  it('signs out and returns to login', async () => {
    const user = userEvent.setup();
    const { getByTestId } = await render(<HomeScreen />);

    await user.press(getByTestId('home.logout'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith();
    });
    expect(mockRouterReplace).toHaveBeenCalledWith('./login');
  });
});
