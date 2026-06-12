import type { Card } from '@sequence/game-logic';
import { z } from 'zod';

import { gamePlayerProcedure } from '../../trpc.ts';
import { executeTurnIn, toTrpcError } from '../move-engine.ts';

const cardSchema = z.object({
  rank: z.enum([
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
  ]),
  suit: z.enum(['C', 'D', 'H', 'S']),
});

/**
 * `game.turnInDeadCard(gameId, version, card)` — hard-mode manual dead-card swap.
 *
 * The engine validates the card is genuinely dead for the acting seat, swaps it
 * for a fresh draw, and the turn CONTINUES (no advance) — so the player still
 * makes their move this turn. Reuses the move-engine transaction path; a card
 * that isn't actually dead (or a second turn-in this turn) → `not-a-dead-card`
 * → BAD_REQUEST.
 */
export const turnInDeadCardRoute = gamePlayerProcedure
  .input(
    z.object({
      gameId: z.string().uuid(),
      version: z.number().int().nonnegative(),
      card: cardSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    try {
      const { version, events } = await executeTurnIn(
        ctx.db,
        input.gameId,
        ctx.seat.seat,
        input.card as Card,
        input.version,
      );
      return { version, events };
    } catch (err) {
      throw toTrpcError(err);
    }
  });
