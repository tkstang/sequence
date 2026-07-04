import type { Card } from '@sequence/game-logic';
import { cleanup, render } from '@testing-library/react-native';

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native') as typeof import('react-native');

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
    GestureDetector: ({
      children,
    }: {
      children: import('react').ReactNode;
    }) => <View>{children}</View>,
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
});
