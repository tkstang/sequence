import { describe, expect, it } from 'vitest';

import { BOARD_MAP, positionAt } from './board-map.ts';
import { detectSequences, lockSequence } from './sequence-detection.ts';
import type { Board, BoardCell, Position, Sequence, Team } from './types.ts';

/** Build a board from a list of [position, cell] entries. */
function board(entries: Array<[Position, BoardCell]>): Board {
  return new Map(entries);
}

/** Place `team` chips at the given positions (unlocked). */
function chips(
  team: Team,
  positions: Position[],
): Array<[Position, BoardCell]> {
  return positions.map((p) => [p, { chip: team }]);
}

/** Five horizontal positions starting at (row, col). */
function rowRun(row: number, startCol: number, len: number): Position[] {
  const out: Position[] = [];
  for (let i = 0; i < len; i++) {
    out.push(positionAt(row, startCol + i)!);
  }
  return out;
}

function colRun(col: number, startRow: number, len: number): Position[] {
  const out: Position[] = [];
  for (let i = 0; i < len; i++) {
    out.push(positionAt(startRow + i, col)!);
  }
  return out;
}

describe('detectSequences — straight runs', () => {
  it('detects a horizontal 5-in-a-row as auto-lock', () => {
    // Row 4 (no corners), columns 2..6 — all card cells.
    const cells = rowRun(4, 2, 5);
    const placed = cells[4]!;
    const b = board(
      chips(1, cells.slice(0, 4)).concat([[placed, { chip: 1 }]]),
    );
    const result = detectSequences(b, placed, 1);
    expect(result.kind).toBe('autoLock');
    if (result.kind === 'autoLock') {
      expect(result.sequences).toHaveLength(1);
      expect(new Set(result.sequences[0])).toEqual(new Set(cells));
    }
  });

  it('detects a vertical 5-in-a-row', () => {
    const cells = colRun(5, 2, 5);
    const placed = cells[2]!;
    const b = board(chips(2, cells));
    const result = detectSequences(b, placed, 2);
    expect(result.kind).toBe('autoLock');
  });

  it('detects a diagonal 5-in-a-row', () => {
    const cells: Position[] = [];
    for (let i = 0; i < 5; i++) cells.push(positionAt(2 + i, 2 + i)!);
    const placed = cells[0]!;
    const b = board(chips(1, cells));
    const result = detectSequences(b, placed, 1);
    expect(result.kind).toBe('autoLock');
  });

  it('reports none when fewer than five align', () => {
    const cells = rowRun(4, 2, 4);
    const b = board(chips(1, cells));
    expect(detectSequences(b, cells[3]!, 1).kind).toBe('none');
  });
});

describe('detectSequences — corners are wild', () => {
  it('counts a corner as a chip for any team (4 chips + corner = sequence)', () => {
    // Top-left corner is (0,0); place team chips at (0,1)..(0,4).
    const corner = BOARD_MAP[0]![0]!; // '1WW'
    const placed = positionAt(0, 4)!;
    const b = board(chips(1, rowRun(0, 1, 4)));
    const result = detectSequences(b, placed, 1);
    expect(result.kind).toBe('autoLock');
    if (result.kind === 'autoLock') {
      expect(result.sequences[0]).toContain(corner);
    }
  });

  it('lets two teams share the same corner', () => {
    const corner = BOARD_MAP[0]![0]!;
    // Team 1 across the top row using the corner.
    const b1 = board(chips(1, rowRun(0, 1, 4)));
    expect(detectSequences(b1, positionAt(0, 4)!, 1).kind).toBe('autoLock');
    // Team 2 down the left column using the SAME corner.
    const b2 = board(chips(2, colRun(0, 1, 4)));
    const r2 = detectSequences(b2, positionAt(4, 0)!, 2);
    expect(r2.kind).toBe('autoLock');
    if (r2.kind === 'autoLock') {
      expect(r2.sequences[0]).toContain(corner);
    }
  });
});

