import type {
  SnapshotBoardCell,
  SnapshotSequence,
} from '@sequence/client-state';
import type { Position, Team } from '@sequence/game-logic';
import { BOARD_MAP, BOARD_SIZE, isCorner } from '@sequence/game-logic';
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { useTheme } from '../../theme/use-theme.ts';
import { BoardCell } from './BoardCell.tsx';
import type { BoardLayoutMap } from './layout-map.ts';

export interface GameBoardProps {
  board: Readonly<Record<Position, SnapshotBoardCell | undefined>>;
  layoutMap?: BoardLayoutMap;
  maxWidth?: number;
  onCellRender?: (position: Position) => void;
  sequences?: readonly SnapshotSequence[];
}

interface SequenceLookup {
  lockedBy?: number;
  team?: Team;
}

const BOARD_PADDING = 8;

export function GameBoard({
  board,
  layoutMap,
  maxWidth,
  onCellRender,
  sequences = [],
}: GameBoardProps) {
  const { colors } = useTheme();
  const window = useWindowDimensions();
  const boardWidth = Math.min(maxWidth ?? window.width - 24, 430);
  const cellSize = Math.max(
    24,
    Math.floor((boardWidth - BOARD_PADDING * 2) / BOARD_SIZE),
  );
  const sequenceLookup = useMemo(
    () => buildSequenceLookup(sequences),
    [sequences],
  );
  const teamColors = {
    1: colors.teamBlue,
    2: colors.teamGreen,
    3: colors.teamRed,
  } as const satisfies Record<Team, string>;

  return (
    <View
      accessibilityLabel="Sequence board"
      style={[
        styles.root,
        {
          backgroundColor: colors.feltDark,
          padding: BOARD_PADDING,
          width: cellSize * BOARD_SIZE + BOARD_PADDING * 2,
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

            return (
              <BoardCell
                key={position}
                cellSize={cellSize}
                chip={chip}
                layoutMap={layoutMap}
                lockedBy={lockedBy}
                onRender={onCellRender}
                position={position}
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
