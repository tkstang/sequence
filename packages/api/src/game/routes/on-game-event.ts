import { tracked } from '@trpc/server';
import { and, asc, eq, gt, max } from 'drizzle-orm';
import { z } from 'zod';

import { gameEvents } from '../../db/schema/game-events.ts';
import { games } from '../../db/schema/games.ts';
import {
  buildSnapshot,
  type GameSnapshot,
  type LoggedEvent,
  redactEvent,
} from '../../shared/realtime/redaction.ts';
import { rooms } from '../../shared/realtime/rooms.ts';
import { gamePlayerProcedure } from '../../trpc.ts';
import { getPresenceHook } from '../presence.ts';
import { loadGameState } from '../state-mapping.ts';

/** A single item on the subscription stream: a snapshot or a (redacted) event. */
export type StreamItem =
  | { kind: 'snapshot'; snapshot: GameSnapshot }
  | { kind: 'event'; event: LoggedEvent };

/**
 * How many events back the gap-replay window retains. Beyond this the server
 * falls back to a fresh snapshot rather than replaying — the recovery contract:
 * gap replay for blips, snapshot for everything else, one path clients can't get
 * wrong.
 */
const REPLAY_WINDOW = 500;

/**
 * `game.onGameEvent(gameId, lastEventId?)` — the single live stream (seat-auth).
 *
 * Recovery contract (design §Error Handling):
 *  - no `lastEventId`, or one older than the retained window → first emit is a
 *    full **redacted snapshot** (public state + the recipient's own hand), then
 *    the live stream;
 *  - a recent `lastEventId` → **gap replay** of missed events from
 *    `game_events`, then live.
 *
 * Every item is `tracked()` by its `seq` so the client resumes precisely.
 * Per-recipient redaction (NFR1) is applied to both replayed and live events.
 */
export const onGameEventRoute = gamePlayerProcedure
  .input(
    z.object({
      gameId: z.string().uuid(),
      lastEventId: z.coerce.number().int().nonnegative().optional(),
    }),
  )
  .subscription(async function* ({ ctx, input, signal }) {
    const { gameId } = input;
    const recipientSeat = ctx.seat.seat;
    const isLocal = ctx.seat.isLocal;

    // Subscribe to the room FIRST so no event committed between the snapshot
    // read and the live loop is lost (we de-dupe by seq below).
    const { sub, unsubscribe } = rooms.subscribe(gameId);

    // Presence: this connection marks the seat connected; its teardown marks it
    // disconnected (the heartbeat-lapse signal). A frozen game resumes once all
    // seats are back. No-op when no presence hook is wired (unit tests).
    const presence = getPresenceHook();
    void presence?.onConnect(gameId, recipientSeat);

    const onAbort = (): void => {
      unsubscribe();
      void presence?.onDisconnect(gameId, recipientSeat);
    };
    signal?.addEventListener('abort', onAbort);

    try {
      const [{ value: maxSeq } = { value: null }] = await ctx.db
        .select({ value: max(gameEvents.seq) })
        .from(gameEvents)
        .where(eq(gameEvents.gameId, gameId));
      const currentMax = maxSeq ?? 0;

      let lastSent = 0;

      const withinWindow =
        input.lastEventId !== undefined &&
        input.lastEventId <= currentMax &&
        currentMax - input.lastEventId <= REPLAY_WINDOW;

      if (withinWindow) {
        // Gap replay: stream missed events (seq > lastEventId) from the log.
        const missed = await ctx.db
          .select({
            seq: gameEvents.seq,
            type: gameEvents.type,
            payload: gameEvents.payload,
          })
          .from(gameEvents)
          .where(
            and(
              eq(gameEvents.gameId, gameId),
              gt(gameEvents.seq, input.lastEventId!),
            ),
          )
          .orderBy(asc(gameEvents.seq));

        for (const row of missed) {
          const event = redactEvent(
            {
              seq: row.seq,
              type: row.type,
              payload: row.payload as Record<string, unknown>,
            },
            recipientSeat,
            isLocal,
          );
          lastSent = row.seq;
          yield tracked(String(row.seq), {
            kind: 'event',
            event,
          } satisfies StreamItem);
        }
      } else {
        // Snapshot-first: a full redacted snapshot tagged at the current seq.
        // The current `version` rides the snapshot so a recovering client can
        // submit its next move without any privileged DB read (FR6).
        const [vrow] = await ctx.db
          .select({ version: games.version })
          .from(games)
          .where(eq(games.id, gameId))
          .limit(1);
        const state = await loadGameState(ctx.db, gameId);
        const snapshot = buildSnapshot(
          state,
          recipientSeat,
          vrow?.version ?? 0,
        );
        lastSent = currentMax;
        yield tracked(String(currentMax), {
          kind: 'snapshot',
          snapshot,
        } satisfies StreamItem);
      }

      // Live stream: drain the room queue, skipping anything already sent (an
      // event committed before our snapshot read but published into the queue).
      for (;;) {
        const event = await sub.next();
        if (event === null) return; // unsubscribed
        if (event.seq <= lastSent) continue;
        lastSent = event.seq;
        const redacted = redactEvent(event, recipientSeat, isLocal);
        yield tracked(String(event.seq), {
          kind: 'event',
          event: redacted,
        } satisfies StreamItem);
      }
    } finally {
      unsubscribe();
    }
  });
