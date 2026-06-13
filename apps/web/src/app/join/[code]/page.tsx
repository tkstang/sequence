'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppHeader } from '@/components/app-header.tsx';
import { useTRPC } from '@/lib/trpc/client.ts';
import { useSession } from '@/lib/use-session.ts';

import { JoinView } from './join-view.tsx';
import type { JoinPreview } from './join-view.tsx';

/**
 * Invite join page (p05-t07). Reads the `[code]` route param, fetches the public
 * `game.preview`, and joins via `game.join` (authed user → direct; anonymous →
 * guest name). On a successful join, routes to the game (lobby).
 */
export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const inviteCode = params.code;
  const router = useRouter();
  const session = useSession();
  const trpc = useTRPC();
  const [joinError, setJoinError] = useState<string | null>(null);

  const preview = useQuery({
    ...trpc.game.preview.queryOptions({ inviteCode }),
    enabled: Boolean(inviteCode),
  });

  const join = useMutation(
    trpc.game.join.mutationOptions({
      onSuccess: (result) => {
        router.replace(`/game/${result.gameId}`);
      },
      onError: (error) => setJoinError(error.message),
    }),
  );

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader homeHref="/" />
      {preview.isPending ? (
        <main className="flex flex-1 items-center justify-center p-8 text-sm text-black/50">
          Loading game…
        </main>
      ) : preview.isError || !preview.data ? (
        <main className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <h1 className="text-xl font-bold">Game not found</h1>
          <p className="text-sm text-black/60">
            This invite link is invalid or the game has expired.
          </p>
        </main>
      ) : (
        <JoinView
          preview={preview.data as JoinPreview}
          isAuthenticated={session.isAuthenticated}
          isJoining={join.isPending}
          joinError={joinError}
          onJoinAsUser={() => {
            setJoinError(null);
            join.mutate({ inviteCode });
          }}
          onJoinAsGuest={(guestName) => {
            setJoinError(null);
            join.mutate({ inviteCode, guestName });
          }}
        />
      )}
    </div>
  );
}
