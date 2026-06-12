import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { gamePlayers, games } from '../../db/schema/index.ts';
import { createHarness, type Harness } from '../../test/harness.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('game.create (integration)', () => {
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

  async function host(name = 'Host') {
    return h.signUp({
      email: `host-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name,
    });
  }

  it('rejects an anonymous create with UNAUTHORIZED', async () => {
    const res = await h.mutate('game.create', {
      playerCount: 4,
      mode: 'tap',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('UNAUTHORIZED');
  });

  it('creates a lobby game with an invite code for an authed user', async () => {
    const user = await host();
    const res = await h.mutate(
      'game.create',
      { playerCount: 4, mode: 'tap', timerSeconds: null },
      user.cookie,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const data = res.data as {
      gameId: string;
      inviteCode: string;
      status: string;
    };
    expect(data.status).toBe('lobby');
    // ~10-char unambiguous alphabet (no 0/O/1/I/L).
    expect(data.inviteCode).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);

    // Creator is seated at seat 0; no hands dealt yet (lobby).
    const players = await h.db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, data.gameId));
    expect(players).toHaveLength(1);
    expect(players[0]?.seat).toBe(0);
    expect(players[0]?.userId).toBe(user.userId);
    expect(players[0]?.isCreator).toBe(true);
  });

  it('rejects an invalid player count at the zod boundary', async () => {
    const user = await host();
    const res = await h.mutate(
      'game.create',
      { playerCount: 5, mode: 'tap' },
      user.cookie,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('BAD_REQUEST');
  });

  it('rejects an illegal timer step', async () => {
    const user = await host();
    // 45s is not a 30s step; 200s is not a 60s step beyond 180.
    for (const timerSeconds of [45, 200, 25]) {
      const res = await h.mutate(
        'game.create',
        { playerCount: 2, mode: 'tap', timerSeconds },
        user.cookie,
      );
      expect(res.ok, `timer ${timerSeconds}`).toBe(false);
    }
    // 30, 180, 240 are all valid steps.
    for (const timerSeconds of [30, 180, 240]) {
      const res = await h.mutate(
        'game.create',
        { playerCount: 2, mode: 'tap', timerSeconds },
        user.cookie,
      );
      expect(res.ok, `timer ${timerSeconds}`).toBe(true);
    }
  });

  it('local game: skips the lobby, seats both, deals hands, goes active', async () => {
    const user = await host('Local Host');
    const res = await h.mutate(
      'game.create',
      {
        playerCount: 2,
        mode: 'tap',
        timerSeconds: null,
        local: true,
        opponentName: 'Couch Rival',
      },
      user.cookie,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const data = res.data as { gameId: string; status: string };
    expect(data.status).toBe('active');

    const [row] = await h.db
      .select()
      .from(games)
      .where(eq(games.id, data.gameId));
    expect(row?.local).toBe(true);
    expect(row?.currentSeat).toBe(0);

    const players = await h.db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, data.gameId))
      .orderBy(gamePlayers.seat);
    expect(players).toHaveLength(2);
    expect(players[0]?.userId).toBe(user.userId);
    expect(players[1]?.guestName).toBe('Couch Rival');
    expect(players[1]?.userId).toBeNull();
    // 2-player deal table → 7 cards each.
    expect((players[0]?.hand ?? []).length).toBe(7);
    expect((players[1]?.hand ?? []).length).toBe(7);
  });

  it('local game requires playerCount 2 and an opponentName', async () => {
    const user = await host();
    const noName = await h.mutate(
      'game.create',
      { playerCount: 2, mode: 'tap', local: true },
      user.cookie,
    );
    expect(noName.ok).toBe(false);

    const wrongCount = await h.mutate(
      'game.create',
      { playerCount: 4, mode: 'tap', local: true, opponentName: 'X' },
      user.cookie,
    );
    expect(wrongCount.ok).toBe(false);
  });

  it('issues unique invite codes across games', async () => {
    const user = await host();
    const codes = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const res = await h.mutate(
        'game.create',
        { playerCount: 2, mode: 'tap' },
        user.cookie,
      );
      expect(res.ok).toBe(true);
      if (res.ok) codes.add((res.data as { inviteCode: string }).inviteCode);
    }
    expect(codes.size).toBe(5);
  });
});
