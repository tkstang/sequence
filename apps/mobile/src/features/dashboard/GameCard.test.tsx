import { render, userEvent } from '@testing-library/react-native';
import { View } from 'react-native';

import { GameCard, type DashboardGame } from './GameCard.tsx';

const baseGame: DashboardGame = {
  gameId: 'saved-1',
  inviteCode: 'abc123',
  status: 'saved',
  playerCount: 4,
  mode: 'tap',
  local: false,
  round: 6,
  expiresAt: '2026-07-06T12:00:00.000Z',
  finishedAt: null,
  winnerTeam: null,
  endReason: null,
  mySeat: 0,
  myTeam: 1,
  opponents: ['Maya', 'Ben'],
  result: 'none',
};

function game(overrides: Partial<DashboardGame> = {}): DashboardGame {
  return { ...baseGame, ...overrides };
}

describe('GameCard', () => {
  it('renders a resumable status, roster, and round metadata', async () => {
    const onPress = jest.fn();
    const { getByTestId, getByText } = await render(
      <GameCard game={game()} kind="resumable" onPress={onPress} />,
    );

    expect(getByTestId('dashboard.resumable.saved-1')).toBeTruthy();
    expect(getByText('SAVED')).toBeTruthy();
    expect(getByText('vs Maya, Ben')).toBeTruthy();
    expect(getByText(/Round 6/)).toBeTruthy();
  });

  it('renders a frozen resumable with the all-return note', async () => {
    const { getByText } = await render(
      <GameCard
        game={game({ gameId: 'frozen-1', status: 'frozen' })}
        kind="resumable"
        onPress={jest.fn()}
      />,
    );

    expect(getByText('FROZEN')).toBeTruthy();
    expect(getByText(/everyone must return/i)).toBeTruthy();
  });

  it('renders recent win, loss, and no-result outcomes', async () => {
    const { getAllByText, getByText } = await render(
      <View>
        <GameCard
          game={game({
            gameId: 'finished-1',
            status: 'finished',
            result: 'win',
          })}
          kind="recent"
          onPress={jest.fn()}
        />
        <GameCard
          game={game({
            gameId: 'finished-2',
            status: 'finished',
            result: 'loss',
          })}
          kind="recent"
          onPress={jest.fn()}
        />
        <GameCard
          game={game({
            endReason: 'concede',
            gameId: 'finished-3',
            result: 'none',
            status: 'finished',
          })}
          kind="recent"
          onPress={jest.fn()}
        />
      </View>,
    );

    expect(getByText('W')).toBeTruthy();
    expect(getAllByText('vs Maya, Ben')).toHaveLength(3);
    expect(getByText('L')).toBeTruthy();
    expect(getByText('No result')).toBeTruthy();
    expect(getByText(/concede/i)).toBeTruthy();
  });

  it('flags local resumables and invokes navigation on press', async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    const { getByTestId, getByText } = await render(
      <GameCard
        game={game({ gameId: 'local-1', local: true, opponents: ['Sam'] })}
        kind="resumable"
        onPress={onPress}
      />,
    );

    expect(getByTestId('dashboard.resumable.local-1.local')).toBeTruthy();
    expect(getByText('LOCAL')).toBeTruthy();
    expect(getByText('local vs Sam')).toBeTruthy();
    await user.press(getByTestId('dashboard.resumable.local-1'));

    expect(onPress).toHaveBeenCalledWith(
      game({ gameId: 'local-1', local: true, opponents: ['Sam'] }),
    );
  });
});
