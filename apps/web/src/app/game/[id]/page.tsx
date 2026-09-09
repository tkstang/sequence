'use client';

import {
  applyStreamItem,
  ruleViolationMessage,
  screenForState,
  type GameStreamItem,
  type GameViewState,
} from '@sequence/client-state';
import type { Position } from '@sequence/game-logic';
import * as stylex from '@stylexjs/stylex';
import { useMutation } from '@tanstack/react-query';
import { useSubscription } from '@trpc/tanstack-react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type { DragEvent } from 'react';
import { useEffect, useReducer, useState } from 'react';

import { Badge } from '@/components/badge.tsx';
import { buttonClassName } from '@/components/button.tsx';
import { Card } from '@/components/card.tsx';
import { useTRPC } from '@/lib/trpc/client.ts';
import {
  color,
  fontSize,
  fontWeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

import { ActiveGameControls } from './components/ActiveGameControls/ActiveGameControls.tsx';
import { CardHand } from './components/CardHand/CardHand.tsx';
import {
  buildChipRemovalMove,
  buildDeadCardTurnIn,
  buildDragPlacementMove,
  canDragChipForRemoval,
  dragHoverTarget,
  type DragIntent,
} from './components/controllers/drag-controller.ts';
import {
  buildTapMove,
  createTapSelection,
  deadCardIndexes,
} from './components/controllers/tap-controller.ts';
import {
  initialChoiceSelection,
  SequenceChoice,
  toggleChoiceCell,
} from './components/GameBoard/components/SequenceChoice.tsx';
import { GameBoard } from './components/GameBoard/GameBoard.tsx';
import { GameOver } from './components/GameOver/GameOver.tsx';
import {
  HandoffScreen,
  visibleHandForSeat,
} from './components/HandoffScreen/HandoffScreen.tsx';
import { LobbyTeams } from './components/LobbyTeams/LobbyTeams.tsx';
import { PlayerRail } from './components/PlayerRail/PlayerRail.tsx';
import {
  ConnectionBanner,
  ToastViewport,
  useToastQueue,
} from './components/toasts.tsx';

type ConnectionState = 'connecting' | 'live' | 'reconnecting' | 'error';
type TrackedStreamItem = GameStreamItem | { data: GameStreamItem };
type PlayerCount = 2 | 3 | 4 | 6;
type RecoveryCursor = { seq: number; offset: 0 | 1 };

const styles = stylex.create({
  centerMain: {
    display: 'flex',
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxl,
  },
  loadingMain: {
    display: 'flex',
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxxl,
    fontSize: fontSize.sm,
    color: color.textFaint,
  },
  errorSection: {
    display: 'flex',
    width: '100%',
    maxWidth: '28rem',
    flexDirection: 'column',
    gap: space.lg,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: color.text,
  },
  errorBody: {
    marginBlockStart: space.sm,
    fontSize: fontSize.sm,
    color: color.textMuted,
  },
  errorActions: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: space.sm,
  },
  gameMain: {
    marginInline: 'auto',
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    maxWidth: '64rem',
    flexDirection: 'column',
    gap: { default: space.md, '@media (min-width: 640px)': space.lg },
    padding: { default: space.sm, '@media (min-width: 640px)': space.lg },
  },
  statusCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.md,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: space.sm,
  },
  connectedText: {
    fontSize: fontSize.sm,
    color: color.textMuted,
  },
  playerGrid: {
    display: 'grid',
    gap: space.sm,
    gridTemplateColumns: {
      default: '1fr',
      '@media (min-width: 640px)': 'repeat(2, minmax(0, 1fr))',
    },
  },
  playerCell: {
    display: 'flex',
    minWidth: 0,
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.border,
    backgroundColor: color.bg,
    padding: space.sm,
    fontSize: fontSize.sm,
    color: color.text,
  },
  playerDot: {
    height: '12px',
    width: '12px',
    flexShrink: 0,
    borderRadius: radius.round,
  },
  playerName: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: fontWeight.medium,
  },
  turnTag: {
    flexShrink: 0,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: color.teamGreen,
  },
  boardSection: {
    display: 'flex',
    justifyContent: 'center',
  },
  dragBar: {
    marginInline: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: 'min(94vw, 680px)',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  playChip: {
    display: 'flex',
    minHeight: '48px',
    alignItems: 'center',
    gap: space.sm,
    borderRadius: radius.md,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.teamBlue,
    backgroundColor: `color-mix(in srgb, ${color.teamBlue} 12%, transparent)`,
    paddingInline: space.lg,
    paddingBlock: space.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: color.teamBlue,
    cursor: 'grab',
    transitionProperty: 'background-color, border-color',
    transitionDuration: '140ms',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  playChipDot: {
    display: 'block',
    height: '28px',
    width: '28px',
    borderRadius: radius.round,
    backgroundColor: color.teamBlue,
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.18)',
  },
  discard: {
    display: 'flex',
    minHeight: '48px',
    minWidth: '112px',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: '1px',
    borderStyle: 'dashed',
    borderColor: color.borderStrong,
    backgroundColor: 'transparent',
    paddingInline: space.lg,
    paddingBlock: space.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: color.textMuted,
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color',
    transitionDuration: '140ms',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
  },
  discardActive: {
    borderColor: color.teamRed,
    backgroundColor: `color-mix(in srgb, ${color.teamRed} 12%, transparent)`,
  },
});

