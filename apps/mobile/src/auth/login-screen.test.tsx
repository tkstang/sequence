import {
  cleanup,
  render,
  userEvent,
  waitFor,
} from '@testing-library/react-native';

var mockRouterReplace = jest.fn();
var mockRouterPush = jest.fn();
var mockSignInEmail = jest.fn();
var mockGuestGames: {
  gameId: string;
  guestName: string;
  inviteCode: string;
  joinedAt: string;
  lastKnownStatus: string;
}[] = [];

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
    replace: (...args: unknown[]) => mockRouterReplace(...args),
  },
}));

jest.mock('./client.ts', () => ({
  signIn: {
    email: (...args: unknown[]) => mockSignInEmail(...args),
  },
}));

jest.mock('./guest-store.ts', () => ({
  listGuestGames: jest.fn(async () => mockGuestGames),
}));

import LoginScreen from '../app/(auth)/login.tsx';

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  mockGuestGames = [];
});

describe('LoginScreen', () => {
  it('validates required email and password fields', async () => {
    const user = userEvent.setup();
    const { getByTestId, getByText } = await render(<LoginScreen />);

    await user.press(getByTestId('auth.login.submit'));

    await waitFor(() => {
      expect(getByText('Enter a valid email address.')).toBeTruthy();
    });
    expect(mockSignInEmail).not.toHaveBeenCalled();
  });

  it('submits email credentials through the auth client', async () => {
    const user = userEvent.setup();
    mockSignInEmail.mockResolvedValue({
      data: { user: { email: 'ada@example.test' } },
      error: null,
    });
    const { getByTestId } = await render(<LoginScreen />);

    await user.type(getByTestId('auth.login.email'), 'ada@example.test');
    await user.type(
      getByTestId('auth.login.password'),
      'correct horse battery staple',
    );
    await user.press(getByTestId('auth.login.submit'));

    await waitFor(() => {
      expect(mockSignInEmail).toHaveBeenCalledWith({
        email: 'ada@example.test',
        password: 'correct horse battery staple',
      });
    });
    expect(mockRouterReplace).toHaveBeenCalledWith('/');
  });

  it('renders bad-credentials errors from the auth client', async () => {
    const user = userEvent.setup();
    mockSignInEmail.mockResolvedValue({
      data: null,
      error: { message: 'Invalid email or password' },
    });
    const { getByTestId, getByText } = await render(<LoginScreen />);

    await user.type(getByTestId('auth.login.email'), 'ada@example.test');
    await user.type(getByTestId('auth.login.password'), 'wrong-password');
    await user.press(getByTestId('auth.login.submit'));

    await waitFor(() => {
      expect(getByText('Invalid email or password')).toBeTruthy();
    });
    expect(getByTestId('auth.login.error')).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('links to the signup route', async () => {
    const user = userEvent.setup();
    const { getByTestId } = await render(<LoginScreen />);

    await user.press(getByTestId('auth.login.signup'));

    expect(mockRouterPush).toHaveBeenCalledWith('./signup');
  });

  it('renders guest games from the registry and continues to a game route', async () => {
    mockGuestGames = [
      {
        gameId: 'guest-game-1',
        guestName: 'Ada',
        inviteCode: 'ABCD2345EF',
        joinedAt: '2026-07-03T12:00:00.000Z',
        lastKnownStatus: 'active',
      },
    ];
    const user = userEvent.setup();
    const { getByTestId, getByText } = await render(<LoginScreen />);

    await waitFor(() => {
      expect(getByTestId('auth.guest.continue.guest-game-1')).toBeTruthy();
    });
    expect(getByText('Ada')).toBeTruthy();
    expect(getByText('ABCD2345EF')).toBeTruthy();

    await user.press(getByTestId('auth.guest.continue.guest-game-1'));

    expect(mockRouterPush).toHaveBeenCalledWith('/game/guest-game-1');
  });
});
