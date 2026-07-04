import type { Card, Position } from '@sequence/game-logic';
import { BOARD_MAP } from '@sequence/game-logic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { BoardLayoutMap, BoardPoint } from '../GameBoard/layout-map.ts';

export interface BoardDragFrame {
  readonly height: number;
  readonly position: Position;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

export interface DragHoverState {
  readonly hoveredPosition: Position | null;
  readonly hoverConfirm: boolean;
}

export type DragReleaseResult =
  | { readonly position: Position; readonly type: 'drop' }
  | { readonly type: 'cancel' };

export interface UseDragChipOptions {
  readonly card: Card | null;
  readonly enabled?: boolean;
  readonly layoutMap: BoardLayoutMap;
  readonly onCancel?: () => void;
  readonly onDrop?: (position: Position) => void;
  readonly onHoverChange?: (position: Position | null) => void;
}

export function boardLayoutFramesFromMap(
  layoutMap: BoardLayoutMap,
): readonly BoardDragFrame[] {
  const frames: BoardDragFrame[] = [];

  for (const row of BOARD_MAP) {
    for (const position of row) {
      const frame = layoutMap.getFrame(position);
      if (frame === undefined) continue;

      frames.push({
        height: frame.height,
        position,
        width: frame.width,
        x: frame.x,
        y: frame.y,
      });
    }
  }

  return frames;
}

export function hitTestDragFrames(
  frames: readonly BoardDragFrame[],
  point: BoardPoint,
): Position | null {
  'worklet';

  for (let index = frames.length - 1; index >= 0; index -= 1) {
    const frame = frames[index]!;
    if (
      point.x >= frame.x &&
      point.x <= frame.x + frame.width &&
      point.y >= frame.y &&
      point.y <= frame.y + frame.height
    ) {
      return frame.position;
    }
  }

  return null;
}

export function dragHoverStateForPoint(
  frames: readonly BoardDragFrame[],
  point: BoardPoint,
): DragHoverState {
  'worklet';

  const hoveredPosition = hitTestDragFrames(frames, point);
  return {
    hoveredPosition,
    hoverConfirm: hoveredPosition !== null,
  };
}

export function dragReleaseForPoint(
  frames: readonly BoardDragFrame[],
  point: BoardPoint,
): DragReleaseResult {
  'worklet';

  const position = hitTestDragFrames(frames, point);
  if (position === null) return { type: 'cancel' };
  return { position, type: 'drop' };
}

export function useDragChip({
  card,
  enabled = true,
  layoutMap,
  onCancel,
  onDrop,
  onHoverChange,
}: UseDragChipOptions) {
  const active = useSharedValue(false);
  const hoverConfirm = useSharedValue(false);
  const hoveredPositionValue = useSharedValue<Position | null>(null);
  const layoutFrames = useSharedValue<readonly BoardDragFrame[]>([]);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [hoveredPosition, setHoveredPosition] = useState<Position | null>(null);

  useEffect(() => {
    layoutFrames.value = boardLayoutFramesFromMap(layoutMap);
  }, [layoutFrames, layoutMap]);

  const publishHover = useCallback(
    (position: Position | null) => {
      setHoveredPosition(position);
      onHoverChange?.(position);
    },
    [onHoverChange],
  );

  const publishCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const publishDrop = useCallback(
    (position: Position) => {
      onDrop?.(position);
    },
    [onDrop],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled && card !== null)
        .onBegin(() => {
          active.value = true;
          hoverConfirm.value = false;
          hoveredPositionValue.value = null;
          translateX.value = 0;
          translateY.value = 0;
          runOnJS(publishHover)(null);
        })
        .onUpdate((event) => {
          translateX.value = event.translationX;
          translateY.value = event.translationY;

          const hoverState = dragHoverStateForPoint(layoutFrames.value, {
            x: event.x,
            y: event.y,
          });
          hoverConfirm.value = hoverState.hoverConfirm;

          if (hoveredPositionValue.value !== hoverState.hoveredPosition) {
            hoveredPositionValue.value = hoverState.hoveredPosition;
            runOnJS(publishHover)(hoverState.hoveredPosition);
          }
        })
        .onFinalize((event) => {
          const release = dragReleaseForPoint(layoutFrames.value, {
            x: event.x,
            y: event.y,
          });

          active.value = false;
          hoverConfirm.value = false;
          hoveredPositionValue.value = null;
          translateX.value = withTiming(0, { duration: 140 });
          translateY.value = withTiming(0, { duration: 140 });
          runOnJS(publishHover)(null);

          if (release.type === 'drop') {
            runOnJS(publishDrop)(release.position);
          } else {
            runOnJS(publishCancel)();
          }
        }),
    [
      active,
      card,
      enabled,
      hoverConfirm,
      hoveredPositionValue,
      layoutFrames,
      publishCancel,
      publishDrop,
      publishHover,
      translateX,
      translateY,
    ],
  );

  const ghostStyle = useAnimatedStyle(() => ({
    opacity: card === null ? 0 : active.value ? 0.92 : 0.01,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: hoverConfirm.value ? 1.06 : 1 },
    ],
  }));

  return {
    gesture,
    ghostStyle,
    hoverConfirm,
    hoveredPosition,
    translateX,
    translateY,
  };
}
