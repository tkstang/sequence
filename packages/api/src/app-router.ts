import { gameRouter } from './game/game.router.ts';
import { historyRouter } from './history/history.router.ts';
import { authedProcedure, publicProcedure, router } from './trpc.ts';

/**
 * The root tRPC router. Composes the `game` and `history` domain routers and a
 * `health.ping` probe used to smoke-test the transport.
 *
 * `AppRouter` is the type-only contract the web client (and the future RN
 * client) import — it is the multi-client API surface.
 */
export const appRouter = router({
  health: router({
    ping: publicProcedure.query(() => ({ pong: true as const })),
    // Session probe: succeeds only with a valid session, returns the user.
    me: authedProcedure.query(({ ctx }) => ({ user: ctx.user })),
  }),
  game: gameRouter,
  history: historyRouter,
});

export type AppRouter = typeof appRouter;
