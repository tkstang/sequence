import { and, desc, eq, lt } from 'drizzle-orm';
import { z } from 'zod';

import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { authedProcedure } from '../../trpc.ts';

/** One completed-game row in the history list (FR14). */
export interface HistoryGame {
  gameId: string;
  finishedAt: string | null;
  playerCount: number;
  mode: string;
  local: boolean;
  winnerTeam: number | null;
  endReason: string | null;
  myTeam: number;
  won: boolean;
}

/**
 * `history.myGames(cursor?)` — the session user's FINISHED games, newest first,
 * cursor-paginated by `finished_at`. Local games (FR16) ARE listed here (flagged
 * `local: true`) — they're excluded only from aggregates/head-to-head. The
 * cursor is the prior page's last `finished_at` ISO string.
 */
export const historyMyGamesRoute = authedProcedure
  .input(
    z
      .object({
        cursor: z.string().datetime().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
      .default({ limit: 20 }),
  )
  .query(async ({ ctx, input }) => {
    const conditions = [
      eq(gamePlayers.userId, ctx.user.id),
      eq(games.status, 'finished'),
    ];
    if (input.cursor) {
      conditions.push(lt(games.finishedAt, new Date(input.cursor)));
    }

    const rows = await ctx.db
      .select({
        gameId: games.id,
        finishedAt: games.finishedAt,
        playerCount: games.playerCount,
        mode: games.mode,
        local: games.local,
        winnerTeam: games.winnerTeam,
        endReason: games.endReason,
        myTeam: gamePlayers.team,
      })
      .from(gamePlayers)
      .innerJoin(games, eq(gamePlayers.gameId, games.id))
      .where(and(...conditions))
      .orderBy(desc(games.finishedAt))
      .limit(input.limit + 1);

    const hasMore = rows.length > input.limit;
    const page = rows.slice(0, input.limit);
    const items: HistoryGame[] = page.map((r) => ({
      gameId: r.gameId,
      finishedAt: r.finishedAt?.toISOString() ?? null,
      playerCount: r.playerCount,
      mode: r.mode,
      local: r.local,
      winnerTeam: r.winnerTeam ?? null,
      endReason: r.endReason ?? null,
      myTeam: r.myTeam,
      won: r.winnerTeam !== null && r.winnerTeam === r.myTeam,
    }));

    const nextCursor =
      hasMore && page.length > 0
        ? (page[page.length - 1]!.finishedAt?.toISOString() ?? null)
        : null;

    return { items, nextCursor };
  });
