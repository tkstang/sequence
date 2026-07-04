import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createHarness, type Harness } from '../../test/harness.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('game.access (integration)', () => {
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

  async function createGame() {
    const host = await h.signUp({
      email: `host-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'Host',
    });
    const created = await h.mutate(
      'game.create',
      { playerCount: 2, mode: 'tap' },
      host.cookie,
    );
    if (!created.ok) throw new Error('create failed');
    return {
      host,
      ...(created.data as { gameId: string; inviteCode: string }),
    };
  }

  it('confirms a registered player seat over HTTP', async () => {
    const { host, gameId } = await createGame();

    const res = await h.query('game.access', { gameId }, host.cookie);

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data).toMatchObject({
      gameId,
      seat: 0,
      team: 1,
      local: false,
    });
  });

  it('confirms a guest player seat over HTTP', async () => {
    const { gameId, inviteCode } = await createGame();
    const joined = await h.mutate('game.join', {
      inviteCode,
      guestName: 'Guest',
      returnGuestToken: true,
    });
    if (!joined.ok) throw new Error('guest join failed');
    const token = (joined.data as { guestToken?: string }).guestToken;
    expect(token).toBeTruthy();

    const res = await h.query('game.access', { gameId }, h.guestCookie(token!));

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data).toMatchObject({
      gameId,
      seat: 1,
      team: 2,
      local: false,
    });
  });

  it('rejects callers without a seat', async () => {
    const { gameId } = await createGame();

    const res = await h.query('game.access', { gameId });

    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('FORBIDDEN');
  });
});
