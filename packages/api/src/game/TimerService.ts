/**
 * Persistent turn-timer service (FR8).
 *
 * Deadlines are PERSISTED (`games.turn_deadline_at`) with an in-memory
 * scheduler that fires forfeits through the move engine; the service
 * **rehydrates from the DB on boot** so a redeploy can't strand a timed game.
 * Pause-on-disconnect stores `turn_remaining_ms` and clears the deadline;
 * resume reschedules from the remainder. The timer does not run during a
 * `pending-choice` sub-state (the design suspends it there).
 *
 * Forfeit-vs-move races resolve via the move engine's version guard: the
 * scheduled forfeit reads the version it was armed against and loses cleanly as
 * CONFLICT if a real move committed first.
 */

import { and, eq, isNotNull } from 'drizzle-orm';

import type { Database } from '../db/client.ts';
import { games } from '../db/schema/games.ts';
import { executeForfeit } from './move-engine.ts';

/** Injectable timer + clock so tests can drive fake timers deterministically. */
export interface TimerDeps {
  now: () => number;
  setTimer: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimer: (handle: ReturnType<typeof setTimeout>) => void;
  /** How a fired timer forfeits. Defaults to the move engine; tests can spy. */
  onExpire?: (gameId: string, version: number) => Promise<void>;
}

const defaultDeps = (db: Database): TimerDeps => ({
  now: () => Date.now(),
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (handle) => clearTimeout(handle),
  onExpire: async (gameId, version) => {
    try {
      await executeForfeit(db, gameId, version);
    } catch {
      // A forfeit that lost the version race (a real move won) is expected and
      // harmless — the new turn schedules its own timer.
    }
  },
});

export class TimerService {
  private readonly deps: TimerDeps;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    private readonly db: Database,
    deps?: Partial<TimerDeps>,
  ) {
    this.deps = { ...defaultDeps(db), ...deps };
  }

  /**
   * Arm the timer for a game's current turn. No-op for untimed games or while a
   * pending choice freezes the turn. Persists `turn_deadline_at` and schedules
   * an in-memory forfeit at the deadline, guarded on `version`.
   */
  async scheduleTurn(
    gameId: string,
    timerSeconds: number | null,
    version: number,
    opts: { pendingChoice?: boolean } = {},
  ): Promise<void> {
    this.clear(gameId);
    if (timerSeconds === null || timerSeconds <= 0) return;
    if (opts.pendingChoice) return; // timer suspended during a choice

    const deadline = this.deps.now() + timerSeconds * 1000;
    await this.db
      .update(games)
      .set({
        turnDeadlineAt: new Date(deadline),
        turnRemainingMs: null,
      })
      .where(eq(games.id, gameId));

    this.arm(gameId, timerSeconds * 1000, version);
  }

  /**
   * Pause the timer (a player dropped): persist the remaining ms and clear the
   * deadline + in-memory timer. Idempotent. Returns the remaining ms (or null
   * when no live deadline).
   */
  async pause(gameId: string): Promise<number | null> {
    this.clear(gameId);
    const [row] = await this.db
      .select({ deadline: games.turnDeadlineAt })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);
    if (!row?.deadline) return null;

    const remaining = Math.max(0, row.deadline.getTime() - this.deps.now());
    await this.db
      .update(games)
      .set({ turnRemainingMs: remaining, turnDeadlineAt: null })
      .where(eq(games.id, gameId));
    return remaining;
  }

  /**
   * Resume a paused timer: reschedule from the stored remainder, re-persisting
   * the deadline. No-op when there is no stored remainder.
   */
  async resume(gameId: string, version: number): Promise<void> {
    const [row] = await this.db
      .select({
        remaining: games.turnRemainingMs,
        pendingChoice: games.pendingChoice,
      })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);
    if (!row || row.remaining === null) return;
    if (row.pendingChoice) return; // still frozen on a choice

    const deadline = this.deps.now() + row.remaining;
    await this.db
      .update(games)
      .set({ turnDeadlineAt: new Date(deadline), turnRemainingMs: null })
      .where(eq(games.id, gameId));
    this.arm(gameId, row.remaining, version);
  }

  /**
   * Boot rehydration: re-arm every active, timed game that has a live deadline.
   * A deadline already in the past fires (almost) immediately, forfeiting the
   * stranded turn. Called once on server boot.
   */
  async rehydrate(): Promise<number> {
    const rows = await this.db
      .select({
        id: games.id,
        deadline: games.turnDeadlineAt,
        version: games.version,
      })
      .from(games)
      .where(and(eq(games.status, 'active'), isNotNull(games.turnDeadlineAt)));

    let armed = 0;
    for (const row of rows) {
      if (!row.deadline) continue;
      const ms = Math.max(0, row.deadline.getTime() - this.deps.now());
      this.arm(row.id, ms, row.version);
      armed += 1;
    }
    return armed;
  }

  /** Cancel any in-memory timer for a game (does not touch the DB). */
  clear(gameId: string): void {
    const handle = this.timers.get(gameId);
    if (handle !== undefined) {
      this.deps.clearTimer(handle);
      this.timers.delete(gameId);
    }
  }

  /** Cancel all in-memory timers (shutdown / test teardown). */
  clearAll(): void {
    for (const handle of this.timers.values()) this.deps.clearTimer(handle);
    this.timers.clear();
  }

  /** Whether a game currently has an armed in-memory timer (test helper). */
  isArmed(gameId: string): boolean {
    return this.timers.has(gameId);
  }

  private arm(gameId: string, ms: number, version: number): void {
    const handle = this.deps.setTimer(() => {
      this.timers.delete(gameId);
      void this.deps.onExpire?.(gameId, version);
    }, ms);
    this.timers.set(gameId, handle);
  }
}
