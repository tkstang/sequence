import type { PendingChoiceView } from '@sequence/client-state';
import type { Position } from '@sequence/game-logic';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { testId } from '../test/test-ids.ts';
import { useTheme } from '../theme/use-theme.ts';

export interface SequenceChoiceSubmit {
  cells: Position[];
  version: number;
}

export interface SequenceChoiceSheetProps {
  errorMessage?: string | null;
  isSubmitting?: boolean;
  mySeat: number;
  onChoose: (choice: SequenceChoiceSubmit) => void;
  onHighlightedCellsChange?: (cells: Position[]) => void;
  pendingChoice?: PendingChoiceView;
  version: number;
}

interface SequenceWindow {
  readonly cells: Position[];
  readonly id: string;
  readonly label: string;
}

export function sequenceChoiceWindows(
  pendingChoice: PendingChoiceView,
): SequenceWindow[] {
  const placed = pendingChoice.placed;
  const windows: SequenceWindow[] = [];

  for (let start = 0; start <= pendingChoice.cells.length - 5; start += 1) {
    const cells = pendingChoice.cells.slice(start, start + 5);
    if (cells.length !== 5) continue;
    if (placed && !cells.includes(placed)) continue;

    windows.push({
      cells,
      id: `${start}:${cells.join('|')}`,
      label: cells.join(' - '),
    });
  }

  return windows;
}

export function SequenceChoiceSheet({
  errorMessage = null,
  isSubmitting = false,
  mySeat,
  onChoose,
  onHighlightedCellsChange,
  pendingChoice,
  version,
}: SequenceChoiceSheetProps) {
  const { colors } = useTheme();
  const windows = useMemo(
    () => (pendingChoice ? sequenceChoiceWindows(pendingChoice) : []),
    [pendingChoice],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ownsChoice = pendingChoice?.seat === mySeat;
  const selectedWindow =
    windows.find((window) => window.id === selectedId) ?? windows[0] ?? null;
  const additionalRunCount = pendingChoice?.additionalRuns?.length ?? 0;

  useEffect(() => {
    setSelectedId(windows[0]?.id ?? null);
  }, [pendingChoice, windows]);

  useEffect(() => {
    onHighlightedCellsChange?.(
      ownsChoice && selectedWindow ? selectedWindow.cells : [],
    );
  }, [onHighlightedCellsChange, ownsChoice, selectedWindow]);

  if (!pendingChoice) {
    return null;
  }

  if (!ownsChoice) {
    return (
      <View
        accessibilityLiveRegion="polite"
        style={[
          styles.frozenBanner,
          { backgroundColor: colors.frozenBg, borderColor: colors.border },
        ]}
        testID={testId('sequenceChoice', 'frozen')}
      >
        <Text style={[styles.frozenText, { color: colors.text }]}>
          Waiting for seat {pendingChoice.seat} to choose a sequence.
        </Text>
      </View>
    );
  }

  const submitDisabled = isSubmitting || selectedWindow === null;

  return (
    <View
      accessibilityLabel="Choose sequence cells"
      style={[
        styles.sheet,
        { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
      ]}
      testID={testId('sequenceChoice', 'sheet')}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Choose the five chips to lock
        </Text>
        <Text style={[styles.body, { color: colors.textMuted }]}>
          Placed chip: {pendingChoice.placed ?? 'unknown'}
        </Text>
      </View>

      <View style={styles.windowList}>
        {windows.map((window, index) => {
          const selected = selectedWindow?.id === window.id;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={window.id}
              onPress={() => setSelectedId(window.id)}
              style={[
                styles.windowButton,
                {
                  backgroundColor: selected
                    ? colors.surfaceSunken
                    : colors.surface,
                  borderColor: selected ? colors.highlight : colors.border,
                },
              ]}
              testID={testId('sequenceChoice', 'window', index)}
            >
              <Text style={[styles.windowLabel, { color: colors.text }]}>
                {window.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {windows.length === 0 ? (
        <Text
          accessibilityRole="alert"
          style={[styles.errorText, { color: colors.danger }]}
        >
          No valid five-cell sequence includes the placed chip.
        </Text>
      ) : null}

      {additionalRunCount > 0 ? (
        <Text style={[styles.body, { color: colors.textMuted }]}>
          {additionalRunCount} more run
          {additionalRunCount === 1 ? '' : 's'} to choose after this
        </Text>
      ) : null}

      {errorMessage ? (
        <Text
          accessibilityRole="alert"
          style={[styles.errorText, { color: colors.danger }]}
          testID={testId('sequenceChoice', 'error')}
        >
          {errorMessage}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: submitDisabled }}
        disabled={submitDisabled}
        onPress={() => {
          if (!selectedWindow) return;
          onChoose({ cells: selectedWindow.cells, version });
        }}
        style={[
          styles.submitButton,
          {
            backgroundColor: submitDisabled ? colors.surface : colors.accent,
          },
        ]}
        testID={testId('sequenceChoice', 'submit')}
      >
        <Text
          style={[
            styles.submitText,
            {
              color: submitDisabled ? colors.textMuted : colors.accentText,
            },
          ]}
        >
          {isSubmitting ? 'Submitting...' : 'Lock sequence'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  frozenBanner: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  frozenText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  sheet: {
    borderRadius: 8,
    borderWidth: 1,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    left: 0,
    padding: 12,
    position: 'absolute',
    right: 0,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 6,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
  },
  windowButton: {
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  windowLabel: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  windowList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
});
