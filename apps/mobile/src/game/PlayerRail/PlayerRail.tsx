import type {
  GameViewStatus,
  SnapshotPlayer,
  SnapshotSequence,
} from '@sequence/client-state';
import type { Team } from '@sequence/game-logic';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';
import { TimerBadge } from './TimerBadge.tsx';

export interface PlayerRailProps {
  currentSeat: number;
  nowMs?: number;
  players: readonly SnapshotPlayer[];
  round: number;
  sequences?: readonly SnapshotSequence[];
  status: GameViewStatus;
  timerSeconds: number | null;
  turnDeadlineAt?: string | null;
  turnRemainingMs?: number | null;
}

type TeamColorMap = Record<Team, string>;
type SequenceCounts = Record<Team, number>;

export function PlayerRail({
  currentSeat,
  nowMs,
  players,
  round,
  sequences = [],
  status,
  timerSeconds,
  turnDeadlineAt,
  turnRemainingMs,
}: PlayerRailProps) {
  const { colors } = useTheme();
  const teamColors = {
    1: colors.teamBlue,
    2: colors.teamGreen,
    3: colors.teamRed,
  } as const satisfies TeamColorMap;
  const counts = useMemo(() => sequenceCounts(sequences), [sequences]);

  return (
    <View
      accessibilityLabel="Players"
      style={[
        styles.root,
        {
          backgroundColor: colors.slate,
        },
      ]}
      testID={testId('game', 'rail')}
    >
      <View style={styles.players} testID={testId('game', 'players')}>
        {players.map((player) => {
          const active = player.seat === currentSeat;
          const connected = player.connected;
          const playerTestId = testId('game', 'player', player.seat);

          return (
            <View
              accessibilityLabel={`${player.name}, seat ${player.seat + 1}, team ${
                player.team
              }, ${connected ? 'connected' : 'offline'}${
                active ? ', current turn' : ''
              }`}
              accessibilityState={{
                disabled: !connected,
                selected: active,
              }}
              key={player.seat}
              style={[
                styles.player,
                {
                  backgroundColor: colors.slateSoft,
                  borderColor: active ? colors.highlight : 'transparent',
                  opacity: connected ? 1 : 0.62,
                },
                active ? styles.activePlayer : null,
              ]}
              testID={playerTestId}
            >
              <View
                accessibilityLabel={`team ${player.team}`}
                style={[
                  styles.teamSwatch,
                  { backgroundColor: teamColors[player.team] },
                ]}
                testID={`${playerTestId}.team`}
              />
              <View style={styles.playerText}>
                <Text
                  numberOfLines={1}
                  style={[styles.playerName, { color: colors.textOnDark }]}
                >
                  {player.name}
                </Text>
                <Text style={[styles.playerMeta, { color: colors.textOnDark }]}>
                  Seat {player.seat + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.turnBadge,
                  {
                    backgroundColor: colors.frozenBg,
                    color: colors.frozenFg,
                    opacity: active ? 1 : 0,
                  },
                ]}
                testID={`${playerTestId}.turn`}
              >
                Turn
              </Text>
              <Text
                style={[
                  styles.connectionBadge,
                  {
                    backgroundColor: connected
                      ? colors.neutralBadgeBg
                      : colors.danger,
                    color: colors.textOnDark,
                    opacity: connected ? 0 : 1,
                  },
                ]}
                testID={`${playerTestId}.offline`}
              >
                {connected ? '' : 'Offline'}
              </Text>
              {connected ? (
                <Text
                  style={[
                    styles.connectionText,
                    {
                      color: colors.textOnDark,
                    },
                  ]}
                >
                  Connected
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.stat} testID={testId('game', 'round')}>
          <Text style={[styles.statValue, { color: colors.textOnDark }]}>
            Round {round}
          </Text>
        </View>
        <View style={styles.stat} testID={testId('game', 'sequences')}>
          <Text style={[styles.statValue, { color: colors.textOnDark }]}>
            Seq {counts[1]}/{counts[2]}/{counts[3]}
          </Text>
        </View>
        <TimerBadge
          nowMs={nowMs}
          status={status}
          timerSeconds={timerSeconds}
          turnDeadlineAt={turnDeadlineAt}
          turnRemainingMs={turnRemainingMs}
        />
      </View>
    </View>
  );
}

function sequenceCounts(
  sequences: readonly SnapshotSequence[],
): SequenceCounts {
  const counts: SequenceCounts = { 1: 0, 2: 0, 3: 0 };
  for (const sequence of sequences) {
    counts[sequence.team] += 1;
  }
  return counts;
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 10,
  },
  players: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  player: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 0,
    display: 'flex',
    flexBasis: '31%',
    flexDirection: 'row',
    gap: 8,
    minHeight: 52,
    minWidth: 104,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  activePlayer: {
    borderWidth: 2,
  },
  teamSwatch: {
    borderRadius: 999,
    height: 12,
    width: 12,
  },
  playerText: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 17,
  },
  playerMeta: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    opacity: 0.62,
  },
  turnBadge: {
    borderRadius: 999,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    right: 6,
    top: 5,
  },
  connectionBadge: {
    borderRadius: 999,
    bottom: 5,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    right: 6,
  },
  connectionText: {
    bottom: 7,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
    opacity: 0.72,
    position: 'absolute',
    right: 8,
  },
  metaRow: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stat: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
});
