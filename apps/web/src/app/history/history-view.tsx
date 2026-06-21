'use client';

import { Badge } from '@/components/badge.tsx';
import { Button } from '@/components/button.tsx';
import { Card } from '@/components/card.tsx';

export interface RecordSummary {
  wins: number;
  losses: number;
  total: number;
}

export interface HeadToHeadRow {
  opponentId: string;
  opponentName: string;
  wins: number;
  losses: number;
  games: number;
}

export interface HistoryGameRow {
  gameId: string;
  finishedAt: string | null;
  playerCount: number;
  mode: string;
  local: boolean;
  winnerTeam: number | null;
  endReason: string | null;
  myTeam: number;
  result: 'win' | 'loss' | 'none';
}

export interface HistoryViewProps {
  record: RecordSummary | undefined;
  headToHead: HeadToHeadRow[];
  games: HistoryGameRow[];
  isLoading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * History + head-to-head (p05-t08, FR14). Aggregate W-L record, a per-opponent
 * head-to-head table, and a paged list of completed games (local games flagged).
 * Presentational — fed plain data so it's testable without a backend.
 */
export function HistoryView({
  record,
  headToHead,
  games,
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: HistoryViewProps) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold">History</h1>

      <section>
        <h2 className="mb-2 text-xs font-bold tracking-wide text-black/50 uppercase">
          Your record
        </h2>
        <Card className="flex items-center gap-6">
          <div>
            <div className="text-2xl font-extrabold">{record?.wins ?? 0}</div>
            <div className="text-xs text-black/50">Wins</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold">{record?.losses ?? 0}</div>
            <div className="text-xs text-black/50">Losses</div>
          </div>
          <div>
            <div className="text-2xl font-extrabold">{record?.total ?? 0}</div>
            <div className="text-xs text-black/50">Games</div>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold tracking-wide text-black/50 uppercase">
          Head to head
        </h2>
        {headToHead.length === 0 ? (
          <p className="text-sm text-black/50">
            No head-to-head records yet — play registered friends to build them.
          </p>
        ) : (
          <Card className="overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream text-left text-xs text-black/50">
                  <th className="px-3 py-2 font-semibold">Opponent</th>
                  <th className="px-3 py-2 font-semibold">W</th>
                  <th className="px-3 py-2 font-semibold">L</th>
                  <th className="px-3 py-2 font-semibold">Games</th>
                </tr>
              </thead>
              <tbody>
                {headToHead.map((h) => (
                  <tr key={h.opponentId} className="border-t border-black/5">
                    <td className="px-3 py-2 font-medium">{h.opponentName}</td>
                    <td className="px-3 py-2">{h.wins}</td>
                    <td className="px-3 py-2">{h.losses}</td>
                    <td className="px-3 py-2">{h.games}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold tracking-wide text-black/50 uppercase">
          Completed games
        </h2>
        {isLoading ? (
          <p className="text-sm text-black/50">Loading…</p>
        ) : games.length === 0 ? (
          <p className="text-sm text-black/50">No finished games yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {games.map((g) => (
              <div
                key={g.gameId}
                className="flex items-center gap-2 text-sm text-black/70"
              >
                {g.result === 'win' ? (
                  <Badge tone="win">W</Badge>
                ) : g.result === 'loss' ? (
                  <Badge tone="loss">L</Badge>
                ) : (
                  <Badge tone="neutral">No result</Badge>
                )}
                <span>
                  {g.local ? 'Local game' : `${g.playerCount}-player`} ·{' '}
                  {g.mode} mode
                  {g.endReason === 'concede' ? ' · concede' : ''}
                </span>
                <span className="ml-auto text-xs text-black/40">
                  {formatDate(g.finishedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
        {hasMore ? (
          <Button
            variant="secondary"
            className="mt-3"
            disabled={isLoadingMore}
            onClick={onLoadMore}
          >
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </Button>
        ) : null}
      </section>
    </main>
  );
}
