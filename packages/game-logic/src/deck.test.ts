import { describe, expect, it } from 'vitest';

import {
  buildDeck,
  createSeededRng,
  isOneEyedJack,
  isTwoEyedJack,
  shuffle,
} from './deck.ts';
import type { Card } from './types.ts';

function key(card: Card): string {
  return `${card.rank}${card.suit}`;
}

describe('buildDeck', () => {
  it('builds 104 cards (two standard 52-card decks)', () => {
    expect(buildDeck()).toHaveLength(104);
  });

  it('contains each of the 52 faces exactly twice', () => {
    const counts = new Map<string, number>();
    for (const card of buildDeck()) {
      counts.set(key(card), (counts.get(key(card)) ?? 0) + 1);
    }
    expect(counts.size).toBe(52);
    for (const [, count] of counts) {
      expect(count).toBe(2);
    }
  });

  it('contains exactly 4 one-eyed jacks (J of spades / hearts)', () => {
    const oneEyed = buildDeck().filter(isOneEyedJack);
    expect(oneEyed).toHaveLength(4);
    for (const j of oneEyed) {
      expect(j.rank).toBe('J');
      expect(['S', 'H']).toContain(j.suit);
    }
  });

  it('contains exactly 4 two-eyed jacks (J of diamonds / clubs)', () => {
    const twoEyed = buildDeck().filter(isTwoEyedJack);
    expect(twoEyed).toHaveLength(4);
    for (const j of twoEyed) {
      expect(j.rank).toBe('J');
      expect(['D', 'C']).toContain(j.suit);
    }
  });
});

describe('isOneEyedJack / isTwoEyedJack', () => {
  it('classifies jacks by suit and rejects non-jacks', () => {
    expect(isOneEyedJack({ rank: 'J', suit: 'S' })).toBe(true);
    expect(isOneEyedJack({ rank: 'J', suit: 'H' })).toBe(true);
    expect(isOneEyedJack({ rank: 'J', suit: 'D' })).toBe(false);
    expect(isTwoEyedJack({ rank: 'J', suit: 'D' })).toBe(true);
    expect(isTwoEyedJack({ rank: 'J', suit: 'C' })).toBe(true);
    expect(isTwoEyedJack({ rank: 'J', suit: 'S' })).toBe(false);
    expect(isOneEyedJack({ rank: 'A', suit: 'S' })).toBe(false);
    expect(isTwoEyedJack({ rank: 'A', suit: 'C' })).toBe(false);
  });
});

describe('shuffle with seeded rng', () => {
  it('is deterministic: same seed yields the same order', () => {
    const a = shuffle(buildDeck(), createSeededRng(42));
    const b = shuffle(buildDeck(), createSeededRng(42));
    expect(a.map(key)).toEqual(b.map(key));
  });

  it('produces different orders for different seeds', () => {
    const a = shuffle(buildDeck(), createSeededRng(1));
    const b = shuffle(buildDeck(), createSeededRng(2));
    expect(a.map(key)).not.toEqual(b.map(key));
  });

  it('does not mutate the input array and preserves the multiset', () => {
    const deck = buildDeck();
    const before = deck.map(key);
    const shuffled = shuffle(deck, createSeededRng(7));
    expect(deck.map(key)).toEqual(before);
    expect(shuffled.map(key).toSorted()).toEqual(before.toSorted());
  });
});

describe('createSeededRng', () => {
  it('returns floats in [0, 1)', () => {
    const rng = createSeededRng(123);
    for (let i = 0; i < 1000; i++) {
      const n = rng.next();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});
