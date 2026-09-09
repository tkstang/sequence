export {
  applyGameEvent,
  applyStreamItem,
  screenForState,
  stateFromSnapshot,
  type GameScreen,
  type GameSnapshotView,
  type GameStreamItem,
  type GameViewState,
  type GameViewStatus,
  type LastMoveView,
  type LoggedGameEvent,
  type PendingChoiceView,
  type SnapshotBoardCell,
  type SnapshotPlayer,
  type SnapshotSequence,
} from './game-state.ts';

export {
  gameFixtures,
  getGameFixture,
  winningSequenceCells,
  type GameFixture,
} from './fixtures.ts';

export {
  RULE_VIOLATION_MESSAGES,
  ruleViolationMessage,
  type RuleViolationCode,
} from './violation-messages.ts';
