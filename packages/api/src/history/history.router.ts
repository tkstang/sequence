import { router } from '../trpc.ts';
import { headToHeadRoute } from './routes/head-to-head.ts';
import { historyMyGamesRoute } from './routes/my-games.ts';
import { myRecordRoute } from './routes/my-record.ts';

/**
 * The `history` router — aggregate record, completed-games list, head-to-head.
 * All authed queries over the finished-games join (no materialized stats).
 */
export const historyRouter = router({
  myRecord: myRecordRoute,
  myGames: historyMyGamesRoute,
  headToHead: headToHeadRoute,
});
