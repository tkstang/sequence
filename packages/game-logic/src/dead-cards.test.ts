import { describe, expect, it } from 'vitest';

import { boardCellsFor } from './board-map.ts';
import { autoSwapDeadCard, findDeadCards, isDeadCard } from './dead-cards.ts';
import { createSeededRng } from './deck.ts';
import type { Board, BoardCell, Card, GameState, Position } from './types.ts';

function board(entries: Array<[Position, BoardCell]>): Board {
  return new Map(entries);
}

/** Cover both board cells of a card with chips. */
function coverCard(card: Card): Array<[Position, BoardCell]> {
  return boardCellsFor(card.rank, card.suit).map((p) => [
    p,
    { chip: 1 } as BoardCell,
  ]);
}

const ACE_CLUBS: Card = { rank: 'A', suit: 'C' };
const KING_HEARTS: Card = { rank: 'K', suit: 'H' };
const ONE_EYED: Card = { rank: 'J', suit: 'S' };
const TWO_EYED: Card = { rank: 'J', suit: 'D' };

describe('isDeadCard', () => {
  it('is dead when both board cells are covered', () => {
    expect(isDeadCard(ACE_CLUBS, board(coverCard(ACE_CLUBS)))).toBe(true);
  });

  it('is live when only one cell is covered', () => {
    const [first] = boardCellsFor(ACE_CLUBS.rank, ACE_CLUBS.suit);
    expect(isDeadCard(ACE_CLUBS, board([[first!, { chip: 1 }]]))).toBe(false);
  });

  it('is live on an empty board', () => {
    expect(isDeadCard(ACE_CLUBS, board([]))).toBe(false);
  });

  it('treats jacks as never dead', () => {
    expect(isDeadCard(ONE_EYED, board([]))).toBe(false);
    expect(isDeadCard(TWO_EYED, board([]))).toBe(false);
  });

  it('resurrects: a freed cell makes a previously dead card live again', () => {
    const cells = boardCellsFor(ACE_CLUBS.rank, ACE_CLUBS.suit);
    const dead = board([
      [cells[0]!, { chip: 1 }],
      [cells[1]!, { chip: 1 }],
    ]);
    expect(isDeadCard(ACE_CLUBS, dead)).toBe(true);
    // One-eyed jack frees the second cell — card is alive again.
    const freed = board([[cells[0]!, { chip: 1 }]]);
    expect(isDeadCard(ACE_CLUBS, freed)).toBe(false);
  });
});

describe('findDeadCards', () => {
  it('returns the dead cards in a hand', () => {
    const b = board([...coverCard(ACE_CLUBS), ...coverCard(KING_HEARTS)]);
    const hand: Card[] = [ACE_CLUBS, KING_HEARTS, TWO_EYED];
    expect(findDeadCards(hand, b)).toEqual([ACE_CLUBS, KING_HEARTS]);
  });

  it('returns empty when nothing is dead', () => {
    expect(findDeadCards([ACE_CLUBS, ONE_EYED], board([]))).toEqual([]);
  });
});

describe('autoSwapDeadCard', () => {
  function stateWith(hand: Card[], b: Board, deckTop: Card[]): GameState {
    return {
      settings: {
        playerCount: 2,
        mode: 'tap',
        timerSeconds: null,
        local: false,
      },
      status: 'active',
      board: b,
      hands: [hand, []],
      deck: deckTop,
      played: [],
      sequences: [],
      teams: [1, 2],
      currentSeat: 0,
      round: 1,
      nextSequenceId: 1,
    };
  }

  it('swaps at most one dead card and emits DeadCardSwapped', () => {
    const drawn: Card = { rank: '5', suit: 'D' };
    const b = board([...coverCard(ACE_CLUBS), ...coverCard(KING_HEARTS)]);
    const state = stateWith([ACE_CLUBS, KING_HEARTS, TWO_EYED], b, [drawn]);
    const { nextState, events } = autoSwapDeadCard(
      state,
      0,
      createSeededRng(1),
    );

    // Exactly one dead card swapped this turn (KING_HEARTS still dead, in hand).
    expect(nextState.hands[0]).toContain(drawn);
    const removed = [ACE_CLUBS, KING_HEARTS].filter(
      (c) =>
        !nextState.hands[0]!.some(
          (h) => h.rank === c.rank && h.suit === c.suit,
        ),
    );
    expect(removed).toHaveLength(1);
    // Discarded card lands in the played pile.
    expect(nextState.played).toHaveLength(1);
    expect(nextState.hands[0]).toHaveLength(3); // size preserved (swap)
    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe('DeadCardSwapped');
  });

  it('is a no-op when no card is dead', () => {
    const state = stateWith([ACE_CLUBS, TWO_EYED], board([]), [
      { rank: '5', suit: 'D' },
    ]);
    const { nextState, events } = autoSwapDeadCard(
      state,
      0,
      createSeededRng(1),
    );
    expect(events).toEqual([]);
    expect(nextState).toBe(state);
  });

  it('leaves the dead card in hand when no replacement is drawable (m3)', () => {
    // Deck and played pile both empty → nothing to draw. The hand must not
    // shrink silently; state is returned unchanged with no event.
    const b = board(coverCard(ACE_CLUBS));
    const state = stateWith([ACE_CLUBS, TWO_EYED], b, []);
    const { nextState, events } = autoSwapDeadCard(
      state,
      0,
      createSeededRng(1),
    );
    expect(events).toEqual([]);
    expect(nextState).toBe(state);
    expect(nextState.hands[0]).toHaveLength(2);
  });
});
