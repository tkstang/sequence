import { getGameFixture, type GameSnapshotView } from '@sequence/client-state';
import {
  cleanup,
  fireEvent,
  render,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import { Share } from 'react-native';

import { LobbyTeams, lobbyIsStartable } from './LobbyTeams.tsx';

function lobbyFixture(): GameSnapshotView {
  const fixture = getGameFixture('lobby');
  if (!fixture) {
    throw new Error('Missing lobby fixture');
  }
  return fixture.snapshot;
}

function player(
  seat: number,
  team: 1 | 2 | 3,
  name: string,
  isCreator = false,
) {
  return {
    connected: true,
    isCreator,
    isGuest: !isCreator,
    name,
    seat,
    team,
  };
}

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

describe('LobbyTeams', () => {
  it('renders a live roster with teams, invite summary, and turn order', async () => {
    const snapshot = lobbyFixture();
    const { getByText } = await render(
      <LobbyTeams
        inviteCode={snapshot.inviteCode}
        mode={snapshot.mode}
        mySeat={snapshot.mySeat}
        playerCount={4}
        players={snapshot.players}
        timerSeconds={snapshot.timerSeconds}
      />,
    );

    expect(getByText('DEV123')).toBeTruthy();
    expect(getByText('4 players - 2 teams - tap mode - no timer')).toBeTruthy();
    expect(getByText('Blue')).toBeTruthy();
    expect(getByText('Green')).toBeTruthy();
    expect(getByText('You')).toBeTruthy();
    expect(getByText('Riya')).toBeTruthy();
    expect(getByText('Marcus')).toBeTruthy();
    expect(getByText('Lena')).toBeTruthy();
    expect(getByText('Turn order: You -> Riya -> Marcus -> Lena')).toBeTruthy();
  });

  it('lets the current player choose an available team slot', async () => {
    const user = userEvent.setup();
    const onJoinTeam = jest.fn();
    const { getByTestId } = await render(
      <LobbyTeams
        inviteCode="TEAMUP"
        mode="tap"
        mySeat={1}
        onJoinTeam={onJoinTeam}
        playerCount={4}
        players={[player(0, 1, 'Host', true), player(1, 2, 'Guest')]}
        timerSeconds={null}
      />,
    );

    await user.press(getByTestId('lobby.team.1.slot.1'));

    expect(onJoinTeam).toHaveBeenCalledWith(1);
  });

  it('shows creator controls and gates start until teams are legal', async () => {
    const user = userEvent.setup();
    const onKick = jest.fn();
    const onRandomize = jest.fn();
    const onStart = jest.fn();
    const { getByTestId, getByText, rerender } = await render(
      <LobbyTeams
        inviteCode="HOST01"
        mode="tap"
        mySeat={0}
        onKick={onKick}
        onRandomize={onRandomize}
        onStart={onStart}
        playerCount={4}
        players={[
          player(0, 1, 'Host', true),
          player(1, 1, 'Guest'),
          player(2, 1, 'Maya'),
          player(3, 2, 'Ben'),
        ]}
        timerSeconds={90}
      />,
    );

    expect(getByTestId('lobby.kick.1')).toBeTruthy();
    expect(getByText('Maya')).toBeTruthy();
    expect(getByTestId('lobby.randomize')).toBeTruthy();
    expect(getByTestId('lobby.start').props.accessibilityState).toMatchObject({
      disabled: true,
    });

    await user.press(getByTestId('lobby.kick.1'));
    await user.press(getByTestId('lobby.randomize'));

    expect(onKick).toHaveBeenCalledWith(1);
    expect(onRandomize).toHaveBeenCalledTimes(1);

    rerender(
      <LobbyTeams
        inviteCode="HOST01"
        mode="tap"
        mySeat={0}
        onStart={onStart}
        playerCount={4}
        players={[
          player(0, 1, 'Host', true),
          player(1, 2, 'Guest'),
          player(2, 1, 'Maya'),
          player(3, 2, 'Ben'),
        ]}
        timerSeconds={90}
      />,
    );

    await waitFor(() => {
      expect(getByTestId('lobby.start').props.accessibilityState).toMatchObject(
        {
          disabled: false,
        },
      );
    });
    fireEvent.press(getByTestId('lobby.start'));

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('shares the invite code with the native Share API', async () => {
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });
    const user = userEvent.setup();
    const { getByTestId, getByText } = await render(
      <LobbyTeams
        inviteCode="SHARE1"
        mode="drag"
        mySeat={0}
        playerCount={2}
        players={[player(0, 1, 'Host', true), player(1, 2, 'Guest')]}
        timerSeconds={30}
      />,
    );

    await user.press(getByTestId('lobby.share'));

    await waitFor(() => {
      expect(Share.share).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('SHARE1'),
          url: 'sequence://join/SHARE1',
        }),
      );
      expect(getByText('Invite shared')).toBeTruthy();
    });
  });

  it('renders a six-player three-team lobby layout', async () => {
    const players = [
      player(0, 1, 'A', true),
      player(1, 2, 'B'),
      player(2, 3, 'C'),
      player(3, 1, 'D'),
      player(4, 2, 'E'),
      player(5, 3, 'F'),
    ];
    const { getByText, getByTestId } = await render(
      <LobbyTeams
        inviteCode="SIXERS"
        mode="tap"
        mySeat={0}
        playerCount={6}
        players={players}
        timerSeconds={null}
      />,
    );

    expect(getByText('6 players - 3 teams - tap mode - no timer')).toBeTruthy();
    expect(getByText('Blue')).toBeTruthy();
    expect(getByText('Green')).toBeTruthy();
    expect(getByText('Red')).toBeTruthy();
    expect(getByTestId('lobby.team.3')).toBeTruthy();
    expect(lobbyIsStartable({ playerCount: 6, players })).toBe(true);
  });
});
