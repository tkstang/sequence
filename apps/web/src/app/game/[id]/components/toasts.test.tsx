import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ConnectionBanner,
  ruleViolationMessage,
  ToastViewport,
} from './toasts.tsx';

describe('game toasts', () => {
  it('maps typed rule violations into player-facing messages', () => {
    expect(
      ruleViolationMessage({
        data: { ruleViolation: { code: 'chip-locked' } },
      }),
    ).toBe('That chip is locked in a sequence.');
    expect(ruleViolationMessage({ data: { code: 'CONFLICT' } })).toBe(
      'Game changed. Try again.',
    );
  });

  it('renders dismissible toast messages', async () => {
    const onDismiss = vi.fn();
    render(
      <ToastViewport
        toasts={[
          {
            id: 't1',
            tone: 'error',
            title: 'Move blocked',
            detail: 'That space is already occupied.',
          },
        ]}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText('Move blocked')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: /dismiss notification/i }),
    );
    expect(onDismiss).toHaveBeenCalledWith('t1');
  });

  it('renders reconnecting banner copy', () => {
    const { rerender } = render(<ConnectionBanner state="reconnecting" />);
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();

    rerender(<ConnectionBanner state="live" />);
    expect(screen.queryByText('Reconnecting...')).not.toBeInTheDocument();
  });
});
