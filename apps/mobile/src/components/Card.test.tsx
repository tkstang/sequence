import { cleanup, render } from '@testing-library/react-native';

import { Card } from './Card.tsx';

afterEach(() => {
  cleanup();
});

describe('Card', () => {
  it('renders children and forwards testID', async () => {
    const { getByTestId, getByText } = await render(
      <Card testID="chrome.card.root">Table settings</Card>,
    );

    expect(getByText('Table settings')).toBeTruthy();
    expect(getByTestId('chrome.card.root')).toBeTruthy();
  });

  it('accepts supported variants and elevations through the public API', async () => {
    const { getByTestId } = await render(
      <Card elevation="raised" testID="chrome.card.accent" variant="accent">
        Current turn
      </Card>,
    );

    expect(getByTestId('chrome.card.accent')).toBeTruthy();
  });
});
