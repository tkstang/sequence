import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '../../components/Badge.tsx';
import { Card } from '../../components/Card.tsx';
import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';

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

const TEAM_VARIANTS = {
  1: 'teamBlue',
  2: 'teamGreen',
  3: 'teamRed',
} as const;

export function normalizeInviteCode(code: string): string {
  return code.replaceAll(/[\s-]/g, '').toUpperCase();
}

function formatTimer(timerSeconds: number | null): string {
  return timerSeconds === null ? 'no timer' : `${timerSeconds}s turns`;
}

export function getPreviewUnavailableMessage(
  preview: JoinPreview,
): string | null {
  if (preview.local) {
    return 'This is a local pass-and-play game and cannot be joined remotely.';
  }
  if (preview.status !== 'lobby') {
    return 'This game has already started and cannot be joined.';
  }
  if (preview.players.length >= preview.playerCount) {
    return 'This game is full.';
  }
  return null;
}

export function PreviewCard({ preview }: { preview: JoinPreview }) {
  const { colors } = useTheme();

  return (
    <Card variant="raised" testID={testId('join', 'preview', 'card')}>
      <View style={styles.root}>
        <View style={styles.heading}>
          <Text style={[styles.inviteCode, { color: colors.text }]}>
            {preview.inviteCode}
          </Text>
          <Text style={[styles.settings, { color: colors.textMuted }]}>
            {preview.playerCount} players
          </Text>
          <Text style={[styles.settings, { color: colors.textMuted }]}>
            {preview.mode} mode
          </Text>
          <Text style={[styles.settings, { color: colors.textMuted }]}>
            {formatTimer(preview.timerSeconds)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            Players
          </Text>
          {preview.players.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              No one has joined yet.
            </Text>
          ) : (
            <View style={styles.roster}>
              {preview.players.map((player) => (
                <View
                  key={player.seat}
                  style={styles.rosterRow}
                  testID={testId('join', 'preview', 'player', player.seat)}
                >
                  <Badge
                    size="sm"
                    variant={
                      TEAM_VARIANTS[
                        player.team as keyof typeof TEAM_VARIANTS
                      ] ?? 'neutral'
                    }
                  >
                    T{player.team}
                  </Badge>
                  <Text style={[styles.playerName, { color: colors.text }]}>
                    {player.name}
                  </Text>
                  {player.isCreator ? (
                    <Badge size="sm" variant="neutral">
                      Host
                    </Badge>
                  ) : null}
                  {player.isGuest ? (
                    <Text style={[styles.guest, { color: colors.textMuted }]}>
                      guest
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  heading: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  settings: {
    fontSize: 15,
    lineHeight: 21,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  empty: {
    fontSize: 15,
    lineHeight: 21,
  },
  roster: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  rosterRow: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  guest: {
    fontSize: 13,
    lineHeight: 18,
  },
});
