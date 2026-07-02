'use client';

import * as stylex from '@stylexjs/stylex';
import Link from 'next/link';

import { AuthenticatedHeader } from '@/components/authenticated-header.tsx';
import { Badge } from '@/components/badge.tsx';
import { buttonProps } from '@/components/button.tsx';
import { Card } from '@/components/card.tsx';
import { color, fontSize, fontWeight, space } from '@/styles/tokens.stylex.ts';

import { ExpiryCountdown } from './expiry-countdown.tsx';

const styles = stylex.create({
  fullWidth: {
    width: '100%',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.xs,
    fontSize: fontSize.sm,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: space.sm,
  },
  resumeName: {
    fontWeight: fontWeight.medium,
  },
  resumeLink: {
    marginInlineStart: 'auto',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: { default: color.teamGreen, ':hover': color.accentHover },
    textDecorationLine: { default: 'none', ':hover': 'underline' },
    transitionProperty: 'color',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
    borderRadius: '4px',
  },
  cardMeta: {
    fontSize: fontSize.xs,
    color: color.textMuted,
    marginBlock: 0,
  },
  resultRow: {
    display: 'flex',
    alignItems: 'center',
    gap: space.sm,
    fontSize: fontSize.sm,
    color: color.text,
  },
  page: {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'column',
  },
  main: {
    marginInline: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: '36rem',
    flexDirection: 'column',
    gap: space.xxl,
    padding: space.lg,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
  },
  sectionHeading: {
    marginBlockStart: 0,
    marginBlockEnd: space.sm,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: color.textMuted,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: color.textMuted,
    marginBlock: 0,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
  },
  stackTight: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.xs,
  },
  historyLink: {
    marginBlockStart: space.md,
    display: 'inline-block',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: { default: color.teamBlue, ':hover': color.accentHover },
    textDecorationLine: { default: 'none', ':hover': 'underline' },
    transitionProperty: 'color',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
    borderRadius: '4px',
  },
});

/** The dashboard card shape (mirrors `MyGameCard` from the api). */
export interface DashboardGame {
  gameId: string;
  inviteCode: string;
  status: string;
  playerCount: number;
  mode: string;
  local: boolean;
  round: number;
  expiresAt: string | null;
  finishedAt: string | null;
  winnerTeam: number | null;
  endReason: string | null;
  mySeat: number;
  myTeam: number;
  opponents: string[];
  result: 'win' | 'loss' | 'none';
}

export interface DashboardViewProps {
  userInitial: string;
  onLogout: () => void;
  isSigningOut?: boolean;
  resumables: DashboardGame[];
  recents: DashboardGame[];
  isLoading?: boolean;
}

/** "vs Sarah, Ben" / "local vs Sarah" / "2v2 with Maya" style label. */
function describeOpponents(game: DashboardGame): string {
  if (game.opponents.length === 0) return 'Solo game';
  const names = game.opponents.join(', ');
  if (game.local) return `local vs ${names}`;
  return `vs ${names}`;
}

function ResumableCard({ game }: { game: DashboardGame }) {
  const isFrozen = game.status === 'frozen';
  // The lobby/game route is the resume target (built in p06); the dashboard
  // links there by id.
  const href = `/game/${game.gameId}`;
  return (
    <Card>
      <div {...stylex.props(styles.cardBody)}>
        <div {...stylex.props(styles.cardHeader)}>
          <span {...stylex.props(styles.resumeName)}>
            {describeOpponents(game)}
          </span>
          <Badge tone={isFrozen ? 'frozen' : 'saved'}>
            {isFrozen ? 'FROZEN' : 'SAVED'}
          </Badge>
          <Link href={href} {...stylex.props(styles.resumeLink)}>
            {isFrozen ? 'Rejoin →' : 'Resume →'}
          </Link>
        </div>
        <p {...stylex.props(styles.cardMeta)}>
          Round {game.round}
          {isFrozen ? ' · everyone must return' : ''}
          {game.expiresAt ? ' · ' : ''}
          {game.expiresAt ? (
            <ExpiryCountdown expiresAt={game.expiresAt} />
          ) : null}
        </p>
      </div>
    </Card>
  );
}

function ResultRow({ game }: { game: DashboardGame }) {
  const badge =
    game.result === 'win' ? (
      <Badge tone="win">W</Badge>
    ) : game.result === 'loss' ? (
      <Badge tone="loss">L</Badge>
    ) : (
      <Badge tone="neutral">No result</Badge>
    );
  return (
    <div {...stylex.props(styles.resultRow)}>
      {badge}
      <span>
        {describeOpponents(game)}
        {game.endReason === 'concede' ? ' · concede' : ''}
      </span>
    </div>
  );
}

/**
 * The logged-in home (p05-t05, approved wireframe `dashboard.html`).
 *
 * Order: actions first (Create primary, Pass & play secondary), then resumable
 * games (FROZEN/SAVED badges, expiry countdowns, all-must-return note), then a
 * recent-results strip (local games labeled), then the history link.
 *
 * Presentational — fed plain data so it's testable without a tRPC backend.
 */
export function DashboardView({
  userInitial,
  onLogout,
  isSigningOut = false,
  resumables,
  recents,
  isLoading = false,
}: DashboardViewProps) {
  const createProps = buttonProps({ size: 'lg' });
  const localProps = buttonProps({ variant: 'secondary' });
  const createFull = stylex.props(styles.fullWidth);
  return (
    <div {...stylex.props(styles.page)}>
      <AuthenticatedHeader
        userInitial={userInitial}
        onLogout={onLogout}
        isSigningOut={isSigningOut}
      />

      <main {...stylex.props(styles.main)}>
        <section {...stylex.props(styles.actions)}>
          <Link
            href="/create"
            className={`${createProps.className ?? ''} ${createFull.className ?? ''}`.trim()}
            style={{ ...createProps.style, ...createFull.style }}
          >
            + Create game
          </Link>
          <Link
            href="/create?local=1"
            className={`${localProps.className ?? ''} ${createFull.className ?? ''}`.trim()}
            style={{ ...localProps.style, ...createFull.style }}
          >
            Pass &amp; play (local)
          </Link>
        </section>

        <section>
          <h2 {...stylex.props(styles.sectionHeading)}>Your games</h2>
          {isLoading ? (
            <p {...stylex.props(styles.emptyText)}>Loading…</p>
          ) : resumables.length === 0 ? (
            <p {...stylex.props(styles.emptyText)}>
              No games to resume right now.
            </p>
          ) : (
            <div {...stylex.props(styles.stack)}>
              {resumables.map((g) => (
                <ResumableCard key={g.gameId} game={g} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 {...stylex.props(styles.sectionHeading)}>Recent results</h2>
          {isLoading ? (
            <p {...stylex.props(styles.emptyText)}>Loading…</p>
          ) : recents.length === 0 ? (
            <p {...stylex.props(styles.emptyText)}>No finished games yet.</p>
          ) : (
            <div {...stylex.props(styles.stackTight)}>
              {recents.map((g) => (
                <ResultRow key={g.gameId} game={g} />
              ))}
            </div>
          )}
          <Link href="/history" {...stylex.props(styles.historyLink)}>
            Full history &amp; head-to-head →
          </Link>
        </section>
      </main>
    </div>
  );
}
