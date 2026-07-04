import type { SnapshotPlayer } from '@sequence/client-state';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button.tsx';
import { testId } from '../test/test-ids.ts';
import { useTheme } from '../theme/use-theme.ts';

type PendingAction = 'save' | 'concede' | null;

export interface LifecycleMutationInput {
  gameId: string;
  version: number;
}

export interface ActiveGameControlsProps {
  errorMessage?: string | null;
  gameId: string;
  isPending?: boolean;
  local: boolean;
  onConcede: (input: LifecycleMutationInput) => void;
  onSaveAndExit: (input: LifecycleMutationInput) => void;
  players: readonly SnapshotPlayer[];
  version: number;
}

function containsGuest(players: readonly SnapshotPlayer[]): boolean {
  return players.some((player) => player.isGuest);
}

export function ActiveGameControls({
  errorMessage = null,
  gameId,
  isPending = false,
  local,
  onConcede,
  onSaveAndExit,
  players,
  version,
}: ActiveGameControlsProps) {
  const { colors } = useTheme();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const canSaveAndExit = local || !containsGuest(players);
  const mutationInput = { gameId, version };

  function confirmSaveAndExit() {
    setPendingAction(null);
    onSaveAndExit(mutationInput);
  }

  function confirmConcede() {
    setPendingAction(null);
    onConcede(mutationInput);
  }

  return (
    <View
      accessibilityLabel="Game lifecycle controls"
      style={styles.root}
      testID={testId('game', 'lifecycle')}
    >
      <View style={styles.buttons}>
        {pendingAction === 'save' ? (
          <>
            <Button
              disabled={isPending}
              onPress={() => setPendingAction(null)}
              size="sm"
              testID={testId('game', 'lifecycle', 'cancel')}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onPress={confirmSaveAndExit}
              size="sm"
              testID={testId('game', 'lifecycle', 'save', 'confirm')}
            >
              Confirm save
            </Button>
          </>
        ) : pendingAction === 'concede' ? (
          <>
            <Button
              disabled={isPending}
              onPress={() => setPendingAction(null)}
              size="sm"
              testID={testId('game', 'lifecycle', 'cancel')}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={isPending}
              onPress={confirmConcede}
              size="sm"
              testID={testId('game', 'lifecycle', 'concede', 'confirm')}
              variant="destructive"
            >
              Confirm concede
            </Button>
          </>
        ) : (
          <>
            {canSaveAndExit ? (
              <Button
                accessibilityLabel={
                  isPending ? 'Saving or conceding game' : 'Save and exit'
                }
                disabled={isPending}
                onPress={() => setPendingAction('save')}
                size="sm"
                testID={testId('game', 'lifecycle', 'save')}
                variant="secondary"
              >
                Save & exit
              </Button>
            ) : null}
            <Button
              disabled={isPending}
              onPress={() => setPendingAction('concede')}
              size="sm"
              testID={testId('game', 'lifecycle', 'concede')}
              variant="destructive"
            >
              Concede
            </Button>
          </>
        )}
      </View>

      {errorMessage ? (
        <Text
          accessibilityRole="alert"
          style={[styles.error, { color: colors.danger }]}
          testID={testId('game', 'lifecycle', 'error')}
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  error: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
