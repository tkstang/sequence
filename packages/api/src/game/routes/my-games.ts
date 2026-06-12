import { desc, eq, inArray } from 'drizzle-orm';

import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { authedProcedure } from '../../trpc.ts';

/** A dashboard game card (resumable or recent). No private hand data. */
export interface MyGameCard {
  gameId: string;
  inviteCode: string;
  status: string;
  playerCount: number;
  mode: string;
  local: boolean;
  expiresAt: string | null;
  finishedAt: string | null;
  winnerTeam: number | null;
  endReason: string | null;
  mySeat: number;
}

/**
 * `game.myGames()` — the dashboard query (authed).
 *
 * Returns:
 *  - `resumables`: the session user's `frozen` / `saved` games (with expiry) to
 *    rejoin/resume;
 *  - `recents`: their most recent `finished` games (results strip).
 * Both are scoped to games where the user holds a seat. No hands/deck.
 */
export const myGamesRoute = authedProcedure.query(async ({ ctx }) => {
  // The user's seats → the games they participate in.
  const mySeats = await ctx.db
    .select({ gameId: gamePlayers.gameId, seat: gamePlayers.seat })
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, ctx.user.id));

  const seatByGame = new Map(mySeats.map((s) => [s.gameId, s.seat]));
  const gameIds = [...seatByGame.keys()];
  if (gameIds.length === 0) return { resumables: [], recents: [] };

  const rows = await ctx.db
    .select()
    .from(games)
    .where(inArray(games.id, gameIds))
    .orderBy(desc(games.updatedAt));

  const toCard = (g: (typeof rows)[number]): MyGameCard => ({
    gameId: g.id,
    inviteCode: g.inviteCode,
    status: g.status,
    playerCount: g.playerCount,
    mode: g.mode,
    local: g.local,
    expiresAt: g.expiresAt?.toISOString() ?? null,
    finishedAt: g.finishedAt?.toISOString() ?? null,
    winnerTeam: g.winnerTeam ?? null,
    endReason: g.endReason ?? null,
    mySeat: seatByGame.get(g.id) ?? 0,
  });

  const resumables = rows
    .filter((g) => g.status === 'frozen' || g.status === 'saved')
    .map(toCard);
  const recents = rows
    .filter((g) => g.status === 'finished')
    .slice(0, 10)
    .map(toCard);

  return { resumables, recents };
});
