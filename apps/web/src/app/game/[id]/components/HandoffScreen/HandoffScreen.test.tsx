import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HandoffScreen, visibleHandForSeat } from './HandoffScreen.tsx';

const hostHand = [
  { rank: 'A', suit: 'C' },
  { rank: 'K', suit: 'D' },
] as const;
const guestHand = [
  { rank: 'Q', suit: 'H' },
  { rank: 'J', suit: 'S' },
] as const;

describe('<HandoffScreen>', () => {
  it('renders a veil action without rendering card labels', async () => {
    const onReveal = vi.fn();
    render(
      <HandoffScreen
        playerName="Guest"
        lastMoveLabel="Host played AC"
        onReveal={onReveal}
      />,
    );

    expect(screen.getByText('Pass to Guest')).toBeInTheDocument();
    expect(screen.queryByText('QH')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /show hand/i }));
    expect(onReveal).toHaveBeenCalled();
  });

  it('veils local hands and returns only the active revealed seat', () => {
    expect(
      visibleHandForSeat({
        local: true,
        localHands: [hostHand, guestHand],
        fallbackHand: hostHand,
        seat: 1,
        veiled: true,
      }),
    ).toEqual([]);
    expect(
      visibleHandForSeat({
        local: true,
        localHands: [hostHand, guestHand],
        fallbackHand: hostHand,
        seat: 1,
        veiled: false,
      }),
    ).toEqual(guestHand);
    expect(
      visibleHandForSeat({
        local: false,
        fallbackHand: hostHand,
        seat: 1,
        veiled: false,
      }),
    ).toEqual(hostHand);
  });
});
