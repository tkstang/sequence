import { cleanup, render } from '@testing-library/react-native';

import { Screen } from './Screen.tsx';

afterEach(() => {
  cleanup();
});

describe('Screen', () => {
  it('renders header and content and forwards testID', async () => {
    const { getByTestId, getByText } = await render(
      <Screen
        header={<Screen.Header title="Lobby" />}
        testID="chrome.screen.lobby"
      >
        Waiting for players
      </Screen>,
    );

    expect(getByText('Lobby')).toBeTruthy();
    expect(getByText('Waiting for players')).toBeTruthy();
    expect(getByTestId('chrome.screen.lobby')).toBeTruthy();
  });

  it('renders scrollable content when scroll is enabled', async () => {
    const { getByTestId, getByText } = await render(
      <Screen scroll testID="chrome.screen.scroll">
        Match history
      </Screen>,
    );

    expect(getByText('Match history')).toBeTruthy();
    expect(getByTestId('chrome.screen.scroll.scroll')).toBeTruthy();
  });

  it('renders non-scroll content by default', async () => {
    const { getByTestId, queryByTestId } = await render(
      <Screen testID="chrome.screen.static">Dashboard</Screen>,
    );

    expect(getByTestId('chrome.screen.static.content')).toBeTruthy();
    expect(queryByTestId('chrome.screen.static.scroll')).toBeNull();
  });
});
