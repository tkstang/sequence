import { describe, expect, it } from 'vitest';

import {
  applyMove,
  forfeitTurn,
  resolveSequenceChoice,
  turnInDeadCard,
} from './apply-move.ts';
import { boardCellsFor, positionAt } from './board-map.ts';
import { createSeededRng } from './deck.ts';
import type {
  Board,
  BoardCell,
  Card,
  GameState,
  Move,
  Position,
  Team,
} from './types.ts';

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

const ONE_EYED: Card = { rank: 'J', suit: 'S' };

function makeBoard(entries: Array<[Position, BoardCell]>): Board {
  return new Map(entries);
}

describe('applyMove — removeChip (one-eyed jack)', () => {
  it('removes an opponent unlocked chip, consumes the jack, and advances', () => {
    const target = positionAt(4, 4)!;
    const state = baseState({
      hands: [
        [ONE_EYED, KING_HEARTS],
        [FIVE_DIAMONDS, ACE_CLUBS],
      ],
      board: makeBoard([[target, { chip: 2 }]]),
    });
    const move: Move = { type: 'removeChip', position: target };
    const r = applyMove(state, move, createSeededRng(1));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // cell cleared
    expect(r.nextState.board.has(target)).toBe(false);
    // one-eyed jack consumed
    expect(
      r.nextState.hands[0]!.some((c) => c.rank === 'J' && c.suit === 'S'),
    ).toBe(false);
    // turn completed (advanced to seat 1)
    expect(r.nextState.currentSeat).toBe(1);
    const types = r.events.map((e) => e.type);
    expect(types).toContain('ChipRemoved');
    expect(types).toContain('TurnAdvanced');
  });

  it('rejects removing a locked chip', () => {
    const target = positionAt(4, 4)!;
    const state = baseState({
      hands: [
        [ONE_EYED, KING_HEARTS],
        [FIVE_DIAMONDS, ACE_CLUBS],
      ],
      board: makeBoard([[target, { chip: 2, lockedBy: 1 }]]),
    });
    const r = applyMove(state, { type: 'removeChip', position: target });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('chip-locked');
  });

  it('rejects removeChip without a one-eyed jack in hand', () => {
    const target = positionAt(4, 4)!;
    const state = baseState({
      hands: [
        [KING_HEARTS, ACE_CLUBS],
        [FIVE_DIAMONDS, TWO_EYED],
      ],
      board: makeBoard([[target, { chip: 2 }]]),
    });
    const r = applyMove(state, { type: 'removeChip', position: target });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('not-a-one-eyed-jack');
  });
});

