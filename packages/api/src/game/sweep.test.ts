import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { gameEvents, gamePlayers, games } from '../db/schema/index.ts';
import { createHarness, type Harness } from '../test/harness.ts';
import { sweepExpiredGames } from './sweep.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('sweepExpiredGames (integration)', () => {
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

  async function seedGame(opts: {
    status: 'frozen' | 'saved' | 'finished' | 'active';
    expiresAt: Date | null;
  }): Promise<string> {
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
      status: opts.status,
      expiresAt: opts.expiresAt,
      finishedAt: opts.status === 'finished' ? new Date() : null,
    });
    await h.db
      .insert(gamePlayers)
      .values({ gameId, seat: 0, team: 1, userId: host.userId });
    await h.db.transaction(async (tx) => {
      await tx
        .insert(gameEvents)
        .values({ gameId, seq: 1, type: 'GameStarted', payload: {} });
    });
    return gameId;
  }

  it('deletes expired frozen/saved games and cascades players + events', async () => {
    const past = new Date(Date.now() - 1000);
    const frozenExpired = await seedGame({ status: 'frozen', expiresAt: past });
    const savedExpired = await seedGame({ status: 'saved', expiresAt: past });

    const deleted = await sweepExpiredGames(h.db);
    expect(deleted).toEqual(
      expect.arrayContaining([frozenExpired, savedExpired]),
    );

    // The games and their children are gone.
    for (const id of [frozenExpired, savedExpired]) {
      const g = await h.db.select().from(games).where(eq(games.id, id));
      expect(g).toHaveLength(0);
      const players = await h.db
        .select()
        .from(gamePlayers)
        .where(eq(gamePlayers.gameId, id));
      expect(players).toHaveLength(0);
      const events = await h.db
        .select()
        .from(gameEvents)
        .where(eq(gameEvents.gameId, id));
      expect(events).toHaveLength(0);
    }
  });

  it('never touches finished games (history) or unexpired games', async () => {
    const past = new Date(Date.now() - 1000);
    const future = new Date(Date.now() + 60 * 60 * 1000);
    const finished = await seedGame({ status: 'finished', expiresAt: past });
    const savedFuture = await seedGame({ status: 'saved', expiresAt: future });

    const deleted = await sweepExpiredGames(h.db);
    expect(deleted).not.toContain(finished);
    expect(deleted).not.toContain(savedFuture);

    const f = await h.db.select().from(games).where(eq(games.id, finished));
    expect(f).toHaveLength(1);
    const s = await h.db.select().from(games).where(eq(games.id, savedFuture));
    expect(s).toHaveLength(1);
  });
});
