'use client';

import Link from 'next/link';

import { AppHeader } from '@/components/app-header.tsx';
import { Badge } from '@/components/badge.tsx';
import { Button } from '@/components/button.tsx';
import { Card } from '@/components/card.tsx';

import { ExpiryCountdown } from './expiry-countdown.tsx';

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
  won: boolean;
}

export interface DashboardViewProps {
  userInitial: string;
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
    <Card className="flex flex-col gap-1 p-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium">{describeOpponents(game)}</span>
        <Badge tone={isFrozen ? 'frozen' : 'saved'}>
          {isFrozen ? 'FROZEN' : 'SAVED'}
        </Badge>
        <Link href={href} className="text-team-green ml-auto text-xs font-bold">
          {isFrozen ? 'Rejoin →' : 'Resume →'}
        </Link>
      </div>
      <p className="text-xs text-black/50">
        Round {game.round}
        {isFrozen ? ' · everyone must return' : ''}
        {game.expiresAt ? ' · ' : ''}
        {game.expiresAt ? <ExpiryCountdown expiresAt={game.expiresAt} /> : null}
      </p>
    </Card>
  );
}

function ResultRow({ game }: { game: DashboardGame }) {
  return (
    <div className="flex items-center gap-2 text-sm text-black/70">
      <Badge tone={game.won ? 'win' : 'loss'}>{game.won ? 'W' : 'L'}</Badge>
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
  resumables,
  recents,
  isLoading = false,
}: DashboardViewProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        right={
          <span
            className="bg-team-blue flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
            aria-label="Your account"
          >
            {userInitial}
          </span>
        }
      />

      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 p-4">
        <section className="flex flex-col gap-2">
          <Link href="/create" className="block">
            <Button size="lg" className="w-full">
              + Create game
            </Button>
          </Link>
          <Link href="/create?local=1" className="block">
            <Button variant="secondary" className="w-full">
              🤝 Pass &amp; play (local)
            </Button>
          </Link>
        </section>

        <section>
          <h2 className="mb-2 text-xs font-bold tracking-wide text-black/50 uppercase">
            Your games
          </h2>
          {isLoading ? (
            <p className="text-sm text-black/50">Loading…</p>
          ) : resumables.length === 0 ? (
            <p className="text-sm text-black/50">
              No games to resume right now.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {resumables.map((g) => (
                <ResumableCard key={g.gameId} game={g} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-xs font-bold tracking-wide text-black/50 uppercase">
            Recent results
          </h2>
          {isLoading ? (
            <p className="text-sm text-black/50">Loading…</p>
          ) : recents.length === 0 ? (
            <p className="text-sm text-black/50">No finished games yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {recents.map((g) => (
                <ResultRow key={g.gameId} game={g} />
              ))}
            </div>
          )}
          <Link
            href="/history"
            className="text-team-blue mt-3 inline-block text-xs font-semibold"
          >
            Full history &amp; head-to-head →
          </Link>
        </section>
      </main>
    </div>
  );
}
