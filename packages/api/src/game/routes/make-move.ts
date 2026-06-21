import type { Move } from '@sequence/game-logic';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { publicProcedure, resolveSeatFromLoadedGame } from '../../trpc.ts';
import { executeMoveFromLoadedState, toTrpcError } from '../move-engine.ts';
import { loadGameStateWithPlayers } from '../state-mapping.ts';

/** zod schema for a `Card` (jacks are valid card values too). */
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
 * Move shape (design §API): a discriminated union mirroring game-logic.
 *  - `{ type:'place', card?, position }` — `card` optional: tap mode sends the
 *    explicitly selected card (a deliberate jack is honored); drag mode omits it
 *    and the server infers the consumed card via natural-over-jack.
 *  - `{ type:'removeChip', position }` — one-eyed jack removal.
 * Mode never changes the procedure or message shape.
 */
const moveSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('place'),
    position: z.string().min(1),
    card: cardSchema.optional(),
  }),
  z.object({
    type: z.literal('removeChip'),
    position: z.string().min(1),
    card: cardSchema.optional(),
  }),
]);

/**
 * `game.makeMove(gameId, version, move)` — the hot path.
 *
 * Delegates to the move engine: load → reduce (game-logic) → persist (version
 * guard) → append events → broadcast. The authenticated seat is stamped onto
 * the move by the engine (p02-m6), so the rules engine enforces turn ownership
 * itself. Errors map to the contract: rule violations → BAD_REQUEST with a
 * typed `ruleViolation`; stale/raced version → CONFLICT.
 */
export const makeMoveRoute = publicProcedure
  .input(
    z.object({
      gameId: z.string().uuid(),
      version: z.number().int().nonnegative(),
      move: moveSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const loaded = await loadGameStateWithPlayers(ctx.db, input.gameId);
    if (!loaded) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    const seat = resolveSeatFromLoadedGame(ctx, loaded);
    if (!seat) {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    try {
      const { version, events } = await executeMoveFromLoadedState(
        ctx.db,
        loaded,
        seat.seat,
        input.move as Move,
        input.version,
      );
      return { version, events };
    } catch (err) {
      throw toTrpcError(err);
    }
  });
