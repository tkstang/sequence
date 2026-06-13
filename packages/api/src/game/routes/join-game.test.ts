import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { gamePlayers } from '../../db/schema/index.ts';
import { createHarness, type Harness } from '../../test/harness.ts';
import { GUEST_COOKIE_NAME } from '../../trpc.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('game.preview / game.join (integration)', () => {
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

  async function createGame(playerCount = 4) {
    const host = await h.signUp({
      email: `host-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'Host',
    });
    const res = await h.mutate(
      'game.create',
      { playerCount, mode: 'tap' },
      host.cookie,
    );
    if (!res.ok) throw new Error('create failed');
    const data = res.data as { gameId: string; inviteCode: string };
    return { host, ...data };
  }

  it('preview is public and returns roster + settings, never hands', async () => {
    const { inviteCode, gameId } = await createGame();
    const res = await h.query('game.preview', { inviteCode });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const data = res.data as Record<string, unknown>;
    expect(data.gameId).toBe(gameId);
    expect(data.status).toBe('lobby');
    expect(data.playerCount).toBe(4);
    // No hand/deck fields anywhere in the serialized preview.
    expect(JSON.stringify(data)).not.toMatch(/hand|deck/i);
  });

  it('preview is NOT_FOUND for an unknown code', async () => {
    const res = await h.query('game.preview', { inviteCode: 'ZZZZZZZZZZ' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('NOT_FOUND');
  });

  it('a registered user joins and occupies the next open seat', async () => {
    const { inviteCode, gameId } = await createGame();
    const joiner = await h.signUp({
      email: `joiner-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'Joiner',
    });
    const res = await h.mutate('game.join', { inviteCode }, joiner.cookie);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect((res.data as { seat: number }).seat).toBe(1); // creator holds seat 0

    const players = await h.db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId));
    expect(players).toHaveLength(2);
  });

  it('a re-join by the same user is idempotent (same seat, no dup row)', async () => {
    const { inviteCode, gameId } = await createGame();
    const joiner = await h.signUp({
      email: `joiner-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'Joiner',
    });
    const first = await h.mutate('game.join', { inviteCode }, joiner.cookie);
    const second = await h.mutate('game.join', { inviteCode }, joiner.cookie);
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect((first.data as { seat: number }).seat).toBe(
        (second.data as { seat: number }).seat,
      );
    }
    const players = await h.db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId));
    expect(players).toHaveLength(2); // creator + one joiner, not three
  });

  it('a guest join issues a game-scoped cookie and stores its hash', async () => {
    const { inviteCode, gameId } = await createGame();
    // Drive join directly via fetch to read the Set-Cookie header.
    const res = await fetch(`${h.baseUrl}/trpc/game.join`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ inviteCode, guestName: 'Couch Guest' }),
    });
    expect(res.ok).toBe(true);
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain(`${GUEST_COOKIE_NAME}=`);
    expect(setCookie.toLowerCase()).toContain('httponly');

    const players = await h.db
      .select()
      .from(gamePlayers)
      .where(eq(gamePlayers.gameId, gameId));
    const guest = players.find((p) => p.guestName === 'Couch Guest');
    expect(guest?.guestTokenHash).toBeTruthy();
    expect(guest?.userId).toBeNull();
  });

  it('anonymous join without a guestName is BAD_REQUEST', async () => {
    const { inviteCode } = await createGame();
    const res = await h.mutate('game.join', { inviteCode });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('BAD_REQUEST');
  });

  it('join is rejected (CONFLICT) when the game is full', async () => {
    const { inviteCode } = await createGame(2); // creator + 1 open seat
    const a = await h.signUp({
      email: `a-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'A',
    });
    const b = await h.signUp({
      email: `b-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'B',
    });
    const first = await h.mutate('game.join', { inviteCode }, a.cookie);
    expect(first.ok).toBe(true); // fills seat 1 (game now full)
    const second = await h.mutate('game.join', { inviteCode }, b.cookie);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.code).toBe('CONFLICT');
  });

  it('preview and join are rate-limited (shared anonymous limiter)', async () => {
    const { inviteCode } = await createGame();
    // The shared limiter is 30/min. Burst past it on preview and expect a 429
    // (TOO_MANY_REQUESTS) before the window resets. Anonymous preview/join
    // traffic intentionally shares one bucket in production because proxy IP
    // attribution was not stable enough on Railway.
    let limited = false;
    for (let i = 0; i < 40; i++) {
      const res = await h.query('game.preview', { inviteCode });
      if (!res.ok && res.code === 'TOO_MANY_REQUESTS') {
        limited = true;
        break;
      }
    }
    expect(limited).toBe(true);
  });

  it('rotating spoofed XFF headers cannot bypass the anonymous invite limiter', async () => {
    const { inviteCode } = await createGame();
    const input = encodeURIComponent(JSON.stringify({ inviteCode }));

    let limited = false;
    for (let i = 0; i < 40; i++) {
      const res = await fetch(`${h.baseUrl}/trpc/game.preview?input=${input}`, {
        headers: { 'x-forwarded-for': `203.0.113.${i}` },
      });
      const json = (await res.json()) as {
        error?: { data?: { code?: string } };
      };
      if (json.error?.data?.code === 'TOO_MANY_REQUESTS') {
        limited = true;
        break;
      }
    }

    expect(limited).toBe(true);
  });
});
