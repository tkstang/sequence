'use client';

import { useState } from 'react';

import { Badge } from '@/components/badge.tsx';
import { Button } from '@/components/button.tsx';

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

const TEAM_META: Record<
  TeamId,
  { name: string; text: string; border: string; bg: string; dot: string }
> = {
  1: {
    name: 'Blue',
    text: 'text-team-blue',
    border: 'border-team-blue',
    bg: 'bg-[#e3ecf7]',
    dot: 'var(--color-team-blue)',
  },
  2: {
    name: 'Green',
    text: 'text-team-green',
    border: 'border-team-green',
    bg: 'bg-[#e2f3e8]',
    dot: 'var(--color-team-green)',
  },
  3: {
    name: 'Red',
    text: 'text-team-red',
    border: 'border-team-red',
    bg: 'bg-[#f9e4e2]',
    dot: 'var(--color-team-red)',
  },
};

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
        className="min-h-12 flex-1 rounded-lg border border-dashed border-black/30 bg-white/60 px-2 py-2 text-center text-xs font-semibold text-black/45 disabled:cursor-not-allowed disabled:opacity-50"
      >
        tap to join
      </button>
    );
  }

  return (
    <div className="min-h-12 flex-1 rounded-lg border border-black/10 bg-white px-2 py-2 text-sm">
      <div className="flex items-center gap-1.5">
        <span className="truncate font-semibold">{player.name}</span>
        {player.isCreator ? <Badge tone="neutral">Host</Badge> : null}
        {player.seat === mySeat ? (
          <span className="text-xs text-black/40">you</span>
        ) : null}
        {isCreator && !player.isCreator ? (
          <button
            type="button"
            onClick={onKick}
            disabled={isMutating}
            className="text-team-red hover:bg-team-red/10 ml-auto rounded px-1 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
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
    <main className="bg-cream mx-auto flex min-h-screen w-full max-w-xl flex-col">
      <section className="bg-slate px-4 py-5 text-center text-white">
        <div className="text-[0.68rem] font-bold tracking-[0.18em] text-white/50 uppercase">
          Invite code
        </div>
        <div className="mt-1 text-2xl font-black tracking-[0.18em]">
          {inviteCode}
        </div>
        <button
          type="button"
          onClick={copyInvite}
          className="mt-1 rounded px-2 py-1 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"
        >
          {copied ? 'copied' : 'copy link'}
        </button>
        <p className="mt-1 text-xs text-white/55">
          {playerCount} players · {teamCount} teams · {mode} mode ·{' '}
          {timerLabel(timerSeconds)}
        </p>
      </section>

      <section className="flex flex-1 flex-col gap-3 p-3">
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
              className={`rounded-lg border-2 ${meta.border} ${meta.bg} p-3`}
            >
              <div
                className={`mb-2 flex items-center gap-2 text-xs font-black tracking-wide uppercase ${meta.text}`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: meta.dot }}
                  aria-hidden
                />
                {meta.name}
              </div>
              <div className="flex gap-2">
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

      <footer className="flex flex-col gap-2 px-4 pb-4 text-center">
        <p className="text-xs text-black/55">{turnOrder(players)}</p>
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
          <div className="rounded-lg bg-white px-3 py-3 text-sm text-black/60">
            Waiting for the host to start.
          </div>
        )}
      </footer>
    </main>
  );
}
