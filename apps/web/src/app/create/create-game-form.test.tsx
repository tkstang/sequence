import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CreateGameForm } from './create-game-form.tsx';

describe('<CreateGameForm>', () => {
  it('submits default settings (2p, tap, no timer, not local)', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CreateGameForm onCreate={onCreate} />);
    await userEvent.click(screen.getByRole('button', { name: /create game/i }));
    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith({
        playerCount: 2,
        mode: 'tap',
        timerSeconds: null,
        local: false,
        opponentName: undefined,
      }),
    );
  });

  it('selects player count and play mode', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CreateGameForm onCreate={onCreate} />);
    await userEvent.click(screen.getByRole('button', { name: '4' }));
    await userEvent.click(screen.getByRole('button', { name: 'drag' }));
    await userEvent.click(screen.getByRole('button', { name: /create game/i }));
    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({ playerCount: 4, mode: 'drag' }),
      ),
    );
  });

  it('shows the mode explanation and switches it with the mode', async () => {
    render(<CreateGameForm onCreate={vi.fn()} />);
    expect(screen.getByText(/the friendlier mode/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'drag' }));
    expect(
      screen.getByText(/the harder, table-like mode/i),
    ).toBeInTheDocument();
  });

  it('disables the local toggle unless 2 players', async () => {
    render(<CreateGameForm onCreate={vi.fn()} />);
    const toggle = screen.getByRole('checkbox');
    expect(toggle).not.toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: '4' }));
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('requires an opponent name for a local game', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<CreateGameForm defaultLocal onCreate={onCreate} />);
    await userEvent.click(
      screen.getByRole('button', { name: /start local game/i }),
    );
    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByText(/name for your opponent/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Opponent name'), 'Sarah');
    await userEvent.click(
      screen.getByRole('button', { name: /start local game/i }),
    );
    await waitFor(() =>
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({ local: true, opponentName: 'Sarah' }),
      ),
    );
  });

  it('offers valid timer steps including 3:00 and a 60s step beyond', () => {
    render(<CreateGameForm onCreate={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'Off' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '3:00' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '5:00' })).toBeInTheDocument();
  });
});
