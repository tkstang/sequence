import type { GameViewState } from '@sequence/client-state';
import type { Card, Move, Position, Team } from '@sequence/game-logic';
import { isOneEyedJack } from '@sequence/game-logic';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTRPC } from '../../api/client.ts';
import { mapTRPCErrorToPolicy } from '../../api/error-policy.ts';
import { ConnectionBanner } from '../../components/ConnectionBanner.tsx';
import { Screen } from '../../components/Screen.tsx';
import { CardHand } from '../../game/CardHand/CardHand.tsx';
import { DragLayer } from '../../game/drag/DragLayer.tsx';
import { GameBoard } from '../../game/GameBoard/GameBoard.tsx';
import { createBoardLayoutMap } from '../../game/GameBoard/layout-map.ts';
import { createBoardSpotlight } from '../../game/GameBoard/spotlight.ts';
import { LobbyTeams, type LobbyPlayerCount } from '../../game/LobbyTeams.tsx';
import { PlayerRail } from '../../game/PlayerRail/PlayerRail.tsx';
import { useMoveSubmit } from '../../game/use-move-submit.ts';
import { useGameStream } from '../../realtime/use-game-stream.ts';
import { testId } from '../../test/test-ids.ts';
import { useTheme } from '../../theme/use-theme.ts';

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function isLobbyPlayerCount(value: number): value is LobbyPlayerCount {
  return value === 2 || value === 3 || value === 4 || value === 6;
}

function mutationMessage(error: unknown): string {
  const policy = mapTRPCErrorToPolicy(error);
  if (policy === 'not-participant') {
    return 'You are not allowed to change this lobby.';
  }
  if (policy === 'refetch-feedback') {
    return 'The lobby changed. Live updates will refresh it.';
  }
  if (policy === 'backoff-toast') {
    return 'Too many requests. Wait a moment and try again.';
  }
  if (policy === 'redirect-login') {
    return 'Sign in or rejoin this game to continue.';
  }
  return error instanceof Error ? error.message : 'Could not update lobby.';
}

