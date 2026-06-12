import { describe, expect, it } from 'vitest';

import { createGame } from './create-game.ts';
import { createSeededRng } from './deck.ts';
import type { GameSettings, PlayerSeed, Team } from './types.ts';

function settings(partial: Partial<GameSettings> = {}): GameSettings {
  return {
    playerCount: 2,
    mode: 'tap',
    timerSeconds: null,
    local: false,
    ...partial,
  };
}

function seeds(teams: Team[]): PlayerSeed[] {
  return teams.map((team, seat) => ({ seat, team }));
}

describe('createGame — dealing', () => {
  const dealTable: ReadonlyArray<[number, Team[], number]> = [
    [2, [1, 2], 7],
    [3, [1, 2, 3], 6],
    [4, [1, 2, 1, 2], 6],
    [6, [1, 2, 3, 1, 2, 3], 5],
  ];

  for (const [count, teams, perHand] of dealTable) {
    it(`deals ${perHand} cards each for ${count} players`, () => {
      const state = createGame(
        settings({ playerCount: count as GameSettings['playerCount'] }),
        seeds(teams),
        createSeededRng(1),
      );
      expect(state.hands).toHaveLength(count);
      for (const hand of state.hands) {
        expect(hand).toHaveLength(perHand);
      }
      // deck = 104 − dealt
      expect(state.deck).toHaveLength(104 - count * perHand);
    });
  }
});

describe('createGame — turn order', () => {
  it('alternates teams for 4 players (B G B G)', () => {
    const state = createGame(
      settings({ playerCount: 4 }),
      seeds([1, 1, 2, 2]),
      createSeededRng(1),
    );
    expect(state.teams).toEqual([1, 2, 1, 2]);
  });

  it('alternates teams for 6 players, 3 teams (B G R B G R)', () => {
    const state = createGame(
      settings({ playerCount: 6 }),
      seeds([1, 1, 2, 2, 3, 3]),
      createSeededRng(1),
    );
    expect(state.teams).toEqual([1, 2, 3, 1, 2, 3]);
  });

  it('treats 3 players as three single-player teams', () => {
    const state = createGame(
      settings({ playerCount: 3 }),
      seeds([1, 2, 3]),
      createSeededRng(1),
    );
    expect(state.teams).toEqual([1, 2, 3]);
  });

  it('starts at seat 0, round 1', () => {
    const state = createGame(settings(), seeds([1, 2]), createSeededRng(1));
    expect(state.currentSeat).toBe(0);
    expect(state.round).toBe(1);
  });
});

describe('createGame — validation', () => {
  it('rejects an unsupported player count', () => {
    expect(() =>
      createGame(
        settings({ playerCount: 5 as unknown as GameSettings['playerCount'] }),
        seeds([1, 2, 1, 2, 1]),
        createSeededRng(1),
      ),
    ).toThrow();
  });

  it('rejects when seed count does not match player count', () => {
    expect(() =>
      createGame(
        settings({ playerCount: 4 }),
        seeds([1, 2]),
        createSeededRng(1),
      ),
    ).toThrow();
  });

  it('rejects uneven teams for 4 players', () => {
    expect(() =>
      createGame(
        settings({ playerCount: 4 }),
        seeds([1, 1, 1, 2]),
        createSeededRng(1),
      ),
    ).toThrow();
  });
});

describe('createGame — initial state', () => {
  it('starts with an empty board and active status', () => {
    const state = createGame(settings(), seeds([1, 2]), createSeededRng(1));
    expect(state.board.size).toBe(0);
    expect(state.status).toBe('active');
    expect(state.sequences).toEqual([]);
    expect(state.played).toEqual([]);
  });

  it('is deterministic for a given seed', () => {
    const a = createGame(settings(), seeds([1, 2]), createSeededRng(99));
    const b = createGame(settings(), seeds([1, 2]), createSeededRng(99));
    expect(a.hands).toEqual(b.hands);
    expect(a.deck).toEqual(b.deck);
  });
});
