/**
 * Client display helpers, backed by the same rule functions the reducer uses —
 * so a client preview can never disagree with the server's verdict.
 *
 * `validPlacements` maps each hand card to the cells it could legally target:
 *  - natural card → its open board cells
 *  - two-eyed jack → every open cell
 *  - one-eyed jack → removable opponent (unlocked) chips
 * Dead cards are excluded (they have no legal placement this turn).
 */

import { ALL_POSITIONS, boardCellsFor } from './board-map.ts';
import { isDeadCard } from './dead-cards.ts';
import { isOneEyedJack, isTwoEyedJack } from './deck.ts';
import { canPlaceWild, oneEyedTargets } from './jack-rules.ts';
import type { Board, Card, Position, Team } from './types.ts';

/**
 * The legal target cells for each card in `hand`, given the current board and
 * the acting `team`. Cards with no legal target (and dead cards) are omitted.
 *
 * `team` is required: one-eyed jack targets are team-dependent (opponent chips
 * only), so a default would mislabel another team's own chips as removable and
 * disagree with the reducer. Callers always know their seat's team.
 */
export function validPlacements(
  hand: readonly Card[],
  board: Board,
  team: Team,
): Map<Card, Position[]> {
  const result = new Map<Card, Position[]>();

  for (const card of hand) {
    if (isOneEyedJack(card)) {
      const targets = oneEyedTargets(board, team);
      if (targets.length > 0) result.set(card, targets);
      continue;
    }

    if (isTwoEyedJack(card)) {
      const open = ALL_POSITIONS.filter((p) => canPlaceWild(board, p).ok);
      if (open.length > 0) result.set(card, open);
      continue;
    }

    // Natural card: skip dead cards; otherwise its open board cells.
    if (isDeadCard(card, board)) continue;
    const open = boardCellsFor(card.rank, card.suit).filter(
      (p) => board.get(p)?.chip === undefined,
    );
    if (open.length > 0) result.set(card, [...open]);
  }

  return result;
}
