import { aliasedTable, and, eq, isNotNull, ne, sql } from 'drizzle-orm';

import { user } from '../../db/schema/auth.ts';
import { gameEvents } from '../../db/schema/game-events.ts';
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
 *
 * Result scoring matches `myRecord` (conceder-only-loss semantics):
 *  - `winner_team` set → win when it's my team, loss otherwise (a normal finish
 *    or a 2-team concede where the winner is recorded);
 *  - `winner_team` null → a no-winner FFA concede (3+ teams). Only the conceding
 *    team takes a loss. So this counts against me (a loss vs the opponent) ONLY
 *    when MY team conceded; otherwise the game is NOT a decided head-to-head
 *    result and is excluded — consistent with `myRecord`, where non-conceding
 *    teams record neither win nor loss. The conceding team is read from the
 *    persisted `GameConceded` event (`payload.team`).
 *
 * Aggregated per opponent in memory (friend-group scale; no stats table).
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
        // The conceding team for a no-winner FFA concede (null otherwise).
        concededTeam: sql<
          number | null
        >`(${gameEvents.payload} ->> 'team')::int`,
      })
      .from(me)
      .innerJoin(games, eq(me.gameId, games.id))
      .innerJoin(
        them,
        and(eq(them.gameId, me.gameId), ne(them.userId, me.userId)),
      )
      .innerJoin(user, eq(them.userId, user.id))
      .leftJoin(
        gameEvents,
        and(
          eq(gameEvents.gameId, games.id),
          eq(gameEvents.type, 'GameConceded'),
        ),
      )
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

      let result: 'win' | 'loss' | 'skip';
      if (r.winnerTeam !== null) {
        // Decisive result: win for the winning team, loss for everyone else.
        result = r.winnerTeam === r.myTeam ? 'win' : 'loss';
      } else if (r.concededTeam !== null && r.concededTeam === r.myTeam) {
        // No-winner FFA concede: only the conceding (my) team takes the loss.
        result = 'loss';
      } else {
        // No-winner concede where I did not concede → not a decided H2H result.
        result = 'skip';
      }
      if (result === 'skip') continue;

      const entry = byOpponent.get(r.opponentId) ?? {
        opponentId: r.opponentId,
        opponentName: r.opponentName ?? 'Player',
        wins: 0,
        losses: 0,
        games: 0,
      };
      entry.games += 1;
      if (result === 'win') entry.wins += 1;
      else entry.losses += 1;
      byOpponent.set(r.opponentId, entry);
    }

    return [...byOpponent.values()].sort((a, b) => b.games - a.games);
  },
);
