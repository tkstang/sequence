import type { Position } from '@sequence/game-logic';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GameBoard } from './GameBoard.tsx';
import { buildBoardCells, cardAssetPath } from './GameBoard.utils.ts';

describe('GameBoard utilities', () => {
  it('builds a 100-cell row-major board with card asset paths', () => {
    const cells = buildBoardCells({ board: {} });
    expect(cells).toHaveLength(100);
    expect(cells[0]).toMatchObject({
      position: '1WW',
      isCorner: true,
      assetPath: null,
    });
    expect(cells[1]).toMatchObject({
      position: '1AC',
      cardCode: 'AC',
      assetPath: '/cards/AC.svg',
    });
  });

  it('maps card codes to existing public card asset paths', () => {
    expect(cardAssetPath('QS')).toBe('/cards/QS.svg');
  });
});

describe('<GameBoard>', () => {
  it('renders 100 accessible cells with card images and chips', () => {
    render(
      <GameBoard
        board={{
          '1AC': { chip: 1 },
          '1KC': { chip: 2, lockedBy: 7 },
        }}
      />,
    );

    expect(
      screen.getByRole('grid', { name: /sequence board/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(100);
    expect(screen.getByLabelText(/team 1 chip/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/team 2 chip locked/i)).toBeInTheDocument();
  });

  it('marks valid, hover, pending, and winning cells', () => {
    render(
      <GameBoard
        board={{ '1AC': { chip: 1, lockedBy: 2 } }}
        validTargets={['1KC' as Position]}
        hoverPosition={'1QC' as Position}
        pendingChoiceCells={['1TC' as Position]}
        winningCells={['1AC' as Position]}
      />,
    );

    expect(screen.getByLabelText(/KC 1KC/i)).toHaveAttribute(
      'data-highlight',
      'valid-target',
    );
    expect(screen.getByLabelText(/QC 1QC/i)).toHaveAttribute(
      'data-highlight',
      'hover-confirm',
    );
    expect(screen.getByLabelText(/TC 1TC/i)).toHaveAttribute(
      'data-highlight',
      'pending-choice',
    );
  });

  it('emits primitive cell positions on click and hover', async () => {
    const onCellSelect = vi.fn();
    const onCellHover = vi.fn();
    render(
      <GameBoard
        board={{}}
        onCellSelect={onCellSelect}
        onCellHover={onCellHover}
      />,
    );

    const cell = screen.getByLabelText(/AC 1AC/i);
    await userEvent.hover(cell);
    await userEvent.click(cell);
    await userEvent.unhover(cell);

    expect(onCellHover).toHaveBeenCalledWith('1AC');
    expect(onCellSelect).toHaveBeenCalledWith('1AC');
    expect(onCellHover).toHaveBeenLastCalledWith(null);
  });
});
