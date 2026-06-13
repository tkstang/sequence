import { and, eq, sql } from 'drizzle-orm';

import { gameEvents } from '../../db/schema/game-events.ts';
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
 * Result semantics:
 *  - `winner_team` set → win for that team, loss for every other team
 *    (a normal finish or a 2-team concede).
 *  - `winner_team` null → a no-winner FFA concede (3+ teams). Per
 *    rules-and-flows ("their team takes the recorded loss"), ONLY the conceding
 *    team takes the loss; the other teams record neither win nor loss and are
 *    excluded from the total. The conceding team is read from the persisted
 *    `GameConceded` event (`payload.team`).
 *
 * Local games (FR16) are excluded. SQL aggregation at query time, no stats
 * table (design).
 */
export const myRecordRoute = authedProcedure.query(
  async ({ ctx }): Promise<MyRecord> => {
    const rows = await ctx.db
      .select({
        team: gamePlayers.team,
        winnerTeam: games.winnerTeam,
        // The conceding team for a no-winner FFA concede (null otherwise).
        concededTeam: sql<
          number | null
        >`(${gameEvents.payload} ->> 'team')::int`,
      })
      .from(gamePlayers)
      .innerJoin(games, eq(gamePlayers.gameId, games.id))
      .leftJoin(
        gameEvents,
        and(
          eq(gameEvents.gameId, games.id),
          eq(gameEvents.type, 'GameConceded'),
        ),
      )
      .where(
        and(
          eq(gamePlayers.userId, ctx.user.id),
          eq(games.status, 'finished'),
          eq(games.local, false),
        ),
      );

    let wins = 0;
    let losses = 0;
    let total = 0;
    for (const r of rows) {
      if (r.winnerTeam !== null) {
        // Decisive result: win for the winning team, loss for everyone else.
        if (r.winnerTeam === r.team) wins += 1;
        else losses += 1;
        total += 1;
      } else if (r.concededTeam !== null && r.concededTeam === r.team) {
        // No-winner FFA concede: only the conceding team takes the loss.
        losses += 1;
        total += 1;
      }
      // Non-conceding teams in a no-winner concede record neither (skipped).
    }
    return { wins, losses, total };
  },
);
