import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    result: 'loss',
    ...overrides,
  };
}

function renderDashboard(
  overrides: Partial<Parameters<typeof DashboardView>[0]> = {},
) {
  return render(
    <DashboardView
      userInitial="T"
      onLogout={vi.fn()}
      resumables={[]}
      recents={[]}
      {...overrides}
    />,
  );
}

describe('<DashboardView>', () => {
  it('renders both create CTAs as links without nested buttons', () => {
    renderDashboard();
    const create = screen.getByRole('link', { name: /create game/i });
    const local = screen.getByRole('link', { name: /pass & play/i });
    expect(create).toHaveAttribute('href', '/create');
    expect(local).toHaveAttribute('href', '/create?local=1');
    expect(create.querySelector('button')).toBeNull();
    expect(local.querySelector('button')).toBeNull();
  });

  it('offers a logout control', async () => {
    const onLogout = vi.fn();
    renderDashboard({ onLogout });
    await userEvent.click(screen.getByRole('button', { name: /log out/i }));
    expect(onLogout).toHaveBeenCalled();
  });

  it('keeps the account mark in the header', () => {
    renderDashboard();
    expect(screen.getByLabelText('Your account')).toBeInTheDocument();
  });

  it('shows a FROZEN resumable with the all-must-return note and expiry', () => {
    renderDashboard({
      resumables: [game({ gameId: 'frz', status: 'frozen' })],
    });
    expect(screen.getByText('FROZEN')).toBeInTheDocument();
    expect(screen.getByText(/everyone must return/i)).toBeInTheDocument();
    expect(screen.getByText(/expires in/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /rejoin/i })).toBeInTheDocument();
  });

  it('shows a SAVED resumable with a Resume link (no return note)', () => {
    renderDashboard({
      resumables: [game({ gameId: 'sv', status: 'saved' })],
    });
    expect(screen.getByText('SAVED')).toBeInTheDocument();
    expect(screen.queryByText(/everyone must return/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /resume/i })).toBeInTheDocument();
  });

  it('labels local games in the recent results strip', () => {
    renderDashboard({
      recents: [
        game({
          gameId: 'r1',
          status: 'finished',
          local: true,
          result: 'win',
          opponents: ['Sarah'],
        }),
      ],
    });
    expect(screen.getByText('W')).toBeInTheDocument();
    expect(screen.getByText(/local vs Sarah/i)).toBeInTheDocument();
  });

  it('shows no-result for a no-winner FFA non-conceder recent', () => {
    renderDashboard({
      recents: [
        game({
          gameId: 'r1',
          status: 'finished',
          winnerTeam: null,
          endReason: 'concede',
          result: 'none',
        }),
      ],
    });
    expect(screen.getByText(/no result/i)).toBeInTheDocument();
    expect(screen.queryByText('L')).not.toBeInTheDocument();
  });

  it('links to full history', () => {
    renderDashboard();
    expect(screen.getByRole('link', { name: /full history/i })).toHaveAttribute(
      'href',
      '/history',
    );
  });
});
