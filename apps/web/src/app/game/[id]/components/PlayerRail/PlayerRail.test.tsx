import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { formatRemaining, PlayerRail } from './PlayerRail.tsx';
import type { PlayerRailProps } from './PlayerRail.tsx';

function player(seat: number, team: 1 | 2 | 3, name: string) {
  return {
    seat,
    team,
    name,
    isCreator: seat === 0,
    isGuest: seat !== 0,
    connected: true,
  };
}

function props(overrides: Partial<PlayerRailProps> = {}): PlayerRailProps {
  return {
    players: [player(0, 1, 'Host'), player(1, 2, 'Guest')],
    currentSeat: 1,
    round: 4,
    sequences: [{ id: 1, team: 1, cells: ['1AC', '1KC', '1QC', '1TC', '19C'] }],
    lastPlayedCards: { 0: { rank: 'A', suit: 'C' } },
    timerSeconds: 90,
    turnDeadlineAt: '2026-06-13T00:01:00.000Z',
    turnRemainingMs: null,
    status: 'active',
    nowMs: new Date('2026-06-13T00:00:12.000Z').getTime(),
    ...overrides,
  };
}

describe('<PlayerRail>', () => {
  it('renders player names, round, sequence counts, and last-played card', () => {
    render(<PlayerRail {...props()} />);

    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText('Guest')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('1/0/0')).toBeInTheDocument();
    expect(screen.getByAltText('AC last played')).toBeInTheDocument();
  });

  it('formats the active timer from the server deadline', () => {
    render(<PlayerRail {...props()} />);
    expect(screen.getByText('0:48')).toBeInTheDocument();
  });

  it('shows paused remaining time for frozen games', () => {
    render(
      <PlayerRail
        {...props({
          status: 'frozen',
          turnRemainingMs: 31_000,
        })}
      />,
    );
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(screen.getByText('0:31')).toBeInTheDocument();
  });

  it('omits timer display for untimed games', () => {
    render(<PlayerRail {...props({ timerSeconds: null })} />);
    expect(screen.queryByText('Timer')).not.toBeInTheDocument();
  });

  it('formats remaining milliseconds as m:ss', () => {
    expect(formatRemaining(61_000)).toBe('1:01');
    expect(formatRemaining(-1)).toBe('0:00');
  });
});
