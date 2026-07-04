import { getGameFixture, stateFromSnapshot } from '@sequence/client-state';
import type { GameViewState } from '@sequence/client-state';
import { cleanup, render, userEvent } from '@testing-library/react-native';

import { GameOver } from './GameOver.tsx';

function fixtureView(overrides: Partial<GameViewState> = {}): GameViewState {
  const fixture = getGameFixture('game-over');
  if (!fixture) {
    throw new Error('missing game-over fixture');
  }

  return {
    ...stateFromSnapshot(fixture.snapshot),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe('GameOver', () => {
  it('renders a two-team win with winner names and represented sequences', async () => {
    const onRematch = jest.fn();
    const onDashboard = jest.fn();
    const view = fixtureView();

    const { getByTestId, getByText } = await render(
      <GameOver
        concededTeam={view.concededTeam}
        endReason={view.endReason}
        mySeat={view.mySeat}
        myTeam={1}
        onDashboard={onDashboard}
        onRematch={onRematch}
        players={view.players}
        sequences={view.sequences}
        winnerTeam={view.winnerTeam}
      />,
    );

    expect(getByTestId('game.over')).toBeTruthy();
    expect(getByText('Team 1 wins')).toBeTruthy();
    expect(getByText('Your team won.')).toBeTruthy();
    expect(getByText('You, Marcus')).toBeTruthy();
    expect(getByTestId('game.over.sequence.1')).toBeTruthy();
    expect(getByText('1WW, 1AC, 1KC, 1QC, 1TC')).toBeTruthy();

    const user = userEvent.setup();
    await user.press(getByTestId('game.over.rematch'));
    await user.press(getByTestId('game.over.dashboard'));

    expect(onRematch).toHaveBeenCalledTimes(1);
    expect(onDashboard).toHaveBeenCalledTimes(1);
  });

  it('renders a two-team loss from the local team perspective', async () => {
    const view = fixtureView({ mySeat: 1, winnerTeam: 1 });

    const { getByText } = await render(
      <GameOver
        concededTeam={view.concededTeam}
        endReason="win"
        mySeat={view.mySeat}
        myTeam={2}
        onDashboard={jest.fn()}
        onRematch={jest.fn()}
        players={view.players}
        sequences={view.sequences}
        winnerTeam={view.winnerTeam}
      />,
    );

    expect(getByText('Team 1 wins')).toBeTruthy();
    expect(getByText('Your team lost.')).toBeTruthy();
  });

  it('renders concede as the web title and attributes the conceding team', async () => {
    const view = fixtureView({
      concededTeam: 2,
      endReason: 'concede',
      winnerTeam: 1,
    });

    const { getByText } = await render(
      <GameOver
        concededTeam={view.concededTeam}
        endReason={view.endReason}
        mySeat={view.mySeat}
        myTeam={1}
        onDashboard={jest.fn()}
        onRematch={jest.fn()}
        players={view.players}
        sequences={view.sequences}
        winnerTeam={view.winnerTeam}
      />,
    );

    expect(getByText('Game conceded')).toBeTruthy();
    expect(getByText('Team 2 conceded')).toBeTruthy();
    expect(getByText('Your team won.')).toBeTruthy();
  });

  it('handles a three-team concede without a recorded winner', async () => {
    const view = fixtureView({
      concededTeam: 2,
      endReason: 'concede',
      players: [
        {
          connected: true,
          isCreator: true,
          isGuest: false,
          name: 'Ari',
          seat: 0,
          team: 1,
        },
        {
          connected: true,
          isCreator: false,
          isGuest: false,
          name: 'Bea',
          seat: 1,
          team: 2,
        },
        {
          connected: true,
          isCreator: false,
          isGuest: false,
          name: 'Cam',
          seat: 2,
          team: 3,
        },
      ],
      sequences: [],
      teams: [1, 2, 3],
      winnerTeam: null,
    });

    const { getByText, queryByTestId } = await render(
      <GameOver
        concededTeam={view.concededTeam}
        endReason={view.endReason}
        mySeat={view.mySeat}
        myTeam={3}
        onDashboard={jest.fn()}
        onRematch={jest.fn()}
        players={view.players}
        sequences={view.sequences}
        winnerTeam={view.winnerTeam}
      />,
    );

    expect(getByText('Game conceded')).toBeTruthy();
    expect(getByText('Team 2 conceded')).toBeTruthy();
    expect(getByText('No winner was recorded.')).toBeTruthy();
    expect(queryByTestId('game.over.sequence.1')).toBeNull();
  });

  it('handles timer-expired finishes with a winner', async () => {
    const view = fixtureView({ endReason: 'expired', winnerTeam: 2 });

    const { getByText } = await render(
      <GameOver
        concededTeam={view.concededTeam}
        endReason={view.endReason}
        mySeat={view.mySeat}
        myTeam={1}
        onDashboard={jest.fn()}
        onRematch={jest.fn()}
        players={view.players}
        sequences={view.sequences}
        winnerTeam={view.winnerTeam}
      />,
    );

    expect(getByText('Team 2 wins')).toBeTruthy();
    expect(getByText('Timer expired.')).toBeTruthy();
    expect(getByText('Your team lost.')).toBeTruthy();
  });
});
