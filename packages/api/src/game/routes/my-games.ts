import { desc, eq, inArray } from 'drizzle-orm';

import { user } from '../../db/schema/auth.ts';
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
  round: number;
  expiresAt: string | null;
  finishedAt: string | null;
  winnerTeam: number | null;
  endReason: string | null;
  mySeat: number;
  /** The session user's team in this game (for W/L derivation). */
  myTeam: number;
  /** Display names of the other players (opponents/teammates), seat order. */
  opponents: string[];
  /** True when the user's team won (finished games only). */
  won: boolean;
}

/**
 * `game.myGames()` — the dashboard query (authed).
 *
 * Returns:
 *  - `resumables`: the session user's `frozen` / `saved` games (with expiry) to
 *    rejoin/resume;
 *  - `recents`: their most recent `finished` games (results strip).
 * Both are scoped to games where the user holds a seat. Each card carries the
 * user's seat+team, the other players' display names (for "vs …" labels), the
 * round, and a derived `won` flag — never any hands/deck.
 */
export const myGamesRoute = authedProcedure.query(async ({ ctx }) => {
  // The user's seats → the games they participate in (+ their team).
  const mySeats = await ctx.db
    .select({
      gameId: gamePlayers.gameId,
      seat: gamePlayers.seat,
      team: gamePlayers.team,
    })
    .from(gamePlayers)
    .where(eq(gamePlayers.userId, ctx.user.id));

  const mineByGame = new Map(
    mySeats.map((s) => [s.gameId, { seat: s.seat, team: s.team }]),
  );
  const gameIds = [...mineByGame.keys()];
  if (gameIds.length === 0) return { resumables: [], recents: [] };

  const rows = await ctx.db
    .select()
    .from(games)
    .where(inArray(games.id, gameIds))
    .orderBy(desc(games.updatedAt));

  // All players across these games, for opponent display names. Guests carry
  // their own name; registered players join `user`. No emails — names only.
  const allPlayers = await ctx.db
    .select({
      gameId: gamePlayers.gameId,
      seat: gamePlayers.seat,
      userId: gamePlayers.userId,
      guestName: gamePlayers.guestName,
      userName: user.name,
    })
    .from(gamePlayers)
    .leftJoin(user, eq(gamePlayers.userId, user.id))
    .where(inArray(gamePlayers.gameId, gameIds))
    .orderBy(gamePlayers.seat);

  const opponentsByGame = new Map<string, string[]>();
  for (const p of allPlayers) {
    const mine = mineByGame.get(p.gameId);
    if (mine && p.seat === mine.seat) continue; // skip the user's own seat
    const name = p.guestName ?? p.userName ?? 'Player';
    const list = opponentsByGame.get(p.gameId) ?? [];
    list.push(name);
    opponentsByGame.set(p.gameId, list);
  }

  const toCard = (g: (typeof rows)[number]): MyGameCard => {
    const mine = mineByGame.get(g.id) ?? { seat: 0, team: 1 };
    return {
      gameId: g.id,
      inviteCode: g.inviteCode,
      status: g.status,
      playerCount: g.playerCount,
      mode: g.mode,
      local: g.local,
      round: g.round,
      expiresAt: g.expiresAt?.toISOString() ?? null,
      finishedAt: g.finishedAt?.toISOString() ?? null,
      winnerTeam: g.winnerTeam ?? null,
      endReason: g.endReason ?? null,
      mySeat: mine.seat,
      myTeam: mine.team,
      opponents: opponentsByGame.get(g.id) ?? [],
      won: g.winnerTeam !== null && g.winnerTeam === mine.team,
    };
  };

  const resumables = rows
    .filter((g) => g.status === 'frozen' || g.status === 'saved')
    .map(toCard);
  const recents = rows
    .filter((g) => g.status === 'finished')
    .slice(0, 10)
    .map(toCard);

  return { resumables, recents };
});
