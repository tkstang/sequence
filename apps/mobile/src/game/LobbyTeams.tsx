import type { SnapshotPlayer } from '@sequence/client-state';
import type { Team } from '@sequence/game-logic';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { Badge } from '../components/Badge.tsx';
import { Button } from '../components/Button.tsx';
import { Card } from '../components/Card.tsx';
import { testId } from '../test/test-ids.ts';
import { useTheme } from '../theme/use-theme.ts';

export type LobbyPlayerCount = 2 | 3 | 4 | 6;
type LobbyTeam = Extract<Team, 1 | 2 | 3>;

export interface LobbyTeamsProps {
  inviteCode: string;
  playerCount: LobbyPlayerCount;
  mode: 'tap' | 'drag';
  timerSeconds: number | null;
  players: SnapshotPlayer[];
  mySeat: number;
  onJoinTeam?: (team: LobbyTeam) => void;
  onKick?: (seat: number) => void;
  onRandomize?: () => void;
  onStart?: () => void;
  isMutating?: boolean;
}

const TEAM_META = {
  1: { label: 'Blue', badge: 'teamBlue' },
  2: { label: 'Green', badge: 'teamGreen' },
  3: { label: 'Red', badge: 'teamRed' },
} as const;

function teamCountForPlayers(playerCount: LobbyPlayerCount): number {
  return playerCount === 3 || playerCount === 6 ? 3 : 2;
}

function seatsPerTeam(playerCount: LobbyPlayerCount): number {
  return playerCount / teamCountForPlayers(playerCount);
}

function playersForTeam(players: SnapshotPlayer[], team: LobbyTeam) {
  return players.filter((player) => player.team === team);
}

