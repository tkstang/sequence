import { describe, expect, it } from 'vitest';

import { applyMove } from './apply-move.ts';
import { boardCellsFor, positionAt } from './board-map.ts';
import { createSeededRng } from './deck.ts';
import { validPlacements } from './display-helpers.ts';
import type {
  Board,
  BoardCell,
  Card,
  GameState,
  Position,
  Team,
} from './types.ts';

const ACE_CLUBS: Card = { rank: 'A', suit: 'C' };
const KING_HEARTS: Card = { rank: 'K', suit: 'H' };
const ONE_EYED: Card = { rank: 'J', suit: 'S' };
const TWO_EYED: Card = { rank: 'J', suit: 'D' };

function board(entries: Array<[Position, BoardCell]>): Board {
  return new Map(entries);
}

describe('validPlacements', () => {
  it('maps a natural card to its open board cells', () => {
    const map = validPlacements([ACE_CLUBS], board([]));
    const cells = map.get(ACE_CLUBS)!;
    expect(new Set(cells)).toEqual(new Set(boardCellsFor('A', 'C')));
  });

  it('excludes occupied cells for a natural card', () => {
    const [first, second] = boardCellsFor('A', 'C');
    const map = validPlacements([ACE_CLUBS], board([[first!, { chip: 1 }]]));
    expect(map.get(ACE_CLUBS)).toEqual([second]);
  });

  it('maps a two-eyed jack to every open cell', () => {
    const occupied = positionAt(4, 4)!;
    const map = validPlacements([TWO_EYED], board([[occupied, { chip: 1 }]]));
    const cells = map.get(TWO_EYED)!;
    expect(cells).not.toContain(occupied);
    // No corners (never placeable) and no occupied cell.
    expect(cells.length).toBeGreaterThan(90);
  });

  it('maps a one-eyed jack to removable opponent targets only', () => {
    const opp = positionAt(4, 4)!;
    const lockedOpp = positionAt(5, 5)!;
    const mine = positionAt(6, 6)!;
    const b = board([
      [opp, { chip: 2 }],
      [lockedOpp, { chip: 2, lockedBy: 1 }],
      [mine, { chip: 1 }],
    ]);
    const map = validPlacements([ONE_EYED], b, 1);
    expect(map.get(ONE_EYED)).toEqual([opp]);
  });

  it('excludes dead cards', () => {
    const dead = board(
      boardCellsFor('A', 'C').map((p) => [p, { chip: 1 } as BoardCell]),
    );
    const map = validPlacements([ACE_CLUBS, KING_HEARTS], dead);
    expect(map.has(ACE_CLUBS)).toBe(false);
    expect(map.has(KING_HEARTS)).toBe(true);
  });
});

describe('validPlacements — agrees with the reducer', () => {
  function stateWith(hand: Card[], b: Board, team: Team): GameState {
    return {
      settings: {
        playerCount: 2,
        mode: 'tap',
        timerSeconds: null,
        local: false,
      },
      status: 'active',
      board: b,
      hands: [hand, [KING_HEARTS]],
      deck: [{ rank: '6', suit: 'C' }],
      played: [],
      sequences: [],
      teams: [team, team === 1 ? 2 : 1],
      currentSeat: 0,
      round: 1,
      nextSequenceId: 1,
    };
  }

  it('every suggested placement is accepted by applyMove', () => {
    const opp = positionAt(4, 4)!;
    const b = board([[opp, { chip: 2 }]]);
    const hand: Card[] = [ACE_CLUBS, TWO_EYED, ONE_EYED];
    const map = validPlacements(hand, b, 1);

    for (const [card, cells] of map) {
      for (const position of cells.slice(0, 3)) {
        const state = stateWith(hand, b, 1);
        const move =
          card.rank === 'J' && card.suit === 'S'
            ? ({ type: 'removeChip', position } as const)
            : ({ type: 'place', position, card } as const);
        const r = applyMove(state, move, createSeededRng(1));
        expect(r.ok).toBe(true);
      }
    }
  });
});
