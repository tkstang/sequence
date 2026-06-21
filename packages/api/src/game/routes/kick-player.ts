import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { rooms } from '../../shared/realtime/rooms.ts';
import { gamePlayerProcedure } from '../../trpc.ts';
import { publishAppendedEvents } from '../publish-events.ts';
import { appendEvents } from '../state-mapping.ts';
import { callerIsCreator } from './set-team.ts';

/**
 * `game.kick(gameId, targetSeat)` — creator-only lobby control.
 *
 * Removes a seated player (frees their seat) while in the lobby. The creator
 * cannot kick themselves. Non-creator → FORBIDDEN. Emits `PlayerKicked`.
 */
export const kickPlayerRoute = gamePlayerProcedure
  .input(
    z.object({
      gameId: z.string().uuid(),
      targetSeat: z.number().int().nonnegative(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const result = await ctx.db.transaction(async (tx) => {
      const [game] = await tx
        .select()
        .from(games)
        .where(eq(games.id, input.gameId))
        .limit(1);
      if (!game) throw new TRPCError({ code: 'NOT_FOUND' });
      if (game.status !== 'lobby') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'cannot kick after start',
        });
      }

      const callerSeat = ctx.seat.seat;
      if (!(await callerIsCreator(tx, input.gameId, callerSeat))) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      if (input.targetSeat === callerSeat) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'the creator cannot kick themselves',
        });
      }

      const deleted = await tx
        .delete(gamePlayers)
        .where(
          and(
            eq(gamePlayers.gameId, input.gameId),
            eq(gamePlayers.seat, input.targetSeat),
          ),
        )
        .returning({ seat: gamePlayers.seat });
      if (deleted.length === 0) throw new TRPCError({ code: 'NOT_FOUND' });

      const appended = await appendEvents(tx, input.gameId, [
        { type: 'PlayerKicked', seat: input.targetSeat },
      ]);

      return { kickedSeat: input.targetSeat, appended };
    });
    publishAppendedEvents(rooms, input.gameId, result.appended);
    return { kickedSeat: result.kickedSeat };
  });
