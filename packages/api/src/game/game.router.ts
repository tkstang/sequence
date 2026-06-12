import { createRateLimiter } from '../shared/rate-limit-middleware.ts';
import { router } from '../trpc.ts';
import { chooseSequenceCellsRoute } from './routes/choose-sequence-cells.ts';
import { concedeRoute } from './routes/concede.ts';
import { createGameRoute } from './routes/create-game.ts';
import { buildJoinRoute } from './routes/join-game.ts';
import { kickPlayerRoute } from './routes/kick-player.ts';
import { makeMoveRoute } from './routes/make-move.ts';
import { myGamesRoute } from './routes/my-games.ts';
import { onGameEventRoute } from './routes/on-game-event.ts';
import { buildPreviewRoute } from './routes/preview.ts';
import { randomizeTeamsRoute } from './routes/randomize-teams.ts';
import { saveAndExitRoute } from './routes/save-and-exit.ts';
import { setTeamRoute } from './routes/set-team.ts';
import { startGameRoute } from './routes/start-game.ts';
import { turnInDeadCardRoute } from './routes/turn-in-dead-card.ts';

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
  setTeam: setTeamRoute,
  kick: kickPlayerRoute,
  randomizeTeams: randomizeTeamsRoute,
  start: startGameRoute,
  makeMove: makeMoveRoute,
  chooseSequenceCells: chooseSequenceCellsRoute,
  turnInDeadCard: turnInDeadCardRoute,
  saveAndExit: saveAndExitRoute,
  concede: concedeRoute,
  myGames: myGamesRoute,
  onGameEvent: onGameEventRoute,
});
