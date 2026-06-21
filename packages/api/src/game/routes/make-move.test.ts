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

import { games } from '../../db/schema/index.ts';
import { createHarness, type Harness } from '../../test/harness.ts';
import {
  appendedEventsFromInsertedRows,
  persistGameState,
} from '../state-mapping.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

/** A legal placement for `seat` given the state, via the shared rule helpers. */
function legalMove(
  state: GameState,
  seat: number,
): { card: Card; position: Position } {
  const hand = state.hands[seat]!;
  const team = state.teams[seat]!;
  const placements = validPlacements(hand, state.board, team);
  for (const [card, positions] of placements) {
    if (positions.length > 0) return { card, position: positions[0]! };
  }
  throw new Error('no legal move for seat');
}

describe('move event append mapping', () => {
  it('pairs source payloads with deterministic seqs independent of RETURNING row order', () => {
    const events = [
      { type: 'ChipPlaced', seat: 0, position: '1AC' },
      { type: 'CardDrawn', seat: 0, card: { rank: '2', suit: 'C' } },
      { type: 'TurnAdvanced', seat: 1 },
    ] as const;

    const appended = appendedEventsFromInsertedRows(
      [
        { seq: 12, type: 'TurnAdvanced', actorSeat: 1 },
        { seq: 10, type: 'ChipPlaced', actorSeat: 0 },
        { seq: 11, type: 'CardDrawn', actorSeat: 0 },
      ],
      events,
    );

    expect(appended.map((event) => event.seq)).toEqual([10, 11, 12]);
    expect(appended.map((event) => event.payload)).toEqual(events);
    expect(appended.map((event) => event.actorSeat)).toEqual([0, 0, 1]);
  });
});

describeIntegration('game.makeMove (integration)', () => {
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
   * Seed a started 2p game where seat 0 is the creator (cookie). Returns ids +
   * the dealt state so the test can compute a legal move from seat 0's hand.
   */
  async function seedGame(): Promise<{
    cookie: string;
    joinerCookie: string;
    gameId: string;
    state: GameState;
  }> {
    const host = await h.signUp({
      email: `host-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'Host',
    });
    const joiner = await h.signUp({
      email: `j-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'Joiner',
    });
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
    await h.db.insert(h.schema.gamePlayers).values([
      { gameId, seat: 0, team: 1, userId: host.userId, isCreator: true },
      { gameId, seat: 1, team: 2, userId: joiner.userId },
    ]);
    const state = createGame(
      { playerCount: 2, mode: 'tap', timerSeconds: null, local: false },
      [
        { seat: 0, team: 1 },
        { seat: 1, team: 2 },
      ],
      createSeededRng(123),
    );
    await h.db.transaction((tx) => persistGameState(tx, gameId, state, 0));
    return {
      cookie: host.cookie,
      joinerCookie: joiner.cookie,
      gameId,
      state,
    };
  }

  it('applies a legal place, bumps version, and returns events', async () => {
    const seeded = await seedGame();
    const { cookie, gameId, state } = seeded;
    const move = legalMove(state, 0);

    const res = await h.mutate(
      'game.makeMove',
      { gameId, version: 1, move: { type: 'place', ...move } },
      cookie,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const data = res.data as { version: number; events: unknown[] };
    expect(data.version).toBe(2);
    // ChipPlaced + (CardDrawn) + TurnAdvanced at minimum.
    const types = (data.events as { type: string }[]).map((e) => e.type);
    expect(types).toContain('ChipPlaced');
    expect(types).toContain('TurnAdvanced');

    const [row] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(row?.version).toBe(2);
    expect(row?.currentSeat).toBe(1);
  });

  it('a rule violation maps to BAD_REQUEST with a typed ruleViolation', async () => {
    const seeded = await seedGame();
    const { cookie, gameId } = seeded;
    // Place on a corner / occupied-or-wrong cell: send a card to a position it
    // cannot cover. '1WW' is a wild corner — no chip may be placed there.
    const res = await h.mutate(
      'game.makeMove',
      {
        gameId,
        version: 1,
        move: {
          type: 'place',
          position: '1WW',
          card: { rank: 'A', suit: 'C' },
        },
      },
      cookie,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('BAD_REQUEST');
      expect(
        (res.ruleViolation as { code: string } | undefined)?.code,
      ).toBeTruthy();
    }
  });

  it('a stale version is rejected with CONFLICT', async () => {
    const seeded = await seedGame();
    const { cookie, gameId, state } = seeded;
    const move = legalMove(state, 0);
    // Version 0 is stale (the dealt state is at version 1).
    const res = await h.mutate(
      'game.makeMove',
      { gameId, version: 0, move: { type: 'place', ...move } },
      cookie,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('CONFLICT');
  });

  it('out-of-turn move is rejected by the engine (not-your-turn)', async () => {
    const { joinerCookie, gameId, state } = await seedGame();
    // Seat 1 (joiner) tries to move while it is seat 0's turn. The engine stamps
    // seat 1 onto the move → applyMove returns not-your-turn (NFR1).
    const move = legalMove(state, 1);
    const res = await h.mutate(
      'game.makeMove',
      { gameId, version: 1, move: { type: 'place', ...move } },
      joinerCookie,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('BAD_REQUEST');
      expect((res.ruleViolation as { code: string } | undefined)?.code).toBe(
        'not-your-turn',
      );
    }
  });

  it('a client can drive a move using ONLY the subscription snapshot version', async () => {
    // The Critical contract: a pure-tRPC client (no privileged DB access) learns
    // the version to move with from the recovery snapshot, not a games.version
    // read. This test takes the version EXCLUSIVELY from the snapshot.
    const seeded = await seedGame();
    const { cookie, gameId, state } = seeded;

    const stream = await h.caller(cookie).game.onGameEvent({ gameId });
    const iterator = (stream as AsyncIterable<readonly [string, unknown]>)[
      Symbol.asyncIterator
    ]();
    const first = await iterator.next();
    await iterator.return?.();
    const item = first.value?.[1] as
      | { kind: 'snapshot'; snapshot: { version: number } }
      | undefined;
    expect(item?.kind).toBe('snapshot');
    const snapshotVersion = item!.snapshot.version;

    const move = legalMove(state, 0);
    const res = await h.mutate(
      'game.makeMove',
      { gameId, version: snapshotVersion, move: { type: 'place', ...move } },
      cookie,
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      const data = res.data as { version: number };
      // The mutation response advances the version the client tracks forward.
      expect(data.version).toBe(snapshotVersion + 1);
    }
  });

  it('concurrent double-submit: exactly one wins (CONFLICT for the loser)', async () => {
    const seeded = await seedGame();
    const { cookie, gameId, state } = seeded;
    const move = legalMove(state, 0);
    const payload = {
      gameId,
      version: 1,
      move: { type: 'place' as const, ...move },
    };
    const [a, b] = await Promise.all([
      h.mutate('game.makeMove', payload, cookie),
      h.mutate('game.makeMove', payload, cookie),
    ]);
    const wins = [a, b].filter((r) => r.ok).length;
    const conflicts = [a, b].filter(
      (r) => !r.ok && r.code === 'CONFLICT',
    ).length;
    expect(wins).toBe(1);
    expect(conflicts).toBe(1);
  });
});
