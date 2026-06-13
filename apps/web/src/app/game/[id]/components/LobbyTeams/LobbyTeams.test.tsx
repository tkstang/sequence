import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LobbyTeams, lobbyIsStartable } from './LobbyTeams.tsx';
import type { LobbyTeamsProps } from './LobbyTeams.tsx';

function player(
  seat: number,
  team: 1 | 2 | 3,
  name: string,
  isCreator = false,
) {
  return {
    seat,
    team,
    name,
    isCreator,
    isGuest: !isCreator,
    connected: true,
  };
}

function props(overrides: Partial<LobbyTeamsProps> = {}): LobbyTeamsProps {
  return {
    inviteCode: 'ABC123',
    playerCount: 4,
    mode: 'tap',
    timerSeconds: null,
    players: [player(0, 1, 'Host', true), player(1, 2, 'Guest')],
    mySeat: 0,
    onJoinTeam: vi.fn(),
    onKick: vi.fn(),
    onRandomize: vi.fn(),
    onStart: vi.fn(),
    onCopyInvite: vi.fn(),
    ...overrides,
  };
}

describe('<LobbyTeams>', () => {
  it('renders stacked team rows, invite code, settings, and turn order', () => {
    render(<LobbyTeams {...props()} />);

    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText(/4 players · 2 teams/i)).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('Green')).toBeInTheDocument();
    expect(screen.getByText(/Turn order: Host -> Guest/i)).toBeInTheDocument();
  });

  it('uses empty slots as tap-to-join controls', async () => {
    const onJoinTeam = vi.fn();
    render(<LobbyTeams {...props({ onJoinTeam })} />);

    await userEvent.click(
      screen.getAllByRole('button', { name: /tap to join/i })[0]!,
    );
    expect(onJoinTeam).toHaveBeenCalledWith(1);
  });

  it('shows creator kick and randomize controls', async () => {
    const onKick = vi.fn();
    const onRandomize = vi.fn();
    render(
      <LobbyTeams
        {...props({
          players: [
            player(0, 1, 'Host', true),
            player(1, 2, 'Guest'),
            player(2, 1, 'Maya'),
            player(3, 2, 'Ben'),
          ],
          onKick,
          onRandomize,
        })}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /kick guest/i }));
    expect(onKick).toHaveBeenCalledWith(1);
    await userEvent.click(screen.getByRole('button', { name: /randomize/i }));
    expect(onRandomize).toHaveBeenCalled();
  });

  it('gates start until the lobby is full and balanced', async () => {
    const onStart = vi.fn();
    const { rerender } = render(<LobbyTeams {...props({ onStart })} />);
    expect(
      screen.getByRole('button', { name: /waiting for 2 more/i }),
    ).toBeDisabled();

    rerender(
      <LobbyTeams
        {...props({
          players: [
            player(0, 1, 'Host', true),
            player(1, 2, 'Guest'),
            player(2, 1, 'Maya'),
            player(3, 2, 'Ben'),
          ],
          onStart,
        })}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /start game/i }));
    expect(onStart).toHaveBeenCalled();
  });

  it('detects valid 3-team FFA and 6-player lobbies', () => {
    expect(
      lobbyIsStartable({
        playerCount: 3,
        players: [
          player(0, 1, 'A', true),
          player(1, 2, 'B'),
          player(2, 3, 'C'),
        ],
      }),
    ).toBe(true);

    expect(
      lobbyIsStartable({
        playerCount: 6,
        players: [
          player(0, 1, 'A', true),
          player(1, 2, 'B'),
          player(2, 3, 'C'),
          player(3, 1, 'D'),
          player(4, 2, 'E'),
          player(5, 3, 'F'),
        ],
      }),
    ).toBe(true);
  });
});
