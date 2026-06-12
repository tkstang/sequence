import { describe, expect, it } from 'vitest';

import {
  BOARD_MAP,
  BOARD_SIZE,
  isCorner,
  parseBoardCell,
} from './board-map.ts';

describe('BOARD_MAP', () => {
  it('is a 10x10 grid (100 cells)', () => {
    expect(BOARD_MAP).toHaveLength(BOARD_SIZE);
    for (const row of BOARD_MAP) {
      expect(row).toHaveLength(BOARD_SIZE);
    }
    const cellCount = BOARD_MAP.flat().length;
    expect(cellCount).toBe(100);
  });

  it('has exactly 4 corner cells, one at each corner', () => {
    const corners = BOARD_MAP.flat().filter((cell) => isCorner(cell));
    expect(corners).toHaveLength(4);

    const last = BOARD_SIZE - 1;
    expect(isCorner(BOARD_MAP[0]![0]!)).toBe(true);
    expect(isCorner(BOARD_MAP[0]![last]!)).toBe(true);
    expect(isCorner(BOARD_MAP[last]![0]!)).toBe(true);
    expect(isCorner(BOARD_MAP[last]![last]!)).toBe(true);
  });

  it('has 48 distinct card codes, each appearing exactly twice', () => {
    const counts = new Map<string, number>();
    for (const cell of BOARD_MAP.flat()) {
      const parsed = parseBoardCell(cell);
      if (parsed.kind === 'corner') continue;
      const code = `${parsed.rank}${parsed.suit}`;
      counts.set(code, (counts.get(code) ?? 0) + 1);
    }

    expect(counts.size).toBe(48);
    for (const [, count] of counts) {
      expect(count).toBe(2);
    }
  });

  it('places no jacks on the board', () => {
    for (const cell of BOARD_MAP.flat()) {
      const parsed = parseBoardCell(cell);
      if (parsed.kind === 'corner') continue;
      expect(parsed.rank).not.toBe('J');
    }
  });
});

describe('parseBoardCell', () => {
  it('parses a corner cell', () => {
    expect(parseBoardCell('1WW')).toEqual({ kind: 'corner' });
  });

  it('parses a card cell into rank and suit (copy index dropped)', () => {
    expect(parseBoardCell('1AC')).toEqual({
      kind: 'card',
      rank: 'A',
      suit: 'C',
    });
    expect(parseBoardCell('2TS')).toEqual({
      kind: 'card',
      rank: 'T',
      suit: 'S',
    });
  });
});
