import { cleanup, fireEvent, render } from '@testing-library/react-native';

import { TextField } from './TextField.tsx';

afterEach(() => {
  cleanup();
});

describe('TextField', () => {
  it('renders value, placeholder, and forwards testID', async () => {
    const { getByDisplayValue, getByPlaceholderText, getByTestId } =
      await render(
        <TextField
          placeholder="Display name"
          testID="chrome.text-field.name"
          value="Ada"
        />,
      );

    expect(getByDisplayValue('Ada')).toBeTruthy();
    expect(getByPlaceholderText('Display name')).toBeTruthy();
    expect(getByTestId('chrome.text-field.name')).toBeTruthy();
  });

  it('calls the change handler with the next value', async () => {
    const onChangeText = jest.fn();
    const { getByTestId } = await render(
      <TextField
        onChangeText={onChangeText}
        testID="chrome.text-field.change"
      />,
    );

    fireEvent(getByTestId('chrome.text-field.change'), 'change', {
      nativeEvent: { text: 'Grace', selection: { start: 5, end: 5 } },
    });

    expect(onChangeText).toHaveBeenCalledWith('Grace');
  });

  it('does not call the change handler when disabled', async () => {
    const onChangeText = jest.fn();
    const { getByTestId } = await render(
      <TextField
        disabled
        onChangeText={onChangeText}
        testID="chrome.text-field.disabled"
      />,
    );

    const field = getByTestId('chrome.text-field.disabled');
    fireEvent(field, 'change', {
      nativeEvent: { text: 'Blocked', selection: { start: 7, end: 7 } },
    });

    expect(field.props.disabled).toBe(true);
    expect(field.props.editable).toBe(false);
    expect(onChangeText).not.toHaveBeenCalled();
  });

  it('accepts supported sizes through the public API', async () => {
    const { getByTestId } = await render(
      <TextField size="lg" testID="chrome.text-field.large" />,
    );

    expect(getByTestId('chrome.text-field.large')).toBeTruthy();
  });
});
