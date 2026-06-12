/**
 * The authoritative move engine — the one loop that matters (design §Data Flow):
 *
 *   load game + hands (one transaction)
 *     → game-logic applyMove/resolveSequenceChoice/turnInDeadCard (reduce)
 *     → persist changed fields + append events (same transaction, version guard)
 *     → emit events to the room (redacted per recipient at the subscription edge)
 *
 * Optimistic concurrency: the caller passes the `version` it last saw; the
 * persist step's version predicate makes a stale/duplicate submit lose cleanly
 * as CONFLICT (first commit wins, deterministically).
 *
 * p02-m6 (carried): game-logic's actor-seat enforcement is opt-in. The engine
 * therefore ALWAYS stamps the authenticated seat onto the move (`move.seat`) and
 * passes `actorSeat` to `resolveSequenceChoice` / `turnInDeadCard`, so a move
 * authored by a non-current seat is rejected by the rules engine itself
 * (NFR1) — no engine call site may omit it.
 */

import {
  applyMove,
  type Card,
  type GameEvent,
  type GameState,
  type Move,
  type Position,
  resolveSequenceChoice,
  type Rng,
  type RuleViolation,
  turnInDeadCard,
} from '@sequence/game-logic';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';

import type { Database } from '../db/client.ts';
import { games } from '../db/schema/games.ts';
import { rooms } from '../shared/realtime/rooms.ts';
import { createServerRng } from './server-rng.ts';
import {
  appendEvents,
  loadGameState,
  persistGameState,
  VersionConflictError,
} from './state-mapping.ts';

/** A reduction step: how the engine maps the loaded state to a MoveResult. */
type Reduction = (
  state: GameState,
  rng: Rng,
) =>
  | { ok: true; nextState: GameState; events: readonly GameEvent[] }
  | { ok: false; error: RuleViolation };

/** Raised when a rule is violated — surfaces as BAD_REQUEST + typed code. */
export class RuleViolationError extends Error {
  constructor(readonly violation: RuleViolation) {
    super(`rule violation: ${violation.code}`);
    this.name = 'RuleViolationError';
  }
}

/**
 * Run one reduction transactionally with the version guard, then broadcast.
 *
 * Shared by every gameplay route (make-move, choose-sequence-cells,
 * turn-in-dead-card) so they all go through the identical load→reduce→persist→
 * emit path. The `version` the caller saw guards the write; a mismatch (stale
 * client OR a lost concurrent race) throws CONFLICT.
 */
export async function runReduction(
  db: Database,
  gameId: string,
  expectedVersion: number,
  reduce: Reduction,
): Promise<{ version: number; events: readonly GameEvent[] }> {
  const rng = createServerRng();

  let result;
  try {
    result = await db.transaction(async (tx) => {
      // Guard the read against the caller's version up front for a clean
      // CONFLICT even before the reduce (persist's predicate is authoritative).
      const [row] = await tx
        .select({ version: games.version })
        .from(games)
        .where(eq(games.id, gameId))
        .limit(1);
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      if (row.version !== expectedVersion) {
        throw new TRPCError({ code: 'CONFLICT', message: 'stale version' });
      }

      const state = await loadGameState(tx, gameId);
      const reduced = reduce(state, rng);
      if (!reduced.ok) {
        throw new RuleViolationError(reduced.error);
      }

      // persistGameState re-checks the version predicate atomically — a
      // concurrent committer that won the race throws VersionConflictError.
      const newVersion = await persistGameState(
        tx,
        gameId,
        reduced.nextState,
        expectedVersion,
      );
      const appended = await appendEvents(tx, gameId, reduced.events);
      return { newVersion, appended };
    });
  } catch (err) {
    // A lost optimistic-concurrency race surfaces as CONFLICT, not a 500.
    if (err instanceof VersionConflictError) {
      throw new TRPCError({ code: 'CONFLICT', message: 'stale version' });
    }
    throw err;
  }

  const { newVersion, appended } = result;

  // Broadcast AFTER the commit so subscribers never see an event the DB rolled
  // back. Redaction happens per-recipient in the subscription generator.
  for (const ev of appended) {
    rooms.publish(gameId, {
      seq: ev.seq,
      type: ev.type,
      payload: ev.payload as unknown as Record<string, unknown>,
    });
  }

  return {
    version: newVersion,
    events: appended.map((a) => a.payload as unknown as GameEvent),
  };
}

/**
 * Execute a `place` / `removeChip` move for the authenticated seat. Stamps the
 * seat onto the move (p02-m6) so the rules engine enforces turn ownership.
 */
export async function executeMove(
  db: Database,
  gameId: string,
  seat: number,
  move: Move,
  version: number,
): Promise<{ version: number; events: readonly GameEvent[] }> {
  // Always set the acting seat — the engine rejects an out-of-turn move itself.
  const stamped: Move = { ...move, seat };
  return runReduction(db, gameId, version, (state, rng) =>
    applyMove(state, stamped, rng),
  );
}

/** Resolve a pending >5-run choice for the authenticated seat (passes actorSeat). */
export async function executeChoice(
  db: Database,
  gameId: string,
  seat: number,
  cells: readonly Position[],
  version: number,
): Promise<{ version: number; events: readonly GameEvent[] }> {
  return runReduction(db, gameId, version, (state, rng) =>
    resolveSequenceChoice(state, cells, rng, seat),
  );
}

/** Manual hard-mode dead-card turn-in for the authenticated seat. */
export async function executeTurnIn(
  db: Database,
  gameId: string,
  seat: number,
  card: Card,
  version: number,
): Promise<{ version: number; events: readonly GameEvent[] }> {
  return runReduction(db, gameId, version, (state, rng) =>
    turnInDeadCard(state, seat, card, rng),
  );
}

/** Map a {@link RuleViolationError} to the BAD_REQUEST tRPC error contract. */
export function toTrpcError(err: unknown): TRPCError {
  if (err instanceof RuleViolationError) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: err.violation.code,
      cause: err,
    });
  }
  if (err instanceof TRPCError) return err;
  return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', cause: err });
}
