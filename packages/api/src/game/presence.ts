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
import { publishAppendedEvents } from './publish-events.ts';
import {
  type AppendedEvent,
  appendEvents,
  persistLifecycleTransition,
  VersionConflictError,
} from './state-mapping.ts';
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
  /** gameId → seat → active subscription count (in-memory truth). */
  private readonly connected = new Map<string, Map<number, number>>();

  constructor(private readonly deps: PresenceDeps) {
    this.now = deps.now ?? (() => Date.now());
  }

  private seats(gameId: string): Map<number, number> {
    let seats = this.connected.get(gameId);
    if (!seats) {
      seats = new Map();
      this.connected.set(gameId, seats);
    }
    return seats;
  }

  /** Currently-connected seats for a game (test/inspection helper). */
  connectedSeats(gameId: string): number[] {
    return [...this.seats(gameId).keys()].sort((a, b) => a - b);
  }

  /**
   * A seat connected (WS subscribe / heartbeat). Marks it connected in memory +
   * DB, then attempts a resume if the game is frozen/saved and the full roster
   * is now present.
   */
  async markConnected(gameId: string, seat: number): Promise<void> {
    const seats = this.seats(gameId);
    seats.set(seat, (seats.get(seat) ?? 0) + 1);
    const [game] = await this.deps.db
      .select({ local: games.local })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);
    await this.deps.db
      .update(gamePlayers)
      .set({ connected: true, lastSeenAt: new Date(this.now()) })
      .where(this.playerPresenceWhere(gameId, seat, game?.local ?? false));

    await this.maybeResume(gameId);
  }

  /**
   * A seat dropped (heartbeat lapse). Marks it disconnected, and if the game is
   * `active`, freezes it: pause the timer, set the 1h expiry, broadcast.
   */
  async markDisconnected(gameId: string, seat: number): Promise<void> {
    const seats = this.seats(gameId);
    const currentCount = seats.get(seat) ?? 0;
    if (currentCount > 1) {
      seats.set(seat, currentCount - 1);
      return;
    }

    seats.delete(seat);
    const [game] = await this.deps.db
      .select({
        local: games.local,
        status: games.status,
        version: games.version,
      })
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);
    if (!game) return;

    await this.deps.db
      .update(gamePlayers)
      .set({ connected: false })
      .where(this.playerPresenceWhere(gameId, seat, game.local));

    // A replacement subscription can connect while this disconnect is already
    // awaiting DB writes. If that happened, restore the DB flag and skip the
    // freeze; the live connection is authoritative.
    const reconnected = game.local
      ? this.seats(gameId).size > 0
      : this.seats(gameId).has(seat);
    if (reconnected) {
      await this.deps.db
        .update(gamePlayers)
        .set({ connected: true, lastSeenAt: new Date(this.now()) })
        .where(this.playerPresenceWhere(gameId, seat, game.local));
      return;
    }

    // Only an active game freezes on a drop (a saved/frozen game stays put).
    if (game.status !== 'active' || !canTransition('active', 'frozen')) return;

    // Freeze under the version guard in one transaction with the event append:
    // if a move committed concurrently (bumping the version), the freeze loses
    // cleanly rather than clobbering the move's row. The next heartbeat lapse
    // re-evaluates, so a genuinely-departed player still freezes the game.
    let frozenVersion: number;
    let appended: AppendedEvent[];
    try {
      const result = await this.deps.db.transaction(async (tx) => {
        const nextVersion = await persistLifecycleTransition(
          tx,
          gameId,
          game.version,
          {
            status: 'frozen',
            expiresAt: new Date(this.now() + FROZEN_EXPIRY_MS),
          },
        );
        const rows = await appendEvents(tx, gameId, [
          { type: 'PlayerDisconnected', seat },
        ]);
        return { nextVersion, rows };
      });
      frozenVersion = result.nextVersion;
      appended = result.rows;
    } catch (err) {
      if (err instanceof VersionConflictError) return; // a move won the race
      throw err;
    }

    // Pause the timer only after the freeze commits (so a lost race doesn't
    // leave a paused timer on a still-active game).
    await this.deps.timers.pause(gameId);
    this.publishAppended(gameId, appended, frozenVersion);

    // A replacement subscription can connect after the pre-freeze recheck but
    // before the freeze transaction commits. In that case markConnected saw an
    // still-active game and could not resume it, so re-evaluate now that the
    // freeze is durable.
    await this.maybeResume(gameId);
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

    // Resume under the version guard, in one transaction with the event append.
    // A frozen/saved game has no concurrent move writer, but guarding keeps the
    // lifecycle writes uniform with the move protocol and bumps the version that
    // the resumed timer arms against.
    let resumedVersion: number;
    let appended: AppendedEvent[];
    const events =
      game.timerSeconds !== null
        ? ([
            { type: 'PlayerReconnected' as const },
            { type: 'TimerResumed' as const },
          ] as const)
        : ([{ type: 'PlayerReconnected' as const }] as const);
    try {
      const result = await this.deps.db.transaction(async (tx) => {
        const nextVersion = await persistLifecycleTransition(
          tx,
          gameId,
          game.version,
          { status: 'active', expiresAt: null },
        );
        const rows = await appendEvents(tx, gameId, [...events]);
        return { nextVersion, rows };
      });
      resumedVersion = result.nextVersion;
      appended = result.rows;
    } catch (err) {
      if (err instanceof VersionConflictError) return; // racing write won
      throw err;
    }

    // Resume the (paused) timer from its stored remainder, armed on the new
    // post-resume version so a forfeit guards against the right row.
    await this.deps.timers.resume(gameId, resumedVersion);

    this.publishAppended(gameId, appended, resumedVersion);
  }

  /** Publish appended lifecycle events to the room with their real DB seqs. */
  private publishAppended(
    gameId: string,
    appended: AppendedEvent[],
    version: number,
  ): void {
    publishAppendedEvents(this.deps.rooms, gameId, appended, version);
  }

  private playerPresenceWhere(gameId: string, seat: number, local: boolean) {
    return local
      ? eq(gamePlayers.gameId, gameId)
      : and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.seat, seat));
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
  onConnect(gameId: string, seat: number): void | Promise<void>;
  onDisconnect(gameId: string, seat: number): void | Promise<void>;
}

let presenceHook: PresenceHook | null = null;

export function setPresenceHook(hook: PresenceHook | null): void {
  presenceHook = hook;
}

export function getPresenceHook(): PresenceHook | null {
  return presenceHook;
}
