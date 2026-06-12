import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { games } from '../db/schema/index.ts';
import { createHarness, type Harness } from '../test/harness.ts';
import { TimerService, type TimerDeps } from './TimerService.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('TimerService (integration, controlled clock)', () => {
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

  /**
   * A controllable timer harness: a manual clock + a queue of armed callbacks
   * we can fire on demand (no real setTimeout). `onExpire` is a spy so we assert
   * the forfeit path without driving the whole move engine.
   */
  function controlled() {
    let clock = 1_000_000;
    const armed: { fn: () => void; at: number }[] = [];
    const onExpire = vi.fn(async () => {});
    const deps: Partial<TimerDeps> = {
      now: () => clock,
      setTimer: (fn, ms) => {
        const entry = { fn, at: clock + ms };
        armed.push(entry);
        return entry as unknown as ReturnType<typeof setTimeout>;
      },
      clearTimer: (handle) => {
        const idx = armed.indexOf(handle as unknown as (typeof armed)[number]);
        if (idx !== -1) armed.splice(idx, 1);
      },
      onExpire,
    };
    return {
      deps,
      onExpire,
      advance(ms: number) {
        clock += ms;
        const due = armed.filter((a) => a.at <= clock);
        for (const d of due) {
          armed.splice(armed.indexOf(d), 1);
          d.fn();
        }
      },
      armedCount: () => armed.length,
    };
  }

  async function seedActiveGame(timerSeconds: number | null) {
    const host = await h.signUp({
      email: `host-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'Host',
    });
    const gameId = randomUUID();
    await h.db.insert(games).values({
      id: gameId,
      inviteCode: gameId.slice(0, 10),
      createdBy: host.userId,
      playerCount: 2,
      mode: 'tap',
      status: 'active',
      version: 3,
      currentSeat: 0,
      timerSeconds,
    });
    return gameId;
  }

  it('schedules a deadline only for timed games', async () => {
    const c = controlled();
    const svc = new TimerService(h.db, c.deps);
    const gameId = await seedActiveGame(30);

    await svc.scheduleTurn(gameId, 30, 3);
    expect(svc.isArmed(gameId)).toBe(true);
    const [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.turnDeadlineAt).toBeTruthy();

    // Untimed game: no deadline, no in-memory timer.
    const untimed = await seedActiveGame(null);
    await svc.scheduleTurn(untimed, null, 3);
    expect(svc.isArmed(untimed)).toBe(false);
    svc.clearAll();
  });

  it('does not arm a timer while a pending choice freezes the turn', async () => {
    const c = controlled();
    const svc = new TimerService(h.db, c.deps);
    const gameId = await seedActiveGame(30);
    await svc.scheduleTurn(gameId, 30, 3, { pendingChoice: true });
    expect(svc.isArmed(gameId)).toBe(false);
    svc.clearAll();
  });

  it('fires a forfeit (onExpire) at the deadline with the armed version', async () => {
    const c = controlled();
    const svc = new TimerService(h.db, c.deps);
    const gameId = await seedActiveGame(30);
    await svc.scheduleTurn(gameId, 30, 7);

    c.advance(29_000);
    expect(c.onExpire).not.toHaveBeenCalled();
    c.advance(2_000); // past the 30s deadline
    expect(c.onExpire).toHaveBeenCalledWith(gameId, 7);
    svc.clearAll();
  });

  it('pause stores remaining ms and clears the deadline; resume reschedules', async () => {
    const c = controlled();
    const svc = new TimerService(h.db, c.deps);
    const gameId = await seedActiveGame(30);
    await svc.scheduleTurn(gameId, 30, 3);

    c.advance(10_000); // 20s left
    const remaining = await svc.pause(gameId);
    expect(remaining).toBe(20_000);
    expect(svc.isArmed(gameId)).toBe(false);
    const [paused] = await h.db
      .select()
      .from(games)
      .where(eq(games.id, gameId));
    expect(paused?.turnDeadlineAt).toBeNull();
    expect(paused?.turnRemainingMs).toBe(20_000);

    await svc.resume(gameId, 3);
    expect(svc.isArmed(gameId)).toBe(true);
    // The new deadline forfeits after the remaining 20s, not the full 30.
    c.advance(20_000);
    expect(c.onExpire).toHaveBeenCalledWith(gameId, 3);
    svc.clearAll();
  });

  it('boot rehydration re-arms live deadlines (a past deadline fires at once)', async () => {
    const c = controlled();
    const svc = new TimerService(h.db, c.deps);
    const gameId = await seedActiveGame(30);
    // Persist a deadline 5s in the FUTURE relative to the controlled clock.
    await h.db
      .update(games)
      .set({ turnDeadlineAt: new Date(c.deps.now!() + 5_000) })
      .where(eq(games.id, gameId));

    const armed = await svc.rehydrate();
    expect(armed).toBe(1);
    expect(svc.isArmed(gameId)).toBe(true);
    c.advance(5_000);
    expect(c.onExpire).toHaveBeenCalledWith(gameId, 3);
    svc.clearAll();
  });
});
