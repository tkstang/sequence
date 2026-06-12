/**
 * Deck construction and a seedable RNG.
 *
 * Sequence uses two standard 52-card decks (104 cards). Jacks never appear on
 * the board: two-eyed jacks (♦ ♣) are wild placements; one-eyed jacks (♠ ♥)
 * remove an opponent chip.
 */

import type { Card, Rank, Suit } from './types.ts';

const RANKS: readonly Rank[] = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'T',
  'J',
  'Q',
  'K',
];

const SUITS: readonly Suit[] = ['C', 'D', 'H', 'S'];

/** Build two full 52-card decks → 104 cards. */
export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (let copy = 0; copy < 2; copy++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ rank, suit });
      }
    }
  }
  return deck;
}

/** A one-eyed jack (J♠ / J♥) removes an opponent's unlocked chip. */
export function isOneEyedJack(card: Card): boolean {
  return card.rank === 'J' && (card.suit === 'S' || card.suit === 'H');
}

/** A two-eyed jack (J♦ / J♣) is wild — places a chip on any open cell. */
export function isTwoEyedJack(card: Card): boolean {
  return card.rank === 'J' && (card.suit === 'D' || card.suit === 'C');
}

// ---------------------------------------------------------------------------
// Seedable RNG
// ---------------------------------------------------------------------------

/** A deterministic pseudo-random source. `next()` returns a float in [0, 1). */
export interface Rng {
  next(): number;
}

/**
 * A small, deterministic RNG (mulberry32). Good enough for shuffling and
 * crucially reproducible from a seed — every test scenario is constructible.
 */
export function createSeededRng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next(): number {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/**
 * Fisher–Yates shuffle using the injected RNG. Pure: returns a new array and
 * does not mutate the input.
 */
export function shuffle<T>(cards: readonly T[], rng: Rng): T[] {
  const out = [...cards];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}
