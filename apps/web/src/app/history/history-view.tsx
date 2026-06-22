'use client';

import * as stylex from '@stylexjs/stylex';

import { Badge } from '@/components/badge.tsx';
import { Button } from '@/components/button.tsx';
import { Card } from '@/components/card.tsx';
import {
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

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

const styles = stylex.create({
  main: {
    marginInline: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: '36rem',
    flexDirection: 'column',
    gap: space.xxl,
    padding: space.lg,
  },
  pageTitle: {
    margin: 0,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: color.text,
  },
  sectionLabel: {
    marginBlock: 0,
    marginBlockEnd: space.sm,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: color.textFaint,
  },
  emptyText: {
    margin: 0,
    fontSize: fontSize.sm,
    color: color.textMuted,
  },
  // Surface styling passed through to <Card> (its internal Tailwind no longer
  // applies, so we provide the surface look via StyleX here).
  cardSurface: {
    boxSizing: 'border-box',
    borderRadius: radius.xl,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.border,
    backgroundColor: color.surface,
    padding: space.lg,
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  },
  recordCard: {
    display: 'flex',
    alignItems: 'center',
    gap: space.xxl,
  },
  recordValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: color.text,
  },
  recordLabel: {
    fontSize: fontSize.xs,
    color: color.textMuted,
  },
  tableCard: {
    overflow: 'hidden',
    padding: 0,
  },
  table: {
    width: '100%',
    fontSize: fontSize.sm,
    borderCollapse: 'collapse',
    color: color.text,
  },
  theadRow: {
    backgroundColor: color.bg,
    textAlign: 'left',
    fontSize: fontSize.xs,
    color: color.textMuted,
  },
  th: {
    paddingInline: space.md,
    paddingBlock: space.sm,
    fontWeight: fontWeight.semibold,
  },
  bodyRow: {
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: color.border,
  },
  td: {
    paddingInline: space.md,
    paddingBlock: space.sm,
  },
  tdName: {
    paddingInline: space.md,
    paddingBlock: space.sm,
    fontWeight: fontWeight.medium,
  },
  gameList: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
  },
  gameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: space.sm,
    fontSize: fontSize.sm,
    color: color.textMuted,
  },
  gameDescription: {
    color: color.text,
  },
  gameDate: {
    marginInlineStart: 'auto',
    fontSize: fontSize.xs,
    color: color.textFaint,
  },
  loadMore: {
    marginBlockStart: space.md,
  },
});

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
    <main {...stylex.props(styles.main)}>
      <h1 {...stylex.props(styles.pageTitle)}>History</h1>

      <section>
        <h2 {...stylex.props(styles.sectionLabel)}>Your record</h2>
        <Card
          className={
            stylex.props(styles.cardSurface, styles.recordCard).className
          }
        >
          <div>
            <div {...stylex.props(styles.recordValue)}>{record?.wins ?? 0}</div>
            <div {...stylex.props(styles.recordLabel)}>Wins</div>
          </div>
          <div>
            <div {...stylex.props(styles.recordValue)}>
              {record?.losses ?? 0}
            </div>
            <div {...stylex.props(styles.recordLabel)}>Losses</div>
          </div>
          <div>
            <div {...stylex.props(styles.recordValue)}>
              {record?.total ?? 0}
            </div>
            <div {...stylex.props(styles.recordLabel)}>Games</div>
          </div>
        </Card>
      </section>

      <section>
        <h2 {...stylex.props(styles.sectionLabel)}>Head to head</h2>
        {headToHead.length === 0 ? (
          <p {...stylex.props(styles.emptyText)}>
            No head-to-head records yet — play registered friends to build them.
          </p>
        ) : (
          <Card
            className={
              stylex.props(styles.cardSurface, styles.tableCard).className
            }
          >
            <table {...stylex.props(styles.table)}>
              <thead>
                <tr {...stylex.props(styles.theadRow)}>
                  <th {...stylex.props(styles.th)}>Opponent</th>
                  <th {...stylex.props(styles.th)}>W</th>
                  <th {...stylex.props(styles.th)}>L</th>
                  <th {...stylex.props(styles.th)}>Games</th>
                </tr>
              </thead>
              <tbody>
                {headToHead.map((h) => (
                  <tr key={h.opponentId} {...stylex.props(styles.bodyRow)}>
                    <td {...stylex.props(styles.tdName)}>{h.opponentName}</td>
                    <td {...stylex.props(styles.td)}>{h.wins}</td>
                    <td {...stylex.props(styles.td)}>{h.losses}</td>
                    <td {...stylex.props(styles.td)}>{h.games}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      <section>
        <h2 {...stylex.props(styles.sectionLabel)}>Completed games</h2>
        {isLoading ? (
          <p {...stylex.props(styles.emptyText)}>Loading…</p>
        ) : games.length === 0 ? (
          <p {...stylex.props(styles.emptyText)}>No finished games yet.</p>
        ) : (
          <div {...stylex.props(styles.gameList)}>
            {games.map((g) => (
              <div key={g.gameId} {...stylex.props(styles.gameRow)}>
                {g.result === 'win' ? (
                  <Badge tone="win">W</Badge>
                ) : g.result === 'loss' ? (
                  <Badge tone="loss">L</Badge>
                ) : (
                  <Badge tone="neutral">No result</Badge>
                )}
                <span {...stylex.props(styles.gameDescription)}>
                  {g.local ? 'Local game' : `${g.playerCount}-player`} ·{' '}
                  {g.mode} mode
                  {g.endReason === 'concede' ? ' · concede' : ''}
                </span>
                <span {...stylex.props(styles.gameDate)}>
                  {formatDate(g.finishedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
        {hasMore ? (
          <Button
            variant="secondary"
            className={stylex.props(styles.loadMore).className}
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
