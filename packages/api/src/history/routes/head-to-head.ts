import { aliasedTable, and, eq, isNotNull, ne } from 'drizzle-orm';

import { user } from '../../db/schema/auth.ts';
import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { authedProcedure } from '../../trpc.ts';

/** One opponent's head-to-head record from the session user's perspective. */
export interface HeadToHead {
  opponentId: string;
  opponentName: string;
  wins: number;
  losses: number;
  games: number;
}

/**
 * `history.headToHead()` — per-opponent records (FR14).
 *
 * A self-join on shared FINISHED, non-local games where BOTH seats have a
 * `user_id` (registered users only — guests and local opponents are excluded).
 * For each shared game, the result is scored from the session user's team vs the
 * winner. Aggregated per opponent in memory (friend-group scale; no stats
 * table per design).
 */
export const headToHeadRoute = authedProcedure.query(
  async ({ ctx }): Promise<HeadToHead[]> => {
    const me = gamePlayers;
    const them = aliasedTable(gamePlayers, 'them');

    const rows = await ctx.db
      .select({
        opponentId: them.userId,
        opponentName: user.name,
        myTeam: me.team,
        winnerTeam: games.winnerTeam,
      })
      .from(me)
      .innerJoin(games, eq(me.gameId, games.id))
      .innerJoin(
        them,
        and(eq(them.gameId, me.gameId), ne(them.userId, me.userId)),
      )
      .innerJoin(user, eq(them.userId, user.id))
      .where(
        and(
          eq(me.userId, ctx.user.id),
          eq(games.status, 'finished'),
          eq(games.local, false),
          isNotNull(them.userId),
        ),
      );

    const byOpponent = new Map<string, HeadToHead>();
    for (const r of rows) {
      if (!r.opponentId) continue;
      const won = r.winnerTeam !== null && r.winnerTeam === r.myTeam;
      const entry = byOpponent.get(r.opponentId) ?? {
        opponentId: r.opponentId,
        opponentName: r.opponentName ?? 'Player',
        wins: 0,
        losses: 0,
        games: 0,
      };
      entry.games += 1;
      if (won) entry.wins += 1;
      else entry.losses += 1;
      byOpponent.set(r.opponentId, entry);
    }

    return [...byOpponent.values()].sort((a, b) => b.games - a.games);
  },
);
