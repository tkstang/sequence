import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '../../components/Badge.tsx';
import { Card } from '../../components/Card.tsx';
import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';

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

export type DashboardGameKind = 'resumable' | 'recent';

export interface GameCardProps {
  game: DashboardGame;
  kind: DashboardGameKind;
  onPress: (game: DashboardGame) => void;
}

function describeOpponents(game: DashboardGame): string {
  if (game.opponents.length === 0) {
    return 'Solo game';
  }

  const names = game.opponents.join(', ');
  return game.local ? `local vs ${names}` : `vs ${names}`;
}

function statusLabel(status: string): string {
  return status.toUpperCase();
}

function resultLabel(result: DashboardGame['result']): string {
  if (result === 'win') {
    return 'W';
  }
  if (result === 'loss') {
    return 'L';
  }
  return 'No result';
}

function statusVariant(status: string) {
  if (status === 'saved') {
    return 'saved';
  }
  if (status === 'frozen') {
    return 'frozen';
  }
  if (status === 'lobby') {
    return 'accent';
  }
  return 'neutral';
}

function resultVariant(result: DashboardGame['result']) {
  if (result === 'win') {
    return 'teamGreen';
  }
  if (result === 'loss') {
    return 'teamRed';
  }
  return 'neutral';
}

function ResumableMeta({ game }: { game: DashboardGame }) {
  const { colors } = useTheme();
  const notes = [`Round ${game.round}`];

  if (game.status === 'frozen') {
    notes.push('everyone must return');
  }

  if (game.expiresAt !== null) {
    notes.push('expires soon');
  }

  return (
    <Text style={[styles.meta, { color: colors.textMuted }]}>
      {notes.join(' · ')}
    </Text>
  );
}

function RecentMeta({ game }: { game: DashboardGame }) {
  const { colors } = useTheme();
  const notes = [`Team ${game.myTeam}`];

  if (game.endReason === 'concede') {
    notes.push('concede');
  }

  if (game.finishedAt !== null) {
    notes.push('finished');
  }

  return (
    <Text style={[styles.meta, { color: colors.textMuted }]}>
      {notes.join(' · ')}
    </Text>
  );
}

export function GameCard({ game, kind, onPress }: GameCardProps) {
  const { colors } = useTheme();
  const cardKind = kind === 'resumable' ? 'resumable' : 'recent';
  const cardTestId = testId('dashboard', cardKind, game.gameId);
  const label =
    kind === 'resumable'
      ? `Open ${describeOpponents(game)}`
      : `View result for ${describeOpponents(game)}`;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => onPress(game)}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
      testID={cardTestId}
    >
      <Card>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.roster, { color: colors.text }]}>
              {describeOpponents(game)}
            </Text>
            <View style={styles.badges}>
              {game.local ? (
                <Badge
                  size="sm"
                  testID={testId('dashboard', cardKind, game.gameId, 'local')}
                  variant="accent"
                >
                  LOCAL
                </Badge>
              ) : null}
              {kind === 'resumable' ? (
                <Badge size="sm" variant={statusVariant(game.status)}>
                  {statusLabel(game.status)}
                </Badge>
              ) : (
                <Badge size="sm" variant={resultVariant(game.result)}>
                  {resultLabel(game.result)}
                </Badge>
              )}
            </View>
          </View>
          {kind === 'resumable' ? (
            <ResumableMeta game={game} />
          ) : (
            <RecentMeta game={game} />
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  header: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  badges: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    flexShrink: 0,
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-end',
  },
  roster: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.82,
  },
});
