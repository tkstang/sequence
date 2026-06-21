import {
  applyMove,
  createGame,
  createSeededRng,
  type Board,
  type Card,
  type GameState,
  type Position,
} from '@sequence/game-logic';
import { describe, expect, it } from 'vitest';

import type { SnapshotBoardCell } from '../game-state.ts';
import {
  boardRecordToMap,
  buildTapMove,
  createTapSelection,
  deadCardIndexes,
} from './tap-controller.ts';

function recordFromBoard(board: Board): Record<Position, SnapshotBoardCell> {
  const out: Record<Position, SnapshotBoardCell> = {};
  for (const [position, cell] of board) out[position] = cell;
  return out;
}

function stateWithLegalMove(): {
  state: GameState;
  selectedIndex: number;
  target: Position;
} {
  const state = createGame(
    { playerCount: 2, mode: 'tap', timerSeconds: null, local: false },
    [
      { seat: 0, team: 1 },
      { seat: 1, team: 2 },
    ],
    createSeededRng(12),
  );
  const board = recordFromBoard(state.board);
  for (let index = 0; index < state.hands[0]!.length; index++) {
    const selection = createTapSelection({
      hand: state.hands[0]!,
      board,
      team: state.teams[0]!,
      selectedIndex: index,
    });
    if (selection && selection.validTargets.length > 0) {
      return {
        state,
        selectedIndex: index,
        target: selection.validTargets[0]!,
      };
    }
  }
  throw new Error('seed produced no legal move');
}

describe('tap controller', () => {
  it('builds valid targets with game-logic display helpers', () => {
    const { state, selectedIndex } = stateWithLegalMove();
    const selection = createTapSelection({
      hand: state.hands[0]!,
      board: recordFromBoard(state.board),
      team: state.teams[0]!,
      selectedIndex,
    });

    expect(selection?.validTargets.length).toBeGreaterThan(0);
  });

  it('submits a reducer-accepted move for a highlighted target', () => {
    const { state, selectedIndex, target } = stateWithLegalMove();
    const selection = createTapSelection({
      hand: state.hands[0]!,
      board: recordFromBoard(state.board),
      team: state.teams[0]!,
      selectedIndex,
    });
    const move = buildTapMove(selection, target);

    expect(move).not.toBeNull();
    const result = applyMove(state, { ...move!, seat: 0 });
    expect(result.ok).toBe(true);
  });

  it('builds removeChip moves for one-eyed jacks', () => {
    const jack: Card = { rank: 'J', suit: 'S' };
    const selection = createTapSelection({
      hand: [jack],
      board: { '1AC': { chip: 2 } },
      team: 1,
      selectedIndex: 0,
    });

    expect(selection?.validTargets).toContain('1AC');
    expect(buildTapMove(selection, '1AC')).toEqual({
      type: 'removeChip',
      position: '1AC',
      card: jack,
    });
  });

  it('rejects unhighlighted cells', () => {
    const { state, selectedIndex } = stateWithLegalMove();
    const selection = createTapSelection({
      hand: state.hands[0]!,
      board: recordFromBoard(state.board),
      team: state.teams[0]!,
      selectedIndex,
    });

    expect(buildTapMove(selection, '1WW')).toBeNull();
  });

  it('marks natural dead cards for default-mode display', () => {
    const ace: Card = { rank: 'A', suit: 'C' };
    const board = boardRecordToMap({
      '1AC': { chip: 1 },
      '2AC': { chip: 2 },
    });
    expect(board.size).toBe(2);
    expect(
      deadCardIndexes([ace], { '1AC': { chip: 1 }, '2AC': { chip: 2 } }),
    ).toEqual([0]);
  });
});
