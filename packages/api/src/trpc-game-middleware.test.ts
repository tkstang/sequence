import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { gamePlayers, games } from './db/schema/index.ts';
import { createHarness, type Harness } from './test/harness.ts';
import { hashToken, issueGuestToken } from './user/guest-tokens.ts';

// Integration suite — requires a real Postgres (the Neon test branch). Skips
// cleanly when DATABASE_URL_TEST is absent so other environments stay green.
const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('gamePlayerProcedure (integration)', () => {
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

  /** Insert a game with the given players; returns the gameId. */
  async function seedGame(opts: {
    createdBy: string;
    local?: boolean;
    currentSeat?: number;
    players: {
      seat: number;
      team: number;
      userId?: string;
      guestName?: string;
      guestTokenHash?: string;
    }[];
  }): Promise<string> {
    const gameId = randomUUID();
    await h.db.insert(games).values({
      id: gameId,
      inviteCode: gameId.slice(0, 10),
      createdBy: opts.createdBy,
      local: opts.local ?? false,
      playerCount: 2,
      mode: 'tap',
      status: 'active',
      currentSeat: opts.currentSeat ?? 1,
    });
    await h.db.insert(gamePlayers).values(
      opts.players.map((p) => ({
        gameId,
        seat: p.seat,
        team: p.team,
        userId: p.userId ?? null,
        guestName: p.guestName ?? null,
        guestTokenHash: p.guestTokenHash ?? null,
      })),
    );
    return gameId;
  }

  it('resolves the seat for a session user who occupies a seat', async () => {
    const user = await h.signUp({
      email: 'p1@example.com',
      password: 'supersecret123',
      name: 'Player One',
    });
    const gameId = await seedGame({
      createdBy: user.userId,
      players: [
        { seat: 1, team: 1, userId: user.userId },
        { seat: 2, team: 2, guestName: 'Guest' },
      ],
    });

    const res = await h.whoSeat(gameId, user.cookie);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.seat).toMatchObject({
        gameId,
        seat: 1,
        team: 1,
        isLocal: false,
      });
    }
  });

  it('resolves the seat for a valid guest cookie', async () => {
    const creator = await h.signUp({
      email: 'host@example.com',
      password: 'supersecret123',
      name: 'Host',
    });
    // A guest token binds to a specific game; mint it for a known id, then seed
    // the seat carrying that token's hash (what the join route does in p04).
    const gameId = randomUUID();
    const token = issueGuestToken(gameId, 2, h.env.BETTER_AUTH_SECRET);
    await h.db.insert(games).values({
      id: gameId,
      inviteCode: gameId.slice(0, 10),
      createdBy: creator.userId,
      playerCount: 2,
      mode: 'tap',
      status: 'active',
      currentSeat: 1,
    });
    await h.db.insert(gamePlayers).values([
      { gameId, seat: 1, team: 1, userId: creator.userId },
      {
        gameId,
        seat: 2,
        team: 2,
        guestName: 'Couch Guest',
        guestTokenHash: hashToken(token),
      },
    ]);

    const res = await h.whoSeat(gameId, h.guestCookie(token));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.seat).toMatchObject({ gameId, seat: 2, team: 2 });
    }
  });

  it('rejects a guest token whose hash is not on any seat (FORBIDDEN)', async () => {
    const creator = await h.signUp({
      email: 'host2@example.com',
      password: 'supersecret123',
      name: 'Host2',
    });
    const gameId = await seedGame({
      createdBy: creator.userId,
      players: [
        { seat: 1, team: 1, userId: creator.userId },
        { seat: 2, team: 2, guestName: 'Couch Guest' },
      ],
    });
    // Valid signature, but no matching hash stored — not a participant.
    const token = issueGuestToken(gameId, 2, h.env.BETTER_AUTH_SECRET);
    const res = await h.whoSeat(gameId, h.guestCookie(token));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('FORBIDDEN');
  });

  it('returns FORBIDDEN for a session user who is not a participant', async () => {
    const owner = await h.signUp({
      email: 'owner@example.com',
      password: 'supersecret123',
      name: 'Owner',
    });
    const outsider = await h.signUp({
      email: 'outsider@example.com',
      password: 'supersecret123',
      name: 'Outsider',
    });
    const gameId = await seedGame({
      createdBy: owner.userId,
      players: [
        { seat: 1, team: 1, userId: owner.userId },
        { seat: 2, team: 2, guestName: 'Guest' },
      ],
    });

    const res = await h.whoSeat(gameId, outsider.cookie);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('FORBIDDEN');
  });

  it('returns FORBIDDEN for an anonymous caller', async () => {
    const owner = await h.signUp({
      email: 'owner2@example.com',
      password: 'supersecret123',
      name: 'Owner2',
    });
    const gameId = await seedGame({
      createdBy: owner.userId,
      players: [{ seat: 1, team: 1, userId: owner.userId }],
    });
    const res = await h.whoSeat(gameId);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('FORBIDDEN');
  });

  it('authorizes the creator session for a local game (both seats)', async () => {
    const creator = await h.signUp({
      email: 'local@example.com',
      password: 'supersecret123',
      name: 'Local Host',
    });
    const gameId = await seedGame({
      createdBy: creator.userId,
      local: true,
      currentSeat: 2,
      players: [
        { seat: 1, team: 1, userId: creator.userId },
        { seat: 2, team: 2, guestName: 'Opponent' },
      ],
    });

    const res = await h.whoSeat(gameId, creator.cookie);
    expect(res.ok).toBe(true);
    if (res.ok) {
      // Local game: creator covers every seat; the resolved seat tracks the
      // game's current seat (2 here).
      expect(res.seat).toMatchObject({ gameId, seat: 2, isLocal: true });
    }
  });
});
