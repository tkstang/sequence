'use client';

import * as stylex from '@stylexjs/stylex';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { AppHeader } from '@/components/app-header.tsx';
import { useTRPC } from '@/lib/trpc/client.ts';
import { useSession } from '@/lib/use-session.ts';
import {
  color,
  fontSize,
  fontWeight,
  lineHeight,
  space,
} from '@/styles/tokens.stylex.ts';

import { JoinView } from './join-view.tsx';
import type { JoinPreview } from './join-view.tsx';

const styles = stylex.create({
  shell: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  centered: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.xxxl,
    textAlign: 'center',
  },
  loading: {
    fontSize: fontSize.sm,
    color: color.textFaint,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    color: color.text,
    margin: 0,
  },
  body: {
    fontSize: fontSize.sm,
    color: color.textMuted,
    margin: 0,
  },
});

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
    <div {...stylex.props(styles.shell)}>
      <AppHeader homeHref="/" />
      {preview.isPending ? (
        <main {...stylex.props(styles.centered, styles.loading)}>
          Loading game…
        </main>
      ) : preview.isError || !preview.data ? (
        <main {...stylex.props(styles.centered)}>
          <h1 {...stylex.props(styles.title)}>Game not found</h1>
          <p {...stylex.props(styles.body)}>
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
