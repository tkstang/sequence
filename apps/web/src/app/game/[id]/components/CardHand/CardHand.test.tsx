import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CardHand } from './CardHand.tsx';

const hand = [
  { rank: 'A', suit: 'C' },
  { rank: 'J', suit: 'S' },
  { rank: '9', suit: 'H' },
] as const;

describe('<CardHand>', () => {
  it('renders a peeking fan of card buttons', () => {
    render(<CardHand hand={hand} mode="tap" />);

    expect(
      screen.getByRole('region', { name: /your hand/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AC' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'JS' })).toBeInTheDocument();
  });

  it('raises and lowers from the hand handle', async () => {
    render(<CardHand hand={hand} mode="tap" />);

    await userEvent.click(screen.getByRole('button', { name: /raise hand/i }));
    expect(
      screen.getByRole('button', { name: /lower hand/i }),
    ).toBeInTheDocument();
  });

  it('raises when a card is tapped and reports selected card index', async () => {
    const onSelectCard = vi.fn();
    render(<CardHand hand={hand} mode="tap" onSelectCard={onSelectCard} />);

    await userEvent.click(screen.getByRole('button', { name: 'JS' }));
    expect(onSelectCard).toHaveBeenCalledWith({ rank: 'J', suit: 'S' }, 1);
  });

  it('marks dead cards only in tap mode', () => {
    const { rerender } = render(
      <CardHand hand={hand} mode="tap" deadCardIndexes={[2]} />,
    );
    expect(
      screen.getByRole('button', { name: /9H dead card/i }),
    ).toBeInTheDocument();

    rerender(<CardHand hand={hand} mode="drag" deadCardIndexes={[2]} />);
    expect(
      screen.queryByRole('button', { name: /9H dead card/i }),
    ).not.toBeInTheDocument();
  });

  it('reflects controlled selection', () => {
    render(<CardHand hand={hand} mode="tap" selectedIndex={0} />);
    expect(screen.getByRole('button', { name: 'AC' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('emits drag callbacks for hard-mode card turn-in', () => {
    const onCardDragStart = vi.fn();
    const onCardDragEnd = vi.fn();
    const { rerender } = render(
      <CardHand
        hand={hand}
        mode="drag"
        onCardDragStart={onCardDragStart}
        onCardDragEnd={onCardDragEnd}
      />,
    );
    const dataTransfer = { effectAllowed: '', setData: vi.fn() };
    const card = screen.getByRole('button', { name: 'JS' });

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragEnd(card, { dataTransfer });

    expect(card).toHaveAttribute('draggable', 'true');
    expect(onCardDragStart).toHaveBeenCalledWith({ rank: 'J', suit: 'S' }, 1);
    expect(onCardDragEnd).toHaveBeenCalled();

    rerender(
      <CardHand
        hand={hand}
        mode="tap"
        onCardDragStart={onCardDragStart}
        onCardDragEnd={onCardDragEnd}
      />,
    );
    expect(screen.getByRole('button', { name: 'JS' })).toHaveAttribute(
      'draggable',
      'false',
    );
  });
});