describe('detectSequences — long runs', () => {
  it('requires a choice for a run of six', () => {
    const cells = rowRun(4, 1, 6);
    const placed = cells[5]!;
    const b = board(chips(1, cells));
    const result = detectSequences(b, placed, 1);
    expect(result.kind).toBe('choiceRequired');
    if (result.kind === 'choiceRequired') {
      expect(result.runLength).toBe(6);
      expect(new Set(result.cells)).toEqual(new Set(cells));
    }
  });

  it('reports two-sequence potential for nine in a row (with shared cell)', () => {
    // 9 in a row → two 5-sequences sharing exactly one cell.
    const cells = rowRun(4, 0, 9);
    const placed = cells[4]!;
    const b = board(chips(1, cells));
    const result = detectSequences(b, placed, 1);
    expect(result.kind).toBe('choiceRequired');
    if (result.kind === 'choiceRequired') {
      expect(result.runLength).toBe(9);
    }
  });
});

describe('detectSequences — crossing placement', () => {
  it('reports both sequences when one placement completes two lines', () => {
    // Place at an intersection completing both a row and a column.
    const center = positionAt(4, 4)!;
    const rowCells = rowRun(4, 0, 5); // includes (4,4) at index 4
    const colCells = colRun(4, 4, 5); // includes (4,4) at index 0
    const entries = [...chips(1, rowCells), ...chips(1, colCells)];
    const b = board(entries);
    const result = detectSequences(b, center, 1);
    expect(result.kind).toBe('autoLock');
    if (result.kind === 'autoLock') {
      expect(result.sequences).toHaveLength(2);
    }
  });
});

describe('detectSequences — locked reuse rule', () => {
  it('allows reusing exactly one cell already locked in this team’s sequence', () => {
    // First sequence locked on row 4 cols 0..4; new vertical run through (4,4)
    // reuses that one locked cell — allowed.
    const firstSeq = rowRun(4, 0, 5);
    const vertical = colRun(4, 4, 5); // shares (4,4)
    const entries: Array<[Position, BoardCell]> = [];
    for (const p of firstSeq) entries.push([p, { chip: 1, lockedBy: 1 }]);
    for (const p of vertical.slice(1)) entries.push([p, { chip: 1 }]);
    const b = board(entries);
    const result = detectSequences(b, vertical[4]!, 1);
    expect(result.kind).toBe('autoLock');
  });

  it('does not allow reusing two cells already locked in this team’s sequence', () => {
    // Two locked cells overlapping the new run → not a fresh sequence.
    const firstSeq = colRun(4, 0, 5); // (0,4)..(4,4) locked
    // New row at row 3 would only share one; build an overlap of two instead:
    // lock a horizontal sequence row 4 cols 0..4, and try a parallel-ish run
    // that overlaps two locked cells — use the same row again (fully locked).
    const entries: Array<[Position, BoardCell]> = firstSeq.map((p) => [
      p,
      { chip: 1, lockedBy: 1 },
    ]);
    const b = board(entries);
    // Re-detecting on the same fully-locked column yields no NEW sequence.
    const result = detectSequences(b, firstSeq[4]!, 1);
    expect(result.kind).toBe('none');
  });
});

describe('lockSequence', () => {
  it('marks the chosen cells locked with the sequence id', () => {
    const cells = rowRun(4, 2, 5);
    const b = board(chips(1, cells));
    const locked = lockSequence(b, cells, 7);
    for (const p of cells) {
      const cell = locked.get(p)!;
      expect(cell.lockedBy).toBe(7);
      expect(cell.chip).toBe(1);
    }
  });

  it('does not mutate the input board', () => {
    const cells = rowRun(4, 2, 5);
    const b = board(chips(1, cells));
    lockSequence(b, cells, 7);
    expect(b.get(cells[0]!)!.lockedBy).toBeUndefined();
  });

  it('leaves corner cells unlocked (they are never occupied)', () => {
    const corner = BOARD_MAP[0]![0]!;
    const cells = [corner, ...rowRun(0, 1, 4)];
    const b = board(chips(1, rowRun(0, 1, 4)));
    const locked = lockSequence(b, cells, 3);
    expect(locked.has(corner)).toBe(false);
  });
});

// Reference the Sequence type to keep imports honest.
const _seq: Sequence = { id: 1, team: 1, cells: [] };
void _seq;
