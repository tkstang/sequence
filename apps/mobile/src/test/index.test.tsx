import { render, userEvent, waitFor } from '@testing-library/react-native';

var mockRouterReplace = jest.fn();
var mockSignOut = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: { pong: true },
    isError: false,
    isPending: false,
  })),
}));

jest.mock('../api/client.ts', () => ({
  useTRPC: jest.fn(() => ({
    health: {
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

describe('HomeScreen', () => {
  it('renders the app name and ping result', async () => {
    const { getByTestId, getByText } = await render(<HomeScreen />);

    expect(getByText('Sequence Online')).toBeTruthy();
    expect(getByText('ada@example.test')).toBeTruthy();
    expect(getByText('pong: true')).toBeTruthy();
    expect(getByTestId('home.ping')).toBeTruthy();
    expect(getByTestId('home.logout')).toBeTruthy();
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