describe('applyMove — pending sequence choice (>5 run)', () => {
  function sixInARow(): {
    state: GameState;
    placed: Position;
    cells: Position[];
  } {
    // Pre-place 5 team-1 chips on row 4 cols 0..4 (unlocked); the player
    // completes col 5 making six → choice required.
    const existing: Position[] = [];
    for (let c = 0; c < 5; c++) existing.push(positionAt(4, c)!);
    const placedPos = positionAt(4, 5)!;
    const entries: Array<[Position, BoardCell]> = existing.map((p) => [
      p,
      { chip: 1 } as BoardCell,
    ]);
    const state = baseState({
      board: makeBoard(entries),
      hands: [[], [FIVE_DIAMONDS, ACE_CLUBS]],
    });
    const cells = [...existing, placedPos];
    return { state, placed: placedPos, cells };
  }

  it('freezes the turn on a run longer than five and emits PendingChoice', () => {
    const { state, placed } = sixInARow();
    // Use an explicit two-eyed jack so we control the placement card.
    const withJack: GameState = {
      ...state,
      hands: [[TWO_EYED], state.hands[1]!],
    };
    const r = applyMove(withJack, {
      type: 'place',
      position: placed,
      card: TWO_EYED,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nextState.pendingChoice).toBeDefined();
    // turn did NOT advance
    expect(r.nextState.currentSeat).toBe(0);
    expect(r.events.some((e) => e.type === 'PendingChoice')).toBe(true);
    // no draw / advance while frozen
    expect(r.events.some((e) => e.type === 'TurnAdvanced')).toBe(false);
  });

  it('resolveSequenceChoice locks a valid straight-5 (incl. placed) and advances', () => {
    const { state, placed, cells } = sixInARow();
    const withJack: GameState = {
      ...state,
      hands: [[TWO_EYED], state.hands[1]!],
    };
    const placement = applyMove(withJack, {
      type: 'place',
      position: placed,
      card: TWO_EYED,
    });
    expect(placement.ok).toBe(true);
    if (!placement.ok) return;

    const chosen = cells.slice(1, 6); // 5 cells including the placed (col 5)
    expect(chosen).toContain(placed);
    const r = resolveSequenceChoice(
      placement.nextState,
      chosen,
      createSeededRng(1),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nextState.pendingChoice).toBeUndefined();
    expect(r.nextState.sequences).toHaveLength(1);
    // turn advanced after resolution
    expect(r.nextState.currentSeat).toBe(1);
    expect(r.events.some((e) => e.type === 'SequenceCompleted')).toBe(true);
  });

  it('rejects a choice that does not include the placed cell', () => {
    const { state, placed, cells } = sixInARow();
    const withJack: GameState = {
      ...state,
      hands: [[TWO_EYED], state.hands[1]!],
    };
    const placement = applyMove(withJack, {
      type: 'place',
      position: placed,
      card: TWO_EYED,
    });
    if (!placement.ok) throw new Error('setup failed');
    const badChoice = cells.slice(0, 5); // cols 0..4 — excludes placed col 5
    expect(badChoice).not.toContain(placed);
    const r = resolveSequenceChoice(
      placement.nextState,
      badChoice,
      createSeededRng(1),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('invalid-sequence-choice');
  });
});

describe('forfeitTurn', () => {
  it('advances the turn without play or draw', () => {
    const state = baseState();
    const before = state.hands[0]!.length;
    const r = forfeitTurn(state, createSeededRng(1));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nextState.currentSeat).toBe(1);
    // no chip placed, no card drawn for the forfeiting seat
    expect(r.nextState.hands[0]).toHaveLength(before);
    expect(r.events.some((e) => e.type === 'ChipPlaced')).toBe(false);
    expect(r.events.some((e) => e.type === 'TurnAdvanced')).toBe(true);
  });
});

describe('turnInDeadCard (hard mode)', () => {
  it('swaps a genuinely dead card and continues the same turn', () => {
    const deadCard: Card = { rank: 'A', suit: 'C' };
    const board = makeBoard(
      boardCellsFor('A', 'C').map((p) => [p, { chip: 1 } as BoardCell]),
    );
    const state: GameState = {
      ...baseState({ board, hands: [[deadCard, KING_HEARTS], []] }),
      settings: {
        playerCount: 2,
        mode: 'drag',
        timerSeconds: null,
        local: false,
      },
    };
    const r = turnInDeadCard(state, 0, deadCard, createSeededRng(1));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // dead card gone, turn NOT advanced (player keeps playing)
    expect(
      r.nextState.hands[0]!.some((c) => c.rank === 'A' && c.suit === 'C'),
    ).toBe(false);
    expect(r.nextState.currentSeat).toBe(0);
    expect(r.events.some((e) => e.type === 'DeadCardSwapped')).toBe(true);
  });

  it('rejects turning in a card that is not actually dead', () => {
    const liveCard: Card = { rank: 'A', suit: 'C' };
    const state: GameState = {
      ...baseState({ hands: [[liveCard, KING_HEARTS], []] }),
      settings: {
        playerCount: 2,
        mode: 'drag',
        timerSeconds: null,
        local: false,
      },
    };
    const r = turnInDeadCard(state, 0, liveCard, createSeededRng(1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('not-a-dead-card');
  });
});
