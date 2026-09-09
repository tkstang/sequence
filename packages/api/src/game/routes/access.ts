import { z } from 'zod';

import { gamePlayerProcedure } from '../../trpc.ts';

/**
 * `game.access(gameId)` — harmless HTTP seat-access check.
 *
 * Used by native clients to confirm a game-scoped credential before destructive
 * local guest cleanup. The existing `gamePlayerProcedure` owns all authorization
 * semantics; this route only returns the resolved public seat metadata.
 */
export const accessRoute = gamePlayerProcedure
  .input(z.object({ gameId: z.string().uuid() }))
  .query(({ ctx }) => ({
    gameId: ctx.seat.gameId,
    seat: ctx.seat.seat,
    team: ctx.seat.team,
    local: ctx.seat.isLocal,
  }));
