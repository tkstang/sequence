import { render, userEvent, waitFor } from '@testing-library/react-native';

import { CreateForm } from './CreateForm.tsx';

describe('CreateForm', () => {
  it('supports player count, mode, and timer settings from the web option list', async () => {
    const user = userEvent.setup();
    const onCreate = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, getByText } = await render(
      <CreateForm isSubmitting={false} onCreate={onCreate} />,
    );

    for (const count of [2, 3, 4, 6]) {
      expect(getByTestId(`create.players.${count}`)).toBeTruthy();
    }
    expect(getByTestId('create.mode.tap')).toBeTruthy();
    expect(getByTestId('create.mode.drag')).toBeTruthy();
    expect(getByText('Off')).toBeTruthy();
    expect(getByText('0:30')).toBeTruthy();
    expect(getByText('3:00')).toBeTruthy();
    expect(getByText('4:00')).toBeTruthy();
    expect(getByText('10:00')).toBeTruthy();

    await user.press(getByTestId('create.players.6'));
    await user.press(getByTestId('create.mode.drag'));
    await user.press(getByTestId('create.timer.240'));
    await user.press(getByTestId('create.submit'));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        playerCount: 6,
        mode: 'drag',
        timerSeconds: 240,
        local: false,
        opponentName: undefined,
      });
    });
  });

  it('forces local games to two players and validates an opponent name', async () => {
    const user = userEvent.setup();
    const onCreate = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, getByText, queryByText } = await render(
      <CreateForm isSubmitting={false} onCreate={onCreate} />,
    );

    await user.press(getByTestId('create.players.4'));
    await user.press(getByTestId('create.local.toggle'));

    expect(
      getByTestId('create.players.2').props.accessibilityState,
    ).toMatchObject({ selected: true });

    await user.press(getByTestId('create.submit'));

    expect(onCreate).not.toHaveBeenCalled();
    expect(getByText('Enter an opponent name.')).toBeTruthy();

    await user.type(getByTestId('create.local.opponentName'), 'Sarah');
    await user.press(getByTestId('create.submit'));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        playerCount: 2,
        mode: 'tap',
        timerSeconds: null,
        local: true,
        opponentName: 'Sarah',
      });
    });
    expect(queryByText('Enter an opponent name.')).toBeNull();
  });

  it('rejects local opponent names longer than forty characters', async () => {
    const user = userEvent.setup();
    const onCreate = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, getByText } = await render(
      <CreateForm isSubmitting={false} onCreate={onCreate} />,
    );

    await user.press(getByTestId('create.local.toggle'));
    await user.type(getByTestId('create.local.opponentName'), 'a'.repeat(41));
    await user.press(getByTestId('create.submit'));

    expect(onCreate).not.toHaveBeenCalled();
    expect(
      getByText('Opponent name must be 40 characters or fewer.'),
    ).toBeTruthy();
  });
});
