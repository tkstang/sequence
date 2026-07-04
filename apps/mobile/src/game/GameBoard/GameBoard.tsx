import type {
  SnapshotBoardCell,
  SnapshotSequence,
} from '@sequence/client-state';
import type { Card, Position, Team } from '@sequence/game-logic';
import { BOARD_MAP, BOARD_SIZE, isCorner } from '@sequence/game-logic';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../theme/use-theme.ts';
import { BoardCell } from './BoardCell.tsx';
import type { BoardCellFrame, BoardLayoutMap } from './layout-map.ts';
import {
  createBoardSpotlight,
  isSpotlightDimmed,
  isSpotlightTarget,
} from './spotlight.ts';

export interface GameBoardProps {
  board: Readonly<Record<Position, SnapshotBoardCell | undefined>>;
  currentTeam?: Team | null;
  highlightedCells?: readonly Position[];
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

type BoardRotation = 0 | 90 | 180 | 270;

const BOARD_PADDING = 8;
const CARD_ASPECT_RATIO = 224.225 / 312.808;
const ROTATIONS = [0, 90, 180, 270] as const satisfies readonly BoardRotation[];
const ROTATION_DURATION_MS = 180;

export function GameBoard({
  board,
  currentTeam,
  highlightedCells = [],
  layoutMap,
  maxWidth,
  onCellPress,
  onCellRender,
  selectedCard,
  sequences = [],
}: GameBoardProps) {
  const { colors } = useTheme();
  const window = useWindowDimensions();
  const [rotation, setRotation] = useState<BoardRotation>(0);
  const animatedRotation = useSharedValue(0);
  const boardWidth = Math.min(maxWidth ?? window.width - 24, 430);
  const cellWidth = Math.max(
    24,
    Math.floor((boardWidth - BOARD_PADDING * 2) / BOARD_SIZE),
  );
  const cellHeight = Math.round(cellWidth / CARD_ASPECT_RATIO);
  const renderedBoardWidth = cellWidth * BOARD_SIZE + BOARD_PADDING * 2;
  const renderedBoardHeight = cellHeight * BOARD_SIZE + BOARD_PADDING * 2;
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
  const highlightedCellSet = useMemo(
    () => new Set<Position>(highlightedCells),
    [highlightedCells],
  );
  const boardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animatedRotation.value}deg` }],
  }));

  useEffect(() => {
    animatedRotation.value = withTiming(rotation, {
      duration: ROTATION_DURATION_MS,
    });
  }, [animatedRotation, rotation]);

  useEffect(() => {
    if (!layoutMap) return;

    layoutMap.clear();
    for (let rowIndex = 0; rowIndex < BOARD_MAP.length; rowIndex += 1) {
      const row = BOARD_MAP[rowIndex]!;
      for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
        const frame = rotateFrame(
          {
            height: cellHeight,
            width: cellWidth,
            x: BOARD_PADDING + colIndex * cellWidth,
            y: BOARD_PADDING + rowIndex * cellHeight,
          },
          rotation,
          renderedBoardWidth,
          renderedBoardHeight,
        );

        layoutMap.registerFrame(row[colIndex]!, frame);
      }
    }

    return () => {
      layoutMap.clear();
    };
  }, [
    cellHeight,
    cellWidth,
    layoutMap,
    renderedBoardHeight,
    renderedBoardWidth,
    rotation,
  ]);

  const rotateBoard = () => {
    setRotation((current) => {
      const currentIndex = ROTATIONS.indexOf(current);
      return ROTATIONS[(currentIndex + 1) % ROTATIONS.length]!;
    });
  };

  return (
    <View
      accessibilityLabel="Sequence board"
      style={[
        styles.root,
        {
          backgroundColor: colors.feltDark,
          height: renderedBoardHeight,
          width: renderedBoardWidth,
        },
      ]}
      testID="board.grid"
    >
      <Animated.View style={[styles.surface, boardAnimatedStyle]}>
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
              const spotlightTarget =
                highlightedCellSet.has(position) ||
                isSpotlightTarget(spotlight, position);
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
      </Animated.View>

      <Pressable
        accessibilityLabel={`Rotate board to ${nextRotation(rotation)} degrees`}
        accessibilityRole="button"
        onPress={rotateBoard}
        style={({ pressed }) => [
          styles.rotateButton,
          {
            backgroundColor: colors.surfaceRaised,
            borderColor: colors.borderStrong,
            opacity: pressed ? 0.78 : 1,
          },
        ]}
        testID="board.rotate"
      >
        <Text style={[styles.rotateText, { color: colors.text }]}>
          Rotate {rotation} deg
        </Text>
      </Pressable>
    </View>
  );
}

function nextRotation(rotation: BoardRotation): BoardRotation {
  const currentIndex = ROTATIONS.indexOf(rotation);
  return ROTATIONS[(currentIndex + 1) % ROTATIONS.length]!;
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

function rotateFrame(
  frame: BoardCellFrame,
  rotation: BoardRotation,
  boardWidth: number,
  boardHeight: number,
): BoardCellFrame {
  if (rotation === 0) return frame;

  const centerX = boardWidth / 2;
  const centerY = boardHeight / 2;
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const corners = [
    rotatePoint(frame.x, frame.y, centerX, centerY, cos, sin),
    rotatePoint(frame.x + frame.width, frame.y, centerX, centerY, cos, sin),
    rotatePoint(
      frame.x + frame.width,
      frame.y + frame.height,
      centerX,
      centerY,
      cos,
      sin,
    ),
    rotatePoint(frame.x, frame.y + frame.height, centerX, centerY, cos, sin),
  ];
  const xValues = corners.map((corner) => corner.x);
  const yValues = corners.map((corner) => corner.y);
  const left = Math.round(Math.min(...xValues));
  const right = Math.round(Math.max(...xValues));
  const top = Math.round(Math.min(...yValues));
  const bottom = Math.round(Math.max(...yValues));

  return {
    height: bottom - top,
    width: right - left,
    x: left,
    y: top,
  };
}

function rotatePoint(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  cos: number,
  sin: number,
): { readonly x: number; readonly y: number } {
  const offsetX = x - centerX;
  const offsetY = y - centerY;

  return {
    x: centerX + offsetX * cos - offsetY * sin,
    y: centerY + offsetX * sin + offsetY * cos,
  };
}

const styles = StyleSheet.create({
  rotateButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 32,
    minWidth: 96,
    paddingHorizontal: 10,
    paddingVertical: 7,
    position: 'absolute',
    right: BOARD_PADDING,
    top: BOARD_PADDING,
    zIndex: 10,
  },
  rotateText: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  root: {
    alignSelf: 'center',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'visible',
  },
  surface: {
    display: 'flex',
    flexDirection: 'column',
    padding: BOARD_PADDING,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
  },
});
