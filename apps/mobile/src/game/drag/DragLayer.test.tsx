import type { Card } from '@sequence/game-logic';
import { act, cleanup, render, waitFor } from '@testing-library/react-native';

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native') as typeof import('react-native');

  interface MockGesture {
    enabled: jest.Mock<MockGesture>;
    onBegin: jest.Mock<MockGesture>;
    onFinalize: jest.Mock<MockGesture>;
    onUpdate: jest.Mock<MockGesture>;
    begin?: () => void;
    finalize?: (event: { x: number; y: number }) => void;
    update?: (event: {
      translationX: number;
      translationY: number;
      x: number;
      y: number;
    }) => void;
  }

  let lastGesture: MockGesture | null = null;

  const createGesture = (): MockGesture => {
    const gesture = {} as MockGesture;

    gesture.enabled = jest.fn(() => gesture);
    gesture.onBegin = jest.fn((callback: () => void) => {
      gesture.begin = callback;
      return gesture;
    });
    gesture.onFinalize = jest.fn(
      (callback: (event: { x: number; y: number }) => void) => {
        gesture.finalize = callback;
        return gesture;
      },
    );
    gesture.onUpdate = jest.fn(
      (
        callback: (event: {
          translationX: number;
          translationY: number;
          x: number;
          y: number;
        }) => void,
      ) => {
        gesture.update = callback;
        return gesture;
      },
    );

    lastGesture = gesture;
    return gesture;
  };

  return {
    Gesture: {
      Pan: jest.fn(createGesture),
    },
    GestureDetector: ({
      children,
    }: {
      children: import('react').ReactNode;
    }) => <View>{children}</View>,
    __getLastGesture: () => lastGesture,
  };
});

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native') as typeof import('react-native');

  return {
    __esModule: true,
    default: {
      View,
    },
    runOnJS: (fn: unknown) => fn,
    useAnimatedStyle: (factory: () => unknown) => factory(),
    useSharedValue: (value: unknown) => ({ value }),
    withTiming: (value: unknown) => value,
  };
});

import { createBoardLayoutMap } from '../GameBoard/layout-map.ts';
import { DragLayer } from './DragLayer.tsx';

const { __getLastGesture } = jest.requireMock(
  'react-native-gesture-handler',
) as {
  __getLastGesture: () => {
    begin?: () => void;
    update?: (event: {
      translationX: number;
      translationY: number;
      x: number;
      y: number;
    }) => void;
    finalize?: (event: { x: number; y: number }) => void;
  } | null;
};

jest.mock('../cards/CardFace.tsx', () => {
  const { Text } = require('react-native') as typeof import('react-native');

  return {
    CardFace: ({
      card,
      testID,
    }: {
      card: { rank: string; suit: string };
      testID?: string;
    }) => <Text testID={testID}>{`${card.rank}${card.suit}`}</Text>,
  };
});

afterEach(() => {
  cleanup();
});

const selectedCard = { rank: '5', suit: 'C' } as const satisfies Card;

describe('DragLayer', () => {
  it('renders an idle ghost layer for the selected card without pre-highlighting the board', async () => {
    const layoutMap = createBoardLayoutMap();
    const { getByTestId, queryByTestId } = await render(
      <DragLayer card={selectedCard} layoutMap={layoutMap} />,
    );

    expect(getByTestId('drag.layer')).toBeTruthy();
    expect(
      getByTestId('drag.ghost', { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(
      getByTestId('drag.ghost.card', { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(queryByTestId('board.cell.1AC.spotlight.target')).toBeNull();
  });

  it('does not render a ghost when no card is selected for drag', async () => {
    const layoutMap = createBoardLayoutMap();
    const { getByTestId, queryByTestId } = await render(
      <DragLayer card={null} layoutMap={layoutMap} />,
    );

    expect(getByTestId('drag.layer')).toBeTruthy();
    expect(queryByTestId('drag.ghost')).toBeNull();
  });

  it('shows hover-confirm while over a cell and clears it after release', async () => {
    const layoutMap = createBoardLayoutMap();
    layoutMap.registerFrame('1AC', { height: 20, width: 20, x: 10, y: 10 });
    const { getByTestId, queryByTestId } = await render(
      <DragLayer card={selectedCard} layoutMap={layoutMap} />,
    );

    await act(async () => {
      __getLastGesture()?.begin?.();
      __getLastGesture()?.update?.({
        translationX: 8,
        translationY: 4,
        x: 12,
        y: 12,
      });
    });

    await waitFor(() => {
      expect(getByTestId('drag.hover-confirm.1AC')).toBeTruthy();
    });

    await act(async () => {
      __getLastGesture()?.finalize?.({ x: 12, y: 12 });
    });

    await waitFor(() => {
      expect(queryByTestId('drag.hover-confirm.1AC')).toBeNull();
    });
  });
});
