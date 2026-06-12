import { randomUUID } from 'node:crypto';

import { createGame, createSeededRng } from '@sequence/game-logic';
import type { GameState } from '@sequence/game-logic';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { gameEvents, games } from '../db/schema/index.ts';
import { createHarness, type Harness } from '../test/harness.ts';
import {
  appendEvents,
  loadGameState,
  persistGameState,
  VersionConflictError,
} from './state-mapping.ts';

// Integration suite — requires the Neon test branch. Skips cleanly otherwise.
const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('state-mapping (integration)', () => {
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

  /**
   * Seed a lobby `games` row + `game_players` rows, then write a freshly-created
   * (active, dealt) `GameState` into them via `persistGameState`. Returns the id
   * and the state that was written.
   */
  async function seedActiveGame(): Promise<{
    gameId: string;
    userId: string;
    state: GameState;
  }> {
    const user = await h.signUp({
      email: `host-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'Host',
    });
    const gameId = randomUUID();
    await h.db.insert(games).values({
      id: gameId,
      inviteCode: gameId.slice(0, 10),
      createdBy: user.userId,
      playerCount: 2,
      mode: 'tap',
      status: 'lobby',
      version: 0,
    });
    await h.db.insert(h.schema.gamePlayers).values([
      { gameId, seat: 0, team: 1, userId: user.userId, isCreator: true },
      { gameId, seat: 1, team: 2, guestName: 'Opponent' },
    ]);

    const state = createGame(
      { playerCount: 2, mode: 'tap', timerSeconds: null, local: false },
      [
        { seat: 0, team: 1 },
        { seat: 1, team: 2 },
      ],
      createSeededRng(42),
    );

    await h.db.transaction(async (tx) => {
      await persistGameState(tx, gameId, state, 0);
    });

    return { gameId, userId: user.userId, state };
  }

  it('round-trips a freshly created game state through the DB', async () => {
    const { gameId, state } = await seedActiveGame();

    const loaded = await h.db.transaction((tx) => loadGameState(tx, gameId));

    expect(loaded.status).toBe('active');
    expect(loaded.settings).toEqual(state.settings);
    expect(loaded.currentSeat).toBe(state.currentSeat);
    expect(loaded.round).toBe(state.round);
    expect(loaded.teams).toEqual(state.teams);
    // Hands assemble from game_players rows, indexed by seat.
    expect(loaded.hands).toEqual(state.hands);
    expect(loaded.deck).toEqual(state.deck);
    expect(loaded.played).toEqual(state.played);
    expect(loaded.sequences).toEqual(state.sequences);
    expect([...loaded.board.entries()]).toEqual([...state.board.entries()]);
    expect(loaded.nextSequenceId).toBe(state.nextSequenceId);
  });

  it('persists a mutated state and reloads it identically (board + hands diff)', async () => {
    const { gameId, state } = await seedActiveGame();

    // Mutate: place a chip for seat 0, drop a card from its hand, advance.
    const placedPos = '1AC';
    const board = new Map(state.board);
    board.set(placedPos, { chip: 1 });
    const hands = state.hands.map((hand, i) =>
      i === 0 ? hand.slice(1) : hand,
    );
    const mutated: GameState = {
      ...state,
      board,
      hands,
      currentSeat: 1,
      round: 1,
    };

    await h.db.transaction((tx) => persistGameState(tx, gameId, mutated, 1));

    const loaded = await h.db.transaction((tx) => loadGameState(tx, gameId));
    expect([...loaded.board.entries()]).toEqual([...mutated.board.entries()]);
    expect(loaded.hands).toEqual(mutated.hands);
    expect(loaded.currentSeat).toBe(1);
  });

  it('bumps the version on each persist', async () => {
    const { gameId, state } = await seedActiveGame();
    const [before] = await h.db
      .select({ version: games.version })
      .from(games)
      .where(eq(games.id, gameId));
    expect(before?.version).toBe(1); // seedActiveGame persisted from 0 → 1

    await h.db.transaction((tx) => persistGameState(tx, gameId, state, 1));
    const [after] = await h.db
      .select({ version: games.version })
      .from(games)
      .where(eq(games.id, gameId));
    expect(after?.version).toBe(2);
  });

  it('throws VersionConflictError on a stale prevVersion', async () => {
    const { gameId, state } = await seedActiveGame();
    // Current version is 1; persisting against 0 (stale) must conflict.
    await expect(
      h.db.transaction((tx) => persistGameState(tx, gameId, state, 0)),
    ).rejects.toBeInstanceOf(VersionConflictError);
  });

  it('appends events with monotonic per-game seq', async () => {
    const { gameId } = await seedActiveGame();

    await h.db.transaction((tx) =>
      appendEvents(tx, gameId, [
        { type: 'TurnAdvanced', seat: 1, round: 1 },
        { type: 'CardDrawn', seat: 1, card: { rank: 'A', suit: 'C' } },
      ]),
    );
    await h.db.transaction((tx) =>
      appendEvents(tx, gameId, [{ type: 'GameWon', team: 1 }]),
    );

    const rows = await h.db
      .select()
      .from(gameEvents)
      .where(eq(gameEvents.gameId, gameId))
      .orderBy(gameEvents.seq);

    expect(rows.map((r) => r.seq)).toEqual([1, 2, 3]);
    expect(rows.map((r) => r.type)).toEqual([
      'TurnAdvanced',
      'CardDrawn',
      'GameWon',
    ]);
    // actor_seat is stamped from the event's seat when present.
    expect(rows[0]?.actorSeat).toBe(1);
    expect(rows[2]?.actorSeat).toBeNull();
  });
});
