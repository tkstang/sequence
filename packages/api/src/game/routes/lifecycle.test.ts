import { randomUUID } from 'node:crypto';

import {
  createGame,
  createSeededRng,
  validPlacements,
  type Card,
  type GameState,
  type Position,
} from '@sequence/game-logic';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { gameEvents, gamePlayers, games } from '../../db/schema/index.ts';
import { rooms } from '../../shared/realtime/rooms.ts';
import { createHarness, type Harness } from '../../test/harness.ts';
import { persistGameState } from '../state-mapping.ts';

/** A legal placement for `seat` given the dealt state. */
function legalMove(
  state: GameState,
  seat: number,
): { card: Card; position: Position } {
  const placements = validPlacements(
    state.hands[seat]!,
    state.board,
    state.teams[seat]!,
  );
  for (const [card, positions] of placements) {
    if (positions.length > 0) return { card, position: positions[0]! };
  }
  throw new Error('no legal move for seat');
}

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

  /**
   * Seed a real DEALT active 2p game (both seats registered users), persisted
   * via game-logic so a genuine makeMove can run. Returns at version 1, seat 0
   * to move. This lets us race a lifecycle write against a real move.
   */
  async function dealtActiveGame() {
    const host = await signUp('Host');
    const joiner = await signUp('Joiner');
    const gameId = randomUUID();
    await h.db.insert(games).values({
      id: gameId,
      inviteCode: gameId.slice(0, 10),
      createdBy: host.userId,
      playerCount: 2,
      mode: 'tap',
      status: 'lobby',
      version: 0,
    });
    await h.db.insert(gamePlayers).values([
      { gameId, seat: 0, team: 1, userId: host.userId, isCreator: true },
      { gameId, seat: 1, team: 2, userId: joiner.userId },
    ]);
    const state = createGame(
      { playerCount: 2, mode: 'tap', timerSeconds: null, local: false },
      [
        { seat: 0, team: 1 },
        { seat: 1, team: 2 },
      ],
      createSeededRng(321),
    );
    await h.db.transaction((tx) => persistGameState(tx, gameId, state, 0));
    return { host, joiner, gameId, state };
  }

  it('concede vs a concurrent move: exactly one wins, no lost transition', async () => {
    // T1: seat 0 makes a legal move (version 1). T2: seat 1 concedes. Both race.
    // Without a version-guarded concede, the move could clobber the row back to
    // active and silently lose the concede. Exactly one must linearize.
    const { host, joiner, gameId, state } = await dealtActiveGame();
    const move = legalMove(state, 0);

    const [moveRes, concedeRes] = await Promise.all([
      h.mutate(
        'game.makeMove',
        { gameId, version: 1, move: { type: 'place', ...move } },
        host.cookie,
      ),
      h.mutate('game.concede', { gameId }, joiner!.cookie),
    ]);

    const [row] = await h.db.select().from(games).where(eq(games.id, gameId));

    // Exactly one of the two writes wins; the loser gets CONFLICT. The final
    // row is internally consistent with whichever won (no lost transition).
    const okCount = [moveRes, concedeRes].filter((r) => r.ok).length;
    const conflictCount = [moveRes, concedeRes].filter(
      (r) => !r.ok && r.code === 'CONFLICT',
    ).length;
    expect(okCount).toBe(1);
    expect(conflictCount).toBe(1);

    if (concedeRes.ok) {
      // Concede won: the game is finished and stays finished (not reverted).
      expect(row?.status).toBe('finished');
      expect(row?.endReason).toBe('concede');
    } else {
      // Move won: the game is still active and the concede was rejected cleanly.
      expect(row?.status).toBe('active');
    }
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

  it('concede broadcasts the post-transition version', async () => {
    const { joiner, gameId } = await activeGame();
    const { sub, unsubscribe } = rooms.subscribe(gameId);

    const res = await h.mutate('game.concede', { gameId }, joiner!.cookie);
    expect(res.ok).toBe(true);

    const event = await Promise.race([
      sub.next(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('concede timeout')), 5000),
      ),
    ]);
    const [row] = await h.db
      .select({ version: games.version })
      .from(games)
      .where(eq(games.id, gameId));
    unsubscribe();

    expect(event?.type).toBe('GameConceded');
    expect(event?.version).toBe(row?.version);
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
      recents: { gameId: string; result: string }[];
    };
    expect(data.resumables.map((g) => g.gameId)).toContain(savedId);
    expect(data.recents.map((g) => g.gameId)).toContain(finishedId);
    expect(data.recents.find((g) => g.gameId === finishedId)?.result).toBe(
      'win',
    );
  });

  it('myGames marks no-winner FFA concede non-conceders as no result', async () => {
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
    await h.db.insert(gameEvents).values({
      gameId,
      seq: 1,
      type: 'GameConceded',
      payload: { type: 'GameConceded', team: 3 },
    });

    const resA = await h.query('game.myGames', undefined, a.cookie);
    expect(resA.ok).toBe(true);
    if (!resA.ok) return;
    expect(
      (
        resA.data as {
          recents: { gameId: string; result: string }[];
        }
      ).recents.find((g) => g.gameId === gameId)?.result,
    ).toBe('none');

    const resC = await h.query('game.myGames', undefined, c.cookie);
    expect(resC.ok).toBe(true);
    if (!resC.ok) return;
    expect(
      (
        resC.data as {
          recents: { gameId: string; result: string }[];
        }
      ).recents.find((g) => g.gameId === gameId)?.result,
    ).toBe('loss');
  });

  it('myGames requires auth', async () => {
    const res = await h.query('game.myGames', undefined);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('UNAUTHORIZED');
  });
});
