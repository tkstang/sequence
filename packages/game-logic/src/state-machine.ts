/**
 * Game lifecycle state machine.
 *
 * The single source of truth for legal status transitions. The API host calls
 * {@link canTransition} before mutating `games.status`; illegal transitions are
 * a programming error, not a user error.
 */

export type GameStatus = 'lobby' | 'active' | 'frozen' | 'saved' | 'finished';

/**
 * Allowed transitions, per design.md §Error Handling lifecycle table:
 *
 *   lobby   → active     (creator starts with valid teams)
 *   active  → frozen     (heartbeat lapse)
 *   active  → saved      (save & exit)
 *   active  → finished   (win / double-sequence / concede)
 *   frozen  → active     (all seats reconnected)
 *   saved   → active     (all original players rejoined)
 *
 * `finished` is terminal. Self-transitions are not transitions.
 */
const TRANSITIONS: Readonly<Record<GameStatus, readonly GameStatus[]>> = {
  lobby: ['active'],
  active: ['frozen', 'saved', 'finished'],
  frozen: ['active'],
  saved: ['active'],
  finished: [],
};

export function canTransition(from: GameStatus, to: GameStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
