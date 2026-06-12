import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { gameEvents, gamePlayers, games } from '../../db/schema/index.ts';
import { createHarness, type Harness } from '../../test/harness.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('game.start (integration)', () => {
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
   * Build a full lobby of `playerCount` and apply `teams[seat]` to each seat.
   * Returns the creator cookie + gameId.
   */
  async function fullLobby(playerCount: 2 | 3 | 4 | 6, teams: number[]) {
    const creator = await signUp('Creator');
    const created = await h.mutate(
      'game.create',
      { playerCount, mode: 'tap' },
      creator.cookie,
    );
    if (!created.ok) throw new Error('create failed');
    const { gameId, inviteCode } = created.data as {
      gameId: string;
      inviteCode: string;
    };
    // Fill remaining seats with registered joiners.
    for (let seat = 1; seat < playerCount; seat++) {
      const u = await signUp(`P${seat}`);
      const res = await h.mutate('game.join', { inviteCode }, u.cookie);
      if (!res.ok) throw new Error('join failed');
    }
    // Apply the requested team layout via the creator.
    for (let seat = 0; seat < playerCount; seat++) {
      await h.mutate(
        'game.setTeam',
        { gameId, targetSeat: seat, team: teams[seat] },
        creator.cookie,
      );
    }
    return { creator, gameId, inviteCode };
  }

  it('creator starts a valid 4p (2v2) game → active, dealt, GameStarted', async () => {
    const { creator, gameId } = await fullLobby(4, [1, 2, 1, 2]);
    const res = await h.mutate('game.start', { gameId }, creator.cookie);
    expect(res.ok).toBe(true);

    const [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('active');
    expect(row?.currentSeat).toBe(0);

    const players = await h.db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId))
      .orderBy(gamePlayers.seat);
    // 4p deal table → 6 cards each.
    for (const p of players) expect((p.hand ?? []).length).toBe(6);

    const events = await h.db
      .select()
      .from(gameEvents)
      .where(eq(gameEvents.gameId, gameId));
    expect(events.map((e) => e.type)).toContain('GameStarted');
  });

  it('a non-creator cannot start (FORBIDDEN)', async () => {
    const { gameId, inviteCode } = await fullLobby(2, [1, 2]);
    void inviteCode;
    const intruder = await signUp('Intruder');
    // Intruder is not a participant → gamePlayerProcedure FORBIDDEN.
    const res = await h.mutate('game.start', { gameId }, intruder.cookie);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('FORBIDDEN');
  });

  it('rejects an uneven 4p team layout (BAD_REQUEST)', async () => {
    const { creator, gameId } = await fullLobby(4, [1, 1, 1, 2]);
    const res = await h.mutate('game.start', { gameId }, creator.cookie);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('BAD_REQUEST');
  });

  it('starts a 6p game as 3v3 (2 teams)', async () => {
    const { creator, gameId } = await fullLobby(6, [1, 2, 1, 2, 1, 2]);
    const res = await h.mutate('game.start', { gameId }, creator.cookie);
    expect(res.ok).toBe(true);
    const [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('active');
  });

  it('starts a 6p game as 2x3 (3 teams)', async () => {
    const { creator, gameId } = await fullLobby(6, [1, 2, 3, 1, 2, 3]);
    const res = await h.mutate('game.start', { gameId }, creator.cookie);
    expect(res.ok).toBe(true);
    const [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.status).toBe('active');
  });

  it('starts a 3p free-for-all (3 teams of 1)', async () => {
    const { creator, gameId } = await fullLobby(3, [1, 2, 3]);
    const res = await h.mutate('game.start', { gameId }, creator.cookie);
    expect(res.ok).toBe(true);
  });

  it('settings/teams are immutable after start (setTeam → CONFLICT)', async () => {
    const { creator, gameId } = await fullLobby(2, [1, 2]);
    const started = await h.mutate('game.start', { gameId }, creator.cookie);
    expect(started.ok).toBe(true);
    const res = await h.mutate(
      'game.setTeam',
      { gameId, targetSeat: 0, team: 2 },
      creator.cookie,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('CONFLICT');
  });

  it('cannot start a game that is not full (BAD_REQUEST)', async () => {
    const creator = await signUp('Solo');
    const created = await h.mutate(
      'game.create',
      { playerCount: 4, mode: 'tap' },
      creator.cookie,
    );
    if (!created.ok) throw new Error('create failed');
    const { gameId } = created.data as { gameId: string };
    const res = await h.mutate('game.start', { gameId }, creator.cookie);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('BAD_REQUEST');
  });
});
