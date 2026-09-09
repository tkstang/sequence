import type { Card } from '@sequence/game-logic';
import { cleanup, render, userEvent } from '@testing-library/react-native';

import { HandoffScreen, visibleHandForSeat } from './HandoffScreen.tsx';

const outgoingHand = [
  { rank: '5', suit: 'C' },
  { rank: 'T', suit: 'H' },
] as const satisfies readonly Card[];

const incomingHand = [
  { rank: 'A', suit: 'H' },
  { rank: 'K', suit: 'D' },
] as const satisfies readonly Card[];

afterEach(() => {
  cleanup();
});

describe('HandoffScreen', () => {
  it('renders the incoming player prompt and reveal action without card labels', async () => {
    const user = userEvent.setup();
    const onReveal = jest.fn();

    const { getByTestId, getByText, queryByText } = await render(
      <HandoffScreen
        lastMoveLabel="5C to 15C"
        onReveal={onReveal}
        playerName="Riya"
      />,
    );

    expect(getByText('Pass to Riya')).toBeTruthy();
    expect(getByText('5C to 15C')).toBeTruthy();
    expect(queryByText('AH')).toBeNull();
    expect(queryByText('5C')).toBeNull();

    await user.press(getByTestId('handoff.confirm'));

    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it('returns no local hand while veiled and only the revealed seat hand after confirm', () => {
    expect(
      visibleHandForSeat({
        fallbackHand: outgoingHand,
        local: true,
        localHands: [outgoingHand, incomingHand],
        seat: 1,
        veiled: true,
      }),
    ).toEqual([]);
    expect(
      visibleHandForSeat({
        fallbackHand: outgoingHand,
        local: true,
        localHands: [outgoingHand, incomingHand],
        seat: 1,
        veiled: false,
      }),
    ).toEqual(incomingHand);
    expect(
      visibleHandForSeat({
        fallbackHand: outgoingHand,
        local: false,
        seat: 1,
        veiled: false,
      }),
    ).toEqual(outgoingHand);
  });
});
