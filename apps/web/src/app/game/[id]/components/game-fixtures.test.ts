import { describe, expect, it } from 'vitest';

import { deadCardIndexes } from './controllers/tap-controller.ts';
import { gameFixtures, getGameFixture } from './game-fixtures.ts';
import { screenForState, stateFromSnapshot } from './game-state.ts';

describe('game fixtures', () => {
  it('covers the representative states from the backlog item', () => {
    const ids = gameFixtures.map((fixture) => fixture.id);
    expect(ids).toEqual([
      'lobby',
      'active-your-turn',
      'active-not-your-turn',
      'dead-card',
      'sequence-choice',
      'game-over',
    ]);
  });

  it('projects each fixture into a routable view state', () => {
    expect(screenForState(stateFromSnapshot(getFixture('lobby')))).toBe(
      'lobby',
    );
    expect(
      screenForState(stateFromSnapshot(getFixture('active-your-turn'))),
    ).toBe('game');
    expect(screenForState(stateFromSnapshot(getFixture('game-over')))).toBe(
      'game-over',
    );
  });

  it('flags the live-turn fixture as the local seat’s turn', () => {
    const yours = getFixture('active-your-turn');
    const theirs = getFixture('active-not-your-turn');
    expect(yours.currentSeat).toBe(yours.mySeat);
    expect(theirs.currentSeat).not.toBe(theirs.mySeat);
  });

  it('makes a real dead card in the dead-card fixture', () => {
    const fixture = getFixture('dead-card');
    expect(deadCardIndexes(fixture.hand, fixture.board).length).toBeGreaterThan(
      0,
    );
  });

  it('carries a completed winning sequence in the game-over fixture', () => {
    const fixture = getFixture('game-over');
    expect(fixture.winnerTeam).toBe(1);
    expect(fixture.sequences).toHaveLength(1);
    for (const cell of fixture.sequences[0]!.cells) {
      expect(fixture.board[cell]?.lockedBy).toBe(fixture.sequences[0]!.id);
    }
  });
});

function getFixture(id: string) {
  const fixture = getGameFixture(id);
  if (!fixture) throw new Error(`missing fixture: ${id}`);
  return fixture.snapshot;
}
