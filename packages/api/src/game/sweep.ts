/**
 * Expiry sweep (FR9/FR10 cleanup).
 *
 * Deletes expired **unfinished** games — `frozen` (1h window) and `saved` (1wk
 * window) whose `expires_at` has passed. The `game_players` / `game_events` FKs
 * cascade, so one delete cleans the whole game. FINISHED games are never
 * touched: they are the history. Runs hourly on an interval armed at boot.
 */

import { and, eq, inArray, lt, or } from 'drizzle-orm';

import type { Database } from '../db/client.ts';
import { games } from '../db/schema/games.ts';

/**
 * Delete every expired frozen/saved game (cascade players + events). Returns the
 * deleted game ids. `now` is injectable for tests.
 */
export async function sweepExpiredGames(
  db: Database,
  now: () => number = () => Date.now(),
): Promise<string[]> {
  const cutoff = new Date(now());

  // Only frozen/saved games with a past expiry; finished games are excluded by
  // the status predicate, so history is never swept.
  const expired = await db
    .select({ id: games.id })
    .from(games)
    .where(
      and(
        or(eq(games.status, 'frozen'), eq(games.status, 'saved')),
        lt(games.expiresAt, cutoff),
      ),
    );

  if (expired.length === 0) return [];
  const ids = expired.map((g) => g.id);

  // The FK cascade on game_players/game_events removes the children.
  await db.delete(games).where(inArray(games.id, ids));
  return ids;
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * Arm the hourly sweep. Returns a stop fn (clears the interval). Errors are
 * swallowed per-tick so one failing sweep doesn't kill the loop.
 */
export function startSweepInterval(
  db: Database,
  intervalMs: number = HOUR_MS,
): () => void {
  const handle = setInterval(() => {
    void sweepExpiredGames(db).catch(() => {
      // best-effort cleanup; the next tick retries.
    });
  }, intervalMs);
  // Don't keep the process alive solely for the sweep.
  handle.unref?.();
  return () => clearInterval(handle);
}
