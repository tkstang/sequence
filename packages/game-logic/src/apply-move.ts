/**
 * The reducer — the complete turn loop.
 *
 * `applyMove` validates and applies a move, returning the next state plus the
 * ordered events the host persists and broadcasts. It owns the whole turn loop:
 * placement / removal, sequence detection + locking, win detection, auto-draw,
 * default-mode dead-card auto-swap for the incoming player, and turn
 * advancement.
 *
 * An optional `rng` is threaded for the two non-deterministic steps (deck
 * reshuffle on depletion, dead-card auto-swap draw). It defaults to a seed
 * derived from current state so callers that don't care still get determinism.
 */

import { cardMatchesPosition, wouldConsumeCard } from './card-consumption.ts';
import { autoSwapDeadCard, isDeadCard } from './dead-cards.ts';
import {
  createSeededRng,
  drawCard,
  isOneEyedJack,
  isTwoEyedJack,
  type Rng,
} from './deck.ts';
import { canPlaceWild, canRemoveChip } from './jack-rules.ts';
import { detectSequences, lockSequence } from './sequence-detection.ts';
import type {
  Card,
  GameEvent,
  GameState,
  Move,
  MoveResult,
  PlaceMove,
  Position,
  RemoveChipMove,
  RuleViolation,
  Seat,
  Sequence,
  Team,
} from './types.ts';
import { checkWin } from './win-conditions.ts';

function fail(code: RuleViolation['code']): MoveResult {
  return { ok: false, error: { code } as RuleViolation };
}

function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

/** A default RNG seeded from coarse state, so 2-arg callers stay deterministic. */
function defaultRng(state: GameState): Rng {
  return createSeededRng(
    state.deck.length * 131 + state.played.length * 17 + state.round * 7 + 1,
  );
}

/** Remove the first matching card from a hand; returns the new hand. */
function removeFromHand(hand: readonly Card[], card: Card): Card[] {
  const idx = hand.findIndex((c) => sameCard(c, card));
  return [...hand.slice(0, idx), ...hand.slice(idx + 1)];
}

export function applyMove(state: GameState, move: Move, rng?: Rng): MoveResult {
  const random = rng ?? defaultRng(state);

  if (state.status !== 'active') {
    return fail('game-not-active');
  }
  if (state.pendingChoice) {
    return fail('pending-choice-unresolved');
  }

  switch (move.type) {
    case 'place':
      return applyPlace(state, move, random);
    case 'removeChip':
      return applyRemove(state, move, random);
  }
}

/**
 * One-eyed jack removal. Validates the target (opponent, unlocked, occupied),
 * consumes a one-eyed jack from hand, clears the cell, then completes the turn
 * (auto-draw + advance). The freed cell cannot be replayed this turn because the
 * removal ends the turn (per the official rule).
 */
function applyRemove(
  state: GameState,
  move: RemoveChipMove,
  rng: Rng,
): MoveResult {
  const seat = state.currentSeat;
  const team = state.teams[seat]!;
  const hand = state.hands[seat]!;

  // The consumed card must be a one-eyed jack (explicit honored, else find one).
  let jack: Card | undefined;
  if (move.card) {
    jack = hand.find((c) => sameCard(c, move.card!));
    if (!jack) return fail('card-not-in-hand');
    if (!isOneEyedJack(jack)) return fail('not-a-one-eyed-jack');
  } else {
    jack = hand.find((c) => isOneEyedJack(c));
    if (!jack) return fail('not-a-one-eyed-jack');
  }

  // Validate the removal target.
  const verdict = canRemoveChip(state.board, move.position, team);
  if (!verdict.ok) return { ok: false, error: verdict.error };

  // Clear the cell.
  const board = new Map(state.board);
  board.delete(move.position);

  const events: GameEvent[] = [
    { type: 'ChipRemoved', seat, position: move.position, card: jack },
  ];

  const newHand = removeFromHand(hand, jack);
  const hands = state.hands.map((h, i) => (i === seat ? newHand : h));

  let next: GameState = {
    ...state,
    board,
    hands,
    played: [...state.played, jack],
  };

  next = drawForSeat(next, seat, rng, events);
  next = advanceTurn(next, rng, events);

  return { ok: true, nextState: next, events };
}

