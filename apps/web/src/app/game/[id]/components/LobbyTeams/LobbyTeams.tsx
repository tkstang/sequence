'use client';

import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Badge } from '@/components/badge.tsx';
import { Button } from '@/components/button.tsx';
import {
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

import type { SnapshotPlayer } from '../game-state.ts';

type TeamId = 1 | 2 | 3;

export interface LobbyTeamsProps {
  inviteCode: string;
  playerCount: 2 | 3 | 4 | 6;
  mode: 'tap' | 'drag';
  timerSeconds: number | null;
  players: SnapshotPlayer[];
  mySeat: number;
  onJoinTeam: (team: TeamId) => void;
  onKick: (seat: number) => void;
  onRandomize: () => void;
  onStart: () => void;
  onCopyInvite: () => Promise<void> | void;
  isMutating?: boolean;
}

const TEAM_META: Record<TeamId, { name: string }> = {
  1: { name: 'Blue' },
  2: { name: 'Green' },
  3: { name: 'Red' },
};

const teamStyles = stylex.create({
  1: {
    borderColor: color.teamBlue,
    backgroundColor: {
      default: '#e3ecf7',
      '@media (prefers-color-scheme: dark)': 'rgba(91,143,196,0.14)',
    },
  },
  2: {
    borderColor: color.teamGreen,
    backgroundColor: {
      default: '#e2f3e8',
      '@media (prefers-color-scheme: dark)': 'rgba(59,185,110,0.14)',
    },
  },
  3: {
    borderColor: color.teamRed,
    backgroundColor: {
      default: '#f9e4e2',
      '@media (prefers-color-scheme: dark)': 'rgba(215,90,81,0.14)',
    },
  },
});

const teamTextStyles = stylex.create({
  1: { color: color.teamBlue },
  2: { color: color.teamGreen },
  3: { color: color.teamRed },
});

const teamDotStyles = stylex.create({
  1: { backgroundColor: color.teamBlue },
  2: { backgroundColor: color.teamGreen },
  3: { backgroundColor: color.teamRed },
});

const styles = stylex.create({
  main: {
    backgroundColor: color.bg,
    marginInline: 'auto',
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    maxWidth: '36rem',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: color.slate,
    paddingInline: space.lg,
    paddingBlock: space.xl,
    textAlign: 'center',
    color: color.textOnDark,
  },
  eyebrow: {
    fontSize: '0.68rem',
    fontWeight: fontWeight.bold,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
  },
  code: {
    marginBlockStart: space.xs,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: '0.18em',
  },
  copyButton: {
    marginBlockStart: space.xs,
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: radius.sm,
    paddingInline: space.sm,
    paddingBlock: space.xs,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    cursor: 'pointer',
    backgroundColor: {
      default: 'transparent',
      ':hover': 'rgba(255,255,255,0.1)',
    },
    color: { default: 'rgba(255,255,255,0.7)', ':hover': color.textOnDark },
    transitionProperty: 'background-color, color',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: 'rgba(255,255,255,0.7)',
    outlineOffset: '2px',
  },
  summary: {
    marginBlockStart: space.xs,
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  teamsSection: {
    display: 'flex',
    flexGrow: 1,
    flexDirection: 'column',
    gap: space.md,
    padding: space.md,
  },
  teamBand: {
    borderRadius: radius.md,
    borderWidth: '2px',
    borderStyle: 'solid',
    padding: space.md,
  },
  teamHeading: {
    marginBlockEnd: space.sm,
    display: 'flex',
    alignItems: 'center',
    gap: space.sm,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.black,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  dot: {
    height: '10px',
    width: '10px',
    borderRadius: radius.pill,
  },
  slotRow: {
    display: 'flex',
    minWidth: 0,
    gap: space.sm,
  },
  emptySlot: {
    minHeight: '48px',
    minWidth: 0,
    flexGrow: 1,
    flexBasis: 0,
    borderRadius: radius.md,
    borderWidth: '1px',
    borderStyle: 'dashed',
    borderColor: color.borderStrong,
    backgroundColor: { default: color.surface, ':hover': color.surfaceSunken },
    paddingInline: space.sm,
    paddingBlock: space.sm,
    textAlign: 'center',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: color.textFaint,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  filledSlot: {
    minHeight: '48px',
    minWidth: 0,
    flexGrow: 1,
    flexBasis: 0,
    borderRadius: radius.md,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.border,
    backgroundColor: color.surface,
    paddingInline: space.sm,
    paddingBlock: space.sm,
    fontSize: fontSize.sm,
    color: color.text,
  },
  slotInner: {
    display: 'flex',
    alignItems: 'center',
    gap: space.xs,
  },
  playerName: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: fontWeight.semibold,
  },
  youLabel: {
    fontSize: fontSize.xs,
    color: color.textFaint,
  },
  kickButton: {
    marginInlineStart: 'auto',
    borderWidth: 0,
    borderStyle: 'solid',
    borderRadius: radius.sm,
    paddingInline: space.xs,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: color.teamRed,
    backgroundColor: { default: 'transparent', ':hover': color.hoverWash },
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  disabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.sm,
    paddingInline: space.lg,
    paddingBlockEnd: space.lg,
    textAlign: 'center',
  },
  turnOrder: {
    fontSize: fontSize.xs,
    color: color.textMuted,
  },
  waiting: {
    borderRadius: radius.md,
    backgroundColor: color.surface,
    paddingInline: space.md,
    paddingBlock: space.md,
    fontSize: fontSize.sm,
    color: color.textMuted,
  },
});

function teamCountForPlayers(playerCount: LobbyTeamsProps['playerCount']) {
  if (playerCount === 3 || playerCount === 6) return 3;
  return 2;
}

function timerLabel(seconds: number | null): string {
  if (seconds === null) return 'no timer';
  if (seconds < 60) return `${seconds}s timer`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0
    ? `${minutes}:00 timer`
    : `${minutes}:${String(rest).padStart(2, '0')} timer`;
}

function seatsPerTeam(playerCount: LobbyTeamsProps['playerCount']): number {
  return playerCount / teamCountForPlayers(playerCount);
}

function playersForTeam(players: SnapshotPlayer[], team: TeamId) {
  return players.filter((player) => player.team === team);
}

export function lobbyIsStartable({
  playerCount,
  players,
}: {
  playerCount: LobbyTeamsProps['playerCount'];
  players: SnapshotPlayer[];
}): boolean {
  if (players.length !== playerCount) return false;
  const teamCount = teamCountForPlayers(playerCount);
  const capacity = seatsPerTeam(playerCount);
  for (let team = 1; team <= teamCount; team++) {
    if (playersForTeam(players, team as TeamId).length !== capacity) {
      return false;
    }
  }
  return true;
}

function startLabel(playerCount: number, players: SnapshotPlayer[]): string {
  if (players.length !== playerCount) {
    return `Waiting for ${playerCount - players.length} more player${
      playerCount - players.length === 1 ? '' : 's'
    }...`;
  }
  return 'Start game';
}

function turnOrder(players: SnapshotPlayer[]): string {
  if (players.length === 0) return 'Turn order appears as players join.';
  const ordered: SnapshotPlayer[] = [];
  for (const player of players) {
    const index = ordered.findIndex(
      (candidate) => candidate.seat > player.seat,
    );
    if (index === -1) ordered.push(player);
    else ordered.splice(index, 0, player);
  }
  return `Turn order: ${ordered.map((player) => player.name).join(' -> ')}`;
}

function TeamSlot({
  player,
  isCreator,
  mySeat,
  onJoin,
  onKick,
  isMutating,
}: {
  player?: SnapshotPlayer;
  isCreator: boolean;
  mySeat: number;
  onJoin: () => void;
  onKick: () => void;
  isMutating: boolean;
}) {
  if (!player) {
    return (
      <button
        type="button"
        onClick={onJoin}
        disabled={isMutating}
        {...stylex.props(styles.emptySlot, isMutating && styles.disabled)}
      >
        tap to join
      </button>
    );
  }

  return (
    <div {...stylex.props(styles.filledSlot)}>
      <div {...stylex.props(styles.slotInner)}>
        <span {...stylex.props(styles.playerName)}>{player.name}</span>
        {player.isCreator ? <Badge tone="neutral">Host</Badge> : null}
        {player.seat === mySeat ? (
          <span {...stylex.props(styles.youLabel)}>you</span>
        ) : null}
        {isCreator && !player.isCreator ? (
          <button
            type="button"
            onClick={onKick}
            disabled={isMutating}
            {...stylex.props(styles.kickButton, isMutating && styles.disabled)}
            aria-label={`Kick ${player.name}`}
          >
            x
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Lobby team formation UI (p06-t02): full-width stacked team bands, empty slots
 * as "tap to join" targets, creator controls, invite summary, and start gating.
 */
export function LobbyTeams({
  inviteCode,
  playerCount,
  mode,
  timerSeconds,
  players,
  mySeat,
  onJoinTeam,
  onKick,
  onRandomize,
  onStart,
  onCopyInvite,
  isMutating = false,
}: LobbyTeamsProps) {
  const [copied, setCopied] = useState(false);
  const teamCount = teamCountForPlayers(playerCount);
  const teams = Array.from(
    { length: teamCount },
    (_, index) => (index + 1) as TeamId,
  );
  const capacity = seatsPerTeam(playerCount);
  const isCreator = players.some(
    (player) => player.seat === mySeat && player.isCreator,
  );
  const startable = lobbyIsStartable({ playerCount, players });

  async function copyInvite() {
    await onCopyInvite();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main {...stylex.props(styles.main)}>
      <section {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.eyebrow)}>Invite code</div>
        <div {...stylex.props(styles.code)}>{inviteCode}</div>
        <button
          type="button"
          onClick={copyInvite}
          {...stylex.props(styles.copyButton)}
        >
          {copied ? 'copied' : 'copy link'}
        </button>
        <p {...stylex.props(styles.summary)}>
          {playerCount} players · {teamCount} teams · {mode} mode ·{' '}
          {timerLabel(timerSeconds)}
        </p>
      </section>

      <section {...stylex.props(styles.teamsSection)}>
        {teams.map((team) => {
          const meta = TEAM_META[team];
          const seated = playersForTeam(players, team);
          const slots = Array.from(
            { length: capacity },
            (_, index) => seated[index],
          );
          return (
            <section
              key={team}
              {...stylex.props(styles.teamBand, teamStyles[team])}
            >
              <div {...stylex.props(styles.teamHeading, teamTextStyles[team])}>
                <span
                  {...stylex.props(styles.dot, teamDotStyles[team])}
                  aria-hidden
                />
                {meta.name}
              </div>
              <div {...stylex.props(styles.slotRow)}>
                {slots.map((player, index) => (
                  <TeamSlot
                    key={player?.seat ?? `${team}-${index}`}
                    player={player}
                    isCreator={isCreator}
                    mySeat={mySeat}
                    isMutating={isMutating}
                    onJoin={() => onJoinTeam(team)}
                    onKick={() => player && onKick(player.seat)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </section>

      <footer {...stylex.props(styles.footer)}>
        <p {...stylex.props(styles.turnOrder)}>{turnOrder(players)}</p>
        {isCreator ? (
          <Button
            variant="ghost"
            onClick={onRandomize}
            disabled={isMutating || players.length < playerCount}
          >
            Randomize teams
          </Button>
        ) : null}
        {isCreator ? (
          <Button
            size="lg"
            onClick={onStart}
            disabled={!startable || isMutating}
          >
            {startLabel(playerCount, players)}
          </Button>
        ) : (
          <div {...stylex.props(styles.waiting)}>
            Waiting for the host to start.
          </div>
        )}
      </footer>
    </main>
  );
}
