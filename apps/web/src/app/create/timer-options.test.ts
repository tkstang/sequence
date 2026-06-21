import { describe, expect, it } from 'vitest';

import { timerOptions } from './timer-options.ts';

describe('timerOptions', () => {
  it('starts with an Off option (null seconds)', () => {
    expect(timerOptions()[0]).toEqual({ seconds: null, label: 'Off' });
  });

  it('uses 30s steps up to 3:00, then 60s steps', () => {
    const secs = timerOptions(300)
      .map((o) => o.seconds)
      .filter((s): s is number => s !== null);
    // 30..180 by 30
    expect(secs.slice(0, 6)).toEqual([30, 60, 90, 120, 150, 180]);
    // then 240, 300 (60s steps)
    expect(secs.slice(6)).toEqual([240, 300]);
  });

  it('formats clock labels', () => {
    const bySeconds = new Map(
      timerOptions(300).map((o) => [o.seconds, o.label]),
    );
    expect(bySeconds.get(30)).toBe('0:30');
    expect(bySeconds.get(90)).toBe('1:30');
    expect(bySeconds.get(180)).toBe('3:00');
    expect(bySeconds.get(300)).toBe('5:00');
  });

  it('only emits valid steps (no 210, no 200)', () => {
    const secs = timerOptions(600).map((o) => o.seconds);
    expect(secs).not.toContain(210);
    expect(secs).not.toContain(200);
  });
});