/**
 * Resolve a pending >5-run choice: the placer selects exactly five straight
 * cells (including the cell they just covered) to lock. Validates the selection,
 * locks it, checks the win, then completes the turn (draw + advance).
 */
export function resolveSequenceChoice(
  state: GameState,
  cells: readonly Position[],
  rng?: Rng,
): MoveResult {
  const random = rng ?? defaultRng(state);
  const pending = state.pendingChoice;
  if (!pending) return fail('no-pending-choice');

  if (!isValidChoice(cells, pending.cells, pending.placed)) {
    return fail('invalid-sequence-choice');
  }
  // Reuse rule (FR5): the chosen window may reuse at most one cell already
  // locked into one of this team's existing sequences — same constraint the
  // auto-lock path enforces (sequence-detection.ts). Without this, a run
  // extended through an own locked sequence lets the placer pick a window that
  // reuses ≥2 locked cells, minting an illegal second sequence (and win).
  if (reusedLockedCount(state, cells, pending.team) > 1) {
    return fail('invalid-sequence-choice');
  }

  const events: GameEvent[] = [];
  let next: GameState = { ...state, pendingChoice: undefined };
  next = lockAndRecord(next, [cells], pending.team, events);

  if (checkWin(next, pending.team)) {
    next = { ...next, status: 'finished', winner: pending.team };
    events.push({ type: 'GameWon', team: pending.team });
    return { ok: true, nextState: next, events };
  }

  // Chain any further >5 runs from the same placement: re-validate that each
  // still has a legal window (the just-locked cells may have consumed it), and
  // freeze the next choice. Runs with no remaining legal window are dropped.
  const remaining = (pending.additionalRuns ?? []).filter((run) =>
    hasLegalWindowFor(next, run, pending.placed, pending.team),
  );
  if (remaining.length > 0) {
    const [activeRun, ...rest] = remaining;
    next = {
      ...next,
      pendingChoice: {
        seat: pending.seat,
        team: pending.team,
        placed: pending.placed,
        cells: activeRun!,
        additionalRuns: rest,
      },
    };
    events.push({
      type: 'PendingChoice',
      seat: pending.seat,
      cells: activeRun!,
    });
    return { ok: true, nextState: next, events };
  }

  next = drawForSeat(next, pending.seat, random, events);
  next = advanceTurn(next, random, events);
  return { ok: true, nextState: next, events };
}

/**
 * A choice is valid when it is exactly five cells, all drawn from the eligible
 * run, includes the just-placed cell, and the five are contiguous (a straight
 * sub-run of the eligible line).
 */
function isValidChoice(
  chosen: readonly Position[],
  eligible: readonly Position[],
  placed: Position,
): boolean {
  if (chosen.length !== 5) return false;
  if (!chosen.includes(placed)) return false;

  const indices: number[] = [];
  for (const cell of chosen) {
    const idx = eligible.indexOf(cell);
    if (idx === -1) return false;
    indices.push(idx);
  }
  indices.sort((a, b) => a - b);
  // Contiguous in the eligible run.
  for (let i = 1; i < indices.length; i++) {
    if (indices[i]! !== indices[i - 1]! + 1) return false;
  }
  return true;
}

/**
 * Count cells in `cells` already locked into one of `team`'s existing
 * sequences. A chosen window is a fresh sequence only when it reuses at most one
 * such cell (FR5). Cross-references the board's `lockedBy` against this team's
 * recorded sequences so another team's lock never counts.
 */
function reusedLockedCount(
  state: GameState,
  cells: readonly Position[],
  team: Team,
): number {
  const teamSeqIds = new Set(
    state.sequences.filter((s) => s.team === team).map((s) => s.id),
  );
  let count = 0;
  for (const pos of cells) {
    const lockedBy = state.board.get(pos)?.lockedBy;
    if (lockedBy !== undefined && teamSeqIds.has(lockedBy)) count++;
  }
  return count;
}

