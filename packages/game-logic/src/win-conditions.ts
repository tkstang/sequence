/**
 * Win conditions.
 *
 *  - 2 teams → 2 completed sequences to win.
 *  - 3 teams → 1 completed sequence to win.
 *
 * A double-sequence completed in a single move meets the 2-team threshold at
 * once (instant win); the engine checks the win after locking, so two new
 * sequences from one placement win immediately. One space from a team's first
 * sequence may be reused in its second — that sharing is handled by sequence
 * detection / locking, not here; this counts whatever sequences are recorded.
 */

import type { GameState, Team } from './types.ts';

/** Sequences required to win for a given team count. */
export function sequencesToWin(teamCount: number): number {
  return teamCount >= 3 ? 1 : 2;
}

/** Number of distinct teams in this game. */
function distinctTeamCount(state: GameState): number {
  return new Set(state.teams).size;
}

/** Has `team` completed enough sequences to win? */
export function checkWin(state: GameState, team: Team): boolean {
  const needed = sequencesToWin(distinctTeamCount(state));
  const owned = state.sequences.filter((s) => s.team === team).length;
  return owned >= needed;
}
