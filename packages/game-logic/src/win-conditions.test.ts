import { describe, expect, it } from 'vitest';

import type { GameState, Sequence, Team } from './types.ts';
import { checkWin, sequencesToWin } from './win-conditions.ts';

function seq(id: number, team: Team): Sequence {
  return { id, team, cells: [] };
}

function stateWith(teamCount: 2 | 3, sequences: Sequence[]): GameState {
  const teams: Team[] = teamCount === 2 ? [1, 2] : [1, 2, 3];
  return {
    settings: {
      playerCount: teamCount === 2 ? 2 : 3,
      mode: 'tap',
      timerSeconds: null,
      local: false,
    },
    status: 'active',
    board: new Map(),
    hands: teams.map(() => []),
    deck: [],
    played: [],
    sequences,
    teams,
    currentSeat: 0,
    round: 1,
    nextSequenceId: sequences.length + 1,
  };
}

describe('sequencesToWin', () => {
  it('needs 2 sequences for a 2-team game', () => {
    expect(sequencesToWin(2)).toBe(2);
  });

  it('needs 1 sequence for a 3-team game', () => {
    expect(sequencesToWin(3)).toBe(1);
  });
});

describe('checkWin', () => {
  it('is false with no sequences', () => {
    expect(checkWin(stateWith(2, []), 1)).toBe(false);
  });

  it('is false with one sequence in a 2-team game', () => {
    expect(checkWin(stateWith(2, [seq(1, 1)]), 1)).toBe(false);
  });

  it('is true with two sequences in a 2-team game', () => {
    const state = stateWith(2, [seq(1, 1), seq(2, 1)]);
    expect(checkWin(state, 1)).toBe(true);
  });

  it('counts only the queried team’s sequences', () => {
    const state = stateWith(2, [seq(1, 1), seq(2, 2)]);
    expect(checkWin(state, 1)).toBe(false);
    expect(checkWin(state, 2)).toBe(false);
  });

  it('is true with one sequence in a 3-team game', () => {
    expect(checkWin(stateWith(3, [seq(1, 2)]), 2)).toBe(true);
  });

  it('treats a double-sequence (two in one move) as an instant win', () => {
    // Both sequences land in the same move for team 1 → meets the 2-team
    // threshold immediately.
    const state = stateWith(2, [seq(1, 1), seq(2, 1)]);
    expect(checkWin(state, 1)).toBe(true);
  });
});
