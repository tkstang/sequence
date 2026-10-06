import type { Position } from '@sequence/game-logic';

jest.mock('react-native-gesture-handler', () => {
  interface MockGesture {
    enabled: jest.Mock<MockGesture>;
    onBegin: jest.Mock<MockGesture>;
    onFinalize: jest.Mock<MockGesture>;
    onUpdate: jest.Mock<MockGesture>;
  }

  const createGesture = (): MockGesture => {
    const gesture = {} as MockGesture;

    gesture.enabled = jest.fn(() => gesture);
    gesture.onBegin = jest.fn(() => gesture);
    gesture.onFinalize = jest.fn(() => gesture);
    gesture.onUpdate = jest.fn(() => gesture);

    return gesture;
  };

  return {
    Gesture: {
      Pan: jest.fn(createGesture),
    },
  };
});

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {
    View: jest.fn(),
  },
  runOnJS: (fn: unknown) => fn,
  useAnimatedStyle: (factory: () => unknown) => factory(),
  useSharedValue: (value: unknown) => ({ value }),
  withTiming: (value: unknown) => value,
}));

import { createBoardLayoutMap } from '../GameBoard/layout-map.ts';
import {
  boardLayoutFramesFromMap,
  dragHoverStateForPoint,
  dragReleaseForPoint,
  hitTestDragFrames,
} from './use-drag-chip.ts';

describe('drag chip hit-testing', () => {
  it('snapshots board layout-map frames for UI-thread hit-testing', () => {
    const layoutMap = createBoardLayoutMap();

    layoutMap.registerFrame('1AC', { height: 20, width: 20, x: 10, y: 10 });
    layoutMap.registerFrame('1KC', { height: 20, width: 20, x: 30, y: 10 });

    expect(boardLayoutFramesFromMap(layoutMap)).toEqual([
      { height: 20, position: '1AC', width: 20, x: 10, y: 10 },
      { height: 20, position: '1KC', width: 20, x: 30, y: 10 },
    ]);
    expect(
      hitTestDragFrames(boardLayoutFramesFromMap(layoutMap), { x: 34, y: 18 }),
    ).toBe('1KC');
  });

  it('exposes hover-confirm state only while over a board cell', () => {
    const frames = [
      { height: 20, position: '1AC' as Position, width: 20, x: 10, y: 10 },
    ];

    expect(dragHoverStateForPoint(frames, { x: 12, y: 12 })).toEqual({
      hoveredPosition: '1AC',
      hoverConfirm: true,
    });
    expect(dragHoverStateForPoint(frames, { x: 9, y: 12 })).toEqual({
      hoveredPosition: null,
      hoverConfirm: false,
    });
  });

  it('cancels releases outside the board and resolves drops over cells', () => {
    const frames = [
      { height: 20, position: '1AC' as Position, width: 20, x: 10, y: 10 },
    ];

    expect(dragReleaseForPoint(frames, { x: 12, y: 12 })).toEqual({
      position: '1AC',
      type: 'drop',
    });
    expect(dragReleaseForPoint(frames, { x: 4, y: 12 })).toEqual({
      type: 'cancel',
    });
  });
});
