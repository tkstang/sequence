import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { rooms } from '../../shared/realtime/rooms.ts';
import { gamePlayerProcedure } from '../../trpc.ts';
import { publishAppendedEvents } from '../publish-events.ts';
import { appendEvents, type Tx } from '../state-mapping.ts';

/**
 * `game.setTeam(gameId, targetSeat, team)` — lobby self-sort + creator control.
 *
 * A player may set **their own** team. The creator may also move **anyone**.
 * A non-creator moving another seat is FORBIDDEN. Only in the lobby. Emits
 * `TeamChanged`.
 */
export const setTeamRoute = gamePlayerProcedure
  .input(
    z.object({
      gameId: z.string().uuid(),
      targetSeat: z.number().int().nonnegative(),
      team: z.union([z.literal(1), z.literal(2), z.literal(3)]),
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
          message: 'teams are immutable after start',
        });
      }

      const callerSeat = ctx.seat.seat;
      const isCreator = await callerIsCreator(tx, input.gameId, callerSeat);
      // Self-sort is always allowed; moving another seat requires creator.
      if (input.targetSeat !== callerSeat && !isCreator) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const [target] = await tx
        .select()
        .from(gamePlayers)
        .where(
          and(
            eq(gamePlayers.gameId, input.gameId),
            eq(gamePlayers.seat, input.targetSeat),
          ),
        )
        .limit(1);
      if (!target) throw new TRPCError({ code: 'NOT_FOUND' });

      await tx
        .update(gamePlayers)
        .set({ team: input.team })
        .where(
          and(
            eq(gamePlayers.gameId, input.gameId),
            eq(gamePlayers.seat, input.targetSeat),
          ),
        );

      const appended = await appendEvents(tx, input.gameId, [
        { type: 'TeamChanged', seat: input.targetSeat, team: input.team },
      ]);

      return { seat: input.targetSeat, team: input.team, appended };
    });
    publishAppendedEvents(rooms, input.gameId, result.appended);
    return { seat: result.seat, team: result.team };
  });

/** True when the caller's seat is the game's creator. */
export async function callerIsCreator(
  tx: Tx,
  gameId: string,
  seat: number,
): Promise<boolean> {
  const [row] = await tx
    .select({ isCreator: gamePlayers.isCreator })
    .from(gamePlayers)
    .where(and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.seat, seat)))
    .limit(1);
  return row?.isCreator ?? false;
}
