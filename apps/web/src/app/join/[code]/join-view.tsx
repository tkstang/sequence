'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/badge.tsx';
import { Button } from '@/components/button.tsx';
import { Card } from '@/components/card.tsx';

/** The public preview shape (mirrors `GamePreview` from the api). */
export interface JoinPreview {
  gameId: string;
  inviteCode: string;
  status: string;
  playerCount: number;
  mode: string;
  timerSeconds: number | null;
  local: boolean;
  players: {
    seat: number;
    team: number;
    name: string;
    isCreator: boolean;
    isGuest: boolean;
  }[];
}

export interface JoinViewProps {
  preview: JoinPreview;
  /** Is there an authenticated session? Gates guest-name vs direct join. */
  isAuthenticated: boolean;
  /** Join as the current user (authed). */
  onJoinAsUser: () => void;
  /** Join as a guest with the given name. */
  onJoinAsGuest: (name: string) => void;
  joinError?: string | null;
  isJoining?: boolean;
}

function describeSettings(p: JoinPreview): string {
  const timer =
    p.timerSeconds === null ? 'no timer' : `${p.timerSeconds}s turns`;
  return `${p.playerCount} players · ${p.mode} mode · ${timer}`;
}

/**
 * Invite landing (p05-t07, FR3). Renders the public preview, then offers the
 * join path: an authed user joins directly; an anonymous visitor either logs in
 * first or joins as a guest by name. The game is unjoinable once it has left the
 * lobby (or is full).
 */
export function JoinView({
  preview,
  isAuthenticated,
  onJoinAsUser,
  onJoinAsGuest,
  joinError,
  isJoining = false,
}: JoinViewProps) {
  const [guestName, setGuestName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const open = preview.status === 'lobby';
  const full = preview.players.length >= preview.playerCount;
  const joinable = open && !full && !preview.local;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 p-4">
      <div>
        <h1 className="text-2xl font-bold">You’re invited to a game</h1>
        <p className="text-sm text-black/60">{describeSettings(preview)}</p>
      </div>

      <Card className="flex flex-col gap-2">
        <h2 className="text-xs font-bold tracking-wide text-black/50 uppercase">
          Players
        </h2>
        {preview.players.length === 0 ? (
          <p className="text-sm text-black/50">No one has joined yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {preview.players.map((p) => (
              <li key={p.seat} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{
                    backgroundColor:
                      p.team === 1
                        ? 'var(--color-team-blue)'
                        : p.team === 2
                          ? 'var(--color-team-green)'
                          : 'var(--color-team-red)',
                  }}
                  aria-hidden
                />
                <span>{p.name}</span>
                {p.isCreator ? <Badge tone="neutral">Host</Badge> : null}
                {p.isGuest ? (
                  <span className="text-xs text-black/40">guest</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!joinable ? (
        <Card className="bg-cream text-sm text-black/70">
          {preview.local
            ? 'This is a local pass-and-play game and can’t be joined remotely.'
            : full
              ? 'This game is full.'
              : 'This game has already started and can’t be joined.'}
        </Card>
      ) : isAuthenticated ? (
        <Button size="lg" disabled={isJoining} onClick={onJoinAsUser}>
          {isJoining ? 'Joining…' : 'Join game'}
        </Button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="guest-name" className="text-sm font-semibold">
              Play as a guest
            </label>
            <input
              id="guest-name"
              type="text"
              value={guestName}
              aria-label="Guest name"
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              className="rounded-lg border border-black/20 bg-white px-3 py-2"
            />
            {nameError ? (
              <span role="alert" className="text-team-red text-xs">
                {nameError}
              </span>
            ) : null}
          </div>
          <Button
            size="lg"
            disabled={isJoining}
            onClick={() => {
              if (!guestName.trim()) {
                setNameError('Enter a name to join');
                return;
              }
              setNameError(null);
              onJoinAsGuest(guestName.trim());
            }}
          >
            {isJoining ? 'Joining…' : 'Join as guest'}
          </Button>
          <p className="text-center text-sm text-black/60">
            or{' '}
            <Link
              href={`/login?next=/join/${preview.inviteCode}`}
              className="text-team-blue font-semibold"
            >
              log in
            </Link>{' '}
            to join with your account
          </p>
        </div>
      )}

      {joinError ? (
        <p role="alert" className="text-team-red text-sm">
          {joinError}
        </p>
      ) : null}
    </main>
  );
}
