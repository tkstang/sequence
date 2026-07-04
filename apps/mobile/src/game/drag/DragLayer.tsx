import type { Card, Position } from '@sequence/game-logic';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { CardFace } from '../cards/CardFace.tsx';
import type { BoardLayoutMap } from '../GameBoard/layout-map.ts';
import { useDragChip } from './use-drag-chip.ts';

export interface DragLayerProps {
  readonly card: Card | null;
  readonly children?: ReactNode;
  readonly enabled?: boolean;
  readonly layoutMap: BoardLayoutMap;
  readonly onCancel?: () => void;
  readonly onDrop?: (position: Position) => void;
  readonly onHoverChange?: (position: Position | null) => void;
}

export function DragLayer({
  card,
  children,
  enabled = true,
  layoutMap,
  onCancel,
  onDrop,
  onHoverChange,
}: DragLayerProps) {
  const drag = useDragChip({
    card,
    enabled,
    layoutMap,
    onCancel,
    onDrop,
    onHoverChange,
  });
  const hoveredFrame =
    drag.hoveredPosition === null
      ? undefined
      : layoutMap.getFrame(drag.hoveredPosition);

  return (
    <GestureDetector gesture={drag.gesture}>
      <View
        pointerEvents={enabled && card !== null ? 'auto' : 'box-none'}
        style={styles.layer}
        testID="drag.layer"
      >
        {children}
        {drag.hoveredPosition !== null && hoveredFrame !== undefined ? (
          <View
            pointerEvents="none"
            style={[
              styles.hoverConfirm,
              {
                height: hoveredFrame.height,
                left: hoveredFrame.x,
                top: hoveredFrame.y,
                width: hoveredFrame.width,
              },
            ]}
            testID={`drag.hover-confirm.${drag.hoveredPosition}`}
          />
        ) : null}
        {card === null ? null : (
          <Animated.View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            style={[styles.ghost, drag.ghostStyle]}
            testID="drag.ghost"
          >
            <CardFace card={card} size="hand" testID="drag.ghost.card" />
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  ghost: {
    left: 0,
    position: 'absolute',
    top: 0,
    zIndex: 20,
  },
  hoverConfirm: {
    borderColor: 'rgba(250,204,21,0.96)',
    borderRadius: 4,
    borderWidth: 3,
    position: 'absolute',
    zIndex: 18,
  },
  layer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 30,
  },
});
