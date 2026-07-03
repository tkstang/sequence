import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button.tsx';
import { Card } from '../../components/Card.tsx';
import { TextField } from '../../components/TextField.tsx';
import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';

export type PlayerCount = 2 | 3 | 4 | 6;
export type PlayMode = 'tap' | 'drag';

export interface CreateGameValues {
  playerCount: PlayerCount;
  mode: PlayMode;
  timerSeconds: number | null;
  local: boolean;
  opponentName?: string;
}

export interface CreateFormProps {
  isSubmitting: boolean;
  onCreate: (values: CreateGameValues) => Promise<void>;
  submitError?: string | null;
}

interface TimerOption {
  seconds: number | null;
  label: string;
}

const PLAYER_COUNTS: readonly PlayerCount[] = [2, 3, 4, 6];
const PLAY_MODES: readonly PlayMode[] = ['tap', 'drag'];

const MODE_EXPLANATION: Record<PlayMode, string> = {
  tap: 'Tap a card to reveal its legal cells, then tap a cell to play. The friendlier mode.',
  drag: 'Drag a chip onto the board with no hints. The harder, table-like mode.',
};

function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function timerOptions(maxSeconds = 600): TimerOption[] {
  const options: TimerOption[] = [{ seconds: null, label: 'Off' }];
  for (let seconds = 30; seconds <= 180; seconds += 30) {
    options.push({ seconds, label: formatClock(seconds) });
  }
  for (let seconds = 240; seconds <= maxSeconds; seconds += 60) {
    options.push({ seconds, label: formatClock(seconds) });
  }
  return options;
}

function optionId(value: string | number | null): string {
  return value === null ? 'off' : String(value);
}

export function CreateForm({
  isSubmitting,
  onCreate,
  submitError,
}: CreateFormProps) {
  const { colors } = useTheme();
  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);
  const [mode, setMode] = useState<PlayMode>('tap');
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [local, setLocal] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function choosePlayerCount(next: PlayerCount) {
    setPlayerCount(next);
    if (next !== 2 && local) {
      setLocal(false);
    }
  }

  function setLocalEnabled(next: boolean) {
    setLocal(next);
    if (next) {
      setPlayerCount(2);
    }
  }

  async function submit() {
    setError(null);
    const trimmedOpponentName = opponentName.trim();
    if (local && trimmedOpponentName.length === 0) {
      setError('Enter an opponent name.');
      return;
    }
    if (local && trimmedOpponentName.length > 40) {
      setError('Opponent name must be 40 characters or fewer.');
      return;
    }

    try {
      await onCreate({
        playerCount,
        mode,
        timerSeconds,
        local,
        opponentName: local ? trimmedOpponentName : undefined,
      });
    } catch {
      // Route-level mutation handlers own submit error state.
    }
  }

  const message = error ?? submitError;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      testID={testId('create', 'scroll')}
    >
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Players</Text>
        <View style={styles.optionRow}>
          {PLAYER_COUNTS.map((count) => (
            <OptionButton
              key={count}
              label={String(count)}
              onPress={() => choosePlayerCount(count)}
              selected={playerCount === count}
              testID={testId('create', 'players', count)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Play mode</Text>
        <View style={styles.optionRow}>
          {PLAY_MODES.map((playMode) => (
            <OptionButton
              key={playMode}
              label={playMode}
              onPress={() => setMode(playMode)}
              selected={mode === playMode}
              testID={testId('create', 'mode', playMode)}
            />
          ))}
        </View>
        <Card variant="sunken">
          <Text style={[styles.explanation, { color: colors.textMuted }]}>
            {MODE_EXPLANATION[mode]}
          </Text>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Turn timer</Text>
        <View style={styles.timerGrid}>
          {timerOptions().map((option) => (
            <OptionButton
              key={optionId(option.seconds)}
              label={option.label}
              onPress={() => setTimerSeconds(option.seconds)}
              selected={timerSeconds === option.seconds}
              testID={testId('create', 'timer', optionId(option.seconds))}
            />
          ))}
        </View>
      </View>

      <Card variant="raised">
        <View style={styles.localHeader}>
          <View style={styles.localText}>
            <Text style={[styles.label, { color: colors.text }]}>
              Pass & play
            </Text>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Local games use two players on this device.
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Pass and play on this device"
            accessibilityRole="switch"
            accessibilityState={{ checked: local }}
            onPress={() => setLocalEnabled(!local)}
            style={[
              styles.switchTrack,
              {
                backgroundColor: local ? colors.accent : colors.surfaceSunken,
                borderColor: local ? colors.accent : colors.borderStrong,
              },
            ]}
            testID={testId('create', 'local', 'toggle')}
          >
            <View
              style={[
                styles.switchThumb,
                {
                  backgroundColor: local ? colors.accentText : colors.textMuted,
                  transform: [{ translateX: local ? 18 : 0 }],
                },
              ]}
            />
          </Pressable>
        </View>
        {local ? (
          <View style={styles.localName}>
            <Text style={[styles.label, { color: colors.text }]}>
              Opponent name
            </Text>
            <TextField
              accessibilityLabel="Opponent name"
              onChangeText={setOpponentName}
              placeholder="e.g. Sarah"
              testID={testId('create', 'local', 'opponentName')}
              value={opponentName}
            />
          </View>
        ) : null}
      </Card>

      {message ? (
        <Text
          accessibilityRole="alert"
          style={[styles.error, { color: colors.danger }]}
        >
          {message}
        </Text>
      ) : null}

      <Button
        disabled={isSubmitting}
        onPress={() => {
          void submit();
        }}
        size="lg"
        testID={testId('create', 'submit')}
      >
        {isSubmitting
          ? 'Creating...'
          : local
            ? 'Start local game'
            : 'Create game'}
      </Button>
    </ScrollView>
  );
}

interface OptionButtonProps {
  label: string;
  onPress: () => void;
  selected: boolean;
  testID: string;
}

function OptionButton({ label, onPress, selected, testID }: OptionButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? colors.accent : colors.surfaceRaised,
          borderColor: selected ? colors.accent : colors.borderStrong,
        },
        pressed ? styles.pressed : null,
      ]}
      testID={testID}
    >
      <Text
        style={[
          styles.optionLabel,
          { color: selected ? colors.accentText : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  explanation: {
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  localHeader: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  localName: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 14,
  },
  localText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: 2,
  },
  option: {
    alignItems: 'center',
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 68,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    textTransform: 'capitalize',
  },
  optionRow: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pressed: {
    opacity: 0.82,
  },
  scrollContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    paddingBottom: 24,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  switchThumb: {
    borderRadius: 999,
    height: 20,
    width: 20,
  },
  switchTrack: {
    borderRadius: 999,
    borderStyle: 'solid',
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 3,
    width: 46,
  },
  timerGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
