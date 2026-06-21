import { describe, expect, it } from 'vitest';

import { BOARD_MAP, positionAt } from './board-map.ts';
import { canPlaceWild, canRemoveChip, oneEyedTargets } from './jack-rules.ts';
import type { Board, BoardCell, Position, Team } from './types.ts';

function board(entries: Array<[Position, BoardCell]>): Board {
  return new Map(entries);
}

const OPEN = positionAt(4, 4)!;
const OTHER = positionAt(5, 5)!;
const CORNER = BOARD_MAP[0]![0]!;

describe('canPlaceWild (two-eyed jack)', () => {
  it('is legal on any open card cell', () => {
    expect(canPlaceWild(board([]), OPEN)).toEqual({ ok: true });
  });

  it('is illegal on an occupied cell', () => {
    const b = board([[OPEN, { chip: 1 }]]);
    expect(canPlaceWild(b, OPEN)).toEqual({
      ok: false,
      error: { code: 'space-occupied' },
    });
  });

  it('is illegal on a corner (corners are never placed on)', () => {
    expect(canPlaceWild(board([]), CORNER)).toEqual({
      ok: false,
      error: { code: 'space-occupied' },
    });
  });
});

describe('canRemoveChip (one-eyed jack)', () => {
  const me: Team = 1;
  const opponent: Team = 2;

  it('removes an opponent unlocked chip', () => {
    const b = board([[OPEN, { chip: opponent }]]);
    expect(canRemoveChip(b, OPEN, me)).toEqual({ ok: true });
  });

  it('is illegal on your own chip', () => {
    const b = board([[OPEN, { chip: me }]]);
    expect(canRemoveChip(b, OPEN, me)).toEqual({
      ok: false,
      error: { code: 'own-chip' },
    });
  });

  it('is illegal on a locked chip', () => {
    const b = board([[OPEN, { chip: opponent, lockedBy: 1 }]]);
    expect(canRemoveChip(b, OPEN, me)).toEqual({
      ok: false,
      error: { code: 'chip-locked' },
    });
  });

  it('is illegal on an empty cell', () => {
    expect(canRemoveChip(board([]), OPEN, me)).toEqual({
      ok: false,
      error: { code: 'empty-cell' },
    });
  });
});

describe('oneEyedTargets', () => {
  it('is empty on a fresh board (no-target = unplayable, NOT dead)', () => {
    expect(oneEyedTargets(board([]), 1)).toEqual([]);
  });

  it('lists only opponent unlocked chips', () => {
    const b = board([
      [OPEN, { chip: 2 }], // opponent, unlocked → target
      [OTHER, { chip: 2, lockedBy: 1 }], // opponent, locked → not a target
      [positionAt(6, 6)!, { chip: 1 }], // own chip → not a target
    ]);
    expect(oneEyedTargets(b, 1)).toEqual([OPEN]);
  });

  it('treats all non-self unlocked teams as targets in 3-team games', () => {
    const b = board([
      [OPEN, { chip: 2 }],
      [OTHER, { chip: 3 }],
      [positionAt(6, 6)!, { chip: 1 }],
    ]);
    expect(new Set(oneEyedTargets(b, 1))).toEqual(new Set([OPEN, OTHER]));
  });
});
