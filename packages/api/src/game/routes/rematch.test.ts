import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { gamePlayers, games } from '../../db/schema/index.ts';
import { createHarness, type Harness } from '../../test/harness.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('game.rematch (integration)', () => {
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

  /** Seed a finished 2p game with two registered users. */
  async function finishedGame() {
    const host = await signUp('Host');
    const joiner = await signUp('Joiner');
    const gameId = randomUUID();
    await h.db.insert(games).values({
      id: gameId,
      inviteCode: gameId.slice(0, 10),
      createdBy: host.userId,
      playerCount: 2,
      mode: 'tap',
      timerSeconds: 60,
      status: 'finished',
      winnerTeam: 1,
      endReason: 'win',
      finishedAt: new Date(),
    });
    await h.db.insert(gamePlayers).values([
      { gameId, seat: 0, team: 1, userId: host.userId, isCreator: true },
      { gameId, seat: 1, team: 2, userId: joiner.userId },
    ]);
    return { host, joiner, gameId };
  }

  it('creates a linked new game with same roster/settings, rotated first player', async () => {
    const { host, joiner, gameId } = await finishedGame();
    const res = await h.mutate('game.rematch', { gameId }, host.cookie);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const data = res.data as {
      gameId: string;
      rematchOf: string;
      status: string;
    };
    expect(data.rematchOf).toBe(gameId);

    const [newGame] = await h.db
      .select()
      .from(games)
      .where(eq(games.id, data.gameId));
    expect(newGame?.rematchOf).toBe(gameId);
    expect(newGame?.playerCount).toBe(2);
    expect(newGame?.timerSeconds).toBe(60); // settings carried over
    expect(newGame?.mode).toBe('tap');

    const newPlayers = await h.db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, data.gameId))
      .orderBy(gamePlayers.seat);
    expect(newPlayers).toHaveLength(2);
    // First player rotated: seat 0 in the new game is the player who was seat 1
    // (the joiner) in the old game.
    expect(newPlayers[0]?.userId).toBe(joiner.userId);
    expect(newPlayers[1]?.userId).toBe(host.userId);
    // Same users present (no new invite needed for them).
    expect(new Set(newPlayers.map((p) => p.userId))).toEqual(
      new Set([host.userId, joiner.userId]),
    );
  });

  it('rejects a rematch of a non-finished game', async () => {
    const { host, gameId } = await finishedGame();
    await h.db
      .update(games)
      .set({ status: 'active' })
      .where(eq(games.id, gameId));
    const res = await h.mutate('game.rematch', { gameId }, host.cookie);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('CONFLICT');
  });
});
