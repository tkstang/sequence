import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HistoryView } from './history-view.tsx';
import type { HistoryGameRow } from './history-view.tsx';

function gameRow(overrides: Partial<HistoryGameRow> = {}): HistoryGameRow {
  return {
    gameId: 'g1',
    finishedAt: new Date('2026-06-10').toISOString(),
    playerCount: 4,
    mode: 'tap',
    local: false,
    winnerTeam: 1,
    endReason: 'win',
    myTeam: 1,
    result: 'win',
    ...overrides,
  };
}

describe('<HistoryView>', () => {
  it('renders the aggregate record', () => {
    render(
      <HistoryView
        record={{ wins: 5, losses: 3, total: 8 }}
        headToHead={[]}
        games={[]}
      />,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders the head-to-head table rows', () => {
    render(
      <HistoryView
        record={{ wins: 0, losses: 0, total: 0 }}
        headToHead={[
          {
            opponentId: 'u2',
            opponentName: 'Sarah',
            wins: 2,
            losses: 1,
            games: 3,
          },
        ]}
        games={[]}
      />,
    );
    expect(screen.getByText('Sarah')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('flags local games and shows W/L in the completed list', () => {
    render(
      <HistoryView
        record={{ wins: 0, losses: 0, total: 0 }}
        headToHead={[]}
        games={[
          gameRow({ gameId: 'a', result: 'win', local: true }),
          gameRow({ gameId: 'b', result: 'loss' }),
        ]}
      />,
    );
    expect(screen.getByText('W')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText(/Local game/i)).toBeInTheDocument();
  });

  it('shows no-result for a no-winner FFA non-conceder game', () => {
    render(
      <HistoryView
        record={{ wins: 0, losses: 0, total: 0 }}
        headToHead={[]}
        games={[
          gameRow({
            gameId: 'neutral',
            winnerTeam: null,
            endReason: 'concede',
            result: 'none',
          }),
        ]}
      />,
    );
    expect(screen.getByText(/no result/i)).toBeInTheDocument();
    expect(screen.queryByText('L')).not.toBeInTheDocument();
  });

  it('shows a Load more button and fires onLoadMore', async () => {
    const onLoadMore = vi.fn();
    render(
      <HistoryView
        record={{ wins: 0, losses: 0, total: 0 }}
        headToHead={[]}
        games={[gameRow({})]}
        hasMore
        onLoadMore={onLoadMore}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /load more/i }));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it('omits Load more when there are no more pages', () => {
    render(
      <HistoryView
        record={{ wins: 0, losses: 0, total: 0 }}
        headToHead={[]}
        games={[gameRow({})]}
        hasMore={false}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /load more/i }),
    ).not.toBeInTheDocument();
  });
});
