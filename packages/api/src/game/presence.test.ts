import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { gamePlayers, games } from '../db/schema/index.ts';
import { RoomRegistry } from '../shared/realtime/rooms.ts';
import { createHarness, type Harness } from '../test/harness.ts';
import { PresenceTracker } from './presence.ts';
import { TimerService } from './TimerService.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('PresenceTracker (integration)', () => {
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

  /** A presence tracker over an isolated room registry + real timer service. */
  function makeTracker() {
    const roomReg = new RoomRegistry();
    const timers = new TimerService(h.db, {
      // No-op scheduler so timers never actually fire during presence tests.
      setTimer: () => 0 as unknown as ReturnType<typeof setTimeout>,
      clearTimer: () => {},
    });
    const presence = new PresenceTracker({ db: h.db, rooms: roomReg, timers });
    return { presence, roomReg, timers };
  }

  async function seedGame(opts: {
    status: 'active' | 'frozen' | 'saved';
    local?: boolean;
    playerCount?: number;
    timerSeconds?: number | null;
    turnRemainingMs?: number | null;
  }): Promise<string> {
    const host = await h.signUp({
      email: `host-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'Host',
    });
    const gameId = randomUUID();
    const playerCount = opts.playerCount ?? 2;
    await h.db.insert(games).values({
      id: gameId,
      inviteCode: gameId.slice(0, 10),
      createdBy: host.userId,
      local: opts.local ?? false,
      playerCount,
      mode: 'tap',
      status: opts.status,
      version: 4,
      currentSeat: 0,
      timerSeconds: opts.timerSeconds ?? null,
      turnRemainingMs: opts.turnRemainingMs ?? null,
    });
    const rows = Array.from({ length: playerCount }, (_, seat) => ({
      gameId,
      seat,
      team: ((seat % 2) + 1) as 1 | 2,
      userId: seat === 0 ? host.userId : null,
      guestName: seat === 0 ? null : `P${seat}`,
      isCreator: seat === 0,
      connected: opts.status === 'active',
    }));
    await h.db.insert(gamePlayers).values(rows);
    return gameId;
  }

  it('a drop while active freezes the game, pauses the timer, sets +1h expiry', async () => {
    const { presence } = makeTracker();
    const gameId = await seedGame({
      status: 'active',
      timerSeconds: 30,
      turnRemainingMs: null,
    });
    // Simulate a live deadline so pause has something to store.
    await h.db
      .update(games)
      .set({ turnDeadlineAt: new Date(Date.now() + 20_000) })
      .where(eq(games.id, gameId));
    // Both seats start connected.
    await presence.markConnected(gameId, 0);
    await presence.markConnected(gameId, 1);

    await presence.markDisconnected(gameId, 1);

    const [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('frozen');
    expect(row?.expiresAt).toBeTruthy();
    // Timer paused: remaining stored, deadline cleared.
    expect(row?.turnDeadlineAt).toBeNull();
    expect(row?.turnRemainingMs).toBeGreaterThan(0);

    const [seat1] = await h.db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.seat, 1));
    expect(seat1?.connected).toBe(false);
  });

  it('resume (frozen→active) only when ALL seats reconnect', async () => {
    const { presence } = makeTracker();
    const gameId = await seedGame({
      status: 'active',
      timerSeconds: 30,
    });
    await h.db
      .update(games)
      .set({ turnDeadlineAt: new Date(Date.now() + 20_000) })
      .where(eq(games.id, gameId));
    await presence.markConnected(gameId, 0);
    await presence.markConnected(gameId, 1);
    await presence.markDisconnected(gameId, 1);

    // Seat 0 alone reconnecting does NOT resume.
    await presence.markConnected(gameId, 0);
    let [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('frozen');

    // Seat 1 back → all present → resume.
    await presence.markConnected(gameId, 1);
    [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('active');
    expect(row?.expiresAt).toBeNull();
  });

  it('does not freeze when an older overlapping subscription disconnects', async () => {
    const { presence } = makeTracker();
    const gameId = await seedGame({
      status: 'active',
      timerSeconds: null,
    });
    await presence.markConnected(gameId, 0);
    await presence.markConnected(gameId, 1);

    // Foreground recovery can open a replacement subscription before the
    // backgrounded subscription aborts. The late abort must decrement only that
    // older connection, not mark the seat disconnected.
    await presence.markConnected(gameId, 0);
    await presence.markDisconnected(gameId, 0);

    let [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('active');
    expect(presence.connectedSeats(gameId)).toEqual([0, 1]);

    await presence.markDisconnected(gameId, 0);
    [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('frozen');
    expect(presence.connectedSeats(gameId)).toEqual([1]);
  });

  it('does not freeze when a replacement subscription reconnects during disconnect handling', async () => {
    const { presence } = makeTracker();
    const gameId = await seedGame({
      status: 'active',
      timerSeconds: null,
    });
    await presence.markConnected(gameId, 0);
    await presence.markConnected(gameId, 1);

    const disconnecting = presence.markDisconnected(gameId, 0);
    await presence.markConnected(gameId, 0);
    await disconnecting;

    const [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('active');
    expect(presence.connectedSeats(gameId)).toEqual([0, 1]);

    const players = await h.db
      .select({ seat: gamePlayers.seat, connected: gamePlayers.connected })
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId))
      .orderBy(gamePlayers.seat);
    expect(players.map((p) => [p.seat, p.connected])).toEqual([
      [0, true],
      [1, true],
    ]);
  });

  it('resumes when a replacement reconnects before the freeze commit finishes', async () => {
    let releaseFreeze!: () => void;
    let freezeStarted!: () => void;
    const freezeStartedPromise = new Promise<void>((resolve) => {
      freezeStarted = resolve;
    });
    const releaseFreezePromise = new Promise<void>((resolve) => {
      releaseFreeze = resolve;
    });
    let delayed = false;
    const delayedDb = new Proxy(h.db, {
      get(target, prop, receiver) {
        if (prop !== 'transaction') return Reflect.get(target, prop, receiver);
        return async (...args: unknown[]) => {
          if (!delayed) {
            delayed = true;
            freezeStarted();
            await releaseFreezePromise;
          }
          return h.db.transaction(
            ...(args as Parameters<typeof h.db.transaction>),
          );
        };
      },
    }) as typeof h.db;
    const roomReg = new RoomRegistry();
    const timers = new TimerService(h.db, {
      setTimer: () => 0 as unknown as ReturnType<typeof setTimeout>,
      clearTimer: () => {},
    });
    const presence = new PresenceTracker({
      db: delayedDb,
      rooms: roomReg,
      timers,
    });
    const gameId = await seedGame({
      status: 'active',
      timerSeconds: null,
    });
    await presence.markConnected(gameId, 0);
    await presence.markConnected(gameId, 1);

    const disconnecting = presence.markDisconnected(gameId, 0);
    await freezeStartedPromise;
    await presence.markConnected(gameId, 0);
    releaseFreeze();
    await disconnecting;

    const [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('active');
    expect(row?.expiresAt).toBeNull();
    expect(presence.connectedSeats(gameId)).toEqual([0, 1]);

    const players = await h.db
      .select({ seat: gamePlayers.seat, connected: gamePlayers.connected })
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId))
      .orderBy(gamePlayers.seat);
    expect(players.map((p) => [p.seat, p.connected])).toEqual([
      [0, true],
      [1, true],
    ]);
  });

  it('saved→active resumes only when all original players reconnect', async () => {
    const { presence } = makeTracker();
    const gameId = await seedGame({
      status: 'saved',
      timerSeconds: null,
      turnRemainingMs: 15_000,
    });
    // Partial roster: only seat 0.
    await presence.markConnected(gameId, 0);
    let [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('saved');

    await presence.markConnected(gameId, 1);
    [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('active');
  });

  it('a local game resumes with the creator alone', async () => {
    const { presence } = makeTracker();
    const gameId = await seedGame({
      status: 'saved',
      local: true,
      playerCount: 2,
    });
    // Only the creator (seat 0) connects — covers both local seats.
    await presence.markConnected(gameId, 0);
    const [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('active');
    const players = await h.db
      .select({ seat: gamePlayers.seat, connected: gamePlayers.connected })
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId))
      .orderBy(gamePlayers.seat);
    expect(players.map((p) => [p.seat, p.connected])).toEqual([
      [0, true],
      [1, true],
    ]);
  });

  it('broadcasts PlayerDisconnected on freeze and PlayerReconnected on resume', async () => {
    const { presence } = makeTracker();
    const gameId = await seedGame({ status: 'active', timerSeconds: 30 });
    await h.db
      .update(games)
      .set({ turnDeadlineAt: new Date(Date.now() + 20_000) })
      .where(eq(games.id, gameId));
    await presence.markConnected(gameId, 0);
    await presence.markConnected(gameId, 1);

    await presence.markDisconnected(gameId, 1);
    await presence.markConnected(gameId, 1);

    const events = await h.db
      .select()
      .from(h.schema.gameEvents)
      .where(eq(h.schema.gameEvents.gameId, gameId));
    const types = events.map((e) => e.type);
    expect(types).toContain('PlayerDisconnected');
    expect(types).toContain('PlayerReconnected');
    expect(types).toContain('TimerResumed');
  });

  it('published freeze/resume lifecycle events carry the bumped version', async () => {
    const { presence, roomReg } = makeTracker();
    const gameId = await seedGame({ status: 'active', timerSeconds: 30 });
    await h.db
      .update(games)
      .set({ turnDeadlineAt: new Date(Date.now() + 20_000) })
      .where(eq(games.id, gameId));
    await presence.markConnected(gameId, 0);
    await presence.markConnected(gameId, 1);
    const { sub, unsubscribe } = roomReg.subscribe(gameId);

    await presence.markDisconnected(gameId, 1);
    const frozen = await Promise.race([
      sub.next(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('freeze timeout')), 5000),
      ),
    ]);
    const [frozenRow] = await h.db
      .select({ version: games.version })
      .from(games)
      .where(eq(games.id, gameId));
    await presence.markConnected(gameId, 1);
    const reconnected = await Promise.race([
      sub.next(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('resume timeout')), 5000),
      ),
    ]);
    const [resumedRow] = await h.db
      .select({ version: games.version })
      .from(games)
      .where(eq(games.id, gameId));
    unsubscribe();

    expect(frozen?.version).toBe(frozenRow?.version);
    expect(reconnected?.version).toBe(resumedRow?.version);
  });
});
