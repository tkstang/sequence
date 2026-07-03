import type { Position, Rank, Suit, Team } from '@sequence/game-logic';
import { isCorner, parseBoardCell } from '@sequence/game-logic';
import { memo } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { testId } from '../../test/test-ids.ts';
import { CardFace } from '../cards/CardFace.tsx';
import type { BoardLayoutMap } from './layout-map.ts';

export interface BoardCellProps {
  cellSize: number;
  chip?: Team;
  layoutMap?: BoardLayoutMap;
  lockedBy?: number;
  onRender?: (position: Position) => void;
  position: Position;
  teamColor?: string;
}

function BoardCellImpl({
  cellSize,
  chip,
  layoutMap,
  lockedBy,
  onRender,
  position,
  teamColor,
}: BoardCellProps) {
  onRender?.(position);

  const corner = isCorner(position);
  const cellTestId = testId('board', 'cell', position);

  function handleLayout(event: LayoutChangeEvent) {
    layoutMap?.registerFrame(position, event.nativeEvent.layout);
  }

  return (
    <View
      accessibilityLabel={
        corner ? 'wild corner' : `${position.slice(1)} board cell`
      }
      onLayout={handleLayout}
      style={[
        styles.root,
        {
          height: cellSize,
          width: cellSize,
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
          size={Math.max(18, cellSize - 6)}
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
    </View>
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
    previous.cellSize === next.cellSize &&
    previous.chip === next.chip &&
    previous.layoutMap === next.layoutMap &&
    previous.lockedBy === next.lockedBy &&
    previous.onRender === next.onRender &&
    previous.position === next.position &&
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
});
