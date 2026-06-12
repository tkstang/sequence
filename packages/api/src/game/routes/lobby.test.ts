import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { gameEvents, gamePlayers } from '../../db/schema/index.ts';
import { createHarness, type Harness } from '../../test/harness.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('lobby operations (integration)', () => {
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

  /** Create a 4p game and have `joiners` join; returns ids + cookies. */
  async function lobbyWithJoiners(joinerLabels: string[]) {
    const creator = await signUp('Creator');
    const created = await h.mutate(
      'game.create',
      { playerCount: 4, mode: 'tap' },
      creator.cookie,
    );
    if (!created.ok) throw new Error('create failed');
    const { gameId, inviteCode } = created.data as {
      gameId: string;
      inviteCode: string;
    };
    const joiners = [];
    for (const label of joinerLabels) {
      const u = await signUp(label);
      const res = await h.mutate('game.join', { inviteCode }, u.cookie);
      if (!res.ok) throw new Error('join failed');
      joiners.push({ ...u, ...(res.data as { seat: number }) });
    }
    return { creator, gameId, inviteCode, joiners };
  }

  it('a player sets their own team (self-sort)', async () => {
    const { gameId, joiners } = await lobbyWithJoiners(['Bob']);
    const bob = joiners[0]!;
    const res = await h.mutate(
      'game.setTeam',
      { gameId, targetSeat: bob.seat, team: 1 },
      bob.cookie,
    );
    expect(res.ok).toBe(true);
    const [row] = await h.db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId));
    expect(
      (
        await h.db
          .select()
          .from(gamePlayers)
          .where(eq(gamePlayers.gameId, gameId))
      ).find((p) => p.seat === bob.seat)?.team,
    ).toBe(1);
    expect(row).toBeTruthy();
  });

  it('the creator may move another player', async () => {
    const { creator, gameId, joiners } = await lobbyWithJoiners(['Bob']);
    const res = await h.mutate(
      'game.setTeam',
      { gameId, targetSeat: joiners[0]!.seat, team: 1 },
      creator.cookie,
    );
    expect(res.ok).toBe(true);
  });

  it('a non-creator moving another seat is FORBIDDEN', async () => {
    const { gameId, joiners } = await lobbyWithJoiners(['Bob', 'Carol']);
    const bob = joiners[0]!;
    const carol = joiners[1]!;
    const res = await h.mutate(
      'game.setTeam',
      { gameId, targetSeat: carol.seat, team: 1 },
      bob.cookie,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('FORBIDDEN');
  });

  it('the creator can kick a player; a non-creator cannot', async () => {
    const { creator, gameId, joiners } = await lobbyWithJoiners([
      'Bob',
      'Carol',
    ]);
    const bob = joiners[0]!;
    const carol = joiners[1]!;

    // Non-creator kick → FORBIDDEN.
    const denied = await h.mutate(
      'game.kick',
      { gameId, targetSeat: carol.seat },
      bob.cookie,
    );
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.code).toBe('FORBIDDEN');

    // Creator kick → seat freed.
    const ok = await h.mutate(
      'game.kick',
      { gameId, targetSeat: carol.seat },
      creator.cookie,
    );
    expect(ok.ok).toBe(true);
    const remaining = await h.db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId));
    expect(remaining.find((p) => p.seat === carol.seat)).toBeUndefined();
  });

  it('the creator cannot kick themselves', async () => {
    const { creator, gameId } = await lobbyWithJoiners([]);
    const res = await h.mutate(
      'game.kick',
      { gameId, targetSeat: 0 },
      creator.cookie,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('BAD_REQUEST');
  });

  it('randomize assigns even, seat-alternating teams (creator only)', async () => {
    const { creator, gameId } = await lobbyWithJoiners([
      'Bob',
      'Carol',
      'Dave',
    ]);
    const res = await h.mutate(
      'game.randomizeTeams',
      { gameId },
      creator.cookie,
    );
    expect(res.ok).toBe(true);

    const players = await h.db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId))
      .orderBy(gamePlayers.seat);
    expect(players).toHaveLength(4);
    // 4p → 2 teams of 2, alternating by seat.
    const teams = players.map((p) => p.team);
    expect(new Set(teams).size).toBe(2);
    for (let i = 1; i < teams.length; i++) {
      expect(teams[i]).not.toBe(teams[i - 1]);
    }
  });

  it('non-creator randomize is FORBIDDEN', async () => {
    const { gameId, joiners } = await lobbyWithJoiners(['Bob']);
    const res = await h.mutate(
      'game.randomizeTeams',
      { gameId },
      joiners[0]!.cookie,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('FORBIDDEN');
  });

  it('lobby ops emit events (PlayerJoined on join, TeamChanged on setTeam)', async () => {
    const { gameId, joiners } = await lobbyWithJoiners(['Bob']);
    await h.mutate(
      'game.setTeam',
      { gameId, targetSeat: joiners[0]!.seat, team: 1 },
      joiners[0]!.cookie,
    );
    const events = await h.db
      .select()
      .from(gameEvents)
      .where(eq(gameEvents.gameId, gameId))
      .orderBy(gameEvents.seq);
    const types = events.map((e) => e.type);
    expect(types).toContain('PlayerJoined');
    expect(types).toContain('TeamChanged');
  });
});
