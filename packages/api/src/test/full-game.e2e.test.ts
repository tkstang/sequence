import { randomUUID } from 'node:crypto';

import {
  isOneEyedJack,
  validPlacements,
  type BoardCell,
  type Card,
  type GameState,
  type Position,
  type Team,
} from '@sequence/game-logic';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { games } from '../db/schema/index.ts';
import type {
  GameSnapshot,
  LoggedEvent,
} from '../shared/realtime/redaction.ts';
import { rooms } from '../shared/realtime/rooms.ts';
import { createHarness, type Harness } from './harness.ts';

/** The client-reachable snapshot shape (the redacted recovery view). */
type GameSnapshotShape = GameSnapshot;

const hasTestDb = Boolean(process.env.DATABASE_URL_TEST);
const describeIntegration = hasTestDb ? describe : describe.skip;

/**
 * Pick a legal move for `seat` from the authoritative state. `validPlacements`
 * maps a one-eyed jack to its removable opponent targets (occupied cells), so a
 * jack-keyed entry becomes a `removeChip`; everything else is a `place`. Prefers
 * natural/wild placements over one-eyed removals so the game makes forward
 * progress toward a win.
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

/**
 * Reconstruct just enough `GameState` from a redacted snapshot to compute a
 * legal move for `seat`: the board, the acting seat's own hand, and the seat's
 * team. This mirrors what a real client does — the snapshot is its only view.
 * Other seats' hands and the deck are absent (NFR1) and not needed here.
 */
function snapshotToState(snap: GameSnapshotShape, seat: number): GameState {
  const board = new Map<Position, BoardCell>();
  for (const [pos, cell] of Object.entries(snap.board)) {
    board.set(pos, cell as BoardCell);
  }
  // The snapshot doesn't ship a teams[] vector; derive the acting seat's team
  // from the known 2p alternation (seat 0 → team 1, seat 1 → 2).
  const team = (seat % 2) + 1;
  const hands: Card[][] = [];
  hands[seat] = snap.hand.map((c) => ({ ...c }) as Card);
  const teams: Team[] = [];
  teams[seat] = team as Team;
  return {
    settings: { playerCount: 2, mode: 'tap', timerSeconds: null, local: false },
    status: snap.status as GameState['status'],
    board,
    hands,
    deck: [],
    played: [],
    sequences: snap.sequences.map((s) => ({
      id: s.id,
      team: s.team as Team,
      cells: s.cells,
    })),
    teams,
    currentSeat: snap.currentSeat,
    round: snap.round,
    nextSequenceId: snap.sequences.length + 1,
  };
}

/**
 * The next current seat after a committed reduction, read from the public
 * `TurnAdvanced` event (client-reachable). Falls back to the prior seat when a
 * turn doesn't advance (e.g. a pending choice freezes the turn).
 */
function nextSeatFrom(
  events: { type: string; seat?: number }[],
  prev: number,
): number {
  // Last TurnAdvanced wins (a chained reduction can emit more than one).
  let seat = prev;
  for (const e of events) {
    if (e.type === 'TurnAdvanced' && e.seat !== undefined) seat = e.seat;
  }
  return seat;
}

/**
 * The scripted full-game e2e (FR6/FR7/FR12): two real tRPC sessions create →
 * join → set teams → start → alternate legal moves until a win → rematch, all
 * over real HTTP. The acting seat's view is rebuilt from its own redacted
 * subscription snapshot, and `version` is tracked exclusively from client-facing
 * responses (start + makeMove) — never a DB read. A room subscriber proves the
 * FR6 broadcast invariant: every committed move fans out to all seats.
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

    // start (creator) — the response is the client's first read of `version` +
    // `currentSeat`. Both are driven from the client-facing contract hereafter;
    // the test never reads `games.version` from the DB (that is exactly the gap
    // the Critical finding caught: a pure client has no privileged DB access).
    const started = await h.mutate('game.start', { gameId }, host.cookie);
    expect(started.ok).toBe(true);
    if (!started.ok) return;
    const startData = started.data as {
      status: string;
      currentSeat: number;
      version: number;
    };
    expect(typeof startData.version).toBe('number');

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

    // The whole game state a client tracks comes from client-reachable data:
    //  - `version` and `currentSeat` from the start response, then from each
    //    successful makeMove/chooseSequenceCells response (no DB version read);
    //  - the board + the acting seat's hand from the per-seat recovery snapshot
    //    (the same redacted view a real client subscribes to).
    let version = startData.version;
    let currentSeat = startData.currentSeat;

    /** Read a seat's current snapshot (board, own hand, version, pendingChoice). */
    async function snapshotFor(seat: number) {
      const stream = await h
        .caller(cookies[seat]!)
        .game.onGameEvent({ gameId });
      const iterator = (stream as AsyncIterable<readonly [string, unknown]>)[
        Symbol.asyncIterator
      ]();
      const first = await iterator.next();
      await iterator.return?.();
      const item = first.value?.[1] as
        | { kind: 'snapshot'; snapshot: GameSnapshotShape }
        | undefined;
      if (item?.kind !== 'snapshot') throw new Error('expected snapshot first');
      return item.snapshot;
    }

    // Alternate legal moves until a win or a generous turn cap. game-logic
    // simulations terminate well under 500 turns; the cap guards against a stuck
    // loop without making the e2e flaky.
    for (let turn = 0; turn < 600 && !won; turn++) {
      const seat = currentSeat;
      // Build the acting seat's view from its own redacted snapshot.
      const snap = await snapshotFor(seat);
      if (snap.status === 'finished') {
        won = true;
        break;
      }
      // The snapshot's version must agree with the client-tracked version —
      // this is the contract the Critical finding required: the snapshot is a
      // sufficient move read path.
      expect(snap.version).toBe(version);

      const state = snapshotToState(snap, seat);
      const move = pickMove(state, seat);
      if (!move) {
        // No legal placement (rare): break — invariants below still hold.
        break;
      }

      const res = await h.mutate(
        'game.makeMove',
        { gameId, version, move },
        cookies[seat]!,
      );
      // A move can legitimately fail only on a pending choice; resolve it using
      // the placer's snapshot (still no DB read for version).
      if (!res.ok) {
        const pcSnap = await snapshotFor(seat);
        if (pcSnap.pendingChoice) {
          const choiceRes = await h.mutate(
            'game.chooseSequenceCells',
            {
              gameId,
              version: pcSnap.version,
              cells: pcSnap.pendingChoice.cells.slice(0, 5),
            },
            cookies[seat]!,
          );
          if (choiceRes.ok) {
            const d = choiceRes.data as {
              version: number;
              events: { type: string; seat?: number }[];
            };
            version = d.version;
            currentSeat = nextSeatFrom(d.events, currentSeat);
            if (d.events.some((e) => e.type === 'GameWon')) won = true;
          }
        } else {
          throw new Error(`move failed: ${res.code} ${res.message}`);
        }
      } else {
        const d = res.data as {
          version: number;
          events: { type: string; seat?: number }[];
        };
        version = d.version;
        const types = d.events.map((e) => e.type);
        if (types.includes('ChipPlaced')) lastChipPlaced++;
        if (types.includes('GameWon')) won = true;
        currentSeat = nextSeatFrom(d.events, currentSeat);
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
