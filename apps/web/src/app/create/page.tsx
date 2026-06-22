'use client';

import * as stylex from '@stylexjs/stylex';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { AuthenticatedHeader } from '@/components/authenticated-header.tsx';
import { useTRPC } from '@/lib/trpc/client.ts';
import { useLogout } from '@/lib/use-logout.ts';
import { useRequireSession } from '@/lib/use-session.ts';
import { color, fontSize, fontWeight, space } from '@/styles/tokens.stylex.ts';

import { CreateGameForm } from './create-game-form.tsx';

const styles = stylex.create({
  loading: {
    display: 'flex',
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xxxl,
    fontSize: fontSize.sm,
    color: color.textMuted,
  },
  page: {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'column',
  },
  main: {
    marginInline: 'auto',
    display: 'flex',
    width: '100%',
    maxWidth: '28rem',
    flexDirection: 'column',
    gap: space.xxl,
    padding: space.lg,
  },
  heading: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: color.text,
  },
});

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
      fallback={<main {...stylex.props(styles.loading)}>Loading…</main>}
    >
      <CreatePageInner />
    </Suspense>
  );
}

function CreatePageInner() {
  const session = useRequireSession();
  const { logout, isSigningOut } = useLogout();
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
    return <main {...stylex.props(styles.loading)}>Loading…</main>;
  }

  return (
    <div {...stylex.props(styles.page)}>
      <AuthenticatedHeader
        userInitial={(session.user?.name ?? '?').charAt(0).toUpperCase()}
        onLogout={logout}
        isSigningOut={isSigningOut}
      />
      <main {...stylex.props(styles.main)}>
        <h1 {...stylex.props(styles.heading)}>New game</h1>
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
