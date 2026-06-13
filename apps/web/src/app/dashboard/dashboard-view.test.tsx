import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardView } from './dashboard-view.tsx';
import type { DashboardGame } from './dashboard-view.tsx';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function game(overrides: Partial<DashboardGame>): DashboardGame {
  return {
    gameId: 'g1',
    inviteCode: 'abc123',
    status: 'frozen',
    playerCount: 4,
    mode: 'tap',
    local: false,
    round: 6,
    expiresAt: new Date(Date.now() + 42 * 60_000).toISOString(),
    finishedAt: null,
    winnerTeam: null,
    endReason: null,
    mySeat: 0,
    myTeam: 1,
    opponents: ['Sarah', 'Ben'],
    won: false,
    ...overrides,
  };
}

describe('<DashboardView>', () => {
  it('renders both create CTAs', () => {
    render(<DashboardView userInitial="T" resumables={[]} recents={[]} />);
    expect(
      screen.getByRole('button', { name: /create game/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /pass & play/i }),
    ).toBeInTheDocument();
  });

  it('shows a FROZEN resumable with the all-must-return note and expiry', () => {
    render(
      <DashboardView
        userInitial="T"
        resumables={[game({ gameId: 'frz', status: 'frozen' })]}
        recents={[]}
      />,
    );
    expect(screen.getByText('FROZEN')).toBeInTheDocument();
    expect(screen.getByText(/everyone must return/i)).toBeInTheDocument();
    expect(screen.getByText(/expires in/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /rejoin/i })).toBeInTheDocument();
  });

  it('shows a SAVED resumable with a Resume link (no return note)', () => {
    render(
      <DashboardView
        userInitial="T"
        resumables={[game({ gameId: 'sv', status: 'saved' })]}
        recents={[]}
      />,
    );
    expect(screen.getByText('SAVED')).toBeInTheDocument();
    expect(screen.queryByText(/everyone must return/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /resume/i })).toBeInTheDocument();
  });

  it('labels local games in the recent results strip', () => {
    render(
      <DashboardView
        userInitial="T"
        resumables={[]}
        recents={[
          game({
            gameId: 'r1',
            status: 'finished',
            local: true,
            won: true,
            opponents: ['Sarah'],
          }),
        ]}
      />,
    );
    expect(screen.getByText('W')).toBeInTheDocument();
    expect(screen.getByText(/local vs Sarah/i)).toBeInTheDocument();
  });

  it('links to full history', () => {
    render(<DashboardView userInitial="T" resumables={[]} recents={[]} />);
    expect(screen.getByRole('link', { name: /full history/i })).toHaveAttribute(
      'href',
      '/history',
    );
  });
});
