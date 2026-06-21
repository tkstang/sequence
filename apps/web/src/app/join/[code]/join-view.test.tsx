import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { JoinView } from './join-view.tsx';
import type { JoinPreview } from './join-view.tsx';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

function preview(overrides: Partial<JoinPreview> = {}): JoinPreview {
  return {
    gameId: 'g1',
    inviteCode: 'abc123',
    status: 'lobby',
    playerCount: 4,
    mode: 'tap',
    timerSeconds: null,
    local: false,
    players: [
      { seat: 0, team: 1, name: 'Sarah', isCreator: true, isGuest: false },
    ],
    ...overrides,
  };
}

describe('<JoinView>', () => {
  it('renders the roster and settings', () => {
    render(
      <JoinView
        preview={preview()}
        isAuthenticated={false}
        onJoinAsUser={vi.fn()}
        onJoinAsGuest={vi.fn()}
      />,
    );
    expect(screen.getByText('Sarah')).toBeInTheDocument();
    expect(screen.getByText('Host')).toBeInTheDocument();
    expect(screen.getByText(/4 players · tap mode/i)).toBeInTheDocument();
  });

  it('offers a direct join when authenticated', async () => {
    const onJoinAsUser = vi.fn();
    render(
      <JoinView
        preview={preview()}
        isAuthenticated
        onJoinAsUser={onJoinAsUser}
        onJoinAsGuest={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /join game/i }));
    expect(onJoinAsUser).toHaveBeenCalled();
  });

  it('offers a guest name path and a login link when anonymous', async () => {
    const onJoinAsGuest = vi.fn();
    render(
      <JoinView
        preview={preview()}
        isAuthenticated={false}
        onJoinAsUser={vi.fn()}
        onJoinAsGuest={onJoinAsGuest}
      />,
    );
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();

    // Empty name blocks the join.
    await userEvent.click(
      screen.getByRole('button', { name: /join as guest/i }),
    );
    expect(onJoinAsGuest).not.toHaveBeenCalled();
    expect(screen.getByText(/enter a name to join/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Guest name'), 'Maya');
    await userEvent.click(
      screen.getByRole('button', { name: /join as guest/i }),
    );
    expect(onJoinAsGuest).toHaveBeenCalledWith('Maya');
  });

  it('blocks joining a started game', () => {
    render(
      <JoinView
        preview={preview({ status: 'active' })}
        isAuthenticated
        onJoinAsUser={vi.fn()}
        onJoinAsGuest={vi.fn()}
      />,
    );
    expect(screen.getByText(/already started/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /join game/i }),
    ).not.toBeInTheDocument();
  });

  it('blocks joining a full game', () => {
    render(
      <JoinView
        preview={preview({
          playerCount: 1,
          players: [
            { seat: 0, team: 1, name: 'Host', isCreator: true, isGuest: false },
          ],
        })}
        isAuthenticated
        onJoinAsUser={vi.fn()}
        onJoinAsGuest={vi.fn()}
      />,
    );
    expect(screen.getByText(/this game is full/i)).toBeInTheDocument();
  });

  it('blocks joining a local game remotely', () => {
    render(
      <JoinView
        preview={preview({ local: true })}
        isAuthenticated
        onJoinAsUser={vi.fn()}
        onJoinAsGuest={vi.fn()}
      />,
    );
    expect(screen.getByText(/can’t be joined remotely/i)).toBeInTheDocument();
  });
});
