/**
 * @sequence/game-logic — the pure rules engine.
 *
 * The multi-client rules contract: the API enforces with it, the web app
 * previews with it, and the future offline host reuses it. No framework
 * imports — pure TypeScript over immutable state.
 */

// Domain types
export type {
  Board,
  BoardCell,
  Card,
  GameEvent,
  GameMode,
  GameSettings,
  GameState,
  Move,
  MoveResult,
  PendingChoice,
  PlaceMove,
  Placement,
  PlayerCount,
  PlayerSeed,
  Position,
  Rank,
  RemoveChipMove,
  RuleViolation,
  Seat,
  Sequence,
  Suit,
  Team,
} from './types.ts';

// Lifecycle state machine
export { canTransition, type GameStatus } from './state-machine.ts';

// Board
export {
  ALL_POSITIONS,
  BOARD_MAP,
  BOARD_SIZE,
  boardCellsFor,
  coordOf,
  isCorner,
  parseBoardCell,
  positionAt,
  type BoardRank,
  type BoardSuit,
  type Coord,
  type ParsedBoardCell,
  type PositionId,
} from './board-map.ts';

// Deck + RNG
export {
  buildDeck,
  createSeededRng,
  drawCard,
  isOneEyedJack,
  isTwoEyedJack,
  shuffle,
  type DrawResult,
  type Rng,
} from './deck.ts';

// Game creation
export { createGame } from './create-game.ts';

// Sequence detection + locking
export {
  detectSequences,
  lockSequence,
  type ChoiceRun,
  type DetectionResult,
} from './sequence-detection.ts';

// Jack rules
export {
  canPlaceWild,
  canRemoveChip,
  oneEyedTargets,
  type Verdict,
} from './jack-rules.ts';

// Dead cards
export {
  autoSwapDeadCard,
  findDeadCards,
  isDeadCard,
  type SwapResult,
} from './dead-cards.ts';

// Win conditions
export { checkWin, sequencesToWin } from './win-conditions.ts';

// Card consumption (natural-over-jack)
export { cardMatchesPosition, wouldConsumeCard } from './card-consumption.ts';

// The reducer — the complete turn loop
export {
  advanceTurn,
  applyMove,
  drawForSeat,
  forfeitTurn,
  resolveSequenceChoice,
  turnInDeadCard,
} from './apply-move.ts';

// Display helpers
export { validPlacements } from './display-helpers.ts';
