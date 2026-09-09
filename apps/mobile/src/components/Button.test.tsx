import { cleanup, fireEvent, render } from '@testing-library/react-native';

import { Button } from './Button.tsx';

afterEach(() => {
  cleanup();
});

describe('Button', () => {
  it('renders children and forwards testID', async () => {
    const { getByTestId, getByText } = await render(
      <Button testID="chrome.button.primary">Start game</Button>,
    );

    expect(getByText('Start game')).toBeTruthy();
    expect(getByTestId('chrome.button.primary')).toBeTruthy();
  });

  it('calls the press handler', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <Button onPress={onPress} testID="chrome.button.press">
        Deal
      </Button>,
    );

    fireEvent.press(getByTestId('chrome.button.press'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call the press handler when disabled', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <Button disabled onPress={onPress} testID="chrome.button.disabled">
        Pass
      </Button>,
    );

    const button = getByTestId('chrome.button.disabled');
    fireEvent.press(button);

    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    expect(onPress).not.toHaveBeenCalled();
  });

  it('accepts supported variants and sizes through the public API', async () => {
    const { getByTestId } = await render(
      <Button
        size="lg"
        testID="chrome.button.destructive"
        variant="destructive"
      >
        Resign
      </Button>,
    );

    expect(getByTestId('chrome.button.destructive')).toBeTruthy();
  });
});
