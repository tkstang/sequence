import { router } from '../trpc.ts';
import { createGameRoute } from './routes/create-game.ts';

/**
 * The `game` router — lifecycle, lobby, moves, and the live subscription.
 *
 * Routes are added per p04 task (create, join, start, makeMove, onGameEvent, …)
 * under `game/routes/`, file-per-route.
 */
export const gameRouter = router({
  create: createGameRoute,
});
