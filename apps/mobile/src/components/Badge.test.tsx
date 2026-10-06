import { cleanup, render } from '@testing-library/react-native';

import { Badge } from './Badge.tsx';

afterEach(() => {
  cleanup();
});

describe('Badge', () => {
  it('renders children and forwards testID', async () => {
    const { getByTestId, getByText } = await render(
      <Badge testID="chrome.badge.status">Ready</Badge>,
    );

    expect(getByText('Ready')).toBeTruthy();
    expect(getByTestId('chrome.badge.status')).toBeTruthy();
  });

  it('accepts supported variants and sizes through the public API', async () => {
    const { getByTestId } = await render(
      <Badge size="lg" testID="chrome.badge.team-blue" variant="teamBlue">
        Blue team
      </Badge>,
    );

    expect(getByTestId('chrome.badge.team-blue')).toBeTruthy();
  });
});
