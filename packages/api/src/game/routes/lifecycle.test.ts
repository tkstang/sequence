import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { gamePlayers, games } from '../../db/schema/index.ts';
import { createHarness, type Harness } from '../../test/harness.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('save / concede / myGames (integration)', () => {
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

  /** Seed an active 2p game with two registered users. */
  async function activeGame(
    opts: { guestSeat?: boolean; local?: boolean } = {},
  ) {
    const host = await signUp('Host');
    const joiner = opts.guestSeat ? null : await signUp('Joiner');
    const gameId = randomUUID();
    await h.db.insert(games).values({
      id: gameId,
      inviteCode: gameId.slice(0, 10),
      createdBy: host.userId,
      local: opts.local ?? false,
      playerCount: 2,
      mode: 'tap',
      status: 'active',
      version: 2,
      currentSeat: 0,
    });
    await h.db.insert(gamePlayers).values([
      { gameId, seat: 0, team: 1, userId: host.userId, isCreator: true },
      opts.guestSeat
        ? {
            gameId,
            seat: 1,
            team: 2,
            guestName: 'Guest',
            guestTokenHash: 'somehash',
          }
        : { gameId, seat: 1, team: 2, userId: joiner!.userId },
    ]);
    return { host, joiner, gameId };
  }

  it('saveAndExit moves the game to saved with a 1-week expiry', async () => {
    const { host, gameId } = await activeGame();
    const res = await h.mutate('game.saveAndExit', { gameId }, host.cookie);
    expect(res.ok).toBe(true);
    const [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('saved');
    expect(row?.expiresAt).toBeTruthy();
    // ~1 week out.
    const ms = row!.expiresAt!.getTime() - Date.now();
    expect(ms).toBeGreaterThan(6 * 24 * 3600 * 1000);
  });

  it('a non-local game with a guest seat cannot be saved (FR10)', async () => {
    const { host, gameId } = await activeGame({ guestSeat: true });
    const res = await h.mutate('game.saveAndExit', { gameId }, host.cookie);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('BAD_REQUEST');
  });

  it('a local game CAN be saved even with a named opponent (FR16)', async () => {
    const { host, gameId } = await activeGame({ guestSeat: true, local: true });
    const res = await h.mutate('game.saveAndExit', { gameId }, host.cookie);
    expect(res.ok).toBe(true);
    const [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('saved');
  });

  it('concede finishes the game, records the loss, and sets the other team winner', async () => {
    const { joiner, gameId } = await activeGame();
    // Seat 1 (team 2) concedes → team 1 wins.
    const res = await h.mutate('game.concede', { gameId }, joiner!.cookie);
    expect(res.ok).toBe(true);
    const [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('finished');
    expect(row?.endReason).toBe('concede');
    expect(row?.winnerTeam).toBe(1);
    expect(row?.finishedAt).toBeTruthy();
  });

  it('myGames returns the user resumables and recents', async () => {
    const host = await signUp('Dash');
    // A saved (resumable) game and a finished (recent) game for this user.
    const savedId = randomUUID();
    const finishedId = randomUUID();
    await h.db.insert(games).values([
      {
        id: savedId,
        inviteCode: savedId.slice(0, 10),
        createdBy: host.userId,
        playerCount: 2,
        mode: 'tap',
        status: 'saved',
        expiresAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
      },
      {
        id: finishedId,
        inviteCode: finishedId.slice(0, 10),
        createdBy: host.userId,
        playerCount: 2,
        mode: 'tap',
        status: 'finished',
        winnerTeam: 1,
        endReason: 'win',
        finishedAt: new Date(),
      },
    ]);
    await h.db.insert(gamePlayers).values([
      {
        gameId: savedId,
        seat: 0,
        team: 1,
        userId: host.userId,
        isCreator: true,
      },
      {
        gameId: finishedId,
        seat: 0,
        team: 1,
        userId: host.userId,
        isCreator: true,
      },
    ]);

    const res = await h.query('game.myGames', undefined, host.cookie);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const data = res.data as {
      resumables: { gameId: string }[];
      recents: { gameId: string }[];
    };
    expect(data.resumables.map((g) => g.gameId)).toContain(savedId);
    expect(data.recents.map((g) => g.gameId)).toContain(finishedId);
  });

  it('myGames requires auth', async () => {
    const res = await h.query('game.myGames', undefined);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('UNAUTHORIZED');
  });
});
