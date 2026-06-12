import { and, eq } from 'drizzle-orm';

import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { authedProcedure } from '../../trpc.ts';

/** Aggregate win-loss record (FR14). Local games are excluded from the tally. */
export interface MyRecord {
  wins: number;
  losses: number;
  total: number;
}

/**
 * `history.myRecord()` — the session user's W-L over FINISHED, non-local games.
 *
 * A game is a win when its `winner_team` equals the user's seat team; a loss
 * otherwise (including no-winner FFA concedes). Local games (FR16) are excluded
 * from aggregates. Computed by joining the user's seats to finished games — no
 * materialized stats table (SQL aggregation at query time per design).
 */
export const myRecordRoute = authedProcedure.query(
  async ({ ctx }): Promise<MyRecord> => {
    const rows = await ctx.db
      .select({
        team: gamePlayers.team,
        winnerTeam: games.winnerTeam,
      })
      .from(gamePlayers)
      .innerJoin(games, eq(gamePlayers.gameId, games.id))
      .where(
        and(
          eq(gamePlayers.userId, ctx.user.id),
          eq(games.status, 'finished'),
          eq(games.local, false),
        ),
      );

    let wins = 0;
    let losses = 0;
    for (const r of rows) {
      if (r.winnerTeam !== null && r.winnerTeam === r.team) wins += 1;
      else losses += 1;
    }
    return { wins, losses, total: rows.length };
  },
);