const teamDotColor = stylex.create({
  tint: (value: string) => ({ backgroundColor: value }),
});

function reducer(
  state: GameViewState | null,
  item: GameStreamItem,
): GameViewState | null {
  return applyStreamItem(state, item);
}

function unwrapStreamItem(item: TrackedStreamItem): GameStreamItem {
  return 'data' in item ? item.data : item;
}

function asPlayerCount(count: number): PlayerCount {
  return count === 3 || count === 4 || count === 6 ? count : 2;
}

function isConflictError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'code' in error.data &&
    error.data.code === 'CONFLICT'
  );
}

function trpcErrorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof error.data === 'object' &&
    error.data !== null &&
    'code' in error.data &&
    typeof error.data.code === 'string'
  ) {
    return error.data.code;
  }
  return undefined;
}

function GameLoadError({
  gameId,
  errorCode,
}: {
  gameId: string;
  errorCode?: string;
}) {
  const isAuthzError =
    errorCode === 'UNAUTHORIZED' || errorCode === 'FORBIDDEN';
  const loginHref = `/login?next=${encodeURIComponent(`/game/${gameId}`)}`;

  return (
    <main {...stylex.props(styles.centerMain)}>
      <section {...stylex.props(styles.errorSection)}>
        <div>
          <h1 {...stylex.props(styles.errorTitle)}>Game unavailable</h1>
          <p {...stylex.props(styles.errorBody)}>
            {isAuthzError
              ? 'Log in with the account that created or joined this game.'
              : 'The game stream could not start. Try again in a moment.'}
          </p>
        </div>
        <div {...stylex.props(styles.errorActions)}>
          {isAuthzError ? (
            <Link
              href={loginHref}
              className={buttonClassName({ variant: 'primary' })}
            >
              Log in
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={buttonClassName({ variant: 'primary' })}
            >
              Retry
            </button>
          )}
          <Link
            href="/dashboard"
            className={buttonClassName({ variant: 'secondary' })}
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

function GameRoutePlaceholder({
  state,
  onConflictRecovery,
}: {
  state: GameViewState;
  onConflictRecovery: () => void;
}) {
  const trpc = useTRPC();
  const router = useRouter();
  const { toasts, pushToast, dismissToast } = useToastQueue();
  const connected = state.players.filter((p) => p.connected).length;
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null,
  );
  const [dragIntent, setDragIntent] = useState<DragIntent | null>(null);
  const [dragHoverPosition, setDragHoverPosition] = useState<Position | null>(
    null,
  );
  const [choiceCells, setChoiceCells] = useState<Position[]>(
    initialChoiceSelection(state.pendingChoice),
  );
  const [revealedSeat, setRevealedSeat] = useState(
    state.local ? state.currentSeat : state.mySeat,
  );
  const [handoffTargetSeat, setHandoffTargetSeat] = useState<number | null>(
    null,
  );
  const handoffVisible =
    state.local && state.status === 'active' && handoffTargetSeat !== null;
  const activeSeat = state.local
    ? (handoffTargetSeat ?? state.currentSeat)
    : state.mySeat;
  const activeHand = visibleHandForSeat({
    local: state.local,
    localHands: state.localHands,
    fallbackHand: state.hand,
    seat: activeSeat,
    veiled: handoffVisible,
  });
  const screen = screenForState(state, handoffVisible);

  function revealHandoff() {
    setRevealedSeat(activeSeat);
    setHandoffTargetSeat(null);
  }

  function showLocalHandoffAfterTurn(result: {
    events?: readonly { type: string; seat?: number }[];
  }) {
    if (!state.local) return;
    const turnAdvanced = result.events?.find(
      (event) => event.type === 'TurnAdvanced',
    );
    if (turnAdvanced?.seat !== undefined) {
      setHandoffTargetSeat(turnAdvanced.seat);
    }
  }

  function notifyGameError(error: unknown) {
    if (isConflictError(error)) onConflictRecovery();
    pushToast({
      tone: 'error',
      title: 'Move blocked',
      detail: isConflictError(error)
        ? 'Game changed. Refreshing state.'
        : ruleViolationMessage(error),
    });
  }

  const makeMove = useMutation(
    trpc.game.makeMove.mutationOptions({
      onSuccess: (result) => {
        showLocalHandoffAfterTurn(result);
        pushToast({ tone: 'success', title: 'Move played' });
        setSelectedCardIndex(null);
        setDragIntent(null);
        setDragHoverPosition(null);
      },
      onError: notifyGameError,
    }),
  );
  const turnInDeadCard = useMutation(
    trpc.game.turnInDeadCard.mutationOptions({
      onSuccess: () => {
        pushToast({ tone: 'success', title: 'Card swapped' });
        setDragIntent(null);
        setDragHoverPosition(null);
      },
      onError: notifyGameError,
    }),
  );
  const chooseSequenceCells = useMutation(
    trpc.game.chooseSequenceCells.mutationOptions({
      onSuccess: (result) => {
        showLocalHandoffAfterTurn(result);
        pushToast({ tone: 'success', title: 'Sequence locked' });
        setChoiceCells([]);
      },
      onError: notifyGameError,
    }),
  );
  const rematch = useMutation(
    trpc.game.rematch.mutationOptions({
      onSuccess: (result) => router.push(`/game/${result.gameId}`),
      onError: (error) =>
        pushToast({
          tone: 'error',
          title: 'Rematch unavailable',
          detail: ruleViolationMessage(error),
        }),
    }),
  );
  const saveAndExit = useMutation(
    trpc.game.saveAndExit.mutationOptions({
      onSuccess: () => {
        pushToast({ tone: 'success', title: 'Game saved' });
        window.setTimeout(() => router.push('/dashboard'), 350);
      },
      onError: (error) => {
        if (isConflictError(error)) onConflictRecovery();
        pushToast({
          tone: 'error',
          title: 'Save failed',
          detail: isConflictError(error)
            ? 'Game changed. Refreshing state.'
            : ruleViolationMessage(error),
        });
      },
    }),
  );
  const concede = useMutation(
    trpc.game.concede.mutationOptions({
      onSuccess: () => {
        pushToast({ tone: 'success', title: 'Game conceded' });
      },
      onError: (error) => {
        if (isConflictError(error)) onConflictRecovery();
        pushToast({
          tone: 'error',
          title: 'Concede failed',
          detail: isConflictError(error)
            ? 'Game changed. Refreshing state.'
            : ruleViolationMessage(error),
        });
      },
    }),
  );
  const pendingChoiceKey = state.pendingChoice
    ? `${state.pendingChoice.seat}:${state.pendingChoice.cells.join('|')}:${
        state.pendingChoice.placed ?? ''
      }`
    : 'none';
  useEffect(() => {
    setChoiceCells(initialChoiceSelection(state.pendingChoice));
  }, [pendingChoiceKey, state.pendingChoice]);
  useEffect(() => {
    if (!state.local || state.status !== 'active') {
      setHandoffTargetSeat(null);
      setRevealedSeat(state.currentSeat);
      return;
    }
    if (state.currentSeat !== revealedSeat && handoffTargetSeat === null) {
      setHandoffTargetSeat(state.currentSeat);
    }
  }, [
    handoffTargetSeat,
    revealedSeat,
    state.currentSeat,
    state.local,
    state.status,
  ]);
  const myTeam =
    state.teams[activeSeat] ??
    state.players.find((player) => player.seat === activeSeat)?.team ??
    1;
  const pendingChoice = state.pendingChoice;
  const gameFinished = state.status === 'finished';
  const canMakeBoardMove =
    pendingChoice === undefined && !handoffVisible && !gameFinished;
  const tapSelection =
    state.mode === 'tap' && canMakeBoardMove
      ? createTapSelection({
          hand: activeHand,
          board: state.board,
          team: myTeam,
          selectedIndex: selectedCardIndex,
        })
      : null;
  const defaultModeDeadCards =
    state.mode === 'tap' ? deadCardIndexes(activeHand, state.board) : [];
  const choosingSequence = pendingChoice?.seat === activeSeat;
  const activePlayerName =
    state.players.find((player) => player.seat === activeSeat)?.name ??
    `Seat ${activeSeat + 1}`;
  const choiceActorName =
    state.players.find((player) => player.seat === pendingChoice?.seat)?.name ??
    `Seat ${(pendingChoice?.seat ?? 0) + 1}`;
  const dragMode = state.mode === 'drag' && canMakeBoardMove;
  const clearDrag = () => {
    setDragIntent(null);
    setDragHoverPosition(null);
  };
  const submitMove = (move: ReturnType<typeof buildDragPlacementMove>) => {
    if (!move) return;
    makeMove.mutate({
      gameId: state.gameId,
      version: state.version,
      move,
    });
  };
  const handleDiscardDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!dragMode || !dragIntent) return;
    if (dragIntent.kind === 'removeChip') {
      submitMove(
        buildChipRemovalMove(state.board, dragIntent.position, myTeam),
      );
    }
    if (dragIntent.kind === 'turnInDeadCard') {
      const card = buildDeadCardTurnIn(
        activeHand,
        state.board,
        dragIntent.index,
      );
      if (card) {
        turnInDeadCard.mutate({
          gameId: state.gameId,
          version: state.version,
          card,
        });
      }
    }
    clearDrag();
  };

  return (
    <main {...stylex.props(styles.gameMain)}>
      <PlayerRail
        players={state.players}
        currentSeat={state.currentSeat}
        round={state.round}
        sequences={state.sequences}
        lastPlayedCards={state.lastPlayedCards}
        timerSeconds={state.timerSeconds}
        turnDeadlineAt={state.turnDeadlineAt}
        turnRemainingMs={state.turnRemainingMs}
        status={state.status}
      />

      <Card {...stylex.props(styles.statusCard)}>
        <div {...stylex.props(styles.statusRow)}>
          <Badge tone={state.status === 'frozen' ? 'frozen' : 'neutral'}>
            {screen}
          </Badge>
          <span {...stylex.props(styles.connectedText)}>
            {connected}/{state.playerCount} connected
          </span>
        </div>
        <div {...stylex.props(styles.playerGrid)}>
          {state.players.map((player) => {
            const dotColor =
              player.team === 1
                ? color.teamBlue
                : player.team === 2
                  ? color.teamGreen
                  : color.teamRed;
            return (
              <div key={player.seat} {...stylex.props(styles.playerCell)}>
                <span
                  {...stylex.props(
                    styles.playerDot,
                    teamDotColor.tint(dotColor),
                  )}
                  aria-hidden
                />
                <span {...stylex.props(styles.playerName)}>{player.name}</span>
                {player.seat === state.currentSeat ? (
                  <span {...stylex.props(styles.turnTag)}>turn</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>

      {!gameFinished && !handoffVisible ? (
        <ActiveGameControls
          isSaving={saveAndExit.isPending}
          isConceding={concede.isPending}
          onSaveAndExit={() =>
            saveAndExit.mutate({ gameId: state.gameId, version: state.version })
          }
          onConcede={() =>
            concede.mutate({ gameId: state.gameId, version: state.version })
          }
        />
      ) : null}

      <section {...stylex.props(styles.boardSection)}>
        <GameBoard
          board={state.board}
          validTargets={tapSelection?.validTargets}
          hoverPosition={
            dragMode ? dragHoverTarget(dragIntent, dragHoverPosition) : null
          }
          winningCells={state.sequences
            .filter((sequence) => sequence.team === state.winnerTeam)
            .flatMap((sequence) => sequence.cells)}
          pendingChoiceCells={state.pendingChoice?.cells}
          choiceSelectedCells={choosingSequence ? choiceCells : []}
          canDragCell={(position) =>
            dragMode && canDragChipForRemoval(state.board, position, myTeam)
          }
          onCellSelect={(position) => {
            if (choosingSequence && pendingChoice) {
              setChoiceCells((current) =>
                toggleChoiceCell(current, position, pendingChoice),
              );
              return;
            }
            if (!canMakeBoardMove) return;
            const move = buildTapMove(tapSelection, position);
            submitMove(move);
          }}
          onCellDragStart={(position) => {
            if (!dragMode) return;
            if (!canDragChipForRemoval(state.board, position, myTeam)) return;
            setDragIntent({ kind: 'removeChip', position });
          }}
          onCellDragEnd={clearDrag}
          onCellDragOver={(position) => {
            if (!dragMode) return;
            setDragHoverPosition(dragHoverTarget(dragIntent, position));
          }}
          onCellDrop={(position) => {
            if (!dragMode || dragIntent?.kind !== 'place') return;
            submitMove(buildDragPlacementMove(position));
          }}
        />
      </section>

      {gameFinished ? (
        <GameOver
          winnerTeam={state.winnerTeam}
          endReason={state.endReason}
          concededTeam={state.concededTeam}
          players={state.players}
          isRematching={rematch.isPending}
          onRematch={() => rematch.mutate({ gameId: state.gameId })}
        />
      ) : null}

      {!gameFinished && pendingChoice ? (
        <SequenceChoice
          pendingChoice={pendingChoice}
          selectedCells={choiceCells}
          isActor={choosingSequence}
          actorName={choiceActorName}
          isSubmitting={chooseSequenceCells.isPending}
          onToggleCell={(cell) =>
            setChoiceCells((current) =>
              toggleChoiceCell(current, cell, pendingChoice),
            )
          }
          onConfirm={(cells) =>
            chooseSequenceCells.mutate({
              gameId: state.gameId,
              version: state.version,
              cells,
            })
          }
        />
      ) : null}

      {!gameFinished && handoffVisible ? (
        <HandoffScreen
          playerName={activePlayerName}
          lastMoveLabel={state.lastMove?.label}
          onReveal={revealHandoff}
        />
      ) : null}

      {!gameFinished && dragMode ? (
        <section {...stylex.props(styles.dragBar)}>
          <button
            type="button"
            draggable
            aria-label="Drag chip to board"
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'copyMove';
              event.dataTransfer.setData('text/plain', 'chip');
              setDragIntent({ kind: 'place' });
            }}
            onDragEnd={clearDrag}
            {...stylex.props(styles.playChip)}
          >
            <span aria-hidden {...stylex.props(styles.playChipDot)} />
            Play chip
          </button>
          <button
            type="button"
            aria-label="Discard"
            data-active={
              dragIntent?.kind === 'removeChip' ||
              dragIntent?.kind === 'turnInDeadCard'
            }
            onDragOver={(event) => {
              if (!dragIntent) return;
              event.preventDefault();
            }}
            onDrop={handleDiscardDrop}
            {...stylex.props(
              styles.discard,
              (dragIntent?.kind === 'removeChip' ||
                dragIntent?.kind === 'turnInDeadCard') &&
                styles.discardActive,
            )}
          >
            Discard
          </button>
        </section>
      ) : null}

      {!gameFinished && !handoffVisible ? (
        <CardHand
          hand={activeHand}
          mode={state.mode}
          selectedIndex={selectedCardIndex}
          deadCardIndexes={defaultModeDeadCards}
          onSelectCard={(_, index) =>
            setSelectedCardIndex((current) =>
              current === index ? null : index,
            )
          }
          onCardDragStart={
            dragMode
              ? (card, index) =>
                  setDragIntent({ kind: 'turnInDeadCard', card, index })
              : undefined
          }
          onCardDragEnd={clearDrag}
        />
      ) : null}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

export default function GamePage() {
  const params = useParams<{ id: string }>();
  const gameId = params.id;
  const trpc = useTRPC();
  const [state, dispatch] = useReducer(reducer, null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('connecting');
  const [recoveryCursor, setRecoveryCursor] = useState<RecoveryCursor | null>(
    null,
  );
  const setTeam = useMutation(trpc.game.setTeam.mutationOptions());
  const kick = useMutation(trpc.game.kick.mutationOptions());
  const randomizeTeams = useMutation(
    trpc.game.randomizeTeams.mutationOptions(),
  );
  const start = useMutation(trpc.game.start.mutationOptions());

  const subscription = useSubscription(
    trpc.game.onGameEvent.subscriptionOptions(
      recoveryCursor
        ? {
            gameId,
            lastEventId: Math.max(
              0,
              recoveryCursor.seq - recoveryCursor.offset,
            ),
          }
        : { gameId },
      {
        onStarted: () => setConnectionState('live'),
        onData: (item) => {
          dispatch(unwrapStreamItem(item as unknown as TrackedStreamItem));
          setConnectionState('live');
        },
        onError: () => setConnectionState('error'),
        onConnectionStateChange: (next) => {
          if (next.state === 'connecting') {
            setConnectionState(state ? 'reconnecting' : 'connecting');
          }
          if (next.state === 'idle') setConnectionState('reconnecting');
        },
      },
    ),
  );

  const showOverlay =
    connectionState !== 'live' || subscription.status === 'error';
  const subscriptionErrorCode = trpcErrorCode(subscription.error);
  const showInitialLoadError = !state && subscription.status === 'error';
  const isMutating =
    setTeam.isPending ||
    kick.isPending ||
    randomizeTeams.isPending ||
    start.isPending;

  return (
    <>
      {state?.status === 'lobby' ? (
        <LobbyTeams
          inviteCode={state.inviteCode}
          playerCount={asPlayerCount(state.playerCount)}
          mode={state.mode}
          timerSeconds={state.timerSeconds}
          players={state.players}
          mySeat={state.mySeat}
          isMutating={isMutating}
          onJoinTeam={(team) =>
            setTeam.mutate({ gameId, targetSeat: state.mySeat, team })
          }
          onKick={(seat) => kick.mutate({ gameId, targetSeat: seat })}
          onRandomize={() => randomizeTeams.mutate({ gameId })}
          onStart={() => start.mutate({ gameId })}
          onCopyInvite={async () => {
            const inviteUrl = `${window.location.origin}/join/${state.inviteCode}`;
            await navigator.clipboard?.writeText(inviteUrl);
          }}
        />
      ) : state ? (
        <GameRoutePlaceholder
          state={state}
          onConflictRecovery={() =>
            setRecoveryCursor((current) => ({
              seq: state.lastSeq,
              offset:
                current?.seq === state.lastSeq && current.offset === 0 ? 1 : 0,
            }))
          }
        />
      ) : showInitialLoadError ? (
        <GameLoadError gameId={gameId} errorCode={subscriptionErrorCode} />
      ) : (
        <main {...stylex.props(styles.loadingMain)}>Loading game…</main>
      )}
      {showOverlay && !showInitialLoadError ? (
        <ConnectionBanner
          state={subscription.status === 'error' ? 'error' : connectionState}
        />
      ) : null}
    </>
  );
}
