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
import { autoSwapDeadCard } from './dead-cards.ts';
import { createSeededRng, drawCard, isTwoEyedJack, type Rng } from './deck.ts';
import { canPlaceWild } from './jack-rules.ts';
import { detectSequences, lockSequence } from './sequence-detection.ts';
import type {
  Card,
  GameEvent,
  GameState,
  Move,
  MoveResult,
  PlaceMove,
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
      // Full removal handling lands in p02-t09; placement path is the t08 scope.
      return fail('no-chip-to-remove');
  }
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
    // Turn freezes: the placer must choose which 5 cells lock. No draw / no
    // advance until resolved (handled by resolveSequenceChoice in p02-t09).
    next = {
      ...next,
      pendingChoice: {
        seat,
        team,
        placed: move.position,
        cells: detection.cells,
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
