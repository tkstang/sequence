import {
  cleanup,
  render,
  userEvent,
  waitFor,
} from '@testing-library/react-native';

var mockRouterReplace = jest.fn();
var mockRouterPush = jest.fn();
var mockSignUpEmail = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
    replace: (...args: unknown[]) => mockRouterReplace(...args),
  },
}));

jest.mock('../../auth/client.ts', () => ({
  signUp: {
    email: (...args: unknown[]) => mockSignUpEmail(...args),
  },
}));

import SignupScreen from './signup.tsx';

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('SignupScreen', () => {
  it('validates required signup fields', async () => {
    const user = userEvent.setup();
    const { getByTestId, getByText } = await render(<SignupScreen />);

    await user.press(getByTestId('auth.signup.submit'));

    await waitFor(() => {
      expect(getByText('Enter your name, email, and a password.')).toBeTruthy();
    });
    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it('submits signup credentials through the auth client', async () => {
    const user = userEvent.setup();
    mockSignUpEmail.mockResolvedValue({
      data: { user: { email: 'grace@example.test' } },
      error: null,
    });
    const { getByTestId } = await render(<SignupScreen />);

    await user.type(getByTestId('auth.signup.name'), 'Grace Hopper');
    await user.type(getByTestId('auth.signup.email'), 'grace@example.test');
    await user.type(getByTestId('auth.signup.password'), 'navy-cobol-1952');
    await user.press(getByTestId('auth.signup.submit'));

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith({
        email: 'grace@example.test',
        name: 'Grace Hopper',
        password: 'navy-cobol-1952',
      });
    });
    expect(mockRouterReplace).toHaveBeenCalledWith('/');
  });

  it('renders signup errors from the auth client', async () => {
    const user = userEvent.setup();
    mockSignUpEmail.mockResolvedValue({
      data: null,
      error: { message: 'User already exists' },
    });
    const { getByTestId, getByText } = await render(<SignupScreen />);

    await user.type(getByTestId('auth.signup.name'), 'Grace Hopper');
    await user.type(getByTestId('auth.signup.email'), 'grace@example.test');
    await user.type(getByTestId('auth.signup.password'), 'navy-cobol-1952');
    await user.press(getByTestId('auth.signup.submit'));

    await waitFor(() => {
      expect(getByText('User already exists')).toBeTruthy();
    });
    expect(getByTestId('auth.signup.error')).toBeTruthy();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });
});
