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
  it('rejects out-of-turn when the move carries a non-current actor seat', () => {
    // It's seat 0's turn. A move authored by seat 1 is rejected by the engine
    // itself with not-your-turn — turn ownership is engine-enforced (NFR1),
    // independent of whether the named card is in any hand.
    const state = baseState({ currentSeat: 0 });
    const r = applyMove(state, {
      type: 'place',
      position: ACE_CLUBS_POS,
      card: ACE_CLUBS,
      seat: 1,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('not-your-turn');
  });

  it('accepts a move whose actor seat matches the current seat', () => {
    const state = baseState({ currentSeat: 0 });
    const r = applyMove(state, {
      type: 'place',
      position: ACE_CLUBS_POS,
      card: ACE_CLUBS,
      seat: 0,
    });
    expect(r.ok).toBe(true);
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

describe('applyMove — crossing auto-lock + choice (I1 regression)', () => {
  it('locks the exactly-5 crossing sequence and wins instantly with the choice', () => {
    // Vertical exactly-5 (col 5, rows 2..6) AND a horizontal 6-run (row 4,
    // cols 1..6) both completed by covering (4,5). The vertical is earned
    // outright; resolving the row choice yields the second sequence → 2-team
    // instant win. Previously the vertical sequence was silently discarded.
    const placed = positionAt(4, 5)!;
    const vertical: Position[] = [];
    for (let r = 2; r <= 6; r++) vertical.push(positionAt(r, 5)!);
    const horizontal: Position[] = [];
    for (let c = 1; c <= 6; c++) horizontal.push(positionAt(4, c)!);
    const entries: Array<[Position, BoardCell]> = [];
    for (const p of vertical) if (p !== placed) entries.push([p, { chip: 1 }]);
    for (const p of horizontal)
      if (p !== placed) entries.push([p, { chip: 1 }]);
    const state = baseState({
      board: makeBoard(entries),
      hands: [[TWO_EYED], []],
    });
    const placement = applyMove(
      state,
      { type: 'place', position: placed, card: TWO_EYED },
      createSeededRng(1),
    );
    expect(placement.ok).toBe(true);
    if (!placement.ok) return;
    // The vertical 5 is already locked while the row choice is pending.
    expect(placement.nextState.pendingChoice).toBeDefined();
    expect(placement.nextState.sequences).toHaveLength(1);

    const chosen = horizontal.slice(1, 6); // cols 2..6, includes placed col 5
    expect(chosen).toContain(placed);
    const r = resolveSequenceChoice(
      placement.nextState,
      chosen,
      createSeededRng(1),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nextState.sequences).toHaveLength(2);
    // 2-team game: two sequences in one placement = instant win.
    expect(r.nextState.status).toBe('finished');
    expect(r.nextState.winner).toBe(1);
    expect(r.events.some((e) => e.type === 'GameWon')).toBe(true);
  });
});

describe('resolveSequenceChoice — reuse rule (C1 regression)', () => {
  it('rejects a chosen window that reuses two or more of this team’s locked cells', () => {
    // Team-1 locked sequence on row 4 cols 0..4 (lockedBy: 1). New unlocked
    // team-1 chips at cols 6..9, then the placer covers col 5 → a 10-cell run
    // (cols 0..9, placed at col 5). Legal 5-windows exist (cols 4..8, 5..9), so
    // the turn freezes for a choice — but the placer must NOT be allowed to
    // choose cols 3..7 (reuses cols 3 and 4, two locked cells). FR5: at most one
    // reused space between own sequences.
    const entries: Array<[Position, BoardCell]> = [];
    for (let c = 0; c < 5; c++) {
      entries.push([positionAt(4, c)!, { chip: 1, lockedBy: 1 } as BoardCell]);
    }
    for (const c of [6, 7, 8, 9]) {
      entries.push([positionAt(4, c)!, { chip: 1 } as BoardCell]);
    }
    const placed = positionAt(4, 5)!;
    const state: GameState = {
      ...baseState({
        board: makeBoard(entries),
        hands: [[TWO_EYED], []],
      }),
      sequences: [
        {
          id: 1,
          team: 1,
          cells: [0, 1, 2, 3, 4].map((c) => positionAt(4, c)!),
        },
      ],
      nextSequenceId: 2,
    };
    const placement = applyMove(
      state,
      { type: 'place', position: placed, card: TWO_EYED },
      createSeededRng(1),
    );
    expect(placement.ok).toBe(true);
    if (!placement.ok) return;
    expect(placement.nextState.pendingChoice).toBeDefined();

    // Illegal window: cols 3,4,5,6,7 — reuses cols 3 and 4 (both locked).
    const illegal = [3, 4, 5, 6, 7].map((c) => positionAt(4, c)!);
    const r = resolveSequenceChoice(
      placement.nextState,
      illegal,
      createSeededRng(1),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('invalid-sequence-choice');
    // And no win was granted off the illegal window.
    if (r.ok) expect(r.nextState.winner).toBeUndefined();
  });

  it('accepts a window reusing exactly one of this team’s locked cells', () => {
    // Same setup, but choose cols 4..7 + col 3 would be two; instead choose
    // cols 4,5,6,7 plus one more from the unlocked side is impossible (run ends
    // at 7), so the only legal 5-window including placed col 7 that reuses ≤1
    // locked cell is cols 3..7? No — that reuses 3 and 4. The legal window is
    // cols 4..8 — but col 8 isn't in the run. With an 8-run (cols 0..7) and two
    // locked cells at 3,4 adjacent to the unlocked tail, the placer simply has
    // no legal fresh window here. Use a longer tail so a legal window exists.
    const entries: Array<[Position, BoardCell]> = [];
    for (let c = 0; c < 5; c++) {
      entries.push([positionAt(4, c)!, { chip: 1, lockedBy: 1 } as BoardCell]);
    }
    for (let c = 5; c < 8; c++) {
      entries.push([positionAt(4, c)!, { chip: 1 } as BoardCell]);
    }
    const placed = positionAt(4, 8)!;
    const state: GameState = {
      ...baseState({
        board: makeBoard(entries),
        hands: [[TWO_EYED], []],
      }),
      sequences: [
        {
          id: 1,
          team: 1,
          cells: [0, 1, 2, 3, 4].map((c) => positionAt(4, c)!),
        },
      ],
      nextSequenceId: 2,
    };
    const placement = applyMove(
      state,
      { type: 'place', position: placed, card: TWO_EYED },
      createSeededRng(1),
    );
    expect(placement.ok).toBe(true);
    if (!placement.ok) return;

    // Legal window: cols 4,5,6,7,8 — reuses only col 4 (one locked cell).
    const legal = [4, 5, 6, 7, 8].map((c) => positionAt(4, c)!);
    const r = resolveSequenceChoice(
      placement.nextState,
      legal,
      createSeededRng(1),
    );
    expect(r.ok).toBe(true);
  });
});

describe('advanceTurn event order (m2 regression)', () => {
  it('emits TurnAdvanced before the incoming player’s auto-swap', () => {
    // Tap mode: seat 1 holds a dead card so the turn advance auto-swaps it. The
    // DeadCardSwapped (attributed to seat 1's now-started turn) must follow the
    // TurnAdvanced that announces that turn.
    const deadForSeat1: Card = { rank: '5', suit: 'D' };
    const board = makeBoard(
      boardCellsFor('5', 'D').map((p) => [p, { chip: 2 } as BoardCell]),
    );
    const state = baseState({
      board,
      hands: [[ACE_CLUBS], [deadForSeat1]],
      deck: [
        { rank: '6', suit: 'C' },
        { rank: '7', suit: 'C' },
      ],
    });
    const r = applyMove(
      state,
      place(ACE_CLUBS_POS, ACE_CLUBS),
      createSeededRng(1),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const turnIdx = r.events.findIndex((e) => e.type === 'TurnAdvanced');
    const swapIdx = r.events.findIndex((e) => e.type === 'DeadCardSwapped');
    expect(turnIdx).toBeGreaterThanOrEqual(0);
    expect(swapIdx).toBeGreaterThanOrEqual(0);
    expect(turnIdx).toBeLessThan(swapIdx);
  });
});

describe('actor-seat enforcement (I4 regression)', () => {
  it('resolveSequenceChoice rejects a non-placer actor with not-your-turn', () => {
    const existing: Position[] = [];
    for (let c = 0; c < 6; c++) existing.push(positionAt(4, c)!);
    const placed = positionAt(4, 5)!;
    const entries: Array<[Position, BoardCell]> = existing
      .slice(0, 5)
      .map((p) => [p, { chip: 1 } as BoardCell]);
    const state = baseState({
      board: makeBoard(entries),
      hands: [[TWO_EYED], []],
    });
    const placement = applyMove(
      state,
      { type: 'place', position: placed, card: TWO_EYED, seat: 0 },
      createSeededRng(1),
    );
    expect(placement.ok).toBe(true);
    if (!placement.ok) return;
    const chosen = existing.slice(1, 6);
    // Seat 1 tries to resolve seat 0's pending choice → rejected.
    const r = resolveSequenceChoice(
      placement.nextState,
      chosen,
      createSeededRng(1),
      1,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('not-your-turn');
  });

  it('turnInDeadCard rejects an actor that is not the current seat', () => {
    const deadCard: Card = { rank: 'A', suit: 'C' };
    const board = makeBoard(
      boardCellsFor('A', 'C').map((p) => [p, { chip: 1 } as BoardCell]),
    );
    const state: GameState = {
      ...baseState({ board, hands: [[deadCard], [deadCard]] }),
      settings: {
        playerCount: 2,
        mode: 'drag',
        timerSeconds: null,
        local: false,
      },
      currentSeat: 0,
    };
    // Seat 1 tries to turn in during seat 0's turn.
    const r = turnInDeadCard(state, 1, deadCard, createSeededRng(1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('not-your-turn');
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

  it('rejects a turn-in when the game is not active (M1)', () => {
    const deadCard: Card = { rank: 'A', suit: 'C' };
    const board = makeBoard(
      boardCellsFor('A', 'C').map((p) => [p, { chip: 1 } as BoardCell]),
    );
    const state: GameState = {
      ...baseState({ board, hands: [[deadCard], []] }),
      settings: {
        playerCount: 2,
        mode: 'drag',
        timerSeconds: null,
        local: false,
      },
      status: 'frozen',
    };
    const r = turnInDeadCard(state, 0, deadCard, createSeededRng(1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('game-not-active');
  });

  it('rejects a turn-in while a sequence choice is pending (M1)', () => {
    const deadCard: Card = { rank: 'A', suit: 'C' };
    const board = makeBoard(
      boardCellsFor('A', 'C').map((p) => [p, { chip: 1 } as BoardCell]),
    );
    const state: GameState = {
      ...baseState({ board, hands: [[deadCard], []] }),
      settings: {
        playerCount: 2,
        mode: 'drag',
        timerSeconds: null,
        local: false,
      },
      pendingChoice: {
        seat: 0,
        team: 1,
        placed: positionAt(0, 1)!,
        cells: [positionAt(0, 1)!],
      },
    };
    const r = turnInDeadCard(state, 0, deadCard, createSeededRng(1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('pending-choice-unresolved');
  });

  it('caps dead-card turn-ins at one per turn (M1)', () => {
    const deadA: Card = { rank: 'A', suit: 'C' };
    const deadK: Card = { rank: 'K', suit: 'H' };
    const board = makeBoard([
      ...boardCellsFor('A', 'C').map(
        (p) => [p, { chip: 1 } as BoardCell] as [Position, BoardCell],
      ),
      ...boardCellsFor('K', 'H').map(
        (p) => [p, { chip: 1 } as BoardCell] as [Position, BoardCell],
      ),
    ]);
    const state: GameState = {
      ...baseState({ board, hands: [[deadA, deadK], []] }),
      settings: {
        playerCount: 2,
        mode: 'drag',
        timerSeconds: null,
        local: false,
      },
      // Replacement draws so the swap actually happens.
      deck: [
        { rank: '2', suit: 'S' },
        { rank: '3', suit: 'S' },
      ],
    };
    const first = turnInDeadCard(state, 0, deadA, createSeededRng(1));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    // A second turn-in in the same turn is rejected.
    const second = turnInDeadCard(
      first.nextState,
      0,
      deadK,
      createSeededRng(1),
    );
    expect(second.ok).toBe(false);
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
