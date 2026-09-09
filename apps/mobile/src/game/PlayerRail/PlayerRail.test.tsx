import type { SnapshotPlayer, SnapshotSequence } from '@sequence/client-state';
import { palette } from '@sequence/design-tokens';
import { cleanup, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

import { PlayerRail } from './PlayerRail.tsx';

afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

const players = [
  player(0, 1, 'Host', true),
  player(1, 2, 'Guest', true),
  player(2, 3, 'Rival', false),
] as const satisfies readonly SnapshotPlayer[];

const sequences = [
  { id: 1, team: 1, cells: ['1AC', '1KC', '1QC', '1TC', '19C'] },
  { id: 2, team: 2, cells: ['2AC', '2KC', '2QC', '2TC', '29C'] },
] as const satisfies readonly SnapshotSequence[];

function player(
  seat: number,
  team: 1 | 2 | 3,
  name: string,
  connected: boolean,
): SnapshotPlayer {
  return {
    connected,
    isCreator: seat === 0,
    isGuest: seat !== 0,
    name,
    seat,
    team,
  };
}

function styleFor(testNode: { props: { style?: unknown } }): ViewStyle {
  return StyleSheet.flatten(testNode.props.style) ?? {};
}

describe('PlayerRail', () => {
  it('renders seats, team colors, connection state, and current-turn highlight', async () => {
    const { getAllByText, getByTestId, getByText } = await render(
      <PlayerRail
        currentSeat={1}
        players={players}
        round={4}
        sequences={sequences}
        status="active"
        timerSeconds={90}
        turnDeadlineAt="2026-07-03T12:01:00.000Z"
      />,
    );

    expect(getByText('Host')).toBeTruthy();
    expect(getByText('Guest')).toBeTruthy();
    expect(getByText('Rival')).toBeTruthy();
    expect(getByText('Seat 1')).toBeTruthy();
    expect(getByText('Seat 2')).toBeTruthy();
    expect(getByText('Seat 3')).toBeTruthy();
    expect(getAllByText('Connected')).toHaveLength(2);
    expect(getByText('Offline')).toBeTruthy();
    expect(styleFor(getAllByText('Connected')[0]!)).not.toMatchObject({
      position: 'absolute',
    });
    expect(styleFor(getByText('Offline'))).not.toMatchObject({
      position: 'absolute',
    });
    expect(getByText('Round 4')).toBeTruthy();
    expect(getByText('Seq 1/1/0')).toBeTruthy();

    expect(styleFor(getByTestId('game.player.0.team')).backgroundColor).toBe(
      palette.light.teamBlue,
    );
    expect(styleFor(getByTestId('game.player.1.team')).backgroundColor).toBe(
      palette.light.teamGreen,
    );
    expect(styleFor(getByTestId('game.player.2.team')).backgroundColor).toBe(
      palette.light.teamRed,
    );
    expect(getByTestId('game.player.1').props.accessibilityState).toMatchObject(
      { selected: true },
    );
    expect(styleFor(getByTestId('game.player.1'))).toMatchObject({
      borderColor: palette.light.highlight,
      borderWidth: 2,
    });
    expect(getByTestId('game.player.1.turn')).toBeTruthy();
    expect(getByTestId('game.player.2.offline')).toBeTruthy();
  });
});
