'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { AppHeader } from '@/components/app-header.tsx';
import { useTRPC } from '@/lib/trpc/client.ts';
import { useRequireSession } from '@/lib/use-session.ts';

import { CreateGameForm } from './create-game-form.tsx';

/**
 * Create-game screen (p05-t06). Gated on a session. Submits to `game.create`
 * and routes to the game by id — the game route (p06) renders the lobby for a
 * normal game and goes straight to play for a local pass-and-play game (the
 * server returns it already `active`).
 *
 * `useSearchParams` requires a Suspense boundary during static prerender, so
 * the search-param-reading body lives in {@link CreatePageInner}.
 */
export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-8 text-sm text-black/50">
          Loading…
        </main>
      }
    >
      <CreatePageInner />
    </Suspense>
  );
}

function CreatePageInner() {
  const session = useRequireSession();
  const router = useRouter();
  const params = useSearchParams();
  const trpc = useTRPC();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const create = useMutation(
    trpc.game.create.mutationOptions({
      onSuccess: (result) => {
        router.replace(`/game/${result.gameId}`);
      },
      onError: (error) => {
        setSubmitError(error.message);
      },
    }),
  );

  if (session.isPending || !session.isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-sm text-black/50">
        Loading…
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
        <h1 className="text-2xl font-bold">New game</h1>
        <CreateGameForm
          defaultLocal={params.get('local') === '1'}
          submitError={submitError}
          isSubmitting={create.isPending}
          onCreate={async (values) => {
            setSubmitError(null);
            await create.mutateAsync(values);
          }}
        />
      </main>
    </div>
  );
}
