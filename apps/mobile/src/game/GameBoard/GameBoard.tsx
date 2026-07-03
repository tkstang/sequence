import type {
  SnapshotBoardCell,
  SnapshotSequence,
} from '@sequence/client-state';
import type { Card, Position, Team } from '@sequence/game-logic';
import { BOARD_MAP, BOARD_SIZE, isCorner } from '@sequence/game-logic';
import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../theme/use-theme.ts';
import { BoardCell } from './BoardCell.tsx';
import type { BoardLayoutMap } from './layout-map.ts';
import {
  createBoardSpotlight,
  isSpotlightDimmed,
  isSpotlightTarget,
} from './spotlight.ts';

export interface GameBoardProps {
  board: Readonly<Record<Position, SnapshotBoardCell | undefined>>;
  currentTeam?: Team | null;
  layoutMap?: BoardLayoutMap;
  maxWidth?: number;
  onCellPress?: (position: Position) => void;
  onCellRender?: (position: Position) => void;
  selectedCard?: Card | null;
  sequences?: readonly SnapshotSequence[];
}

interface SequenceLookup {
  lockedBy?: number;
  team?: Team;
}

const BOARD_PADDING = 8;
const CARD_ASPECT_RATIO = 224.225 / 312.808;

export function GameBoard({
  board,
  currentTeam,
  layoutMap,
  maxWidth,
  onCellPress,
  onCellRender,
  selectedCard,
  sequences = [],
}: GameBoardProps) {
  const { colors } = useTheme();
  const window = useWindowDimensions();
  const boardWidth = Math.min(maxWidth ?? window.width - 24, 430);
  const cellWidth = Math.max(
    24,
    Math.floor((boardWidth - BOARD_PADDING * 2) / BOARD_SIZE),
  );
  const cellHeight = Math.round(cellWidth / CARD_ASPECT_RATIO);
  const sequenceLookup = useMemo(
    () => buildSequenceLookup(sequences),
    [sequences],
  );
  const spotlight = useMemo(
    () => createBoardSpotlight({ board, currentTeam, selectedCard }),
    [board, currentTeam, selectedCard],
  );
  const teamColors = {
    1: colors.teamBlue,
    2: colors.teamGreen,
    3: colors.teamRed,
  } as const satisfies Record<Team, string>;

  useEffect(() => {
    if (!layoutMap) return;

    layoutMap.clear();
    for (let rowIndex = 0; rowIndex < BOARD_MAP.length; rowIndex += 1) {
      const row = BOARD_MAP[rowIndex]!;
      for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
        layoutMap.registerFrame(row[colIndex]!, {
          height: cellHeight,
          width: cellWidth,
          x: BOARD_PADDING + colIndex * cellWidth,
          y: BOARD_PADDING + rowIndex * cellHeight,
        });
      }
    }

    return () => {
      layoutMap.clear();
    };
  }, [cellHeight, cellWidth, layoutMap]);

  return (
    <View
      accessibilityLabel="Sequence board"
      style={[
        styles.root,
        {
          backgroundColor: colors.feltDark,
          height: cellHeight * BOARD_SIZE + BOARD_PADDING * 2,
          padding: BOARD_PADDING,
          width: cellWidth * BOARD_SIZE + BOARD_PADDING * 2,
        },
      ]}
      testID="board.grid"
    >
      {BOARD_MAP.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={styles.row}
          testID={`board.row.${rowIndex}`}
        >
          {row.map((position) => {
            const cell = board[position];
            const sequence = sequenceLookup.get(position);
            const chip =
              cell?.chip ?? (isCorner(position) ? undefined : sequence?.team);
            const lockedBy = cell?.lockedBy ?? sequence?.lockedBy;
            const spotlightTarget = isSpotlightTarget(spotlight, position);
            const spotlightDimmed = isSpotlightDimmed(spotlight, position);

            return (
              <BoardCell
                key={position}
                cellHeight={cellHeight}
                cellWidth={cellWidth}
                chip={chip}
                disabled={
                  selectedCard !== null &&
                  selectedCard !== undefined &&
                  !spotlightTarget
                }
                lockedBy={lockedBy}
                onPress={onCellPress}
                onRender={onCellRender}
                position={position}
                spotlight={
                  spotlightTarget
                    ? 'target'
                    : spotlightDimmed
                      ? 'dimmed'
                      : 'none'
                }
                teamColor={chip === undefined ? undefined : teamColors[chip]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

function buildSequenceLookup(
  sequences: readonly SnapshotSequence[],
): ReadonlyMap<Position, SequenceLookup> {
  const lookup = new Map<Position, SequenceLookup>();
  for (const sequence of sequences) {
    for (const position of sequence.cells) {
      lookup.set(position, { lockedBy: sequence.id, team: sequence.team });
    }
  }
  return lookup;
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'center',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
  },
});
