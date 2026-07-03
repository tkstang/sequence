import { palette } from '@sequence/design-tokens';
import type { Card, Position, Team } from '@sequence/game-logic';
import { boardCellsFor } from '@sequence/game-logic';
import { cleanup, render } from '@testing-library/react-native';
import { createElement } from 'react';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

import { GameBoard } from './GameBoard.tsx';
import {
  createBoardSpotlight,
  isSpotlightDimmed,
  isSpotlightTarget,
} from './spotlight.ts';

jest.mock('../cards/CardFace.tsx', () => {
  const { Text } = require('react-native') as typeof import('react-native');
  const { createElement: mockCreateElement } =
    require('react') as typeof import('react');

  return {
    CardFace: ({
      card,
      testID,
    }: {
      card: { rank: string; suit: string };
      testID?: string;
    }) => mockCreateElement(Text, { testID }, `${card.rank}${card.suit}`),
  };
});

afterEach(() => {
  cleanup();
});

type BoardFixture = Record<Position, { chip?: Team; lockedBy?: number }>;

const ACE_CLUBS: Card = { rank: 'A', suit: 'C' };
const ONE_EYED_JACK: Card = { rank: 'J', suit: 'S' };

function styleFor(testNode: { props: { style?: unknown } }): ViewStyle {
  return StyleSheet.flatten(testNode.props.style) ?? {};
}

describe('GameBoard spotlight targeting', () => {
  it('derives selected normal-card targets from valid placements', () => {
    const [blockedAce, openAce] = boardCellsFor('A', 'C');
    const board: BoardFixture = {
      [blockedAce!]: { chip: 2 },
    };
    const spotlight = createBoardSpotlight({
      board,
      currentTeam: 1,
      selectedCard: ACE_CLUBS,
    });

    expect(isSpotlightTarget(spotlight, openAce!)).toBe(true);
    expect(isSpotlightTarget(spotlight, blockedAce!)).toBe(false);
    expect(isSpotlightDimmed(spotlight, blockedAce!)).toBe(true);
  });

  it('dims non-target cells only while a card is selected', async () => {
    const [target] = boardCellsFor('A', 'C');
    const { getByTestId, queryByTestId, rerender } = await render(
      createElement(GameBoard, {
        board: {},
        currentTeam: 1,
        selectedCard: ACE_CLUBS,
      }),
    );

    expect(queryByTestId(`board.cell.${target!}.spotlight.dim`)).toBeNull();
    expect(getByTestId('board.cell.1KC.spotlight.dim')).toBeTruthy();
    expect(
      styleFor(getByTestId('board.cell.1KC.spotlight.dim')).backgroundColor,
    ).toBe('rgba(15,23,42,0.54)');

    await rerender(createElement(GameBoard, { board: {}, currentTeam: 1 }));

    expect(queryByTestId('board.cell.1KC.spotlight.dim')).toBeNull();
  });

  it('clears spotlight when the selected card is empty', async () => {
    const { queryByTestId } = await render(
      createElement(GameBoard, {
        board: {},
        currentTeam: 1,
        selectedCard: null,
      }),
    );

    expect(queryByTestId('board.cell.1KC.spotlight.dim')).toBeNull();
    expect(queryByTestId('board.cell.1KC.spotlight.target')).toBeNull();
  });

  it('targets only removable opponent chips for a selected one-eyed jack', async () => {
    const board: BoardFixture = {
      '1AC': { chip: 2 },
      '1KC': { chip: 2, lockedBy: 5 },
      '1QC': { chip: 1 },
    };
    const { getByTestId, queryByTestId } = await render(
      createElement(GameBoard, {
        board,
        currentTeam: 1,
        selectedCard: ONE_EYED_JACK,
      }),
    );

    expect(getByTestId('board.cell.1AC.spotlight.target')).toBeTruthy();
    expect(queryByTestId('board.cell.1AC.spotlight.dim')).toBeNull();
    expect(getByTestId('board.cell.1KC.spotlight.dim')).toBeTruthy();
    expect(getByTestId('board.cell.1QC.spotlight.dim')).toBeTruthy();
    expect(styleFor(getByTestId('board.cell.1AC.chip')).backgroundColor).toBe(
      palette.light.teamGreen,
    );
  });
});