/**
 * Does `run` still contain a contiguous 5-window that includes `placed` and
 * reuses at most one cell locked into one of `team`'s sequences? Used to drop
 * queued choice runs whose only legal windows were consumed by an earlier lock.
 */
function hasLegalWindowFor(
  state: GameState,
  run: readonly Position[],
  placed: Position,
  team: Team,
): boolean {
  const placedIdx = run.indexOf(placed);
  for (let start = 0; start + 5 <= run.length; start++) {
    if (placedIdx < start || placedIdx >= start + 5) continue;
    const window = run.slice(start, start + 5);
    if (reusedLockedCount(state, window, team) <= 1) return true;
  }
  return false;
}

/**
 * Hard-mode manual dead-card turn-in. Validates the card is genuinely dead,
 * swaps it for a fresh draw, and continues the same turn (no advance).
 */
export function turnInDeadCard(
  state: GameState,
  seat: Seat,
  card: Card,
  rng?: Rng,
): MoveResult {
  const random = rng ?? defaultRng(state);
  const hand = state.hands[seat] ?? [];
  if (!hand.some((c) => sameCard(c, card))) {
    return fail('card-not-in-hand');
  }
  if (!isDeadCard(card, state.board)) {
    return fail('not-a-dead-card');
  }

  const handWithout = removeFromHand(hand, card);
  const draw = drawCard(state.deck, state.played, random);
  const newHand = draw.card ? [...handWithout, draw.card] : handWithout;
  const hands = state.hands.map((h, i) => (i === seat ? newHand : h));

  const events: GameEvent[] = draw.card
    ? [{ type: 'DeadCardSwapped', seat, discarded: card, drawn: draw.card }]
    : [];

  const next: GameState = {
    ...state,
    hands,
    deck: draw.deck,
    played: [...draw.played, card],
  };

  return { ok: true, nextState: next, events };
}

/** Forfeit the current turn: advance without any play or draw (timer expiry). */
export function forfeitTurn(state: GameState, rng?: Rng): MoveResult {
  const random = rng ?? defaultRng(state);
  if (state.status !== 'active') return fail('game-not-active');
  if (state.pendingChoice) return fail('pending-choice-unresolved');

  const events: GameEvent[] = [];
  const next = advanceTurn(state, random, events);
  return { ok: true, nextState: next, events };
}

