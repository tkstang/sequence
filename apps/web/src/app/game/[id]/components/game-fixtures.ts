import type { Card, Position, Team } from '@sequence/game-logic';

import type {
  GameSnapshotView,
  SnapshotBoardCell,
  SnapshotPlayer,
  SnapshotSequence,
} from './game-state.ts';

/**
 * Representative {@link GameSnapshotView} states for fast, isolated UI work.
 *
 * These fixtures feed the dev playground (`/dev`) and are equally usable from
 * component tests, so previews and assertions exercise the same shapes the live
 * game route projects from snapshots + streamed events. They intentionally use
 * real board position codes (see `@sequence/game-logic` `BOARD_MAP`) so the
 * board, dead-card detection, and sequence highlighting behave faithfully.
 */

const PLAYERS: SnapshotPlayer[] = [
  {
    seat: 0,
    team: 1,
    name: 'You',
    isCreator: true,
    isGuest: false,
    connected: true,
  },
  {
    seat: 1,
    team: 2,
    name: 'Riya',
    isCreator: false,
    isGuest: false,
    connected: true,
  },
  {
    seat: 2,
    team: 1,
    name: 'Marcus',
    isCreator: false,
    isGuest: false,
    connected: true,
  },
  {
    seat: 3,
    team: 2,
    name: 'Lena',
    isCreator: false,
    isGuest: true,
    connected: true,
  },
];

/**
 * A six-card hand spanning the interesting display cases: a normal number card
 * (`5C`, which the dead-card fixture covers on the board), a two-eyed wild jack
 * (`JD`), a one-eyed removal jack (`JS`), and ordinary cards.
 */
const HAND: Card[] = [
  { rank: '5', suit: 'C' },
  { rank: 'T', suit: 'H' },
  { rank: 'J', suit: 'D' },
  { rank: 'J', suit: 'S' },
  { rank: '7', suit: 'S' },
  { rank: 'Q', suit: 'D' },
];

/** Merge several `{ position: cell }` groups into one board record. */
function board(
  ...groups: Record<Position, SnapshotBoardCell>[]
): Record<Position, SnapshotBoardCell> {
  return Object.assign({}, ...groups);
}

/** Place same-team chips on a set of positions. */
function chips(
  team: Team,
  ...positions: Position[]
): Record<Position, SnapshotBoardCell> {
  return Object.fromEntries(
    positions.map((position) => [position, { chip: team }]),
  );
}

/** Place locked (sequence-completed) chips for a team. */
function lockedChips(
  team: Team,
  sequenceId: number,
  ...positions: Position[]
): Record<Position, SnapshotBoardCell> {
  return Object.fromEntries(
    positions.map((position) => [
      position,
      { chip: team, lockedBy: sequenceId },
    ]),
  );
}

/** Mid-game scatter shared by the active fixtures. */
const ACTIVE_BOARD = board(
  chips(1, '1AC', '1KC', '1QC'),
  chips(2, '17S', '18S', '2TC'),
);

/** The winning sequence used by the game-over fixture (top-row run + corner). */
const WINNING_CELLS: Position[] = ['1WW', '1AC', '1KC', '1QC', '1TC'];

const WINNING_SEQUENCE: SnapshotSequence = {
  id: 1,
  team: 1,
  cells: WINNING_CELLS,
};

function baseSnapshot(): GameSnapshotView {
  return {
    gameId: 'dev-game',
    inviteCode: 'DEV123',
    status: 'active',
    playerCount: 4,
    mode: 'tap',
    timerSeconds: null,
    local: false,
    mySeat: 0,
    currentSeat: 0,
    round: 3,
    version: 12,
    board: {},
    sequences: [],
    players: PLAYERS,
    teams: [1, 2, 1, 2],
    hand: HAND,
  };
}

const lobby: GameSnapshotView = {
  ...baseSnapshot(),
  status: 'lobby',
  round: 0,
  version: 0,
  board: {},
  hand: [],
};

const activeYourTurn: GameSnapshotView = {
  ...baseSnapshot(),
  status: 'active',
  currentSeat: 0,
  board: ACTIVE_BOARD,
  timerSeconds: 30,
  turnRemainingMs: 21_000,
};

const activeNotYourTurn: GameSnapshotView = {
  ...baseSnapshot(),
  status: 'active',
  currentSeat: 1,
  board: ACTIVE_BOARD,
  timerSeconds: 30,
  turnRemainingMs: 8_000,
};

/**
 * Both board copies of `5C` (`15C`, `25C`) are covered, so the `5C` held in
 * {@link HAND} is dead and renders dimmed in the hand fan.
 */
const deadCard: GameSnapshotView = {
  ...baseSnapshot(),
  status: 'active',
  currentSeat: 0,
  board: board(ACTIVE_BOARD, chips(2, '15C'), chips(1, '25C')),
};

/**
 * An overline: six chips in a row let the player choose which five lock into a
 * sequence. `placed` marks the cell just played.
 */
const sequenceChoice: GameSnapshotView = {
  ...baseSnapshot(),
  status: 'active',
  currentSeat: 0,
  board: board(chips(1, '1WW', '1AC', '1KC', '1QC', '1TC', '19C')),
  pendingChoice: {
    seat: 0,
    cells: ['1WW', '1AC', '1KC', '1QC', '1TC', '19C'],
    placed: '19C',
  },
};

const gameOver: GameSnapshotView = {
  ...baseSnapshot(),
  status: 'finished',
  currentSeat: 0,
  board: board(
    ACTIVE_BOARD,
    lockedChips(1, WINNING_SEQUENCE.id, ...WINNING_CELLS),
  ),
  sequences: [WINNING_SEQUENCE],
  winner: 1,
  winnerTeam: 1,
};

export interface GameFixture {
  /** Stable slug used in playground routes and fixture lookups. */
  id: string;
  /** Human label for menus and preview captions. */
  label: string;
  /** One-line note on what the state demonstrates. */
  description: string;
  snapshot: GameSnapshotView;
}

/**
 * The representative fixtures, in narrative order (lobby → play → end). Add a
 * new entry here to surface it in both the playground and any fixture-driven
 * test.
 */
export const gameFixtures: GameFixture[] = [
  {
    id: 'lobby',
    label: 'Lobby',
    description: 'Pre-game lobby with teams forming and no board yet.',
    snapshot: lobby,
  },
  {
    id: 'active-your-turn',
    label: 'Active — your turn',
    description:
      'Mid-game, it is the local seat’s turn with time on the clock.',
    snapshot: activeYourTurn,
  },
  {
    id: 'active-not-your-turn',
    label: 'Active — not your turn',
    description: 'Mid-game while an opponent is on the clock.',
    snapshot: activeNotYourTurn,
  },
  {
    id: 'dead-card',
    label: 'Dead card',
    description: 'Both board copies of a held card are covered, so it is dead.',
    snapshot: deadCard,
  },
  {
    id: 'sequence-choice',
    label: 'Sequence choice',
    description: 'An overline run prompts the player to pick the locking five.',
    snapshot: sequenceChoice,
  },
  {
    id: 'game-over',
    label: 'Game over',
    description: 'Finished game with a completed, locked winning sequence.',
    snapshot: gameOver,
  },
];

const fixturesById: Record<string, GameFixture> = Object.fromEntries(
  gameFixtures.map((fixture) => [fixture.id, fixture]),
);

/** Look up a single fixture by id. */
export function getGameFixture(id: string): GameFixture | undefined {
  return fixturesById[id];
}

/** The winning sequence cells, exported for board highlighting in previews. */
export const winningSequenceCells = WINNING_CELLS;
