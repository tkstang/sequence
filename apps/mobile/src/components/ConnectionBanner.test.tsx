import { cleanup, render } from '@testing-library/react-native';

import { ConnectionBanner } from './ConnectionBanner.tsx';

afterEach(() => {
  cleanup();
});

describe('ConnectionBanner', () => {
  it('renders nothing when the stream is live', async () => {
    const { queryByTestId } = await render(
      <ConnectionBanner connectionState="live" />,
    );

    expect(queryByTestId('game.connection.banner')).toBeNull();
  });

  it('shows reconnecting state with the game connection testID', async () => {
    const { getByTestId, getByText } = await render(
      <ConnectionBanner connectionState="reconnecting" />,
    );

    expect(getByTestId('game.connection.banner')).toBeTruthy();
    expect(getByText('Reconnecting')).toBeTruthy();
  });

  it('names the disconnected player when the game is frozen', async () => {
    const { getByTestId, getByText } = await render(
      <ConnectionBanner
        connectionState="live"
        disconnectedPlayerName="Bob"
        expiresAt="2026-07-03T13:00:00.000Z"
      />,
    );

    expect(getByTestId('game.connection.banner')).toBeTruthy();
    expect(getByText('Game paused')).toBeTruthy();
    expect(
      getByText('Bob disconnected. Waiting for everyone to return.'),
    ).toBeTruthy();
  });
});
