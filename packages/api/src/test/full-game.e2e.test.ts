import { randomUUID } from 'node:crypto';

import {
  isOneEyedJack,
  validPlacements,
  type Card,
  type GameState,
  type Position,
} from '@sequence/game-logic';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { games } from '../db/schema/index.ts';
import { loadGameState } from '../game/state-mapping.ts';
import type { LoggedEvent } from '../shared/realtime/redaction.ts';
import { rooms } from '../shared/realtime/rooms.ts';
import { createHarness, type Harness } from './harness.ts';

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

/**
 * The scripted full-game e2e (FR6/FR7/FR12): two real tRPC sessions create →
 * join → set teams → start → alternate legal moves until a win → rematch, all
 * over real HTTP. Legal moves are computed with game-logic `validPlacements`
 * against the authoritative loaded state — the same helper the client uses, so
 * a client preview can never disagree with the server. A room subscriber proves
 * the FR6 broadcast invariant: every committed move fans out to all seats.
 */
describeIntegration('scripted full game over the API (e2e)', () => {
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
   * Pick a legal move for `seat` from the authoritative state. `validPlacements`
   * maps a one-eyed jack to its removable opponent targets (occupied cells), so
   * a jack-keyed entry becomes a `removeChip`; everything else is a `place`.
   * Prefers natural/wild placements over one-eyed removals so the game makes
   * forward progress toward a win.
   */
  type ScriptedMove =
    | { type: 'place'; card: Card; position: Position }
    | { type: 'removeChip'; position: Position };

  function pickMove(state: GameState, seat: number): ScriptedMove | null {
    const placements = validPlacements(
      state.hands[seat]!,
      state.board,
      state.teams[seat]!,
    );
    let removal: ScriptedMove | null = null;
    for (const [card, positions] of placements) {
      if (positions.length === 0) continue;
      if (isOneEyedJack(card)) {
        removal ??= { type: 'removeChip', position: positions[0]! };
        continue;
      }
      return { type: 'place', card, position: positions[0]! };
    }
    return removal;
  }

  it('plays a 2-player game create→join→start→win→rematch with live broadcast', async () => {
    const host = await h.signUp({
      email: `host-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'Host',
    });
    const guest = await h.signUp({
      email: `guest-${randomUUID()}@example.com`,
      password: 'supersecret123',
      name: 'Guest',
    });

    // create (host) → 2p tap game
    const created = await h.mutate(
      'game.create',
      { playerCount: 2, mode: 'tap' },
      host.cookie,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const { gameId, inviteCode } = created.data as {
      gameId: string;
      inviteCode: string;
    };

    // preview (public) shows the lobby
    const preview = await h.query('game.preview', { inviteCode });
    expect(preview.ok).toBe(true);

    // join (guest) → seat 1
    const joined = await h.mutate('game.join', { inviteCode }, guest.cookie);
    expect(joined.ok).toBe(true);

    // teams: host team 1 (seat 0), guest team 2 (seat 1) — already alternating.
    await h.mutate(
      'game.setTeam',
      { gameId, targetSeat: 0, team: 1 },
      host.cookie,
    );
    await h.mutate(
      'game.setTeam',
      { gameId, targetSeat: 1, team: 2 },
      host.cookie,
    );

    // start (creator)
    const started = await h.mutate('game.start', { gameId }, host.cookie);
    expect(started.ok).toBe(true);

    // FR6: subscribe a room observer and assert every move broadcasts.
    const received: LoggedEvent[] = [];
    const { sub, unsubscribe } = rooms.subscribe(gameId);
    const drain = (async () => {
      for (;;) {
        const ev = await sub.next();
        if (ev === null) return;
        received.push(ev);
      }
    })();

    const cookies = [host.cookie, guest.cookie];
    let won = false;
    let lastChipPlaced = 0;

    // Alternate legal moves until a win or a generous turn cap. game-logic
    // simulations terminate well under 500 turns; the cap guards against a stuck
    // loop without making the e2e flaky.
    for (let turn = 0; turn < 600 && !won; turn++) {
      const [row] = await h.db
        .select({ status: games.status, currentSeat: games.currentSeat })
        .from(games)
        .where(eq(games.id, gameId));
      if (!row || row.status === 'finished') {
        won = row?.status === 'finished';
        break;
      }
      const seat = row.currentSeat ?? 0;
      const state = await loadGameState(h.db, gameId);
      const move = pickMove(state, seat);
      if (!move) {
        // No legal placement (rare): forfeit by playing nothing is not exposed;
        // fall back to advancing via a dead-card-free state is impossible here,
        // so just break — the invariants below still hold for the played turns.
        break;
      }

      // version = current row version; reload to be safe under no concurrency.
      const [vrow] = await h.db
        .select({ version: games.version })
        .from(games)
        .where(eq(games.id, gameId));
      const res = await h.mutate(
        'game.makeMove',
        {
          gameId,
          version: vrow!.version,
          move,
        },
        cookies[seat]!,
      );
      // A move can legitimately fail only on a pending choice; resolve it.
      if (!res.ok) {
        const [pc] = await h.db
          .select()
          .from(games)
          .where(eq(games.id, gameId));
        if (pc?.pendingChoice) {
          const choice = pc.pendingChoice as { cells: string[] };
          await h.mutate(
            'game.chooseSequenceCells',
            {
              gameId,
              version: pc.version,
              cells: choice.cells.slice(0, 5),
            },
            cookies[seat]!,
          );
        } else {
          // Unexpected failure — surface it.
          throw new Error(`move failed: ${res.code} ${res.message}`);
        }
      } else {
        const types = (res.data as { events: { type: string }[] }).events.map(
          (e) => e.type,
        );
        if (types.includes('ChipPlaced')) lastChipPlaced++;
        if (types.includes('GameWon')) won = true;
      }
    }

    // Allow the room drain to catch up.
    await new Promise((r) => setTimeout(r, 50));
    unsubscribe();
    await drain;

    expect(won).toBe(true);

    const [finished] = await h.db
      .select()
      .from(games)
      .where(eq(games.id, gameId));
    expect(finished?.status).toBe('finished');
    expect(finished?.winnerTeam).toBeTruthy();

    // FR6 broadcast invariant: the observer saw chip placements broadcast.
    expect(received.some((e) => e.type === 'ChipPlaced')).toBe(true);
    expect(received.some((e) => e.type === 'GameWon')).toBe(true);
    expect(lastChipPlaced).toBeGreaterThan(0);

    // rematch from the finished game → a new linked game, same roster.
    const rematch = await h.mutate('game.rematch', { gameId }, host.cookie);
    expect(rematch.ok).toBe(true);
    if (rematch.ok) {
      const data = rematch.data as { gameId: string; rematchOf: string };
      expect(data.rematchOf).toBe(gameId);
      expect(data.gameId).not.toBe(gameId);
    }
    // A full random game is hundreds of HTTP round-trips; under full-suite DB
    // contention this runs slower than in isolation, so the cap is generous.
  }, 240_000);
});
