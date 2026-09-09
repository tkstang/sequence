import type { GameViewState, LoggedGameEvent } from '@sequence/client-state';
import type { Card } from '@sequence/game-logic';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useTRPC } from '../api/client.ts';
import {
  AUTO_SWAP_FEEDBACK,
  feedbackForMoveSubmitError,
  type MoveSubmitFeedback,
} from './feedback/toasts.ts';

export { AUTO_SWAP_FEEDBACK };

export interface UseDeadCardControlsOptions {
  gameId: string;
  view: GameViewState | null;
}

export interface UseDeadCardControlsResult {
  clearFeedback: () => void;
  feedback: MoveSubmitFeedback | null;
  submitting: boolean;
  turnInDeadCard: (card: Card) => Promise<boolean>;
}

function triggerNotification(feedback: MoveSubmitFeedback): void {
  const notificationType =
    feedback.haptic === 'warning'
      ? Haptics.NotificationFeedbackType.Warning
      : Haptics.NotificationFeedbackType.Error;
  void Haptics.notificationAsync(notificationType).catch(() => undefined);
}

function latestDeadCardSwapSeq(
  events: readonly LoggedGameEvent[],
): number | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event?.type === 'DeadCardSwapped') {
      return event.seq;
    }
  }
  return null;
}

export function useDeadCardControls({
  gameId,
  view,
}: UseDeadCardControlsOptions): UseDeadCardControlsResult {
  const trpc = useTRPC();
  const submittingRef = useRef(false);
  const lastAutoSwapSeqRef = useRef<number | null>(null);
  const [feedback, setFeedback] = useState<MoveSubmitFeedback | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setSubmittingState = useCallback((nextSubmitting: boolean) => {
    submittingRef.current = nextSubmitting;
    setSubmitting(nextSubmitting);
  }, []);

  const handleTurnInError = useCallback(
    (error: unknown) => {
      const feedbackForError = feedbackForMoveSubmitError(error);
      setSubmittingState(false);
      setFeedback(feedbackForError);
      triggerNotification(feedbackForError);
    },
    [setSubmittingState],
  );

  const turnInDeadCardMutation = useMutation(
    trpc.game.turnInDeadCard.mutationOptions({
      onError(error: unknown) {
        handleTurnInError(error);
      },
      onSuccess() {
        setSubmittingState(false);
      },
    }),
  );

  const turnInDeadCard = useCallback(
    async (card: Card): Promise<boolean> => {
      if (!view || submittingRef.current || turnInDeadCardMutation.isPending) {
        return false;
      }

      setFeedback(null);
      setSubmittingState(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );

      try {
        await turnInDeadCardMutation.mutateAsync({
          card,
          gameId,
          version: view.version,
        });
        return true;
      } catch (error) {
        if (submittingRef.current) {
          handleTurnInError(error);
        }
        return false;
      }
    },
    [
      gameId,
      handleTurnInError,
      setSubmittingState,
      turnInDeadCardMutation,
      view,
    ],
  );

  useEffect(() => {
    if (!view || view.mode === 'drag') return;

    const swapSeq = latestDeadCardSwapSeq(view.recentEvents);
    if (swapSeq === null || swapSeq === lastAutoSwapSeqRef.current) return;

    lastAutoSwapSeqRef.current = swapSeq;
    setFeedback(AUTO_SWAP_FEEDBACK);
    triggerNotification(AUTO_SWAP_FEEDBACK);
  }, [view]);

  return {
    clearFeedback: () => setFeedback(null),
    feedback,
    submitting,
    turnInDeadCard,
  };
}
