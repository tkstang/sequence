import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ActiveGameControls } from './ActiveGameControls.tsx';

describe('<ActiveGameControls>', () => {
  it('asks for confirmation before saving and exiting', async () => {
    const onSaveAndExit = vi.fn();
    render(
      <ActiveGameControls
        isSaving={false}
        isConceding={false}
        onSaveAndExit={onSaveAndExit}
        onConcede={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /save and exit/i }),
    );
    expect(onSaveAndExit).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: /confirm save/i }),
    );
    expect(onSaveAndExit).toHaveBeenCalledTimes(1);
  });

  it('asks for confirmation before conceding', async () => {
    const onConcede = vi.fn();
    render(
      <ActiveGameControls
        isSaving={false}
        isConceding={false}
        onSaveAndExit={vi.fn()}
        onConcede={onConcede}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /concede/i }));
    expect(onConcede).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: /confirm concede/i }),
    );
    expect(onConcede).toHaveBeenCalledTimes(1);
  });

  it('keeps both controls reachable while a lifecycle mutation is pending', () => {
    render(
      <ActiveGameControls
        isSaving
        isConceding={false}
        onSaveAndExit={vi.fn()}
        onConcede={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /saving game/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /concede/i })).toBeEnabled();
  });
});
