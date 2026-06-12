/**
 * Card-consumption inference — the natural-over-jack rule.
 *
 * For a placement the consumed card is determined two ways:
 *  - Explicit (tap mode): the named card is honored as sent — a deliberate
 *    two-eyed jack play is allowed even while holding the natural card. The card
 *    must still be in hand.
 *  - Inferred (drag mode): prefer the natural matching card; fall back to a
 *    two-eyed (wild) jack only when no natural card is held. A one-eyed jack is
 *    never spent implicitly (it is a removal card, not a placement card).
 */

import { boardCellsFor } from './board-map.ts';
import { isTwoEyedJack } from './deck.ts';
import type { Card, Placement } from './types.ts';

function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

/** True when a (non-jack) card's natural board cell includes `position`. */
export function cardMatchesPosition(card: Card, position: string): boolean {
  return boardCellsFor(card.rank, card.suit).includes(position);
}

/**
 * The card a placement would consume.
 *  - Explicit card → returned as-is (throws if not in hand).
 *  - Inferred → natural card if held, else a two-eyed jack if held, else
 *    `undefined` (no legal way to place here from this hand).
 */
export function wouldConsumeCard(
  placement: Placement,
  hand: readonly Card[],
): Card | undefined {
  if (placement.card) {
    const inHand = hand.find((c) => sameCard(c, placement.card!));
    if (!inHand) {
      throw new Error('explicit card is not in hand');
    }
    return inHand;
  }

  const natural = hand.find((c) => cardMatchesPosition(c, placement.position));
  if (natural) return natural;

  const wild = hand.find((c) => isTwoEyedJack(c));
  return wild;
}
