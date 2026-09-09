import type { SnapshotBoardCell } from '@sequence/client-state';
import type { Card, Position } from '@sequence/game-logic';
import {
  cleanup,
  render,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

import { CardHand } from './CardHand.tsx';

jest.mock('../cards/CardFace.tsx', () => {
  const { Text } = require('react-native') as typeof import('react-native');

  return {
    CardFace: ({
      card,
      testID,
    }: {
      card: { rank: string; suit: string };
      testID?: string;
    }) => <Text testID={testID}>{`${card.rank}${card.suit}`}</Text>,
  };
});

afterEach(() => {
  cleanup();
});

const hand = [
  { rank: 'A', suit: 'C' },
  { rank: 'K', suit: 'H' },
  { rank: 'J', suit: 'S' },
] as const satisfies readonly Card[];

function styleFor(testNode: { props: { style?: unknown } }): ViewStyle {
  return StyleSheet.flatten(testNode.props.style) ?? {};
}

function deadAceBoard(): Readonly<
  Record<Position, SnapshotBoardCell | undefined>
> {
  return {
    '1AC': { chip: 1 },
    '2AC': { chip: 2 },
  };
}

describe('CardHand', () => {
  it('renders hand fixtures as bottom-docked cards with stable testIDs', async () => {
    const { getByTestId } = await render(
      <CardHand board={{}} hand={hand} mode="tap" />,
    );

    expect(getByTestId('hand.card.AC')).toBeTruthy();
    expect(getByTestId('hand.card.KH')).toBeTruthy();
    expect(getByTestId('hand.card.JS')).toBeTruthy();
    expect(styleFor(getByTestId('hand.dock'))).toMatchObject({
      bottom: 0,
      position: 'absolute',
    });
  });

  it('toggles selected cards internally and reports selection changes', async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();
    const { getByTestId } = await render(
      <CardHand
        board={{}}
        hand={hand}
        mode="tap"
        onSelectionChange={onSelectionChange}
      />,
    );

    await user.press(getByTestId('hand.card.AC'));

    await waitFor(() => {
      expect(
        getByTestId('hand.card.AC').props.accessibilityState,
      ).toMatchObject({ selected: true });
    });
    expect(onSelectionChange).toHaveBeenLastCalledWith(hand[0], 0);

    await user.press(getByTestId('hand.card.AC'));

    await waitFor(() => {
      expect(
        getByTestId('hand.card.AC').props.accessibilityState,
      ).toMatchObject({ selected: false });
    });
    expect(onSelectionChange).toHaveBeenLastCalledWith(null, null);
  });

  it('renders externally controlled selected visual state', async () => {
    const { getByTestId } = await render(
      <CardHand board={{}} hand={hand} mode="tap" selectedIndex={1} />,
    );

    expect(getByTestId('hand.card.KH').props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(styleFor(getByTestId('hand.card.KH'))).toMatchObject({
      borderWidth: 2,
    });
  });

  it('badges dead cards from the snapshot board', async () => {
    const { getByTestId, queryByTestId } = await render(
      <CardHand board={deadAceBoard()} hand={hand} mode="drag" />,
    );

    expect(getByTestId('hand.card.AC.dead')).toBeTruthy();
    expect(queryByTestId('hand.card.KH.dead')).toBeNull();
  });

  it('does not badge dead cards in tap mode', async () => {
    const { queryByTestId } = await render(
      <CardHand board={deadAceBoard()} hand={hand} mode="tap" />,
    );

    expect(queryByTestId('hand.card.AC.dead')).toBeNull();
  });

  it('shows dead-card turn-in affordance only in drag-mode games', async () => {
    const { getByTestId, queryByTestId, rerender } = await render(
      <CardHand
        board={deadAceBoard()}
        hand={hand}
        mode="tap"
        onTurnInDeadCard={jest.fn()}
      />,
    );

    expect(queryByTestId('hand.card.AC.turnIn')).toBeNull();

    await rerender(
      <CardHand
        board={deadAceBoard()}
        hand={hand}
        mode="drag"
        onTurnInDeadCard={jest.fn()}
      />,
    );

    expect(getByTestId('hand.card.AC.turnIn')).toBeTruthy();
  });

  it('turns in a dead card without toggling selection', async () => {
    const user = userEvent.setup();
    const onSelectionChange = jest.fn();
    const onTurnInDeadCard = jest.fn();
    const { getByTestId } = await render(
      <CardHand
        board={deadAceBoard()}
        hand={hand}
        mode="drag"
        onSelectionChange={onSelectionChange}
        onTurnInDeadCard={onTurnInDeadCard}
      />,
    );

    await user.press(getByTestId('hand.card.AC.turnIn'));

    expect(onTurnInDeadCard).toHaveBeenCalledWith(hand[0], 0);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it('disables dead-card turn-in controls with the rest of the hand', async () => {
    const user = userEvent.setup();
    const onTurnInDeadCard = jest.fn();
    const { getByTestId } = await render(
      <CardHand
        board={deadAceBoard()}
        disabled
        hand={hand}
        mode="drag"
        onTurnInDeadCard={onTurnInDeadCard}
      />,
    );

    expect(
      getByTestId('hand.card.AC.turnIn').props.accessibilityState,
    ).toMatchObject({
      disabled: true,
    });

    await user.press(getByTestId('hand.card.AC.turnIn'));

    expect(onTurnInDeadCard).not.toHaveBeenCalled();
  });
});