function slotsForTeam(
  players: SnapshotPlayer[],
  team: LobbyTeam,
  capacity: number,
): Array<SnapshotPlayer | undefined> {
  const seated = playersForTeam(players, team);
  const slotCount = Math.max(capacity, seated.length);
  return Array.from({ length: slotCount }, (_, index) => seated[index]);
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

function orderedPlayers(players: SnapshotPlayer[]): SnapshotPlayer[] {
  const ordered: SnapshotPlayer[] = [];
  for (const player of players) {
    const index = ordered.findIndex(
      (candidate) => candidate.seat > player.seat,
    );
    if (index === -1) ordered.push(player);
    else ordered.splice(index, 0, player);
  }
  return ordered;
}

function turnOrder(players: SnapshotPlayer[]): string {
  if (players.length === 0) return 'Turn order appears as players join.';
  return `Turn order: ${orderedPlayers(players)
    .map((player) => player.name)
    .join(' -> ')}`;
}

function startLabel(playerCount: LobbyPlayerCount, players: SnapshotPlayer[]) {
  const remaining = playerCount - players.length;
  if (remaining > 0) {
    return `Waiting for ${remaining} more player${remaining === 1 ? '' : 's'}`;
  }
  return 'Start game';
}

export function lobbyIsStartable({
  playerCount,
  players,
}: {
  playerCount: LobbyPlayerCount;
  players: SnapshotPlayer[];
}): boolean {
  if (players.length !== playerCount) return false;
  const teamCount = teamCountForPlayers(playerCount);
  const capacity = seatsPerTeam(playerCount);

  for (let team = 1; team <= teamCount; team += 1) {
    if (playersForTeam(players, team as LobbyTeam).length !== capacity) {
      return false;
    }
  }

  return true;
}

async function shareInvite(inviteCode: string) {
  const url = `sequence://join/${encodeURIComponent(inviteCode)}`;
  await Share.share({
    message: `Join my Sequence Online game with invite code ${inviteCode}: ${url}`,
    url,
  });
}

function TeamSlot({
  index,
  isCreator,
  isMutating,
  mySeat,
  onJoin,
  onKick,
  player,
  team,
}: {
  index: number;
  isCreator: boolean;
  isMutating: boolean;
  mySeat: number;
  onJoin: () => void;
  onKick: () => void;
  player?: SnapshotPlayer;
  team: LobbyTeam;
}) {
  const { colors } = useTheme();

  if (!player) {
    return (
      <Pressable
        accessibilityLabel={`Tap to join ${TEAM_META[team].label}`}
        accessibilityRole="button"
        accessibilityState={{ disabled: isMutating }}
        disabled={isMutating}
        onPress={isMutating ? undefined : onJoin}
        style={({ pressed }) => [
          styles.emptySlot,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderStrong,
          },
          pressed && !isMutating ? styles.pressed : null,
          isMutating ? styles.disabled : null,
        ]}
        testID={testId('lobby', 'team', team, 'slot', index)}
      >
        <Text style={[styles.emptySlotText, { color: colors.textMuted }]}>
          tap to join
        </Text>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.filledSlot,
        { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
      ]}
      testID={testId('lobby', 'player', player.seat)}
    >
      <View style={styles.playerLine}>
        <Text
          numberOfLines={1}
          style={[styles.playerName, { color: colors.text }]}
        >
          {player.name}
        </Text>
        {player.isCreator ? (
          <Badge size="sm" variant="neutral">
            Host
          </Badge>
        ) : null}
        {player.seat === mySeat ? (
          <Text style={[styles.youLabel, { color: colors.textMuted }]}>
            you
          </Text>
        ) : null}
        {isCreator && !player.isCreator ? (
          <Pressable
            accessibilityLabel={`Kick ${player.name}`}
            accessibilityRole="button"
            accessibilityState={{ disabled: isMutating }}
            disabled={isMutating}
            onPress={isMutating ? undefined : onKick}
            style={({ pressed }) => [
              styles.kickButton,
              pressed && !isMutating ? styles.pressed : null,
              isMutating ? styles.disabled : null,
            ]}
            testID={testId('lobby', 'kick', player.seat)}
          >
            <Text style={[styles.kickLabel, { color: colors.danger }]}>x</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function LobbyTeams({
  inviteCode,
  isMutating = false,
  mode,
  mySeat,
  onJoinTeam,
  onKick,
  onRandomize,
  onStart,
  playerCount,
  players,
  timerSeconds,
}: LobbyTeamsProps) {
  const { colors } = useTheme();
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const teamCount = teamCountForPlayers(playerCount);
  const capacity = seatsPerTeam(playerCount);
  const teams = Array.from(
    { length: teamCount },
    (_, index) => (index + 1) as LobbyTeam,
  );
  const isCreator = players.some(
    (player) => player.seat === mySeat && player.isCreator,
  );
  const startable = lobbyIsStartable({ playerCount, players });

  async function handleShare() {
    setShareStatus(null);
    try {
      await shareInvite(inviteCode);
      setShareStatus('Invite shared');
    } catch {
      setShareStatus('Could not share invite.');
    }
  }

  return (
    <View style={styles.root} testID={testId('lobby', 'screen')}>
      <Card variant="accent" testID={testId('lobby', 'invite')}>
        <View style={styles.inviteCard}>
          <Text style={[styles.eyebrow, { color: colors.accentText }]}>
            Invite code
          </Text>
          <Text style={[styles.inviteCode, { color: colors.accentText }]}>
            {inviteCode}
          </Text>
          <Text style={[styles.summary, { color: colors.accentText }]}>
            {playerCount} players - {teamCount} teams - {mode} mode -{' '}
            {timerLabel(timerSeconds)}
          </Text>
          <Button
            onPress={() => {
              void handleShare();
            }}
            size="sm"
            testID={testId('lobby', 'share')}
            variant="secondary"
          >
            Share invite
          </Button>
          {shareStatus ? (
            <Text style={[styles.shareStatus, { color: colors.accentText }]}>
              {shareStatus}
            </Text>
          ) : null}
        </View>
      </Card>

      <View style={styles.teams}>
        {teams.map((team) => {
          const slots = slotsForTeam(players, team, capacity);
          const badgeVariant = TEAM_META[team].badge;

          return (
            <View
              key={team}
              style={[
                styles.teamBand,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors[badgeVariant],
                },
              ]}
              testID={testId('lobby', 'team', team)}
            >
              <View style={styles.teamHeading}>
                <Badge size="sm" variant={badgeVariant}>
                  T{team}
                </Badge>
                <Text
                  style={[styles.teamLabel, { color: colors[badgeVariant] }]}
                >
                  {TEAM_META[team].label}
                </Text>
              </View>
              <View style={styles.slotRow}>
                {slots.map((player, index) => (
                  <TeamSlot
                    key={player?.seat ?? `${team}-${index}`}
                    index={index}
                    isCreator={isCreator}
                    isMutating={isMutating}
                    mySeat={mySeat}
                    onJoin={() => onJoinTeam?.(team)}
                    onKick={() => {
                      if (player) onKick?.(player.seat);
                    }}
                    player={player}
                    team={team}
                  />
                ))}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.turnOrder, { color: colors.textMuted }]}>
          {turnOrder(players)}
        </Text>
        {isCreator ? (
          <Button
            disabled={isMutating || players.length < playerCount}
            onPress={onRandomize}
            testID={testId('lobby', 'randomize')}
            variant="secondary"
          >
            Randomize teams
          </Button>
        ) : null}
        {isCreator ? (
          <Button
            disabled={!startable || isMutating}
            onPress={onStart}
            size="lg"
            testID={testId('lobby', 'start')}
          >
            {startLabel(playerCount, players)}
          </Button>
        ) : (
          <Card variant="sunken" testID={testId('lobby', 'waiting')}>
            Waiting for the host to start.
          </Card>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  inviteCard: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  inviteCode: {
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
    textAlign: 'center',
  },
  summary: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  shareStatus: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  teams: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  teamBand: {
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 12,
  },
  teamHeading: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
  },
  teamLabel: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  slotRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptySlot: {
    alignItems: 'center',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    minWidth: 96,
    minHeight: 52,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  emptySlotText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  filledSlot: {
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    flex: 1,
    minWidth: 96,
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  playerLine: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  playerName: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  youLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  kickButton: {
    alignItems: 'center',
    borderRadius: 6,
    display: 'flex',
    justifyContent: 'center',
    marginLeft: 'auto',
    minHeight: 30,
    minWidth: 30,
  },
  kickLabel: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  turnOrder: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
});
