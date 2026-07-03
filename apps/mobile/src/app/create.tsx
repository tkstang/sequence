import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useState } from 'react';

import { useTRPC } from '../api/client.ts';
import { Screen } from '../components/Screen.tsx';
import {
  CreateForm,
  type CreateGameValues,
} from '../features/create/CreateForm.tsx';
import { testId } from '../test/test-ids.ts';

type CreateGameResult = {
  gameId: string;
  inviteCode: string;
  local: boolean;
  status: string;
};

export default function CreateScreen() {
  const trpc = useTRPC();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createGame = useMutation(
    trpc.game.create.mutationOptions({
      onError(error) {
        setSubmitError(error.message);
      },
      onSuccess(result: CreateGameResult) {
        router.replace(`/game/${encodeURIComponent(result.gameId)}` as Href);
      },
    }),
  );

  async function create(values: CreateGameValues) {
    setSubmitError(null);
    await createGame.mutateAsync(values);
  }

  return (
    <Screen
      header={
        <Screen.Header
          eyebrow="New game"
          title="Create game"
          testID={testId('create', 'header')}
        />
      }
      testID={testId('create', 'screen')}
    >
      <CreateForm
        isSubmitting={createGame.isPending}
        onCreate={create}
        submitError={submitError}
      />
    </Screen>
  );
}
