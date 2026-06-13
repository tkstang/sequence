import { describe, expect, it } from 'vitest';

import { formatRemaining } from './expiry-countdown.tsx';

describe('formatRemaining', () => {
  it('reports expired at or below zero', () => {
    expect(formatRemaining(0)).toBe('expired');
    expect(formatRemaining(-1000)).toBe('expired');
  });

  it('reports minutes under an hour (floor, min 1)', () => {
    expect(formatRemaining(42 * 60_000)).toBe('42 min');
    expect(formatRemaining(30_000)).toBe('1 min');
  });

  it('reports hours under a day', () => {
    expect(formatRemaining(3 * 3_600_000)).toBe('3 hr');
  });

  it('reports days, pluralizing correctly', () => {
    expect(formatRemaining(24 * 3_600_000)).toBe('1 day');
    expect(formatRemaining(6 * 24 * 3_600_000)).toBe('6 days');
  });
});
