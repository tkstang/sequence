import { describe, expect, it } from 'vitest';

import * as gameLogic from './index.ts';

describe('@sequence/game-logic public surface', () => {
  it('exports the reducer and creation entry points', () => {
    expect(typeof gameLogic.applyMove).toBe('function');
    expect(typeof gameLogic.createGame).toBe('function');
    expect(typeof gameLogic.resolveSequenceChoice).toBe('function');
    expect(typeof gameLogic.turnInDeadCard).toBe('function');
    expect(typeof gameLogic.forfeitTurn).toBe('function');
  });

  it('exports rule + display helpers and board constants', () => {
    expect(typeof gameLogic.validPlacements).toBe('function');
    expect(typeof gameLogic.detectSequences).toBe('function');
    expect(typeof gameLogic.isDeadCard).toBe('function');
    expect(typeof gameLogic.checkWin).toBe('function');
    expect(gameLogic.BOARD_MAP).toHaveLength(10);
    expect(gameLogic.canTransition('lobby', 'active')).toBe(true);
  });
});
