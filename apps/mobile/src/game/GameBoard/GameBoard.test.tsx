import { palette } from '@sequence/design-tokens';
import type { Position, Team } from '@sequence/game-logic';
import { BOARD_MAP, BOARD_SIZE } from '@sequence/game-logic';
import { cleanup, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

import { GameBoard } from './GameBoard.tsx';
import { createBoardLayoutMap } from './layout-map.ts';

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

type BoardFixture = Record<Position, { chip?: Team; lockedBy?: number }>;

function styleFor(testNode: { props: { style?: unknown } }): ViewStyle {
  return StyleSheet.flatten(testNode.props.style) ?? {};
}

describe('GameBoard', () => {
  it('renders the 10x10 game-logic board with stable cell testIDs', async () => {
    const { getByTestId, getAllByTestId } = await render(
      <GameBoard board={{}} />,
    );

    expect(getAllByTestId(/^board\.cell\.[^.]+$/)).toHaveLength(
      BOARD_SIZE * BOARD_SIZE,
    );

    for (const row of BOARD_MAP) {
      for (const position of row) {
        expect(getByTestId(`board.cell.${position}`)).toBeTruthy();
      }
    }
  });

  it('renders wild treatment for all four corner cells', async () => {
    const { getByTestId, queryByTestId } = await render(
      <GameBoard board={{}} />,
    );

    for (const position of ['1WW', '2WW', '3WW', '4WW'] as const) {
      expect(getByTestId(`board.cell.${position}.wild`)).toBeTruthy();
      expect(queryByTestId(`board.cell.${position}.card`)).toBeNull();
    }
  });

  it('renders chip overlays with team colors', async () => {
    const board: BoardFixture = {
      '1AC': { chip: 1 },
      '1KC': { chip: 2 },
      '1QC': { chip: 3 },
    };
    const { getByTestId } = await render(<GameBoard board={board} />);

    expect(styleFor(getByTestId('board.cell.1AC.chip')).backgroundColor).toBe(
      palette.light.teamBlue,
    );
    expect(styleFor(getByTestId('board.cell.1KC.chip')).backgroundColor).toBe(
      palette.light.teamGreen,
    );
    expect(styleFor(getByTestId('board.cell.1QC.chip')).backgroundColor).toBe(
      palette.light.teamRed,
    );
  });

  it('shows lock treatment for cells locked into a sequence', async () => {
    const { getByTestId } = await render(
      <GameBoard board={{ '1AC': { chip: 1, lockedBy: 7 } }} />,
    );

    expect(getByTestId('board.cell.1AC.lock')).toBeTruthy();
    expect(styleFor(getByTestId('board.cell.1AC.chip')).borderWidth).toBe(2);
  });

  it('renders sequence ownership when supplied with completed sequences', async () => {
    const { getByTestId } = await render(
      <GameBoard board={{}} sequences={[{ cells: ['1AC'], id: 8, team: 2 }]} />,
    );

    expect(styleFor(getByTestId('board.cell.1AC.chip')).backgroundColor).toBe(
      palette.light.teamGreen,
    );
    expect(getByTestId('board.cell.1AC.lock')).toBeTruthy();
  });

  it('only re-renders a cell whose chip state changes', async () => {
    const renders = new Map<Position, number>();
    const onCellRender = (position: Position) => {
      renders.set(position, (renders.get(position) ?? 0) + 1);
    };

    const { rerender } = await render(
      <GameBoard board={{ '1AC': { chip: 1 } }} onCellRender={onCellRender} />,
    );

    expect(renders.get('1AC')).toBe(1);
    expect(renders.get('1KC')).toBe(1);

    await rerender(
      <GameBoard board={{ '1AC': { chip: 2 } }} onCellRender={onCellRender} />,
    );

    expect(renders.get('1AC')).toBe(2);
    expect(renders.get('1KC')).toBe(1);
    expect(renders.size).toBe(BOARD_SIZE * BOARD_SIZE);
  });

  it('registers cell frames in the board layout map', async () => {
    const layoutMap = createBoardLayoutMap();
    const { getByTestId } = await render(
      <GameBoard board={{}} layoutMap={layoutMap} />,
    );

    fireEvent(getByTestId('board.cell.1AC'), 'layout', {
      nativeEvent: {
        layout: { height: 33, width: 34, x: 12, y: 6 },
      },
    });

    expect(layoutMap.getFrame('1AC')).toEqual({
      height: 33,
      width: 34,
      x: 12,
      y: 6,
    });
  });
});
