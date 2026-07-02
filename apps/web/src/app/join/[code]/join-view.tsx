'use client';

import * as stylex from '@stylexjs/stylex';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/badge.tsx';
import { Button } from '@/components/button.tsx';
import { Card } from '@/components/card.tsx';
import {
  color,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

const styles = stylex.create({
  main: {
    marginInline: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: '28rem',
    flexDirection: 'column',
    gap: space.xl,
    padding: space.lg,
  },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    color: color.text,
    margin: 0,
  },
  settings: {
    marginBlock: space.xs,
    marginInline: 0,
    fontSize: fontSize.sm,
    color: color.textMuted,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
  },
  sectionLabel: {
    margin: 0,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: color.textFaint,
  },
  emptyRoster: {
    margin: 0,
    fontSize: fontSize.sm,
    color: color.textFaint,
  },
  roster: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
    margin: 0,
    padding: 0,
    listStyle: 'none',
    fontSize: fontSize.sm,
    color: color.text,
  },
  rosterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: space.sm,
  },
  dot: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    flexShrink: 0,
    borderRadius: radius.round,
  },
  dotColor: (c: string) => ({
    backgroundColor: c,
  }),
  guestTag: {
    fontSize: fontSize.xs,
    color: color.textFaint,
  },
  notice: {
    fontSize: fontSize.sm,
    color: color.textMuted,
  },
  guestSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.md,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: color.text,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: color.border, ':focus': color.focusRing },
    backgroundColor: color.surface,
    color: color.text,
    paddingBlock: space.sm,
    paddingInline: space.md,
    fontFamily: 'inherit',
    fontSize: fontSize.sm,
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
    transitionProperty: 'border-color',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
  },
  fieldError: {
    fontSize: fontSize.xs,
    color: color.danger,
  },
  loginPrompt: {
    margin: 0,
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: color.textMuted,
  },
  loginLink: {
    fontWeight: fontWeight.semibold,
    color: { default: color.teamBlue, ':hover': color.accentHover },
    textDecorationLine: { default: 'none', ':hover': 'underline' },
  },
  error: {
    margin: 0,
    fontSize: fontSize.sm,
    color: color.danger,
  },
});

const TEAM_COLORS: Record<number, string> = {
  1: color.teamBlue,
  2: color.teamGreen,
};

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
    <main {...stylex.props(styles.main)}>
      <div>
        <h1 {...stylex.props(styles.heading)}>You’re invited to a game</h1>
        <p {...stylex.props(styles.settings)}>{describeSettings(preview)}</p>
      </div>

      <Card {...stylex.props(styles.card)}>
        <h2 {...stylex.props(styles.sectionLabel)}>Players</h2>
        {preview.players.length === 0 ? (
          <p {...stylex.props(styles.emptyRoster)}>No one has joined yet.</p>
        ) : (
          <ul {...stylex.props(styles.roster)}>
            {preview.players.map((p) => (
              <li key={p.seat} {...stylex.props(styles.rosterRow)}>
                <span
                  {...stylex.props(
                    styles.dot,
                    styles.dotColor(TEAM_COLORS[p.team] ?? color.teamRed),
                  )}
                  aria-hidden
                />
                <span>{p.name}</span>
                {p.isCreator ? <Badge tone="neutral">Host</Badge> : null}
                {p.isGuest ? (
                  <span {...stylex.props(styles.guestTag)}>guest</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!joinable ? (
        <Card {...stylex.props(styles.notice)}>
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
        <div {...stylex.props(styles.guestSection)}>
          <div {...stylex.props(styles.field)}>
            <label htmlFor="guest-name" {...stylex.props(styles.label)}>
              Play as a guest
            </label>
            <input
              id="guest-name"
              type="text"
              value={guestName}
              aria-label="Guest name"
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              {...stylex.props(styles.input)}
            />
            {nameError ? (
              <span role="alert" {...stylex.props(styles.fieldError)}>
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
          <p {...stylex.props(styles.loginPrompt)}>
            or{' '}
            <Link
              href={`/login?next=/join/${preview.inviteCode}`}
              {...stylex.props(styles.loginLink)}
            >
              log in
            </Link>{' '}
            to join with your account
          </p>
        </div>
      )}

      {joinError ? (
        <p role="alert" {...stylex.props(styles.error)}>
          {joinError}
        </p>
      ) : null}
    </main>
  );
}
