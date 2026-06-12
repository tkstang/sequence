import { describe, expect, it } from 'vitest';

import { boardCellsFor } from './board-map.ts';
import { cardMatchesPosition, wouldConsumeCard } from './card-consumption.ts';
import type { Card, Placement } from './types.ts';

const ACE_CLUBS: Card = { rank: 'A', suit: 'C' };
const KING_HEARTS: Card = { rank: 'K', suit: 'H' };
const ONE_EYED: Card = { rank: 'J', suit: 'S' };
const TWO_EYED: Card = { rank: 'J', suit: 'D' };

const ACE_CLUBS_POS = boardCellsFor('A', 'C')[0]!;
const KING_HEARTS_POS = boardCellsFor('K', 'H')[0]!;

function place(position: string, card?: Card): Placement {
  return card ? { position, card } : { position };
}

describe('cardMatchesPosition', () => {
  it('matches the natural card to its board cell', () => {
    expect(cardMatchesPosition(ACE_CLUBS, ACE_CLUBS_POS)).toBe(true);
  });

  it('rejects a card whose face is elsewhere', () => {
    expect(cardMatchesPosition(ACE_CLUBS, KING_HEARTS_POS)).toBe(false);
  });

  it('never matches a jack to a board cell', () => {
    expect(cardMatchesPosition(ONE_EYED, ACE_CLUBS_POS)).toBe(false);
    expect(cardMatchesPosition(TWO_EYED, ACE_CLUBS_POS)).toBe(false);
  });
});

describe('wouldConsumeCard — explicit (tap mode)', () => {
  it('honors the named card as sent', () => {
    const hand = [ACE_CLUBS, TWO_EYED];
    // Player deliberately plays the two-eyed jack on the Ace-of-Clubs cell even
    // while holding the natural card.
    expect(wouldConsumeCard(place(ACE_CLUBS_POS, TWO_EYED), hand)).toEqual(
      TWO_EYED,
    );
  });

  it('throws when the explicit card is not in hand', () => {
    expect(() =>
      wouldConsumeCard(place(ACE_CLUBS_POS, ACE_CLUBS), [KING_HEARTS]),
    ).toThrow();
  });
});

describe('wouldConsumeCard — inferred (drag mode, natural-over-jack)', () => {
  it('consumes the natural card when held', () => {
    const hand = [ACE_CLUBS, TWO_EYED];
    expect(wouldConsumeCard(place(ACE_CLUBS_POS), hand)).toEqual(ACE_CLUBS);
  });

  it('falls back to a two-eyed jack only when no natural card is held', () => {
    const hand = [KING_HEARTS, TWO_EYED];
    // No Ace of Clubs in hand → the wild jack is the only way to place here.
    expect(wouldConsumeCard(place(ACE_CLUBS_POS), hand)).toEqual(TWO_EYED);
  });

  it('never spends a one-eyed jack implicitly', () => {
    const hand = [KING_HEARTS, ONE_EYED];
    // No natural card, no two-eyed jack → nothing legal to consume.
    expect(wouldConsumeCard(place(ACE_CLUBS_POS), hand)).toBeUndefined();
  });

  it('returns undefined when nothing can place here', () => {
    expect(
      wouldConsumeCard(place(ACE_CLUBS_POS), [KING_HEARTS]),
    ).toBeUndefined();
  });
});
