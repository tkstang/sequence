/**
 * In-memory room registry for real-time fan-out.
 *
 * One process owns all traffic (no horizontal scaling for the MVP), so rooms
 * live in memory: gameId → set of subscriber queues. The move engine and
 * lifecycle routes call {@link RoomRegistry.publish} after committing; each
 * subscriber's `onGameEvent` generator drains its queue and yields redacted,
 * `tracked()` events to its socket.
 *
 * A subscriber is an async push-queue: `publish` enqueues, the generator awaits
 * the next item. This decouples the (synchronous) commit path from the (async)
 * per-socket delivery.
 */

import type { LoggedEvent } from './redaction.ts';

/** A single subscriber's bounded async queue of events. */
class Subscriber {
  private readonly buffer: LoggedEvent[] = [];
  private resolve: ((value: LoggedEvent | null) => void) | null = null;
  private closed = false;

  /** Enqueue an event (or wake a waiting consumer). */
  push(event: LoggedEvent): void {
    if (this.closed) return;
    if (this.resolve) {
      const r = this.resolve;
      this.resolve = null;
      r(event);
    } else {
      this.buffer.push(event);
    }
  }

  /** Await the next event, or `null` once the subscriber is closed + drained. */
  next(): Promise<LoggedEvent | null> {
    if (this.buffer.length > 0) {
      return Promise.resolve(this.buffer.shift()!);
    }
    if (this.closed) return Promise.resolve(null);
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  close(): void {
    this.closed = true;
    if (this.resolve) {
      const r = this.resolve;
      this.resolve = null;
      r(null);
    }
  }
}

/**
 * The room registry. `subscribe` returns a {@link Subscriber} handle plus an
 * unsubscribe fn; `publish` fans an event out to every current subscriber of a
 * game. Redaction happens per-recipient in the subscription generator, not here
 * — the registry carries full events.
 */
export class RoomRegistry {
  private readonly rooms = new Map<string, Set<Subscriber>>();

  subscribe(gameId: string): { sub: Subscriber; unsubscribe: () => void } {
    let set = this.rooms.get(gameId);
    if (!set) {
      set = new Set();
      this.rooms.set(gameId, set);
    }
    const sub = new Subscriber();
    set.add(sub);

    return {
      sub,
      unsubscribe: () => {
        sub.close();
        const current = this.rooms.get(gameId);
        if (current) {
          current.delete(sub);
          if (current.size === 0) this.rooms.delete(gameId);
        }
      },
    };
  }

  /** Fan `event` out to every subscriber of `gameId`. */
  publish(gameId: string, event: LoggedEvent): void {
    const set = this.rooms.get(gameId);
    if (!set) return;
    for (const sub of set) sub.push(event);
  }

  /** Current subscriber count for a game (presence + tests). */
  subscriberCount(gameId: string): number {
    return this.rooms.get(gameId)?.size ?? 0;
  }
}

export type { Subscriber };

/**
 * The process-wide room registry. A singleton because rooms are in-memory and
 * the move engine, subscription, and presence layers must share one map.
 */
export const rooms = new RoomRegistry();
