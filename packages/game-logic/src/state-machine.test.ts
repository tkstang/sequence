import { describe, expect, it } from 'vitest';

import { canTransition, type GameStatus } from './state-machine.ts';

const ALL_STATUSES: GameStatus[] = [
  'lobby',
  'active',
  'frozen',
  'saved',
  'finished',
];

/**
 * The lifecycle table from design.md §Error Handling:
 *   lobby   → active
 *   active  → frozen | saved | finished
 *   frozen  → active
 *   saved   → active
 *   finished → (terminal)
 */
const ALLOWED: ReadonlyArray<readonly [GameStatus, GameStatus]> = [
  ['lobby', 'active'],
  ['active', 'frozen'],
  ['active', 'saved'],
  ['active', 'finished'],
  ['frozen', 'active'],
  ['saved', 'active'],
];

function isAllowed(from: GameStatus, to: GameStatus): boolean {
  return ALLOWED.some(([f, t]) => f === from && t === to);
}

describe('canTransition', () => {
  it('permits exactly the allowed transitions', () => {
    for (const [from, to] of ALLOWED) {
      expect(canTransition(from, to)).toBe(true);
    }
  });

  it('rejects every transition not in the allowed table', () => {
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        if (isAllowed(from, to)) continue;
        expect(canTransition(from, to)).toBe(false);
      }
    }
  });

  it('treats finished as terminal', () => {
    for (const to of ALL_STATUSES) {
      expect(canTransition('finished', to)).toBe(false);
    }
  });

  it('rejects self-transitions', () => {
    for (const status of ALL_STATUSES) {
      expect(canTransition(status, status)).toBe(false);
    }
  });
});
