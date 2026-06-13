import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GameOver } from './GameOver.tsx';

const players = [
  {
    seat: 0,
    team: 1,
    name: 'Host',
    isCreator: true,
    isGuest: false,
    connected: true,
  },
  {
    seat: 1,
    team: 2,
    name: 'Guest',
    isCreator: false,
    isGuest: true,
    connected: true,
  },
] as const;

describe('<GameOver>', () => {
  it('renders winner details and navigation actions', async () => {
    const onRematch = vi.fn();
    render(
      <GameOver
        winnerTeam={2}
        endReason="win"
        players={players}
        onRematch={onRematch}
      />,
    );

    expect(screen.getByText('Team 2 wins')).toBeInTheDocument();
    expect(screen.getByText('Guest')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    await userEvent.click(screen.getByRole('button', { name: /rematch/i }));
    expect(onRematch).toHaveBeenCalled();
  });

  it('disables rematch while a rematch mutation is pending', () => {
    render(
      <GameOver
        winnerTeam={null}
        endReason="concede"
        players={players}
        isRematching
        onRematch={vi.fn()}
      />,
    );

    expect(screen.getByText('Game conceded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rematch/i })).toBeDisabled();
  });
});
