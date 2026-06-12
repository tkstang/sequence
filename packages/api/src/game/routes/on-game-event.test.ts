import { randomUUID } from 'node:crypto';

import { createGame, createSeededRng } from '@sequence/game-logic';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { LoggedEvent } from '../../shared/realtime/redaction.ts';
import { rooms } from '../../shared/realtime/rooms.ts';
import { createHarness, type Harness } from '../../test/harness.ts';
import { appendEvents, persistGameState } from '../state-mapping.ts';
import type { StreamItem } from './on-game-event.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

/**
 * A subscription yield is a `tracked()` envelope: a `[id, data]` tuple. Helper
 * to read both halves in tests.
 */
type Yielded = readonly [string, StreamItem];

function idOf(y: Yielded): string {
  return y[0];
}
function dataOf(y: Yielded): StreamItem {
  return y[1];
}

/**
 * The server-side caller yields each `tracked()` item as a `[id, data]` tuple
 * at runtime (the SSE envelope shape), though tRPC's static type is the branded
 * `TrackedData`. Tests treat the runtime tuple as ground truth via `unknown`.
 */
function asTuples(iterable: AsyncIterable<unknown>): AsyncIterator<Yielded> {
  return (iterable as AsyncIterable<Yielded>)[Symbol.asyncIterator]();
}

/** Pull `n` items from a subscription async iterable (with a timeout guard). */
async function take(
  iterable: AsyncIterable<unknown>,
  n: number,
): Promise<Yielded[]> {
  const out: Yielded[] = [];
  const iterator = asTuples(iterable);
  for (let i = 0; i < n; i++) {
    const result = await Promise.race([
      iterator.next(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('subscription timeout')), 5000),
      ),
    ]);
    if (result.done) break;
    out.push(result.value);
  }
  await iterator.return?.();
  return out;
}

describeIntegration('game.onGameEvent (integration)', () => {
  let h: Harness;

  beforeAll(async () => {
    h = await createHarness();
  });
  afterAll(async () => {
    await h.close();
  });
  beforeEach(async () => {
    await h.reset();
  });

  /** Seed a started 2p game with both seats and persisted dealt state. */
  async function seedStartedGame(local = false) {
    const host = await h.signUp({
      email: `host-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'Host',
    });
    const gameId = randomUUID();
    await h.db.insert(h.schema.games).values({
      id: gameId,
      inviteCode: gameId.slice(0, 10),
      createdBy: host.userId,
      local,
      playerCount: 2,
      mode: 'tap',
      status: 'lobby',
      version: 0,
    });
    await h.db.insert(h.schema.gamePlayers).values([
      { gameId, seat: 0, team: 1, userId: host.userId, isCreator: true },
      { gameId, seat: 1, team: 2, guestName: 'Opp' },
    ]);
    const state = createGame(
      { playerCount: 2, mode: 'tap', timerSeconds: null, local },
      [
        { seat: 0, team: 1 },
        { seat: 1, team: 2 },
      ],
      createSeededRng(11),
    );
    await h.db.transaction((tx) => persistGameState(tx, gameId, state, 0));
    return { host, gameId, state };
  }

  it('subscribe without lastEventId emits a snapshot first (own hand only)', async () => {
    const { host, gameId, state } = await seedStartedGame();
    const sub = await h.caller(host.cookie).game.onGameEvent({ gameId });
    const [first] = await take(sub, 1);
    const firstData = first ? dataOf(first) : undefined;

    expect(firstData?.kind).toBe('snapshot');
    if (firstData?.kind === 'snapshot') {
      expect(firstData.snapshot.hand).toEqual(state.hands[0]);
      // Seat 0's snapshot must not include the deck or seat 1's hand.
      expect(JSON.stringify(firstData.snapshot)).not.toContain('deck');
      expect(firstData.snapshot.localHands).toBeUndefined();
    }
  });

  it('snapshot then live events flow in order', async () => {
    const { host, gameId } = await seedStartedGame();
    const sub = await h.caller(host.cookie).game.onGameEvent({ gameId });
    const iterator = asTuples(sub);

    const first = await iterator.next();
    expect(dataOf(first.value as Yielded).kind).toBe('snapshot');

    // Simulate the move engine publishing a public event into the room.
    const live: LoggedEvent = {
      seq: 1,
      type: 'TurnAdvanced',
      payload: { seat: 1, round: 1 },
    };
    rooms.publish(gameId, live);

    const second = await Promise.race([
      iterator.next(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000),
      ),
    ]);
    const item = second.value as Yielded;
    const data = dataOf(item);
    expect(data.kind).toBe('event');
    if (data.kind === 'event') {
      expect(data.event.type).toBe('TurnAdvanced');
    }
    expect(idOf(item)).toBe('1'); // tracked() id = seq
    await iterator.return?.();
  });

  it('a recent lastEventId replays the gap from game_events', async () => {
    const { host, gameId } = await seedStartedGame();
    // Append three events to the log.
    await h.db.transaction((tx) =>
      appendEvents(tx, gameId, [
        { type: 'TurnAdvanced', seat: 1, round: 1 },
        { type: 'TurnAdvanced', seat: 0, round: 2 },
        { type: 'TurnAdvanced', seat: 1, round: 2 },
      ]),
    );

    // Resume from seq 1 → expect seq 2 and 3 replayed as events (no snapshot).
    const sub = await h
      .caller(host.cookie)
      .game.onGameEvent({ gameId, lastEventId: 1 });
    const items = await take(sub, 2);
    expect(items.map(idOf)).toEqual(['2', '3']);
    expect(items.every((i) => dataOf(i).kind === 'event')).toBe(true);
  });

  it('a stale lastEventId beyond the window falls back to a snapshot', async () => {
    const { host, gameId } = await seedStartedGame();
    await h.db.transaction((tx) =>
      appendEvents(tx, gameId, [{ type: 'TurnAdvanced', seat: 1, round: 1 }]),
    );
    // lastEventId far in the future / impossible → snapshot fallback.
    const sub = await h
      .caller(host.cookie)
      .game.onGameEvent({ gameId, lastEventId: 99_999 });
    const [first] = await take(sub, 1);
    expect(first ? dataOf(first).kind : undefined).toBe('snapshot');
  });

  it('redacts a private CardDrawn for a non-owning subscriber', async () => {
    const { host, gameId } = await seedStartedGame();
    const sub = await h.caller(host.cookie).game.onGameEvent({ gameId });
    const iterator = asTuples(sub);
    await iterator.next(); // snapshot

    // A CardDrawn for seat 1 reaches seat 0 (the host) redacted — no card.
    rooms.publish(gameId, {
      seq: 1,
      type: 'CardDrawn',
      payload: { seat: 1, card: { rank: 'A', suit: 'C' } },
    });
    const next = await Promise.race([
      iterator.next(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000),
      ),
    ]);
    const item = dataOf(next.value as Yielded);
    expect(item.kind).toBe('event');
    if (item.kind === 'event') {
      expect(JSON.stringify(item.event)).not.toContain('"card"');
    }
    await iterator.return?.();
  });

  it('a local-game subscriber receives every hand in the snapshot', async () => {
    const { host, gameId, state } = await seedStartedGame(true);
    const sub = await h.caller(host.cookie).game.onGameEvent({ gameId });
    const [first] = await take(sub, 1);
    const firstData = first ? dataOf(first) : undefined;
    expect(firstData?.kind).toBe('snapshot');
    if (firstData?.kind === 'snapshot') {
      expect(firstData.snapshot.localHands).toHaveLength(2);
      expect(firstData.snapshot.localHands?.[1]).toEqual(state.hands[1]);
    }
  });
});
