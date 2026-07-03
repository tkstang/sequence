import type { Position, Rank, Suit, Team } from '@sequence/game-logic';
import { isCorner, parseBoardCell } from '@sequence/game-logic';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { testId } from '../../test/test-ids.ts';
import { CardFace } from '../cards/CardFace.tsx';

export type BoardCellSpotlight = 'dimmed' | 'none' | 'target';

export interface BoardCellProps {
  cellHeight: number;
  cellWidth: number;
  chip?: Team;
  disabled?: boolean;
  lockedBy?: number;
  onPress?: (position: Position) => void;
  onRender?: (position: Position) => void;
  position: Position;
  spotlight?: BoardCellSpotlight;
  teamColor?: string;
}

function BoardCellImpl({
  cellHeight,
  cellWidth,
  chip,
  disabled = false,
  lockedBy,
  onPress,
  onRender,
  position,
  spotlight = 'none',
  teamColor,
}: BoardCellProps) {
  onRender?.(position);

  const corner = isCorner(position);
  const cellTestId = testId('board', 'cell', position);
  const interactive = onPress !== undefined;

  return (
    <Pressable
      accessibilityLabel={
        corner ? 'wild corner' : `${position.slice(1)} board cell`
      }
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityState={{ disabled: interactive ? disabled : undefined }}
      disabled={!interactive || disabled}
      onPress={interactive ? () => onPress(position) : undefined}
      style={[
        styles.root,
        {
          height: cellHeight,
          width: cellWidth,
        },
        corner ? styles.corner : null,
      ]}
      testID={cellTestId}
    >
      {corner ? (
        <Text style={styles.wildMark} testID={`${cellTestId}.wild`}>
          W
        </Text>
      ) : (
        <CardFace
          card={cardForPosition(position)}
          size={Math.max(18, cellWidth - 6)}
          testID={`${cellTestId}.card`}
        />
      )}

      {chip && teamColor ? (
        <View
          accessibilityLabel={`team ${chip} chip`}
          style={[
            styles.chip,
            {
              backgroundColor: teamColor,
              borderColor: lockedBy === undefined ? '#ffffff' : '#111827',
            },
            lockedBy === undefined ? null : styles.lockedChip,
          ]}
          testID={`${cellTestId}.chip`}
        >
          {lockedBy === undefined ? null : (
            <View style={styles.lockDot} testID={`${cellTestId}.lock`} />
          )}
        </View>
      ) : null}

      {spotlight === 'target' ? (
        <View
          pointerEvents="none"
          style={styles.spotlightTarget}
          testID={`${cellTestId}.spotlight.target`}
        />
      ) : null}

      {spotlight === 'dimmed' ? (
        <View
          pointerEvents="none"
          style={styles.spotlightDim}
          testID={`${cellTestId}.spotlight.dim`}
        />
      ) : null}
    </Pressable>
  );
}

function cardForPosition(position: Position): { rank: Rank; suit: Suit } {
  const parsed = parseBoardCell(position);
  if (parsed.kind === 'corner') {
    throw new Error(`cannot render a card face for corner ${position}`);
  }
  return { rank: parsed.rank, suit: parsed.suit };
}

export const BoardCell = memo(
  BoardCellImpl,
  (previous, next) =>
    previous.cellHeight === next.cellHeight &&
    previous.cellWidth === next.cellWidth &&
    previous.chip === next.chip &&
    previous.disabled === next.disabled &&
    previous.lockedBy === next.lockedBy &&
    previous.onPress === next.onPress &&
    previous.onRender === next.onRender &&
    previous.position === next.position &&
    previous.spotlight === next.spotlight &&
    previous.teamColor === next.teamColor,
);
BoardCell.displayName = 'BoardCell';

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.32)',
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  corner: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  wildMark: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  chip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    bottom: 3,
    height: 16,
    justifyContent: 'center',
    position: 'absolute',
    right: 3,
    width: 16,
  },
  lockedChip: {
    borderWidth: 2,
  },
  lockDot: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    height: 5,
    width: 5,
  },
  spotlightDim: {
    backgroundColor: 'rgba(15,23,42,0.54)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  spotlightTarget: {
    borderColor: 'rgba(250,204,21,0.92)',
    borderRadius: 3,
    borderWidth: 2,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