function cardCode(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function teamForSeat(view: GameViewState): Team | null {
  const team = view.teams[view.mySeat];
  if (team !== undefined) return team;
  return (
    view.players.find((player) => player.seat === view.mySeat)?.team ?? null
  );
}

function Placeholder({ title, view }: { title: string; view: GameViewState }) {
  const { colors } = useTheme();

  return (
    <View style={styles.placeholder} testID={testId('game', 'placeholder')}>
      <Text style={[styles.placeholderTitle, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.placeholderBody, { color: colors.textMuted }]}>
        This game state is live. The full mobile surface lands in a later phase.
      </Text>
      <Text style={[styles.placeholderMeta, { color: colors.textMuted }]}>
        Version {view.version}
      </Text>
    </View>
  );
}

function ActiveGameView({
  gameId,
  view,
}: {
  gameId: string;
  view: GameViewState;
}) {
  const { colors } = useTheme();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const moveSubmit = useMoveSubmit({ gameId, view });
  const boardLayoutMap = useMemo(() => createBoardLayoutMap(), []);
  const currentPlayer = view.players.find(
    (player) => player.seat === view.currentSeat,
  );
  const currentTeam = teamForSeat(view);
  const myTurn = view.currentSeat === view.mySeat;
  const dragMode = view.mode === 'drag';
  const selectionDisabled =
    !myTurn || moveSubmit.selectedCardDisabled || !moveSubmit.canSubmit;
  const dragEnabled = dragMode && !selectionDisabled;
  const spotlight = useMemo(
    () =>
      createBoardSpotlight({
        board: view.board,
        currentTeam,
        selectedCard: selectionDisabled || dragMode ? null : selectedCard,
      }),
    [currentTeam, dragMode, selectedCard, selectionDisabled, view.board],
  );

  useEffect(() => {
    if (
      (selectionDisabled ||
        selectedIndex === null ||
        selectedIndex >= view.hand.length) &&
      (selectedCard !== null || selectedIndex !== null)
    ) {
      setSelectedCard(null);
      setSelectedIndex(null);
    }
  }, [selectedCard, selectedIndex, selectionDisabled, view.hand.length]);

  const handleCellPress = async (position: Position) => {
    if (
      !myTurn ||
      !moveSubmit.canSubmit ||
      !selectedCard ||
      !spotlight.targets.has(position)
    ) {
      return;
    }

    const move: Move = isOneEyedJack(selectedCard)
      ? { card: selectedCard, position, type: 'removeChip' }
      : { card: selectedCard, position, type: 'place' };
    const submitted = await moveSubmit.submitMove(move);
    if (submitted) {
      setSelectedCard(null);
      setSelectedIndex(null);
    }
  };
  const handleDragDrop = async (position: Position) => {
    if (!dragEnabled || selectedCard === null) return;

    const move: Move = isOneEyedJack(selectedCard)
      ? { position, type: 'removeChip' }
      : { position, type: 'place' };
    const submitted = await moveSubmit.submitMove(move);
    if (submitted) {
      setSelectedCard(null);
      setSelectedIndex(null);
    }
  };
  const turnTitle = myTurn
    ? 'Your turn'
    : `${currentPlayer?.name ?? 'Opponent'}'s turn`;
  const controlsCopy = moveSubmit.submitting
    ? 'Submitting move...'
    : (moveSubmit.feedback?.message ??
      (myTurn
        ? selectedCard
          ? dragMode
            ? `Drag ${cardCode(selectedCard)} onto a board cell.`
            : `Tap a highlighted board cell for ${cardCode(selectedCard)}.`
          : 'Select a card to show legal targets.'
        : `Waiting for ${currentPlayer?.name ?? 'the current player'}.`));

  return (
    <View style={styles.activeStack} testID={testId('game', 'active')}>
      <View
        accessibilityLiveRegion="polite"
        style={[
          styles.turnBanner,
          {
            backgroundColor: myTurn ? colors.savedBg : colors.surfaceRaised,
            borderColor: myTurn ? colors.savedFg : colors.border,
          },
        ]}
        testID={testId('game', 'turn', 'banner')}
      >
        <Text
          style={[
            styles.turnTitle,
            { color: myTurn ? colors.savedFg : colors.text },
          ]}
        >
          {turnTitle}
        </Text>
        <Text
          style={[
            styles.turnBody,
            { color: myTurn ? colors.savedFg : colors.textMuted },
          ]}
        >
          Round {view.round} - Version {view.version}
        </Text>
      </View>

      <PlayerRail
        currentSeat={view.currentSeat}
        players={view.players}
        round={view.round}
        sequences={view.sequences}
        status={view.status}
        timerSeconds={view.timerSeconds}
        turnDeadlineAt={view.turnDeadlineAt}
        turnRemainingMs={view.turnRemainingMs}
      />

      <View
        style={styles.playSurface}
        testID={testId('game', 'play', 'surface')}
      >
        <View style={styles.boardSurface}>
          <GameBoard
            board={view.board}
            currentTeam={selectionDisabled ? null : currentTeam}
            layoutMap={boardLayoutMap}
            onCellPress={handleCellPress}
            selectedCard={selectionDisabled || dragMode ? null : selectedCard}
            sequences={view.sequences}
          />
          {dragMode ? (
            <DragLayer
              card={dragEnabled ? selectedCard : null}
              enabled={dragEnabled}
              layoutMap={boardLayoutMap}
              onDrop={handleDragDrop}
            />
          ) : null}
        </View>
        <CardHand
          board={view.board}
          disabled={selectionDisabled}
          hand={view.hand}
          mode={view.mode}
          onSelectionChange={(card, index) => {
            moveSubmit.clearFeedback();
            setSelectedCard(card);
            setSelectedIndex(index);
          }}
          selectedIndex={selectionDisabled ? null : selectedIndex}
        />
      </View>

      <View
        accessibilityLiveRegion="polite"
        style={[
          styles.controls,
          {
            backgroundColor:
              moveSubmit.feedback?.tone === 'error'
                ? colors.frozenBg
                : colors.surfaceRaised,
            borderColor:
              moveSubmit.feedback?.tone === 'error'
                ? colors.danger
                : colors.border,
          },
        ]}
        testID={testId('game', 'controls')}
      >
        <Text
          accessibilityRole={moveSubmit.feedback ? 'alert' : undefined}
          style={[
            styles.controlsText,
            {
              color:
                moveSubmit.feedback?.tone === 'error'
                  ? colors.danger
                  : colors.text,
            },
          ]}
        >
          {controlsCopy}
        </Text>
      </View>
    </View>
  );
}

function GameStateView({
  gameId,
  isMutating,
  mutationError,
  onClearError,
  onJoinTeam,
  onKick,
  onRandomize,
  onStart,
  view,
}: {
  gameId: string;
  isMutating: boolean;
  mutationError: string | null;
  onClearError: () => void;
  onJoinTeam: (team: 1 | 2 | 3) => void;
  onKick: (seat: number) => void;
  onRandomize: () => void;
  onStart: () => void;
  view: GameViewState;
}) {
  const { colors } = useTheme();

  if (view.status === 'lobby') {
    if (!isLobbyPlayerCount(view.playerCount)) {
      return <Placeholder title="Unsupported lobby size" view={view} />;
    }

    return (
      <View style={styles.stack}>
        <LobbyTeams
          inviteCode={view.inviteCode}
          isMutating={isMutating}
          mode={view.mode}
          mySeat={view.mySeat}
          onJoinTeam={(team) => {
            onClearError();
            onJoinTeam(team);
          }}
          onKick={(seat) => {
            onClearError();
            onKick(seat);
          }}
          onRandomize={() => {
            onClearError();
            onRandomize();
          }}
          onStart={() => {
            onClearError();
            onStart();
          }}
          playerCount={view.playerCount}
          players={view.players}
          timerSeconds={view.timerSeconds}
        />
        {mutationError ? (
          <Text
            accessibilityRole="alert"
            style={[styles.error, { color: colors.danger }]}
            testID={testId('lobby', 'error')}
          >
            {mutationError}
          </Text>
        ) : null}
      </View>
    );
  }

  if (view.status === 'active') {
    return <ActiveGameView gameId={gameId} view={view} />;
  }
  if (view.status === 'finished') {
    return <Placeholder title="Game finished" view={view} />;
  }
  if (view.status === 'frozen') {
    return <Placeholder title="Game frozen" view={view} />;
  }
  return <Placeholder title="Game saved" view={view} />;
}

export default function GameRouteScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const gameId = firstParam(params.id);
  const trpc = useTRPC();
  const { colors } = useTheme();
  const [mutationError, setMutationError] = useState<string | null>(null);
  const stream = useGameStream(gameId);

  const mutationOptions = {
    onError(error: unknown) {
      setMutationError(mutationMessage(error));
    },
  };
  const setTeam = useMutation(
    trpc.game.setTeam.mutationOptions(mutationOptions),
  );
  const kick = useMutation(trpc.game.kick.mutationOptions(mutationOptions));
  const randomizeTeams = useMutation(
    trpc.game.randomizeTeams.mutationOptions(mutationOptions),
  );
  const start = useMutation(trpc.game.start.mutationOptions(mutationOptions));
  const isMutating =
    setTeam.isPending ||
    kick.isPending ||
    randomizeTeams.isPending ||
    start.isPending;

  return (
    <Screen
      header={
        <Screen.Header
          eyebrow="Live game"
          title="Sequence"
          testID={testId('game', 'header')}
        />
      }
      scroll
      testID={testId('game', 'screen')}
    >
      <View style={styles.stack}>
        <ConnectionBanner connectionState={stream.connectionState} />
        {gameId.length === 0 ? (
          <Text style={[styles.error, { color: colors.danger }]}>
            Missing game id.
          </Text>
        ) : stream.view ? (
          <GameStateView
            gameId={gameId}
            isMutating={isMutating}
            mutationError={mutationError}
            onClearError={() => setMutationError(null)}
            onJoinTeam={(team) =>
              setTeam.mutate({ gameId, targetSeat: stream.view!.mySeat, team })
            }
            onKick={(targetSeat) => kick.mutate({ gameId, targetSeat })}
            onRandomize={() => randomizeTeams.mutate({ gameId })}
            onStart={() => start.mutate({ gameId })}
            view={stream.view}
          />
        ) : stream.connectionState === 'error' ? (
          <Text style={[styles.error, { color: colors.danger }]}>
            Could not load this game.
          </Text>
        ) : (
          <Text style={[styles.loading, { color: colors.textMuted }]}>
            Loading game...
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  activeStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  turnBanner: {
    borderRadius: 8,
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  turnTitle: {
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  turnBody: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  playSurface: {
    alignItems: 'center',
    display: 'flex',
    minHeight: 600,
    paddingBottom: 146,
    position: 'relative',
  },
  boardSurface: {
    position: 'relative',
  },
  controls: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  controlsText: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  error: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  loading: {
    fontSize: 16,
    lineHeight: 22,
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  placeholderBody: {
    fontSize: 15,
    lineHeight: 21,
  },
  placeholderMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
});
