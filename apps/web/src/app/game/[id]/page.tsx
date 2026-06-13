'use client';

import { useMutation } from '@tanstack/react-query';
import { useSubscription } from '@trpc/tanstack-react-query';
import { useParams } from 'next/navigation';
import { useReducer, useState } from 'react';

import { Badge } from '@/components/badge.tsx';
import { Card } from '@/components/card.tsx';
import { useTRPC } from '@/lib/trpc/client.ts';

import {
  applyStreamItem,
  screenForState,
  type GameStreamItem,
  type GameViewState,
} from './components/game-state.ts';
import { LobbyTeams } from './components/LobbyTeams/LobbyTeams.tsx';

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
  const screen = screenForState(state);
  const connected = state.players.filter((p) => p.connected).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 p-4">
      <section className="bg-slate rounded-lg p-4 text-white">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold">Sequence</h1>
          <Badge tone="neutral">{state.inviteCode}</Badge>
          <span className="ml-auto text-xs text-white/70">
            v{state.version} · {state.mode} · round {state.round}
          </span>
        </div>
      </section>

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
