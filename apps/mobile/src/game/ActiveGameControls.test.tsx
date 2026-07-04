import { cleanup, render, userEvent } from '@testing-library/react-native';

import { ActiveGameControls } from './ActiveGameControls.tsx';

const basePlayers = [
  {
    connected: true,
    isCreator: true,
    isGuest: false,
    name: 'Alex',
    seat: 0,
    team: 1,
  },
  {
    connected: true,
    isCreator: false,
    isGuest: false,
    name: 'Blair',
    seat: 1,
    team: 2,
  },
] as const;

afterEach(() => {
  cleanup();
});

describe('ActiveGameControls', () => {
  it('confirms save & exit and submits the version-guarded payload', async () => {
    const user = userEvent.setup();
    const onSaveAndExit = jest.fn();

    const { getByTestId, queryByTestId } = await render(
      <ActiveGameControls
        gameId="game-1"
        local={false}
        onConcede={jest.fn()}
        onSaveAndExit={onSaveAndExit}
        players={basePlayers}
        version={12}
      />,
    );

    await user.press(getByTestId('game.lifecycle.save'));

    expect(getByTestId('game.lifecycle.save.confirm')).toBeTruthy();
    expect(queryByTestId('game.lifecycle.concede')).toBeNull();

    await user.press(getByTestId('game.lifecycle.save.confirm'));

    expect(onSaveAndExit).toHaveBeenCalledWith({
      gameId: 'game-1',
      version: 12,
    });
  });

  it('hides save & exit when the snapshot roster contains a guest', async () => {
    const { queryByTestId, getByTestId } = await render(
      <ActiveGameControls
        gameId="game-1"
        local={false}
        onConcede={jest.fn()}
        onSaveAndExit={jest.fn()}
        players={[{ ...basePlayers[0], isGuest: true }, basePlayers[1]]}
        version={12}
      />,
    );

    expect(queryByTestId('game.lifecycle.save')).toBeNull();
    expect(getByTestId('game.lifecycle.concede')).toBeTruthy();
  });

  it('keeps save & exit available for local games with guest roster seats', async () => {
    const { getByTestId } = await render(
      <ActiveGameControls
        gameId="game-1"
        local
        onConcede={jest.fn()}
        onSaveAndExit={jest.fn()}
        players={[{ ...basePlayers[0], isGuest: true }, basePlayers[1]]}
        version={12}
      />,
    );

    expect(getByTestId('game.lifecycle.save')).toBeTruthy();
  });

  it('confirms concede and submits the version-guarded payload', async () => {
    const user = userEvent.setup();
    const onConcede = jest.fn();

    const { getByTestId, queryByTestId } = await render(
      <ActiveGameControls
        gameId="game-1"
        local={false}
        onConcede={onConcede}
        onSaveAndExit={jest.fn()}
        players={basePlayers}
        version={12}
      />,
    );

    await user.press(getByTestId('game.lifecycle.concede'));

    expect(getByTestId('game.lifecycle.concede.confirm')).toBeTruthy();
    expect(queryByTestId('game.lifecycle.save')).toBeNull();

    await user.press(getByTestId('game.lifecycle.concede.confirm'));

    expect(onConcede).toHaveBeenCalledWith({ gameId: 'game-1', version: 12 });
  });

  it('disables lifecycle controls while a mutation is pending', async () => {
    const user = userEvent.setup();
    const onSaveAndExit = jest.fn();
    const onConcede = jest.fn();

    const { getByTestId } = await render(
      <ActiveGameControls
        gameId="game-1"
        isPending
        local={false}
        onConcede={onConcede}
        onSaveAndExit={onSaveAndExit}
        players={basePlayers}
        version={12}
      />,
    );

    expect(
      getByTestId('game.lifecycle.save').props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(
      getByTestId('game.lifecycle.concede').props.accessibilityState,
    ).toMatchObject({ disabled: true });

    await user.press(getByTestId('game.lifecycle.save'));
    await user.press(getByTestId('game.lifecycle.concede'));

    expect(onSaveAndExit).not.toHaveBeenCalled();
    expect(onConcede).not.toHaveBeenCalled();
  });

  it('renders lifecycle errors inside the controls area', async () => {
    const { getByText } = await render(
      <ActiveGameControls
        errorMessage="Game changed. Live updates will refresh it."
        gameId="game-1"
        local={false}
        onConcede={jest.fn()}
        onSaveAndExit={jest.fn()}
        players={basePlayers}
        version={12}
      />,
    );

    expect(
      getByText('Game changed. Live updates will refresh it.'),
    ).toBeTruthy();
  });
});