function applyPlace(state: GameState, move: PlaceMove, rng: Rng): MoveResult {
  const seat = state.currentSeat;
  const team = state.teams[seat]!;
  const hand = state.hands[seat]!;

  // Resolve the consumed card (explicit honored, else natural-over-jack).
  let consumed: Card | undefined;
  try {
    consumed = wouldConsumeCard(move, hand);
  } catch {
    return fail('card-not-in-hand');
  }
  if (!consumed) {
    // Nothing in hand can place here (no natural card, no wild jack).
    return fail('card-not-in-hand');
  }
  if (!hand.some((c) => sameCard(c, consumed!))) {
    return fail('card-not-in-hand');
  }

  // Validate placement legality for the consumed card.
  const occupied = state.board.get(move.position)?.chip !== undefined;
  if (isTwoEyedJack(consumed)) {
    const verdict = canPlaceWild(state.board, move.position);
    if (!verdict.ok) return { ok: false, error: verdict.error };
  } else {
    if (occupied) return fail('space-occupied');
    if (!cardMatchesPosition(consumed, move.position)) {
      return fail('wrong-card-for-space');
    }
  }

  // Place the chip.
  const board = new Map(state.board);
  board.set(move.position, { chip: team });

  const events: GameEvent[] = [
    {
      type: 'ChipPlaced',
      seat,
      team,
      position: move.position,
      card: consumed,
    },
  ];

  // Consume the card into the played pile.
  const newHand = removeFromHand(hand, consumed);
  const hands = state.hands.map((h, i) => (i === seat ? newHand : h));

  let next: GameState = {
    ...state,
    board,
    hands,
    played: [...state.played, consumed],
  };

  // Sequence detection on the placed cell.
  const detection = detectSequences(board, move.position, team);

  if (detection.kind === 'choiceRequired') {
    // A single placement can both complete an exactly-5 sequence in one
    // direction (auto-locked outright) and produce a >5 run in another (a
    // frozen choice). Lock the auto-lock sequences first — including the win
    // check, so an earned double-sequence instant win is never lost — then
    // freeze on the remaining choice.
    if (detection.autoLock.length > 0) {
      next = lockAndRecord(next, detection.autoLock, team, events);
      if (checkWin(next, team)) {
        next = { ...next, status: 'finished', winner: team };
        events.push({ type: 'GameWon', team });
        return { ok: true, nextState: next, events };
      }
    }

    // Turn freezes: the placer must choose which 5 cells lock. No draw / no
    // advance until resolved (handled by resolveSequenceChoice). Any further >5
    // runs from this placement are queued to resolve after this one.
    next = {
      ...next,
      pendingChoice: {
        seat,
        team,
        placed: move.position,
        cells: detection.cells,
        additionalRuns: detection.additionalChoices.map((c) => c.cells),
      },
    };
    events.push({ type: 'PendingChoice', seat, cells: detection.cells });
    return { ok: true, nextState: next, events };
  }

  if (detection.kind === 'autoLock') {
    const locked = lockAndRecord(next, detection.sequences, team, events);
    next = locked;
    // Win check fires immediately on lock (double-sequence = instant win).
    if (checkWin(next, team)) {
      next = { ...next, status: 'finished', winner: team };
      events.push({ type: 'GameWon', team });
      return { ok: true, nextState: next, events };
    }
  }

  // Auto-draw to refill the hand, then advance the turn.
  next = drawForSeat(next, seat, rng, events);
  next = advanceTurn(next, rng, events);

  return { ok: true, nextState: next, events };
}

/** Lock each detected sequence, record it, and emit SequenceCompleted events. */
function lockAndRecord(
  state: GameState,
  sequences: readonly (readonly string[])[],
  team: Team,
  events: GameEvent[],
): GameState {
  let board = state.board;
  const recorded: Sequence[] = [];
  let nextId = state.nextSequenceId;

  for (const cells of sequences) {
    const id = nextId++;
    board = lockSequence(board, cells, id);
    recorded.push({ id, team, cells: [...cells] });
    events.push({
      type: 'SequenceCompleted',
      team,
      sequenceId: id,
      cells: [...cells],
    });
  }

  return {
    ...state,
    board,
    sequences: [...state.sequences, ...recorded],
    nextSequenceId: nextId,
  };
}

/** Draw one card for the seat (auto-draw), emitting CardDrawn. */
export function drawForSeat(
  state: GameState,
  seat: Seat,
  rng: Rng,
  events: GameEvent[],
): GameState {
  const draw = drawCard(state.deck, state.played, rng);
  if (!draw.card) return state;

  const hands = state.hands.map((h, i) =>
    i === seat ? [...h, draw.card!] : h,
  );
  events.push({ type: 'CardDrawn', seat, card: draw.card });

  return { ...state, hands, deck: draw.deck, played: draw.played };
}

/**
 * Advance to the next seat (wrapping increments the round) and run default-mode
 * dead-card auto-swap for the incoming player. Emits TurnAdvanced (and a
 * DeadCardSwapped via the helper when applicable).
 */
export function advanceTurn(
  state: GameState,
  rng: Rng,
  events: GameEvent[],
): GameState {
  const count = state.hands.length;
  const nextSeat = (state.currentSeat + 1) % count;
  const round = nextSeat === 0 ? state.round + 1 : state.round;

  let next: GameState = { ...state, currentSeat: nextSeat, round };

  // Default mode: auto-swap at most one dead card for the incoming player.
  if (state.settings.mode === 'tap') {
    const swap = autoSwapDeadCard(next, nextSeat, rng);
    next = swap.nextState;
    events.push(...swap.events);
  }

  events.push({ type: 'TurnAdvanced', seat: nextSeat, round });
  return next;
}
