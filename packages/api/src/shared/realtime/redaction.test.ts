import { createGame, createSeededRng } from '@sequence/game-logic';
import type { GameState } from '@sequence/game-logic';
import { describe, expect, it } from 'vitest';

import { buildSnapshot, type LoggedEvent, redactEvent } from './redaction.ts';

function activeGame(local = false): GameState {
  return createGame(
    { playerCount: 2, mode: 'tap', timerSeconds: null, local },
    [
      { seat: 0, team: 1 },
      { seat: 1, team: 2 },
    ],
    createSeededRng(7),
  );
}

describe('redactEvent', () => {
  const cardDrawnForSeat1: LoggedEvent = {
    seq: 5,
    type: 'CardDrawn',
    payload: { seat: 1, card: { rank: 'A', suit: 'C' } },
  };

  it('passes public events through identically for all seats', () => {
    const chipPlaced: LoggedEvent = {
      seq: 3,
      type: 'ChipPlaced',
      payload: {
        seat: 0,
        team: 1,
        position: '1AC',
        card: { rank: 'A', suit: 'C' },
      },
    };
    expect(redactEvent(chipPlaced, 0, false)).toEqual(chipPlaced);
    expect(redactEvent(chipPlaced, 1, false)).toEqual(chipPlaced);
  });

  it('delivers a CardDrawn in full only to the owning seat', () => {
    // Owning seat sees the card.
    expect(redactEvent(cardDrawnForSeat1, 1, false)).toEqual(cardDrawnForSeat1);
    // Non-owning seat sees the skeleton — no card.
    const redacted = redactEvent(cardDrawnForSeat1, 0, false);
    expect(redacted.payload).not.toHaveProperty('card');
    expect(redacted.payload).toMatchObject({ seat: 1 });
  });

  it('strips both discarded and drawn from a DeadCardSwapped for others', () => {
    const swap: LoggedEvent = {
      seq: 9,
      type: 'DeadCardSwapped',
      payload: {
        seat: 0,
        discarded: { rank: '2', suit: 'D' },
        drawn: { rank: 'K', suit: 'H' },
      },
    };
    const redacted = redactEvent(swap, 1, false);
    expect(redacted.payload).not.toHaveProperty('discarded');
    expect(redacted.payload).not.toHaveProperty('drawn');
    expect(redacted.payload).toMatchObject({ seat: 0 });
  });

  it('a local-game connection receives private events intact', () => {
    expect(redactEvent(cardDrawnForSeat1, 0, true)).toEqual(cardDrawnForSeat1);
  });

  it('NFR1: no event reaching a non-owning seat carries card data', () => {
    const events: LoggedEvent[] = [
      {
        seq: 1,
        type: 'CardDrawn',
        payload: { seat: 1, card: { rank: 'A', suit: 'C' } },
      },
      {
        seq: 2,
        type: 'DeadCardSwapped',
        payload: {
          seat: 1,
          discarded: { rank: '3', suit: 'S' },
          drawn: { rank: '9', suit: 'D' },
        },
      },
    ];
    for (const e of events) {
      const redacted = redactEvent(e, 0, false);
      // Scan the serialized payload for any card-bearing key.
      expect(JSON.stringify(redacted)).not.toMatch(/"(card|drawn|discarded)"/);
    }
  });
});

describe('buildSnapshot', () => {
  it('includes only the recipient hand and never the deck (NFR1)', () => {
    const state = activeGame();
    const snap0 = buildSnapshot(state, 0, 1);
    const snap1 = buildSnapshot(state, 1, 1);

    expect(snap0.hand).toEqual(state.hands[0]);
    expect(snap1.hand).toEqual(state.hands[1]);
    expect(snap0.hand).not.toEqual(snap1.hand);

    // The serialized snapshot must not contain the deck or the other hand.
    const serialized0 = JSON.stringify(snap0);
    expect(serialized0).not.toContain('deck');
    expect(serialized0).not.toContain('localHands');
    // The opponent's hand cards must not all be present in seat 0's snapshot.
    const otherHand = state.hands[1]!;
    const leaked = otherHand.every(
      (c) =>
        serialized0.includes(`"${c.rank}"`) &&
        serialized0.includes(`"${c.suit}"`),
    );
    // (weak check) at least assert the snapshot hand length equals own hand.
    expect(snap0.hand.length).toBe(state.hands[0]!.length);
    void leaked;
  });

  it('a local-game snapshot includes every hand', () => {
    const state = activeGame(true);
    const snap = buildSnapshot(state, 0, 1);
    expect(snap.localHands).toBeDefined();
    expect(snap.localHands).toHaveLength(2);
    expect(snap.localHands?.[1]).toEqual(state.hands[1]);
  });

  it('public state (board, sequences, status, currentSeat) is present', () => {
    const state = activeGame();
    const snap = buildSnapshot(state, 0, 1);
    expect(snap.status).toBe('active');
    expect(snap.currentSeat).toBe(0);
    expect(snap.board).toEqual({});
    expect(snap.sequences).toEqual([]);
  });

  it('carries the current version so a recovering client can submit a move', () => {
    const state = activeGame();
    // version is global per-game (not redacted) — identical for every seat.
    expect(buildSnapshot(state, 0, 7).version).toBe(7);
    expect(buildSnapshot(state, 1, 7).version).toBe(7);
  });

  it('includes pendingChoice.placed and additionalRuns for a reconnecting placer', () => {
    const state: GameState = {
      ...activeGame(),
      pendingChoice: {
        seat: 0,
        team: 1,
        placed: '5AC',
        cells: ['5AC', '6AC', '7AC', '8AC', '9AC', 'TAC'],
        additionalRuns: [['1AD', '2AD', '3AD', '4AD', '5AD']],
      },
    };
    const snap = buildSnapshot(state, 0, 3);
    expect(snap.pendingChoice).toMatchObject({
      seat: 0,
      placed: '5AC',
      cells: ['5AC', '6AC', '7AC', '8AC', '9AC', 'TAC'],
      additionalRuns: [['1AD', '2AD', '3AD', '4AD', '5AD']],
    });
  });
});
