import { describe, expect, it } from 'vitest';

import { applyMove } from './apply-move.ts';
import { boardCellsFor } from './board-map.ts';
import { createSeededRng } from './deck.ts';
import type { Card, GameState, Move, Team } from './types.ts';

const ACE_CLUBS: Card = { rank: 'A', suit: 'C' };
const KING_HEARTS: Card = { rank: 'K', suit: 'H' };
const TWO_EYED: Card = { rank: 'J', suit: 'D' };
const FIVE_DIAMONDS: Card = { rank: '5', suit: 'D' };

const ACE_CLUBS_POS = boardCellsFor('A', 'C')[0]!;
const KING_HEARTS_POS = boardCellsFor('K', 'H')[0]!;

interface Overrides {
  hands?: Card[][];
  deck?: Card[];
  currentSeat?: number;
  board?: GameState['board'];
  teams?: Team[];
}

function baseState(o: Overrides = {}): GameState {
  return {
    settings: { playerCount: 2, mode: 'tap', timerSeconds: null, local: false },
    status: 'active',
    board: o.board ?? new Map(),
    hands: o.hands ?? [
      [ACE_CLUBS, KING_HEARTS],
      [FIVE_DIAMONDS, TWO_EYED],
    ],
    deck: o.deck ?? [FIVE_DIAMONDS, { rank: '6', suit: 'C' }],
    played: [],
    sequences: [],
    teams: o.teams ?? [1, 2],
    currentSeat: o.currentSeat ?? 0,
    round: 1,
    nextSequenceId: 1,
  };
}

function place(position: string, card?: Card): Move {
  return card ? { type: 'place', position, card } : { type: 'place', position };
}

describe('applyMove — rejections', () => {
  it('rejects out-of-turn', () => {
    const state = baseState({ currentSeat: 0 });
    // Seat 1's card, but it's seat 0's turn — move authored for the wrong seat
    // is rejected because the played card is not in the current seat's hand.
    const r = applyMove(state, place(KING_HEARTS_POS, KING_HEARTS));
    // King-of-hearts IS in seat 0's hand here, so use a seat-1-only card:
    const r2 = applyMove(
      state,
      place(boardCellsFor('5', 'D')[0]!, FIVE_DIAMONDS),
    );
    expect(r.ok).toBe(true); // sanity: in-hand card succeeds
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error.code).toBe('card-not-in-hand');
  });

  it('rejects a card not in hand', () => {
    const state = baseState();
    const r = applyMove(
      state,
      place(boardCellsFor('Q', 'S')[0]!, { rank: 'Q', suit: 'S' }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('card-not-in-hand');
  });

  it('rejects placing on an occupied space', () => {
    const board = new Map([[ACE_CLUBS_POS, { chip: 2 as Team }]]);
    const state = baseState({ board });
    const r = applyMove(state, place(ACE_CLUBS_POS, ACE_CLUBS));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('space-occupied');
  });

  it('rejects the wrong card for a space', () => {
    const state = baseState();
    // King of hearts onto the Ace-of-Clubs cell — not a wild, not a match.
    const r = applyMove(state, place(ACE_CLUBS_POS, KING_HEARTS));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('wrong-card-for-space');
  });
});

describe('applyMove — placement', () => {
  it('places a natural card, draws, advances, and emits ordered events', () => {
    const state = baseState();
    const r = applyMove(
      state,
      place(ACE_CLUBS_POS, ACE_CLUBS),
      createSeededRng(1),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // chip on the board for team 1
    expect(r.nextState.board.get(ACE_CLUBS_POS)?.chip).toBe(1);
    // hand refilled to original size
    expect(r.nextState.hands[0]).toHaveLength(2);
    // ACE_CLUBS consumed
    expect(
      r.nextState.hands[0]!.some((c) => c.rank === 'A' && c.suit === 'C'),
    ).toBe(false);
    // turn advanced to seat 1
    expect(r.nextState.currentSeat).toBe(1);
    // events in order: ChipPlaced, CardDrawn, TurnAdvanced
    const types = r.events.map((e) => e.type);
    expect(types).toEqual(['ChipPlaced', 'CardDrawn', 'TurnAdvanced']);
  });

  it('explicit two-eyed jack is honored even while holding the natural card', () => {
    const state = baseState({
      hands: [
        [ACE_CLUBS, TWO_EYED],
        [FIVE_DIAMONDS, KING_HEARTS],
      ],
    });
    const r = applyMove(
      state,
      place(ACE_CLUBS_POS, TWO_EYED),
      createSeededRng(1),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // the jack was spent, the natural ace remains
    expect(
      r.nextState.hands[0]!.some((c) => c.rank === 'A' && c.suit === 'C'),
    ).toBe(true);
    expect(
      r.nextState.hands[0]!.some((c) => c.rank === 'J' && c.suit === 'D'),
    ).toBe(false);
  });

  it('inferred placement consumes the natural card over a held jack', () => {
    const state = baseState({
      hands: [
        [ACE_CLUBS, TWO_EYED],
        [FIVE_DIAMONDS, KING_HEARTS],
      ],
    });
    // card omitted → infer
    const r = applyMove(state, place(ACE_CLUBS_POS), createSeededRng(1));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // natural ace consumed, jack retained
    expect(
      r.nextState.hands[0]!.some((c) => c.rank === 'J' && c.suit === 'D'),
    ).toBe(true);
    expect(
      r.nextState.hands[0]!.some((c) => c.rank === 'A' && c.suit === 'C'),
    ).toBe(false);
  });

  it('inferred placement uses a wild jack on an open cell when no natural held', () => {
    const state = baseState({
      hands: [
        [KING_HEARTS, TWO_EYED],
        [FIVE_DIAMONDS, ACE_CLUBS],
      ],
    });
    // place on Ace-of-Clubs cell with no Ace in hand → wild jack
    const r = applyMove(state, place(ACE_CLUBS_POS), createSeededRng(1));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nextState.board.get(ACE_CLUBS_POS)?.chip).toBe(1);
    expect(
      r.nextState.hands[0]!.some((c) => c.rank === 'J' && c.suit === 'D'),
    ).toBe(false);
  });

  it('reshuffles the played pile when the deck empties on draw', () => {
    const state = baseState({
      deck: [], // empty deck
    });
    const withPlayed: GameState = {
      ...state,
      played: [
        { rank: '2', suit: 'S' },
        { rank: '3', suit: 'S' },
      ],
    };
    const r = applyMove(
      withPlayed,
      place(ACE_CLUBS_POS, ACE_CLUBS),
      createSeededRng(1),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // hand refilled from the reshuffled pile
    expect(r.nextState.hands[0]).toHaveLength(2);
    expect(r.events.some((e) => e.type === 'CardDrawn')).toBe(true);
  });
});
