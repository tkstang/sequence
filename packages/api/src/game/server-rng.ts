import { randomInt } from 'node:crypto';

import type { Rng } from '@sequence/game-logic';

/**
 * A cryptographically-seeded {@link Rng} for server-side use.
 *
 * `game-logic` is deterministic given an RNG; the API host injects a real
 * entropy source here (deck shuffles, invite codes, dead-card swaps) so games
 * are unpredictable in production while staying seedable in tests. `next()`
 * returns a float in `[0, 1)` drawn from `crypto.randomInt`.
 */
export function createServerRng(): Rng {
  return {
    next() {
      // 2^32 buckets of uniform integer entropy → a float in [0, 1).
      return randomInt(0, 0x1_00_00_00_00) / 0x1_00_00_00_00;
    },
  };
}
