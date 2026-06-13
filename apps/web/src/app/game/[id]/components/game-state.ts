import type { Card, Position, Team } from '@sequence/game-logic';

export interface SnapshotPlayer {
  seat: number;
  team: Team;
  name: string;
  isCreator: boolean;
  isGuest: boolean;
  connected: boolean;
}

export interface SnapshotBoardCell {
  chip?: Team;
  lockedBy?: number;
}

export interface SnapshotSequence {
  id: number;
  team: Team;
  cells: Position[];
}

export interface PendingChoiceView {
  seat: number;
  cells: Position[];
  placed?: Position;
  additionalRuns?: Position[][];
}

export interface GameSnapshotView {
  gameId: string;
  inviteCode: string;
  status: GameViewStatus;
  playerCount: number;
  mode: 'tap' | 'drag';
  timerSeconds: number | null;
  local: boolean;
  mySeat: number;
  currentSeat: number;
  round: number;
  version: number;
  board: Record<Position, SnapshotBoardCell>;
  sequences: SnapshotSequence[];
  players: SnapshotPlayer[];
  teams: Team[];
  hand: Card[];
  localHands?: Card[][];
  pendingChoice?: PendingChoiceView;
  winner?: Team;
  winnerTeam?: Team | null;
  endReason?: string | null;
  expiresAt?: string | null;
  turnDeadlineAt?: string | null;
  turnRemainingMs?: number | null;
}

export interface LoggedGameEvent {
  seq: number;
  type: string;
  payload: Record<string, unknown>;
  version?: number;
}

export type GameStreamItem =
  | { kind: 'snapshot'; snapshot: GameSnapshotView }
  | { kind: 'event'; event: LoggedGameEvent };

export type GameViewStatus =
  | 'lobby'
  | 'active'
  | 'frozen'
  | 'saved'
  | 'finished';

export interface LastMoveView {
  seat?: number;
  label: string;
}

export interface GameViewState extends GameSnapshotView {
  lastSeq: number;
  lastMove?: LastMoveView;
  lastPlayedCards: Record<number, Card>;
  recentEvents: LoggedGameEvent[];
}

export type GameScreen = 'loading' | 'lobby' | 'game' | 'handoff' | 'game-over';

function asCard(value: unknown): Card | undefined {
  if (
    typeof value === 'object' &&
    value !== null &&
    'rank' in value &&
    'suit' in value
  ) {
    const { rank, suit } = value as Card;
    if (typeof rank === 'string' && typeof suit === 'string') {
      return { rank, suit } as Card;
    }
  }
  return undefined;
}

function asCards(value: unknown): Card[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const cards = value.map(asCard);
  if (cards.some((card) => card === undefined)) return undefined;
  return cards as Card[];
}

function asPosition(value: unknown): Position | undefined {
  return typeof value === 'string' ? (value as Position) : undefined;
}

function asPositions(value: unknown): Position[] {
  return Array.isArray(value)
    ? (value.filter((cell) => typeof cell === 'string') as Position[])
    : [];
}

function asPositionRuns(value: unknown): Position[][] | undefined {
  if (!Array.isArray(value)) return undefined;
  const runs = value.map(asPositions).filter((run) => run.length > 0);
  return runs.length > 0 ? runs : undefined;
}

function asTeam(value: unknown): Team | undefined {
  return value === 1 || value === 2 || value === 3 ? value : undefined;
}

function asSeat(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value)
    ? value
    : undefined;
}

