import { and, desc, eq, inArray, lt, or } from 'drizzle-orm';
import { z } from 'zod';

import { gameEvents } from '../../db/schema/game-events.ts';
import { gamePlayers } from '../../db/schema/game-players.ts';
import { games } from '../../db/schema/games.ts';
import { authedProcedure } from '../../trpc.ts';

/**
 * The pagination cursor is a TOTAL order over `(finished_at desc, id desc)`.
 * Encoding both halves (ISO timestamp + game id) prevents skipping rows whose
 * `finished_at` ties across a page boundary. Serialized as `"<iso>|<id>"`.
 */
const CURSOR_SEP = '|';

export type HistoryGameResult = 'win' | 'loss' | 'none';

function encodeCursor(finishedAt: Date, id: string): string {
  return `${finishedAt.toISOString()}${CURSOR_SEP}${id}`;
}

function decodeCursor(cursor: string): { finishedAt: Date; id: string } | null {
  const sep = cursor.indexOf(CURSOR_SEP);
  if (sep === -1) return null;
  const iso = cursor.slice(0, sep);
  const id = cursor.slice(sep + 1);
  const finishedAt = new Date(iso);
  if (!id || Number.isNaN(finishedAt.getTime())) return null;
  return { finishedAt, id };
}

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
  result: HistoryGameResult;
}

function concededTeamFromPayload(payload: unknown): number | null {
  if (!payload || typeof payload !== 'object') return null;
  const team = (payload as { team?: unknown }).team;
  return typeof team === 'number' ? team : null;
}

function resultForTeam(opts: {
  winnerTeam: number | null;
  endReason: string | null;
  myTeam: number;
  concededTeam: number | null;
}): HistoryGameResult {
  if (opts.winnerTeam !== null) {
    return opts.winnerTeam === opts.myTeam ? 'win' : 'loss';
  }
  if (opts.endReason === 'concede' && opts.concededTeam === opts.myTeam) {
    return 'loss';
  }
  return 'none';
}

/**
 * `history.myGames(cursor?)` — the session user's FINISHED games, newest first,
 * cursor-paginated by `finished_at`. Local games (FR16) ARE listed here (flagged
 * `local: true`) — they're excluded only from aggregates/head-to-head. The
 * cursor is the prior page's last `(finished_at, id)` keyset, encoded by
 * {@link encodeCursor} (a total order, so finished_at ties never skip a row).
 */
export const historyMyGamesRoute = authedProcedure
  .input(
    z
      .object({
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      })
      .default({ limit: 20 }),
  )
  .query(async ({ ctx, input }) => {
    const conditions = [
      eq(gamePlayers.userId, ctx.user.id),
      eq(games.status, 'finished'),
    ];
    const decoded = input.cursor ? decodeCursor(input.cursor) : null;
    if (decoded) {
      // Composite keyset predicate: strictly after (finished_at, id) in the
      // (finished_at desc, id desc) order — no row with a tied finished_at is
      // skipped across a page boundary.
      conditions.push(
        or(
          lt(games.finishedAt, decoded.finishedAt),
          and(
            eq(games.finishedAt, decoded.finishedAt),
            lt(games.id, decoded.id),
          ),
        )!,
      );
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
      .orderBy(desc(games.finishedAt), desc(games.id))
      .limit(input.limit + 1);

    const hasMore = rows.length > input.limit;
    const page = rows.slice(0, input.limit);
    const pageIds = page.map((r) => r.gameId);
    const concededTeamByGame = new Map<string, number>();
    if (pageIds.length > 0) {
      const concededEvents = await ctx.db
        .select({
          gameId: gameEvents.gameId,
          payload: gameEvents.payload,
        })
        .from(gameEvents)
        .where(
          and(
            inArray(gameEvents.gameId, pageIds),
            eq(gameEvents.type, 'GameConceded'),
          ),
        );
      for (const event of concededEvents) {
        const team = concededTeamFromPayload(event.payload);
        if (team !== null) concededTeamByGame.set(event.gameId, team);
      }
    }
    const items: HistoryGame[] = page.map((r) => ({
      gameId: r.gameId,
      finishedAt: r.finishedAt?.toISOString() ?? null,
      playerCount: r.playerCount,
      mode: r.mode,
      local: r.local,
      winnerTeam: r.winnerTeam ?? null,
      endReason: r.endReason ?? null,
      myTeam: r.myTeam,
      result: resultForTeam({
        winnerTeam: r.winnerTeam ?? null,
        endReason: r.endReason ?? null,
        myTeam: r.myTeam,
        concededTeam: concededTeamByGame.get(r.gameId) ?? null,
      }),
    }));

    const last = hasMore && page.length > 0 ? page[page.length - 1]! : null;
    const nextCursor =
      last && last.finishedAt
        ? encodeCursor(last.finishedAt, last.gameId)
        : null;

    return { items, nextCursor };
  });
