import { randomUUID } from 'node:crypto';

import {
  createGame,
  createSeededRng,
  isDeadCard,
  type Board,
  type Card,
  type GameState,
} from '@sequence/game-logic';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { gameEvents, games } from '../../db/schema/index.ts';
import { createHarness, type Harness } from '../../test/harness.ts';
import { persistGameState } from '../state-mapping.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

describeIntegration('pending choice + dead-card turn-in (integration)', () => {
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

  /** Seed a 2p game and persist `state`; returns the creator cookie + ids. */
  async function seedWith(
    state: GameState,
    mode: 'tap' | 'drag' = 'tap',
  ): Promise<{ cookie: string; gameId: string }> {
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
      mode,
      status: 'lobby',
      version: 0,
    });
    await h.db.insert(h.schema.gamePlayers).values([
      { gameId, seat: 0, team: 1, userId: host.userId, isCreator: true },
      { gameId, seat: 1, team: 2, userId: joiner.userId },
    ]);
    await h.db.transaction((tx) => persistGameState(tx, gameId, state, 0));
    return { cookie: host.cookie, gameId };
  }

  /** Base active 2p state with overridable board/hands. */
  function baseState(overrides: Partial<GameState>): GameState {
    const state = createGame(
      { playerCount: 2, mode: 'tap', timerSeconds: null, local: false },
      [
        { seat: 0, team: 1 },
        { seat: 1, team: 2 },
      ],
      createSeededRng(5),
    );
    return { ...state, ...overrides };
  }

  it('a >5 run freezes the turn (PendingChoice) until chooseSequenceCells resolves', async () => {
    // Row 8 cols 1..6 are 23H 24H 25H 26H 27H 28H. Pre-place team 1 chips on
    // cols 2..6, give seat 0 the 3H natural card so a place at 23H makes a 6-run.
    const board: Board = new Map([
      ['24H', { chip: 1 }],
      ['25H', { chip: 1 }],
      ['26H', { chip: 1 }],
      ['27H', { chip: 1 }],
      ['28H', { chip: 1 }],
    ]);
    const hand: Card[] = [
      { rank: '3', suit: 'H' },
      { rank: 'A', suit: 'S' },
      { rank: 'A', suit: 'D' },
      { rank: 'K', suit: 'S' },
      { rank: 'Q', suit: 'D' },
    ];
    const state = baseState({
      board,
      hands: [hand, [{ rank: '2', suit: 'C' }]],
      deck: [
        { rank: '4', suit: 'C' },
        { rank: '5', suit: 'C' },
      ],
    });
    const { cookie, gameId } = await seedWith(state);

    // Place 3H at 23H → 6-run → PendingChoice (turn frozen, no advance).
    const placed = await h.mutate(
      'game.makeMove',
      {
        gameId,
        version: 1,
        move: {
          type: 'place',
          position: '23H',
          card: { rank: '3', suit: 'H' },
        },
      },
      cookie,
    );
    expect(placed.ok).toBe(true);
    if (!placed.ok) return;
    const placeEvents = (placed.data as { events: { type: string }[] }).events;
    expect(placeEvents.map((e) => e.type)).toContain('PendingChoice');
    // Turn did NOT advance (no TurnAdvanced yet).
    expect(placeEvents.map((e) => e.type)).not.toContain('TurnAdvanced');

    const [mid] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(mid?.currentSeat).toBe(0); // still seat 0's turn
    expect(mid?.pendingChoice).toBeTruthy();
    const version = mid!.version;

    // Resolve: choose cols 1..5 (23H..27H) — a straight 5 including the placed.
    const resolved = await h.mutate(
      'game.chooseSequenceCells',
      {
        gameId,
        version,
        cells: ['23H', '24H', '25H', '26H', '27H'],
      },
      cookie,
    );
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    const resolveEvents = (resolved.data as { events: { type: string }[] })
      .events;
    expect(resolveEvents.map((e) => e.type)).toContain('SequenceCompleted');
    expect(resolveEvents.map((e) => e.type)).toContain('TurnAdvanced');

    const [after] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(after?.pendingChoice).toBeNull();
    expect(after?.currentSeat).toBe(1); // turn advanced after the lock
  });

  it('only the placer may resolve a pending choice', async () => {
    const board: Board = new Map([
      ['24H', { chip: 1 }],
      ['25H', { chip: 1 }],
      ['26H', { chip: 1 }],
      ['27H', { chip: 1 }],
      ['28H', { chip: 1 }],
    ]);
    const state = baseState({
      board,
      hands: [[{ rank: '3', suit: 'H' }], [{ rank: '2', suit: 'C' }]],
      deck: [{ rank: '4', suit: 'C' }],
    });
    // Seat 0 places; seat 1 (joiner) tries to resolve → rejected.
    const host = await h.signUp({
      email: `h-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'H',
    });
    const joiner = await h.signUp({
      email: `j-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'J',
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
    await h.db.transaction((tx) => persistGameState(tx, gameId, state, 0));

    await h.mutate(
      'game.makeMove',
      {
        gameId,
        version: 1,
        move: {
          type: 'place',
          position: '23H',
          card: { rank: '3', suit: 'H' },
        },
      },
      host.cookie,
    );
    const [mid] = await h.db.select().from(games).where(eq(games.id, gameId));
    const res = await h.mutate(
      'game.chooseSequenceCells',
      {
        gameId,
        version: mid!.version,
        cells: ['23H', '24H', '25H', '26H', '27H'],
      },
      joiner.cookie,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      // not-your-turn from the engine (the joiner is not the placer).
      expect((res.ruleViolation as { code?: string })?.code).toBe(
        'not-your-turn',
      );
    }
  });

  it('an invalid cell set is rejected', async () => {
    const board: Board = new Map([
      ['24H', { chip: 1 }],
      ['25H', { chip: 1 }],
      ['26H', { chip: 1 }],
      ['27H', { chip: 1 }],
      ['28H', { chip: 1 }],
    ]);
    const state = baseState({
      board,
      hands: [[{ rank: '3', suit: 'H' }], [{ rank: '2', suit: 'C' }]],
      deck: [{ rank: '4', suit: 'C' }],
    });
    const { cookie, gameId } = await seedWith(state);
    await h.mutate(
      'game.makeMove',
      {
        gameId,
        version: 1,
        move: {
          type: 'place',
          position: '23H',
          card: { rank: '3', suit: 'H' },
        },
      },
      cookie,
    );
    const [mid] = await h.db.select().from(games).where(eq(games.id, gameId));
    // A non-contiguous / placed-excluding set is invalid.
    const res = await h.mutate(
      'game.chooseSequenceCells',
      {
        gameId,
        version: mid!.version,
        cells: ['24H', '25H', '26H', '27H', '28H'],
      },
      cookie,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect((res.ruleViolation as { code?: string })?.code).toBe(
        'invalid-sequence-choice',
      );
    }
  });

  it('hard-mode turnInDeadCard swaps the dead card and play continues', async () => {
    // A dead card: both its board cells already covered. Card 5C lives at two
    // cells; cover both for the opposing team, then seat 0 holds 5C (dead).
    const fiveCells = ['15C', '25C'];
    const board: Board = new Map([
      [fiveCells[0]!, { chip: 2 }],
      [fiveCells[1]!, { chip: 2 }],
    ]);
    const deadCard: Card = { rank: '5', suit: 'C' };
    const state = baseState({
      board,
      hands: [[deadCard, { rank: 'A', suit: 'S' }], [{ rank: '2', suit: 'C' }]],
      deck: [
        { rank: 'K', suit: 'D' },
        { rank: 'Q', suit: 'D' },
      ],
    });
    // Sanity: the card is genuinely dead on this board.
    expect(isDeadCard(deadCard, board)).toBe(true);

    const { cookie, gameId } = await seedWith(state, 'drag');

    const res = await h.mutate(
      'game.turnInDeadCard',
      { gameId, version: 1, card: deadCard },
      cookie,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const events = (res.data as { events: { type: string }[] }).events;
    expect(events.map((e) => e.type)).toContain('DeadCardSwapped');
    // Turn continues (no advance on a turn-in).
    expect(events.map((e) => e.type)).not.toContain('TurnAdvanced');

    const [after] = await h.db.select().from(games).where(eq(games.id, gameId));
    expect(after?.currentSeat).toBe(0);
    void gameEvents;
  });

  it('turning in a non-dead card is rejected (not-a-dead-card)', async () => {
    const liveCard: Card = { rank: '5', suit: 'C' };
    const state = baseState({
      board: new Map(),
      hands: [[liveCard], [{ rank: '2', suit: 'C' }]],
      deck: [{ rank: 'K', suit: 'D' }],
    });
    const { cookie, gameId } = await seedWith(state, 'drag');
    const res = await h.mutate(
      'game.turnInDeadCard',
      { gameId, version: 1, card: liveCard },
      cookie,
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect((res.ruleViolation as { code?: string })?.code).toBe(
        'not-a-dead-card',
      );
    }
  });
});
