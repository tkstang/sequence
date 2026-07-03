import { useMutation } from '@tanstack/react-query';
import { render, userEvent, waitFor } from '@testing-library/react-native';

var mockRouterReplace = jest.fn();
var mockMutationResult:
  | {
      gameId: string;
      inviteCode: string;
      local: boolean;
      status: 'active' | 'lobby';
    }
  | undefined;
var mockMutationError: Error | undefined;

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(
    (options: {
      onError?: (error: Error) => void;
      onSuccess?: (result: unknown) => void;
    }) => ({
      isPending: false,
      mutateAsync: jest.fn(async (_values: unknown) => {
        if (mockMutationError) {
          options.onError?.(mockMutationError);
          throw mockMutationError;
        }
        const result = mockMutationResult ?? {
          gameId: 'game-remote',
          inviteCode: 'abc123',
          local: false,
          status: 'lobby',
        };
        options.onSuccess?.(result);
        return result;
      }),
    }),
  ),
}));

jest.mock('../../api/client.ts', () => ({
  useTRPC: jest.fn(() => ({
    game: {
      create: {
        mutationOptions: jest.fn((options: unknown) => options),
      },
    },
  })),
}));

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
  },
}));

import CreateScreen from '../../app/create.tsx';

beforeEach(() => {
  mockRouterReplace = jest.fn();
  mockMutationResult = undefined;
  mockMutationError = undefined;
  jest.mocked(useMutation).mockClear();
});

describe('CreateScreen', () => {
  it('creates a remote game and lands in the lobby route', async () => {
    const user = userEvent.setup();
    const { getByTestId } = await render(<CreateScreen />);

    await user.press(getByTestId('create.players.3'));
    await user.press(getByTestId('create.mode.drag'));
    await user.press(getByTestId('create.timer.180'));
    await user.press(getByTestId('create.submit'));

    const mutation = jest.mocked(useMutation).mock.results[0]!.value;

    await waitFor(() => {
      expect(mutation.mutateAsync).toHaveBeenCalledWith({
        playerCount: 3,
        mode: 'drag',
        timerSeconds: 180,
        local: false,
        opponentName: undefined,
      });
      expect(mockRouterReplace).toHaveBeenCalledWith('/game/game-remote');
    });
  });

  it('creates a local game and lands in the active game route', async () => {
    mockMutationResult = {
      gameId: 'game-local',
      inviteCode: 'local1',
      local: true,
      status: 'active',
    };
    const user = userEvent.setup();
    const { getByTestId } = await render(<CreateScreen />);

    await user.press(getByTestId('create.local.toggle'));
    await user.type(getByTestId('create.local.opponentName'), 'Nia');
    await user.press(getByTestId('create.submit'));

    const mutation = jest.mocked(useMutation).mock.results[0]!.value;

    await waitFor(() => {
      expect(mutation.mutateAsync).toHaveBeenCalledWith({
        playerCount: 2,
        mode: 'tap',
        timerSeconds: null,
        local: true,
        opponentName: 'Nia',
      });
      expect(mockRouterReplace).toHaveBeenCalledWith('/game/game-local');
    });
  });

  it('renders create errors from game.create', async () => {
    mockMutationError = new Error('Unauthorized');
    const user = userEvent.setup();
    const { getByTestId, getByText } = await render(<CreateScreen />);

    await user.press(getByTestId('create.submit'));

    await waitFor(() => {
      expect(getByText('Unauthorized')).toBeTruthy();
    });
  });
});
