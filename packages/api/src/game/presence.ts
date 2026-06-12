/**
 * Presence + connection-driven lifecycle (FR9).
 *
 * The real-time layer reports per-seat connect/disconnect (heartbeat lapse ≈ 2
 * missed pings). This tracker maps those into lifecycle transitions via the
 * game-logic state machine:
 *
 *  - a seat drops while `active` → freeze (`active→frozen`), pause the timer,
 *    set `expires_at = +1h`, broadcast `PlayerDisconnected`;
 *  - a seat reconnects and **all** required seats are now connected →
 *    resume (`frozen→active` or `saved→active`), resume the timer, broadcast
 *    `PlayerReconnected` + `TimerResumed`.
 *
 * "All required seats" = every distinct seat for a normal game; for a LOCAL game
 * the creator's single connection covers every seat, so one connection suffices.
 */

import { canTransition } from '@sequence/game-logic';
import { and, eq } from 'drizzle-orm';

import type { Database } from '../db/client.ts';
import { gamePlayers } from '../db/schema/game-players.ts';
import { games } from '../db/schema/games.ts';
import type { RoomRegistry } from '../shared/realtime/rooms.ts';
import { type AppendedEvent, appendEvents } from './state-mapping.ts';
import type { TimerService } from './TimerService.ts';

const FROZEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export interface PresenceDeps {
  db: Database;
  rooms: RoomRegistry;
  timers: TimerService;
  now?: () => number;
}

export class PresenceTracker {
  private readonly now: () => number;
  /** gameId → set of currently-connected seats (in-memory truth). */
  private readonly connected = new Map<string, Set<number>>();

  constructor(private readonly deps: PresenceDeps) {
    this.now = deps.now ?? (() => Date.now());
  }

  private seats(gameId: string): Set<number> {
    let set = this.connected.get(gameId);
    if (!set) {
      set = new Set();
      this.connected.set(gameId, set);
    }
    return set;
  }

  /** Currently-connected seats for a game (test/inspection helper). */
  connectedSeats(gameId: string): number[] {
    return [...this.seats(gameId)].sort((a, b) => a - b);
  }

  /**
   * A seat connected (WS subscribe / heartbeat). Marks it connected in memory +
   * DB, then attempts a resume if the game is frozen/saved and the full roster
   * is now present.
   */
  async markConnected(gameId: string, seat: number): Promise<void> {
    this.seats(gameId).add(seat);
    await this.deps.db
      .update(gamePlayers)
      .set({ connected: true, lastSeenAt: new Date(this.now()) })
      .where(and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.seat, seat)));

    await this.maybeResume(gameId);
  }

  /**
   * A seat dropped (heartbeat lapse). Marks it disconnected, and if the game is
   * `active`, freezes it: pause the timer, set the 1h expiry, broadcast.
   */
  async markDisconnected(gameId: string, seat: number): Promise<void> {
    this.seats(gameId).delete(seat);
    await this.deps.db
      .update(gamePlayers)
      .set({ connected: false })
      .where(and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.seat, seat)));

    const [game] = await this.deps.db
      .select({ status: games.status })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);
    if (!game) return;

    // Only an active game freezes on a drop (a saved/frozen game stays put).
    if (game.status === 'active' && canTransition('active', 'frozen')) {
      await this.deps.timers.pause(gameId);
      await this.deps.db
        .update(games)
        .set({
          status: 'frozen',
          expiresAt: new Date(this.now() + FROZEN_EXPIRY_MS),
        })
        .where(eq(games.id, gameId));
      const appended = await this.deps.db.transaction((tx) =>
        appendEvents(tx, gameId, [{ type: 'PlayerDisconnected', seat }]),
      );
      this.publishAppended(gameId, appended);
    }
  }

  /**
   * Resume a frozen/saved game when the full required roster is connected. Local
   * games resume with the creator's single connection (it covers every seat).
   */
  private async maybeResume(gameId: string): Promise<void> {
    const [game] = await this.deps.db
      .select({
        status: games.status,
        local: games.local,
        playerCount: games.playerCount,
        version: games.version,
        timerSeconds: games.timerSeconds,
      })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);
    if (!game) return;
    if (game.status !== 'frozen' && game.status !== 'saved') return;

    const live = this.seats(gameId);
    const allPresent = game.local
      ? live.size >= 1 // the creator's one connection covers all local seats
      : live.size >= game.playerCount;
    if (!allPresent) return;

    if (!canTransition(game.status, 'active')) return;

    await this.deps.db
      .update(games)
      .set({ status: 'active', expiresAt: null })
      .where(eq(games.id, gameId));

    // Resume the (paused) timer from its stored remainder.
    await this.deps.timers.resume(gameId, game.version);

    const events =
      game.timerSeconds !== null
        ? ([
            { type: 'PlayerReconnected' as const },
            { type: 'TimerResumed' as const },
          ] as const)
        : ([{ type: 'PlayerReconnected' as const }] as const);
    const appended = await this.deps.db.transaction((tx) =>
      appendEvents(tx, gameId, [...events]),
    );
    this.publishAppended(gameId, appended);
  }

  /** Publish appended lifecycle events to the room with their real DB seqs. */
  private publishAppended(gameId: string, appended: AppendedEvent[]): void {
    for (const ev of appended) {
      this.deps.rooms.publish(gameId, {
        seq: ev.seq,
        type: ev.type,
        payload: ev.payload as unknown as Record<string, unknown>,
      });
    }
  }

  /** Drop all in-memory presence for a game (sweep/teardown). */
  forget(gameId: string): void {
    this.connected.delete(gameId);
  }
}

/**
 * Module-level presence hook the subscription route calls on connect/disconnect.
 * Wired to a real {@link PresenceTracker} in `server.ts`; unset in tests that
 * don't exercise presence (the subscription then just streams events).
 */
export interface PresenceHook {
  onConnect(gameId: string, seat: number): void;
  onDisconnect(gameId: string, seat: number): void;
}

let presenceHook: PresenceHook | null = null;

export function setPresenceHook(hook: PresenceHook | null): void {
  presenceHook = hook;
}

export function getPresenceHook(): PresenceHook | null {
  return presenceHook;
}
