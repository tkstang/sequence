import { describe, expect, it } from 'vitest';

import {
  applyMove,
  createGame,
  createSeededRng,
  forfeitTurn,
  isOneEyedJack,
  resolveSequenceChoice,
  validPlacements,
  type GameState,
  type Move,
  type PlayerSeed,
  type Rng,
  type Team,
} from './index.ts';

const DEAL_TABLE: Record<number, number> = { 2: 7, 3: 6, 4: 6, 6: 5 };

function seedsFor(teams: Team[]): PlayerSeed[] {
  return teams.map((team, seat) => ({ seat, team }));
}

/** Count chips currently on the board. */
function chipCount(state: GameState): number {
  let n = 0;
  for (const cell of state.board.values()) {
    if (cell.chip !== undefined) n++;
  }
  return n;
}

/** Pick a deterministic "random" element using the rng. */
function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng.next() * items.length)]!;
}

/**
 * A scripted bot: choose a random legal move via validPlacements for the current
 * seat, applying pending-choice resolution and falling back to forfeit when the
 * seat has no legal placement.
 */
function botMove(state: GameState, rng: Rng): ReturnType<typeof applyMove> {
  const seat = state.currentSeat;
  const team = state.teams[seat]!;
  const hand = state.hands[seat]!;
  const placements = validPlacements(hand, state.board, team);

  if (placements.size === 0) {
    // Nothing legal — forfeit the turn (still draws? no: forfeit = no draw).
    return forfeitTurn(state, rng);
  }

  const cards = [...placements.keys()];
  const card = pick(cards, rng);
  const cells = placements.get(card)!;
  const position = pick(cells, rng);

  const move: Move = isOneEyedJack(card)
    ? { type: 'removeChip', position, card }
    : { type: 'place', position, card };

  let result = applyMove(state, move, rng);
  if (!result.ok) return result;

  // Resolve a pending >5-run choice by locking 5 contiguous cells including the
  // placed one — honoring the reuse rule (a window may reuse at most one cell
  // already locked into this team's existing sequences).
  if (result.nextState.pendingChoice) {
    const pending = result.nextState.pendingChoice;
    const placedState = result.nextState;
    const idx = pending.cells.indexOf(pending.placed);
    const teamSeqIds = new Set(
      placedState.sequences
        .filter((s) => s.team === pending.team)
        .map((s) => s.id),
    );
    const reusedLocked = (window: readonly string[]): number =>
      window.filter((pos) => {
        const lockedBy = placedState.board.get(pos)?.lockedBy;
        return lockedBy !== undefined && teamSeqIds.has(lockedBy);
      }).length;

    // Every contiguous 5-window that contains the placed cell.
    const candidates: string[][] = [];
    const lo = Math.max(0, idx - 4);
    const hi = Math.min(pending.cells.length - 5, idx);
    for (let start = lo; start <= hi; start++) {
      candidates.push(pending.cells.slice(start, start + 5));
    }
    const legal =
      candidates.find((w) => reusedLocked(w) <= 1) ?? candidates[0]!;
    result = resolveSequenceChoice(placedState, legal, rng);
  }

  return result;
}

interface SimResult {
  winner: Team;
  turns: number;
}

function simulate(teams: Team[], seed: number): SimResult {
  const playerCount = teams.length as 2 | 3 | 4 | 6;
  const rng = createSeededRng(seed);
  let state = createGame(
    { playerCount, mode: 'tap', timerSeconds: null, local: false },
    seedsFor(teams),
    rng,
  );

  const dealSize = DEAL_TABLE[playerCount]!;
  let turns = 0;
  const MAX_TURNS = 500;

  while (state.status === 'active' && turns < MAX_TURNS) {
    const result = botMove(state, rng);
    expect(result.ok).toBe(true);
    if (!result.ok) break;

    state = result.nextState;
    turns++;

    // ---- Invariants checked every turn ----

    // No pending choice should leak across a completed bot turn.
    expect(state.pendingChoice).toBeUndefined();

    // Hand sizes: every seat holds exactly the deal size while the game is
    // active (auto-draw + dead-card swap preserve hand size; forfeit doesn't
    // draw but also doesn't discard, so size is preserved there too).
    if (state.status === 'active') {
      for (const hand of state.hands) {
        expect(hand.length).toBe(dealSize);
      }
    }

    // Card conservation: every card is accounted for across hands+deck+played
    // plus chips on the board (each placed chip consumed one card).
    const inHands = state.hands.reduce((sum, h) => sum + h.length, 0);
    const total = inHands + state.deck.length + state.played.length;
    // 104 cards total; chips on board correspond to consumed (played) cards,
    // which already live in `played`. So total cards in piles+hands must be
    // ≤ 104 and ≥ 0 — and exactly 104 since nothing is destroyed.
    expect(total).toBe(104);

    // Board chip count never negative, never exceeds 100 - corners(4).
    const chips = chipCount(state);
    expect(chips).toBeGreaterThanOrEqual(0);
    expect(chips).toBeLessThanOrEqual(96);
  }

  expect(state.status).toBe('finished');
  expect(state.winner).toBeDefined();
  expect(turns).toBeLessThan(MAX_TURNS);

  return { winner: state.winner!, turns };
}

describe('full-game simulation', () => {
  it('a 2-player game terminates with a winner under 500 turns', () => {
    const { turns } = simulate([1, 2], 12345);
    expect(turns).toBeGreaterThan(0);
  });

  it('a 3-player free-for-all terminates with a winner', () => {
    simulate([1, 2, 3], 777);
  });

  it('a 4-player team game terminates with a winner', () => {
    simulate([1, 2, 1, 2], 2024);
  });

  it('is deterministic for a fixed seed', () => {
    const a = simulate([1, 2], 999);
    const b = simulate([1, 2], 999);
    expect(a).toEqual(b);
  });
});
