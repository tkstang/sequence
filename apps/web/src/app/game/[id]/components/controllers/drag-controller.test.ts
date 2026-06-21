import {
  applyMove,
  createGame,
  createSeededRng,
  turnInDeadCard,
  validPlacements,
  type Card,
  type GameState,
  type Position,
} from '@sequence/game-logic';
import { describe, expect, it } from 'vitest';

import type { SnapshotBoardCell } from '../game-state.ts';
import {
  buildChipRemovalMove,
  buildDeadCardTurnIn,
  buildDragPlacementMove,
  canDragChipForRemoval,
  dragHoverTarget,
  type DragIntent,
} from './drag-controller.ts';

function stateWithImplicitPlacement(): {
  state: GameState;
  target: Position;
} {
  const state = createGame(
    { playerCount: 2, mode: 'drag', timerSeconds: null, local: false },
    [
      { seat: 0, team: 1 },
      { seat: 1, team: 2 },
    ],
    createSeededRng(21),
  );
  const placements = validPlacements(state.hands[0]!, state.board, 1);
  for (const cells of placements.values()) {
    const target = cells[0];
    if (target) return { state, target };
  }
  throw new Error('seed produced no legal move');
}

describe('drag controller', () => {
  it('builds a cardless placement move accepted by hard-mode inference', () => {
    const { state, target } = stateWithImplicitPlacement();
    const move = buildDragPlacementMove(target);

    expect(move).toEqual({ type: 'place', position: target });
    expect(move).not.toHaveProperty('card');
    const result = applyMove(state, { ...move!, seat: 0 }, createSeededRng(1));
    expect(result.ok).toBe(true);
  });

  it('builds a cardless one-eyed removal for opponent unlocked chips only', () => {
    const position = '1AC' as Position;
    const board = {
      [position]: { chip: 2 },
      '1KC': { chip: 1 },
      '1QC': { chip: 2, lockedBy: 7 },
    } satisfies Record<Position, SnapshotBoardCell>;
    const state = createGame(
      { playerCount: 2, mode: 'drag', timerSeconds: null, local: false },
      [
        { seat: 0, team: 1 },
        { seat: 1, team: 2 },
      ],
      createSeededRng(9),
    );
    const removalState: GameState = {
      ...state,
      board: new Map([[position, { chip: 2 }]]),
      hands: [[{ rank: 'J', suit: 'S' }], state.hands[1]!],
    };

    expect(canDragChipForRemoval(board, position, 1)).toBe(true);
    expect(canDragChipForRemoval(board, '1KC' as Position, 1)).toBe(false);
    expect(canDragChipForRemoval(board, '1QC' as Position, 1)).toBe(false);

    const move = buildChipRemovalMove(board, position, 1);
    expect(move).toEqual({ type: 'removeChip', position });
    expect(move).not.toHaveProperty('card');
    const result = applyMove(
      removalState,
      { ...move!, seat: 0 },
      createSeededRng(1),
    );
    expect(result.ok).toBe(true);
  });

  it('returns only genuinely dead cards for discard-zone turn-in', () => {
    const deadCard: Card = { rank: 'A', suit: 'C' };
    const liveCard: Card = { rank: 'K', suit: 'D' };
    const board = {
      '1AC': { chip: 1 },
      '2AC': { chip: 2 },
    } satisfies Record<Position, SnapshotBoardCell>;
    const state = createGame(
      { playerCount: 2, mode: 'drag', timerSeconds: null, local: false },
      [
        { seat: 0, team: 1 },
        { seat: 1, team: 2 },
      ],
      createSeededRng(10),
    );
    const turnInState: GameState = {
      ...state,
      board: new Map(Object.entries(board) as [Position, SnapshotBoardCell][]),
      hands: [[deadCard, liveCard], state.hands[1]!],
    };

    expect(buildDeadCardTurnIn([deadCard, liveCard], board, 0)).toEqual(
      deadCard,
    );
    expect(buildDeadCardTurnIn([deadCard, liveCard], board, 1)).toBeNull();
    const result = turnInDeadCard(
      turnInState,
      0,
      buildDeadCardTurnIn([deadCard, liveCard], board, 0)!,
      createSeededRng(1),
    );
    expect(result.ok).toBe(true);
  });

  it('only hover-highlights the active generic chip drag target', () => {
    const intent: DragIntent = { kind: 'place' };
    expect(dragHoverTarget(intent, '1AC' as Position)).toBe('1AC');
    expect(
      dragHoverTarget(
        { kind: 'removeChip', position: '1AC' as Position },
        '1KC' as Position,
      ),
    ).toBeNull();
    expect(dragHoverTarget(null, '1AC' as Position)).toBeNull();
  });
});
