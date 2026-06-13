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

  it('a 3-team FFA concede records a loss only for the conceding team', async () => {
    // Three registered users, one per FFA team. User C concedes (no winner).
    // C must take the loss; A and B (who did not concede) record neither.
    const a = await signUp('A');
    const b = await signUp('B');
    const c = await signUp('C');
    const gameId = randomUUID();
    await h.db.insert(games).values({
      id: gameId,
      inviteCode: gameId.slice(0, 10),
      createdBy: a.userId,
      playerCount: 3,
      mode: 'tap',
      status: 'finished',
      winnerTeam: null, // FFA concede → no single winner
      endReason: 'concede',
      finishedAt: new Date(),
    });
    await h.db.insert(gamePlayers).values([
      { gameId, seat: 0, team: 1, userId: a.userId, isCreator: true },
      { gameId, seat: 1, team: 2, userId: b.userId },
      { gameId, seat: 2, team: 3, userId: c.userId },
    ]);
    // The GameConceded event records the conceding team (team 3 = user C).
    await h.db.insert(h.schema.gameEvents).values({
      gameId,
      seq: 1,
      type: 'GameConceded',
      payload: { type: 'GameConceded', team: 3 },
    });

    const recA = await h.query('history.myRecord', undefined, a.cookie);
    const recB = await h.query('history.myRecord', undefined, b.cookie);
    const recC = await h.query('history.myRecord', undefined, c.cookie);
    expect(recA.ok && recA.data).toMatchObject({
      wins: 0,
      losses: 0,
      total: 0,
    });
    expect(recB.ok && recB.data).toMatchObject({
      wins: 0,
      losses: 0,
      total: 0,
    });
    expect(recC.ok && recC.data).toMatchObject({
      wins: 0,
      losses: 1,
      total: 1,
    });
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

  it('history.myGames marks no-winner FFA concede non-conceders as no result', async () => {
    const a = await signUp('A');
    const b = await signUp('B');
    const c = await signUp('C');
    const gameId = randomUUID();
    await h.db.insert(games).values({
      id: gameId,
      inviteCode: gameId.slice(0, 10),
      createdBy: a.userId,
      playerCount: 3,
      mode: 'tap',
      status: 'finished',
      winnerTeam: null,
      endReason: 'concede',
      finishedAt: new Date(),
    });
    await h.db.insert(gamePlayers).values([
      { gameId, seat: 0, team: 1, userId: a.userId, isCreator: true },
      { gameId, seat: 1, team: 2, userId: b.userId },
      { gameId, seat: 2, team: 3, userId: c.userId },
    ]);
    await h.db.insert(h.schema.gameEvents).values({
      gameId,
      seq: 1,
      type: 'GameConceded',
      payload: { type: 'GameConceded', team: 3 },
    });

    const resA = await h.query('history.myGames', { limit: 5 }, a.cookie);
    expect(resA.ok).toBe(true);
    if (!resA.ok) return;
    expect(
      (
        resA.data as {
          items: { gameId: string; result: string }[];
        }
      ).items.find((g) => g.gameId === gameId)?.result,
    ).toBe('none');

    const resC = await h.query('history.myGames', { limit: 5 }, c.cookie);
    expect(resC.ok).toBe(true);
    if (!resC.ok) return;
    expect(
      (
        resC.data as {
          items: { gameId: string; result: string }[];
        }
      ).items.find((g) => g.gameId === gameId)?.result,
    ).toBe('loss');
  });

  it('history.myGames does not skip rows when finished_at ties across a page', async () => {
    const a = await signUp('A');
    const b = await signUp('B');
    // Three games that ALL finished at the same instant — a finished_at tie that
    // a finished_at-only cursor would skip across a page boundary.
    const tie = new Date(Date.now() - 1000);
    await finishedGame({
      a: a.userId,
      b: b.userId,
      winnerTeam: 1,
      finishedAt: tie,
    });
    await finishedGame({
      a: a.userId,
      b: b.userId,
      winnerTeam: 2,
      finishedAt: tie,
    });
    await finishedGame({
      a: a.userId,
      b: b.userId,
      winnerTeam: 1,
      finishedAt: tie,
    });

    const seen = new Set<string>();
    let cursor: string | null = null;
    // Page through 2 at a time; the composite (finished_at, id) cursor must
    // surface all three distinct games with no skips and no duplicates.
    for (let page = 0; page < 5; page++) {
      const res = await h.query(
        'history.myGames',
        cursor ? { limit: 2, cursor } : { limit: 2 },
        a.cookie,
      );
      expect(res.ok).toBe(true);
      if (!res.ok) break;
      const data = res.data as {
        items: { gameId: string }[];
        nextCursor: string | null;
      };
      for (const item of data.items) seen.add(item.gameId);
      cursor = data.nextCursor;
      if (!cursor) break;
    }
    expect(seen.size).toBe(3);
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

  it('headToHead scores a no-winner FFA concede only against the conceder (matches myRecord)', async () => {
    // 3-team FFA: A (t1), B (t2), C (t3). C concedes → no winner_team.
    // myRecord semantics: only C takes the loss; A and B record neither.
    // So head-to-head must NOT count this game as a loss for A or B against
    // each other (the prior bug scored it a loss for BOTH). From C's side, the
    // concede is a loss versus each registered opponent.
    const a = await signUp('A');
    const b = await signUp('B');
    const c = await signUp('C');
    const gameId = randomUUID();
    await h.db.insert(games).values({
      id: gameId,
      inviteCode: gameId.slice(0, 10),
      createdBy: a.userId,
      playerCount: 3,
      mode: 'tap',
      status: 'finished',
      winnerTeam: null,
      endReason: 'concede',
      finishedAt: new Date(),
    });
    await h.db.insert(gamePlayers).values([
      { gameId, seat: 0, team: 1, userId: a.userId, isCreator: true },
      { gameId, seat: 1, team: 2, userId: b.userId },
      { gameId, seat: 2, team: 3, userId: c.userId },
    ]);
    await h.db.insert(h.schema.gameEvents).values({
      gameId,
      seq: 1,
      type: 'GameConceded',
      payload: { type: 'GameConceded', team: 3 }, // C conceded
    });

    // A's head-to-head: the no-winner concede is not a decided result for A, so
    // A has zero recorded head-to-head games (B is excluded entirely).
    const resA = await h.query('history.headToHead', undefined, a.cookie);
    expect(resA.ok).toBe(true);
    if (resA.ok) expect((resA.data as unknown[]).length).toBe(0);

    // C conceded → a loss against each registered opponent (A and B).
    const resC = await h.query('history.headToHead', undefined, c.cookie);
    expect(resC.ok).toBe(true);
    if (!resC.ok) return;
    const dataC = resC.data as {
      wins: number;
      losses: number;
      games: number;
    }[];
    expect(dataC).toHaveLength(2);
    for (const row of dataC) {
      expect(row).toMatchObject({ wins: 0, losses: 1, games: 1 });
    }
  });
});
