import type { Position } from '@sequence/game-logic';
import { z } from 'zod';

import { gamePlayerProcedure } from '../../trpc.ts';
import { executeChoice, toTrpcError } from '../move-engine.ts';

/**
 * `game.chooseSequenceCells(gameId, version, cells)` — resolve a pending >5-run
 * lock (design §API).
 *
 * Only the placer may resolve (the engine checks `actorSeat === pending.seat`,
 * stamped from the authenticated seat). The chosen five cells must form a
 * straight window including the just-placed chip; an invalid set is rejected
 * (`invalid-sequence-choice` → BAD_REQUEST). A placement that produced multiple
 * >5 runs freezes them sequentially: resolving one may emit a fresh
 * `PendingChoice` for the next (the turn stays frozen until all are resolved).
 * Reuses the move-engine transaction path.
 */
export const chooseSequenceCellsRoute = gamePlayerProcedure
  .input(
    z.object({
      gameId: z.string().uuid(),
      version: z.number().int().nonnegative(),
      cells: z.array(z.string().min(1)).length(5),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    try {
      const { version, events } = await executeChoice(
        ctx.db,
        input.gameId,
        ctx.seat.seat,
        input.cells as Position[],
        input.version,
      );
      return { version, events };
    } catch (err) {
      throw toTrpcError(err);
    }
  });
