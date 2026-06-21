import type { Position } from '@sequence/game-logic';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { PendingChoiceView } from '../../game-state.ts';
import {
  initialChoiceSelection,
  SequenceChoice,
  toggleChoiceCell,
} from './SequenceChoice.tsx';

const pendingChoice: PendingChoiceView = {
  seat: 0,
  placed: '1AC' as Position,
  cells: ['1AC', '1KC', '1QC', '1JC', '1TC', '19C'] as Position[],
  additionalRuns: [['2AC', '2KC', '2QC', '2JC', '2TC', '29C'] as Position[]],
};

function Harness({ onConfirm }: { onConfirm: (cells: Position[]) => void }) {
  const [selectedCells, setSelectedCells] = useState(
    initialChoiceSelection(pendingChoice),
  );
  return (
    <SequenceChoice
      pendingChoice={pendingChoice}
      selectedCells={selectedCells}
      isActor
      actorName="Host"
      onToggleCell={(cell) =>
        setSelectedCells((current) =>
          toggleChoiceCell(current, cell, pendingChoice),
        )
      }
      onConfirm={onConfirm}
    />
  );
}

describe('<SequenceChoice>', () => {
  it('pins the placed cell and caps selection at five cells', () => {
    let selected = initialChoiceSelection(pendingChoice);

    selected = toggleChoiceCell(selected, '1AC' as Position, pendingChoice);
    expect(selected).toEqual(['1AC']);

    for (const cell of pendingChoice.cells.slice(1)) {
      selected = toggleChoiceCell(selected, cell, pendingChoice);
    }
    expect(selected).toEqual(['1AC', '1KC', '1QC', '1JC', '1TC']);
  });

  it('confirms exactly five selected cells for the actor', async () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);

    expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
    for (const cell of pendingChoice.cells.slice(1, 5)) {
      await userEvent.click(screen.getByRole('button', { name: cell }));
    }
    expect(screen.getByText('5/5 - 1 next')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalledWith(['1AC', '1KC', '1QC', '1JC', '1TC']);
  });

  it('shows non-actors a waiting state without a confirm action', () => {
    render(
      <SequenceChoice
        pendingChoice={pendingChoice}
        selectedCells={[]}
        isActor={false}
        actorName="Guest"
        onToggleCell={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText('Guest choosing')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /confirm/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1AC' })).toBeDisabled();
  });
});
