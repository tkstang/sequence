/**
 * Dead-card handling.
 *
 * A card is "dead" when both of its board cells are already covered, so it can
 * never be played. Status is evaluated per-turn, never flagged permanently — a
 * one-eyed jack can free a cell and resurrect a previously dead card. Jacks are
 * never dead (they are wild / removal cards, not tied to board cells).
 *
 *  - Default mode: at most one dead card is auto-swapped at the start of a
 *    player's turn, emitting a `DeadCardSwapped` event.
 *  - Hard mode: the player must notice and turn the card in themselves
 *    (validated in apply-move, not here).
 */

import { boardCellsFor } from './board-map.ts';
import { drawCard, isOneEyedJack, isTwoEyedJack, type Rng } from './deck.ts';
import type { Board, Card, GameEvent, GameState, Seat } from './types.ts';

/** True when both of the card's board cells are covered by a chip. */
export function isDeadCard(card: Card, board: Board): boolean {
  // Jacks never appear on the board → never dead.
  if (isOneEyedJack(card) || isTwoEyedJack(card)) return false;

  const cells = boardCellsFor(card.rank, card.suit);
  if (cells.length === 0) return false;

  return cells.every((pos) => board.get(pos)?.chip !== undefined);
}

/** The dead cards within a hand, in hand order. */
export function findDeadCards(hand: readonly Card[], board: Board): Card[] {
  return hand.filter((card) => isDeadCard(card, board));
}

export interface SwapResult {
  readonly nextState: GameState;
  readonly events: readonly GameEvent[];
}

/**
 * Auto-swap a single dead card for the seat (default mode). Discards the first
 * dead card to the played pile and draws a replacement (reshuffling the played
 * pile if the deck is empty). No-op (and identity state) when nothing is dead.
 */
export function autoSwapDeadCard(
  state: GameState,
  seat: Seat,
  rng: Rng,
): SwapResult {
  const hand = state.hands[seat] ?? [];
  const deadIndex = hand.findIndex((card) => isDeadCard(card, state.board));
  if (deadIndex === -1) {
    return { nextState: state, events: [] };
  }

  const discarded = hand[deadIndex]!;
  // Remove the dead card, then draw a replacement. The discarded card joins the
  // played pile only after the draw so it cannot be immediately redrawn.
  const handWithout = [
    ...hand.slice(0, deadIndex),
    ...hand.slice(deadIndex + 1),
  ];

  const draw = drawCard(state.deck, state.played, rng);
  const newHand = draw.card ? [...handWithout, draw.card] : handWithout;

  const nextHands = state.hands.map((h, i) => (i === seat ? newHand : h));

  const nextState: GameState = {
    ...state,
    hands: nextHands,
    deck: draw.deck,
    played: [...draw.played, discarded],
  };

  // If no replacement could be drawn, no meaningful swap occurred — but the
  // dead card was still removed; emit the event only when a card was drawn.
  if (!draw.card) {
    return {
      nextState: { ...nextState, played: [...state.played, discarded] },
      events: [],
    };
  }

  const event: GameEvent = {
    type: 'DeadCardSwapped',
    seat,
    discarded,
    drawn: draw.card,
  };

  return { nextState, events: [event] };
}
