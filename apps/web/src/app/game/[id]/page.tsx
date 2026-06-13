'use client';

import type { Position } from '@sequence/game-logic';
import { useMutation } from '@tanstack/react-query';
import { useSubscription } from '@trpc/tanstack-react-query';
import { useParams } from 'next/navigation';
import type { DragEvent } from 'react';
import { useEffect, useReducer, useState } from 'react';

import { Badge } from '@/components/badge.tsx';
import { Card } from '@/components/card.tsx';
import { useTRPC } from '@/lib/trpc/client.ts';

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
  applyStreamItem,
  screenForState,
  type GameStreamItem,
  type GameViewState,
} from './components/game-state.ts';
import {
  initialChoiceSelection,
  SequenceChoice,
  toggleChoiceCell,
} from './components/GameBoard/components/SequenceChoice.tsx';
import { GameBoard } from './components/GameBoard/GameBoard.tsx';
import {
  HandoffScreen,
  visibleHandForSeat,
} from './components/HandoffScreen/HandoffScreen.tsx';
import { LobbyTeams } from './components/LobbyTeams/LobbyTeams.tsx';
import { PlayerRail } from './components/PlayerRail/PlayerRail.tsx';

type ConnectionState = 'connecting' | 'live' | 'reconnecting' | 'error';
type TrackedStreamItem = GameStreamItem | { data: GameStreamItem };
type PlayerCount = 2 | 3 | 4 | 6;

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

function ReconnectingOverlay({ state }: { state: ConnectionState }) {
  if (state === 'live') return null;
  return (
    <div className="bg-slate/80 fixed inset-0 z-50 flex items-center justify-center p-4 text-white">
      <div className="bg-slate rounded-lg px-5 py-4 text-center shadow-xl">
        <p className="text-sm font-bold">
          {state === 'error' ? 'Connection interrupted' : 'Reconnecting…'}
        </p>
        <p className="mt-1 text-xs text-white/70">
          Your game state will resume from the server stream.
        </p>
      </div>
    </div>
  );
}

function GameRoutePlaceholder({ state }: { state: GameViewState }) {
  const trpc = useTRPC();
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

  const makeMove = useMutation(
    trpc.game.makeMove.mutationOptions({
      onSuccess: (result) => {
        showLocalHandoffAfterTurn(result);
        setSelectedCardIndex(null);
        setDragIntent(null);
        setDragHoverPosition(null);
      },
    }),
  );
  const turnInDeadCard = useMutation(
    trpc.game.turnInDeadCard.mutationOptions({
      onSuccess: () => {
        setDragIntent(null);
        setDragHoverPosition(null);
      },
    }),
  );
  const chooseSequenceCells = useMutation(
    trpc.game.chooseSequenceCells.mutationOptions({
      onSuccess: (result) => {
        showLocalHandoffAfterTurn(result);
        setChoiceCells([]);
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
  const canMakeBoardMove = pendingChoice === undefined && !handoffVisible;
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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 p-4">
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

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Badge tone={state.status === 'frozen' ? 'frozen' : 'neutral'}>
            {screen}
          </Badge>
          <span className="text-sm text-black/60">
            {connected}/{state.playerCount} connected
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {state.players.map((player) => (
            <div
              key={player.seat}
              className="bg-cream flex items-center gap-2 rounded-lg border border-black/10 p-2 text-sm"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{
                  backgroundColor:
                    player.team === 1
                      ? 'var(--color-team-blue)'
                      : player.team === 2
                        ? 'var(--color-team-green)'
                        : 'var(--color-team-red)',
                }}
                aria-hidden
              />
              <span className="font-medium">{player.name}</span>
              {player.seat === state.currentSeat ? (
                <span className="text-team-green text-xs font-bold">turn</span>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      <section className="flex justify-center">
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

      {pendingChoice ? (
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

      {handoffVisible ? (
        <HandoffScreen
          playerName={activePlayerName}
          lastMoveLabel={state.lastMove?.label}
          onReveal={revealHandoff}
        />
      ) : null}

      {dragMode ? (
        <section className="mx-auto flex w-full max-w-[min(94vw,680px)] items-center justify-between gap-3">
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
            className="border-team-blue bg-team-blue/10 text-team-blue flex min-h-12 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold"
          >
            <span
              aria-hidden
              className="bg-team-blue block h-7 w-7 rounded-full shadow-inner"
            />
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
            className="data-[active=true]:border-team-red data-[active=true]:bg-team-red/10 flex min-h-12 min-w-28 items-center justify-center rounded-lg border border-dashed border-black/25 px-4 py-2 text-sm font-bold text-black/60"
          >
            Discard
          </button>
        </section>
      ) : null}

      {!handoffVisible ? (
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
  const setTeam = useMutation(trpc.game.setTeam.mutationOptions());
  const kick = useMutation(trpc.game.kick.mutationOptions());
  const randomizeTeams = useMutation(
    trpc.game.randomizeTeams.mutationOptions(),
  );
  const start = useMutation(trpc.game.start.mutationOptions());

  const subscription = useSubscription(
    trpc.game.onGameEvent.subscriptionOptions(
      { gameId },
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
        <GameRoutePlaceholder state={state} />
      ) : (
        <main className="flex min-h-screen items-center justify-center p-8 text-sm text-black/50">
          Loading game…
        </main>
      )}
      {showOverlay ? (
        <ReconnectingOverlay
          state={subscription.status === 'error' ? 'error' : connectionState}
        />
      ) : null}
    </>
  );
}
