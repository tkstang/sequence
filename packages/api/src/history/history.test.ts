import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { gamePlayers, games } from '../db/schema/index.ts';
import { createHarness, type Harness } from '../test/harness.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('history (integration)', () => {
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

  async function signUp(label: string) {
    return h.signUp({
      email: `${label}-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: label,
    });
  }

  /**
   * Seed a finished 2p game between userA (team 1) and userB (team 2). When
   * `userB` is null, seat 1 is a guest. `winnerTeam` decides the result.
   */
  async function finishedGame(opts: {
    a: string;
    b: string | null;
    winnerTeam: number | null;
    local?: boolean;
    finishedAt?: Date;
    guestSeat?: boolean;
  }): Promise<string> {
    const gameId = randomUUID();
    await h.db.insert(games).values({
      id: gameId,
      inviteCode: gameId.slice(0, 10),
      createdBy: opts.a,
      local: opts.local ?? false,
      playerCount: 2,
      mode: 'tap',
      status: 'finished',
      winnerTeam: opts.winnerTeam,
      endReason: 'win',
      finishedAt: opts.finishedAt ?? new Date(),
    });
    await h.db
      .insert(gamePlayers)
      .values([
        { gameId, seat: 0, team: 1, userId: opts.a, isCreator: true },
        opts.b
          ? { gameId, seat: 1, team: 2, userId: opts.b }
          : { gameId, seat: 1, team: 2, guestName: 'Guest' },
      ]);
    return gameId;
  }

  it('myRecord tallies wins/losses over finished non-local games', async () => {
    const a = await signUp('A');
    const b = await signUp('B');
    await finishedGame({ a: a.userId, b: b.userId, winnerTeam: 1 }); // A wins
    await finishedGame({ a: a.userId, b: b.userId, winnerTeam: 2 }); // A loses
    await finishedGame({ a: a.userId, b: b.userId, winnerTeam: 1 }); // A wins

    const res = await h.query('history.myRecord', undefined, a.cookie);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data).toMatchObject({ wins: 2, losses: 1, total: 3 });
  });

  it('myRecord excludes local games', async () => {
    const a = await signUp('A');
    await finishedGame({ a: a.userId, b: null, winnerTeam: 1, local: true });
    const res = await h.query('history.myRecord', undefined, a.cookie);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toMatchObject({ total: 0 });
  });

  it('history.myGames lists finished games (including local, flagged) with cursor', async () => {
    const a = await signUp('A');
    const b = await signUp('B');
    // 3 finished games at distinct times for stable ordering + paging.
    const t0 = new Date(Date.now() - 3000);
    const t1 = new Date(Date.now() - 2000);
    const t2 = new Date(Date.now() - 1000);
    await finishedGame({
      a: a.userId,
      b: b.userId,
      winnerTeam: 1,
      finishedAt: t0,
    });
    await finishedGame({
      a: a.userId,
      b: null,
      winnerTeam: 1,
      local: true,
      finishedAt: t1,
    });
    await finishedGame({
      a: a.userId,
      b: b.userId,
      winnerTeam: 2,
      finishedAt: t2,
    });

    // Page 1: limit 2, newest first.
    const page1 = await h.query('history.myGames', { limit: 2 }, a.cookie);
    expect(page1.ok).toBe(true);
    if (!page1.ok) return;
    const d1 = page1.data as {
      items: { local: boolean }[];
      nextCursor: string | null;
    };
    expect(d1.items).toHaveLength(2);
    expect(d1.nextCursor).toBeTruthy();
    // The local game is present in the list (flagged).
    const allLocalFlags = d1.items.map((i) => i.local);
    expect(allLocalFlags).toContain(true);

    // Page 2 via the cursor: the remaining game.
    const page2 = await h.query(
      'history.myGames',
      { limit: 2, cursor: d1.nextCursor },
      a.cookie,
    );
    expect(page2.ok).toBe(true);
    if (page2.ok) {
      const d2 = page2.data as { items: unknown[] };
      expect(d2.items).toHaveLength(1);
    }
  });

  it('headToHead pairs only registered users sharing finished games', async () => {
    const a = await signUp('A');
    const b = await signUp('B');
    // A vs B twice (A wins one), and A vs a guest once (must NOT appear).
    await finishedGame({ a: a.userId, b: b.userId, winnerTeam: 1 });
    await finishedGame({ a: a.userId, b: b.userId, winnerTeam: 2 });
    await finishedGame({ a: a.userId, b: null, winnerTeam: 1 }); // guest opp

    const res = await h.query('history.headToHead', undefined, a.cookie);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const data = res.data as {
      opponentId: string;
      opponentName: string;
      wins: number;
      losses: number;
      games: number;
    }[];
    // Exactly one opponent (B); the guest game is excluded.
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      opponentId: b.userId,
      wins: 1,
      losses: 1,
      games: 2,
    });
  });

  it('headToHead excludes local games', async () => {
    const a = await signUp('A');
    await finishedGame({ a: a.userId, b: null, winnerTeam: 1, local: true });
    const res = await h.query('history.headToHead', undefined, a.cookie);
    expect(res.ok).toBe(true);
    if (res.ok) expect((res.data as unknown[]).length).toBe(0);
  });
});
