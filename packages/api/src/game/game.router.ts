import { createRateLimiter } from '../shared/rate-limit-middleware.ts';
import { router } from '../trpc.ts';
import { createGameRoute } from './routes/create-game.ts';
import { buildJoinRoute } from './routes/join-game.ts';
import { buildPreviewRoute } from './routes/preview.ts';

/**
 * The `game` router — lifecycle, lobby, moves, and the live subscription.
 *
 * Routes are added per p04 task (create, join, start, makeMove, onGameEvent, …)
 * under `game/routes/`, file-per-route.
 *
 * `preview`/`join` are public and share one in-memory per-IP rate limiter
 * (the p03-t09 reusable limiter) to throttle invite-code enumeration. Keyed on
 * the resolved client IP (`ctx.ip`), now correct on the WS path too (I3).
 */
const joinPreviewLimiter = createRateLimiter({ max: 30, windowMs: 60_000 });

export const gameRouter = router({
  create: createGameRoute,
  preview: buildPreviewRoute(joinPreviewLimiter),
  join: buildJoinRoute(joinPreviewLimiter),
});