function cardLabel(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function removeOneCard(hand: readonly Card[], card: Card): Card[] {
  let removed = false;
  return hand.filter((candidate) => {
    if (
      !removed &&
      candidate.rank === card.rank &&
      candidate.suit === card.suit
    ) {
      removed = true;
      return false;
    }
    return true;
  });
}

function replaceCard(hand: readonly Card[], from: Card, to: Card): Card[] {
  let replaced = false;
  return hand.map((candidate) => {
    if (
      !replaced &&
      candidate.rank === from.rank &&
      candidate.suit === from.suit
    ) {
      replaced = true;
      return to;
    }
    return candidate;
  });
}

function updateLocalHands(
  state: GameViewState,
  seat: number,
  updater: (hand: Card[]) => Card[],
): Card[][] | undefined {
  if (!state.localHands) return undefined;
  return state.localHands.map((hand, index) =>
    index === seat ? updater([...hand]) : hand,
  );
}

function withEventBase(
  state: GameViewState,
  event: LoggedGameEvent,
): GameViewState {
  return {
    ...state,
    version: event.version ?? state.version,
    lastSeq: event.seq,
    recentEvents: [...state.recentEvents.slice(-9), event],
  };
}

export function stateFromSnapshot(snapshot: GameSnapshotView): GameViewState {
  return {
    ...snapshot,
    winnerTeam: snapshot.winnerTeam ?? snapshot.winner ?? null,
    endReason: snapshot.endReason ?? null,
    expiresAt: snapshot.expiresAt ?? null,
    turnDeadlineAt: snapshot.turnDeadlineAt ?? null,
    turnRemainingMs: snapshot.turnRemainingMs ?? null,
    lastSeq: 0,
    lastPlayedCards: {},
    recentEvents: [],
  };
}

export function applyGameEvent(
  current: GameViewState,
  event: LoggedGameEvent,
): GameViewState {
  const state = withEventBase(current, event);
  const payload = event.payload;

  switch (event.type) {
    case 'PlayerJoined': {
      const seat = asSeat(payload.seat);
      const team = asTeam(payload.team);
      const name = typeof payload.name === 'string' ? payload.name : 'Player';
      if (seat === undefined || team === undefined) return state;
      const existing = state.players.filter((p) => p.seat !== seat);
      const player: SnapshotPlayer = {
        seat,
        team,
        name,
        isCreator: false,
        isGuest: payload.isGuest === true,
        connected: true,
      };
      const players = [...existing];
      const insertAt = players.findIndex((candidate) => candidate.seat > seat);
      if (insertAt === -1) {
        players.push(player);
      } else {
        players.splice(insertAt, 0, player);
      }
      return {
        ...state,
        players,
      };
    }
    case 'TeamChanged': {
      const seat = asSeat(payload.seat);
      const team = asTeam(payload.team);
      if (seat === undefined || team === undefined) return state;
      const teams = [...state.teams];
      teams[seat] = team;
      return {
        ...state,
        teams,
        players: state.players.map((p) =>
          p.seat === seat ? { ...p, team } : p,
        ),
      };
    }
    case 'PlayerKicked': {
      const seat = asSeat(payload.seat);
      if (seat === undefined) return state;
      return {
        ...state,
        players: state.players.filter((p) => p.seat !== seat),
      };
    }
    case 'GameStarted': {
      const seat = asSeat(payload.currentSeat) ?? state.currentSeat;
      return { ...state, status: 'active', currentSeat: seat };
    }
    case 'HandUpdated': {
      const seat = asSeat(payload.seat);
      const hand = asCards(payload.hand);
      if (seat === undefined || !hand) return state;
      return {
        ...state,
        hand: seat === state.mySeat ? hand : state.hand,
        localHands: state.local
          ? updateLocalHands(state, seat, () => hand)
          : state.localHands,
      };
    }
    case 'ChipPlaced': {
      const seat = asSeat(payload.seat);
      const team = asTeam(payload.team);
      const position = asPosition(payload.position);
      const card = asCard(payload.card);
      if (team === undefined || position === undefined) return state;
      return {
        ...state,
        board: { ...state.board, [position]: { chip: team } },
        lastPlayedCards:
          seat !== undefined && card
            ? { ...state.lastPlayedCards, [seat]: card }
            : state.lastPlayedCards,
        hand:
          seat === state.mySeat && card
            ? removeOneCard(state.hand, card)
            : state.hand,
        localHands:
          state.local && seat !== undefined && card
            ? updateLocalHands(state, seat, (hand) => removeOneCard(hand, card))
            : state.localHands,
        lastMove: {
          seat,
          label: card
            ? `${cardLabel(card)} to ${position}`
            : `Chip to ${position}`,
        },
      };
    }
    case 'ChipRemoved': {
      const seat = asSeat(payload.seat);
      const position = asPosition(payload.position);
      const card = asCard(payload.card);
      if (!position) return state;
      const { [position]: _removed, ...board } = state.board;
      return {
        ...state,
        board,
        lastPlayedCards:
          seat !== undefined && card
            ? { ...state.lastPlayedCards, [seat]: card }
            : state.lastPlayedCards,
        hand:
          seat === state.mySeat && card
            ? removeOneCard(state.hand, card)
            : state.hand,
        localHands:
          state.local && seat !== undefined && card
            ? updateLocalHands(state, seat, (hand) => removeOneCard(hand, card))
            : state.localHands,
        lastMove: {
          seat,
          label: card
            ? `${cardLabel(card)} removed ${position}`
            : `Removed ${position}`,
        },
      };
    }
    case 'CardDrawn': {
      const seat = asSeat(payload.seat);
      const card = asCard(payload.card);
      if (seat === undefined || !card) return state;
      return {
        ...state,
        hand: seat === state.mySeat ? [...state.hand, card] : state.hand,
        localHands: state.local
          ? updateLocalHands(state, seat, (hand) => [...hand, card])
          : state.localHands,
      };
    }
    case 'DeadCardSwapped': {
      const seat = asSeat(payload.seat);
      const discarded = asCard(payload.discarded);
      const drawn = asCard(payload.drawn);
      if (seat === undefined || !discarded || !drawn) return state;
      return {
        ...state,
        hand:
          seat === state.mySeat
            ? replaceCard(state.hand, discarded, drawn)
            : state.hand,
        localHands: state.local
          ? updateLocalHands(state, seat, (hand) =>
              replaceCard(hand, discarded, drawn),
            )
          : state.localHands,
      };
    }
    case 'SequenceCompleted': {
      const team = asTeam(payload.team);
      const id = asSeat(payload.sequenceId);
      const cells = Array.isArray(payload.cells)
        ? (payload.cells.filter(
            (cell) => typeof cell === 'string',
          ) as Position[])
        : [];
      if (team === undefined || id === undefined || cells.length === 0) {
        return state;
      }
      const board = { ...state.board };
      for (const cell of cells) {
        const currentCell = board[cell];
        board[cell] = currentCell
          ? { ...currentCell, lockedBy: id }
          : { lockedBy: id };
      }
      return {
        ...state,
        board,
        sequences: [...state.sequences, { id, team, cells }],
      };
    }
    case 'PendingChoice': {
      const seat = asSeat(payload.seat);
      const cells = asPositions(payload.cells);
      const placed = asPosition(payload.placed);
      const additionalRuns = asPositionRuns(payload.additionalRuns);
      if (seat === undefined || cells.length === 0) return state;
      return {
        ...state,
        pendingChoice: {
          seat,
          cells,
          ...(placed ? { placed } : {}),
          ...(additionalRuns ? { additionalRuns } : {}),
        },
      };
    }
    case 'TurnAdvanced': {
      const seat = asSeat(payload.seat);
      const round = asSeat(payload.round);
      return {
        ...state,
        currentSeat: seat ?? state.currentSeat,
        round: round ?? state.round,
        pendingChoice: undefined,
      };
    }
    case 'GameWon': {
      const team = asTeam(payload.team);
      return {
        ...state,
        status: 'finished',
        winnerTeam: team ?? state.winnerTeam,
        endReason: 'win',
      };
    }
    case 'GameConceded': {
      return { ...state, status: 'finished', endReason: 'concede' };
    }
    case 'GameSaved': {
      return { ...state, status: 'saved' };
    }
    case 'PlayerDisconnected': {
      const seat = asSeat(payload.seat);
      return {
        ...state,
        status: 'frozen',
        players: state.players.map((p) =>
          p.seat === seat ? { ...p, connected: false } : p,
        ),
      };
    }
    case 'PlayerReconnected': {
      return {
        ...state,
        players: state.players.map((p) => ({ ...p, connected: true })),
      };
    }
    case 'TimerResumed': {
      return { ...state, status: 'active' };
    }
    default:
      return state;
  }
}

export function applyStreamItem(
  current: GameViewState | null,
  item: GameStreamItem,
): GameViewState | null {
  if (item.kind === 'snapshot') return stateFromSnapshot(item.snapshot);
  if (!current) return null;
  return applyGameEvent(current, item.event);
}

export function screenForState(
  state: GameViewState | null,
  handoffVisible = false,
): GameScreen {
  if (!state) return 'loading';
  if (state.status === 'lobby') return 'lobby';
  if (state.status === 'finished') return 'game-over';
  if (handoffVisible && state.local && state.status === 'active') {
    return 'handoff';
  }
  return 'game';
}
