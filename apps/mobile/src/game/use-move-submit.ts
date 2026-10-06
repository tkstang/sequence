import type { GameViewState, LoggedGameEvent } from '@sequence/client-state';
import type { Move } from '@sequence/game-logic';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useTRPC } from '../api/client.ts';
import { logger as defaultLogger, type Logger } from '../lib/logger.ts';
import {
  feedbackForMoveSubmitError,
  type MoveSubmitFeedback,
} from './feedback/toasts.ts';

export interface PendingMoveSubmit {
  expectedVersion?: number;
  move: Move;
  submittedAtMs: number;
  submittedSeq: number;
  submittedVersion: number;
}

interface TrackedPendingMoveSubmit extends PendingMoveSubmit {
  id: number;
}

export interface UseMoveSubmitOptions {
  gameId: string;
  logger?: Pick<Logger, 'error' | 'info' | 'warn'>;
  now?: () => number;
  view: GameViewState | null;
}

export interface UseMoveSubmitResult {
  canSubmit: boolean;
  clearFeedback: () => void;
  feedback: MoveSubmitFeedback | null;
  pendingMove: PendingMoveSubmit | null;
  selectedCardDisabled: boolean;
  submitMove: (move: Move) => Promise<boolean>;
  submitting: boolean;
}

function stripPendingId(
  pending: TrackedPendingMoveSubmit | null,
): PendingMoveSubmit | null {
  if (!pending) return null;
  const {
    expectedVersion,
    move,
    submittedAtMs,
    submittedSeq,
    submittedVersion,
  } = pending;
  return {
    ...(expectedVersion === undefined ? {} : { expectedVersion }),
    move,
    submittedAtMs,
    submittedSeq,
    submittedVersion,
  };
}

function firstMatchingEcho(
  events: readonly LoggedGameEvent[],
  pending: TrackedPendingMoveSubmit,
): LoggedGameEvent | null {
  if (pending.expectedVersion === undefined) return null;
  return (
    events.find(
      (event) =>
        event.seq > pending.submittedSeq &&
        event.version === pending.expectedVersion,
    ) ?? null
  );
}

function p50(values: readonly number[]): number {
  const sorted: number[] = [];
  for (const value of values) {
    const insertAt = sorted.findIndex((candidate) => candidate > value);
    if (insertAt === -1) {
      sorted.push(value);
    } else {
      sorted.splice(insertAt, 0, value);
    }
  }
  return sorted[Math.floor((sorted.length - 1) / 2)] ?? 0;
}

function triggerNotification(feedback: MoveSubmitFeedback): void {
  const notificationType =
    feedback.haptic === 'warning'
      ? Haptics.NotificationFeedbackType.Warning
      : Haptics.NotificationFeedbackType.Error;
  void Haptics.notificationAsync(notificationType).catch(() => undefined);
}

export function useMoveSubmit({
  gameId,
  logger = defaultLogger,
  now = Date.now,
  view,
}: UseMoveSubmitOptions): UseMoveSubmitResult {
  const trpc = useTRPC();
  const pendingRef = useRef<TrackedPendingMoveSubmit | null>(null);
  const nextPendingIdRef = useRef(0);
  const roundTripSamplesRef = useRef<number[]>([]);
  const [pendingMove, setPendingMove] = useState<PendingMoveSubmit | null>(
    null,
  );
  const [feedback, setFeedback] = useState<MoveSubmitFeedback | null>(null);

  const setTrackedPending = useCallback(
    (pending: TrackedPendingMoveSubmit | null) => {
      pendingRef.current = pending;
      setPendingMove(stripPendingId(pending));
    },
    [],
  );

  const handleSubmitError = useCallback(
    (error: unknown) => {
      const feedbackForError = feedbackForMoveSubmitError(error);
      setTrackedPending(null);
      setFeedback(feedbackForError);
      triggerNotification(feedbackForError);
    },
    [setTrackedPending],
  );

  const makeMove = useMutation(
    trpc.game.makeMove.mutationOptions({
      onError(error: unknown) {
        handleSubmitError(error);
      },
      onSuccess(result: { events: unknown[]; version: number }) {
        const current = pendingRef.current;
        if (!current) return;
        setTrackedPending({
          ...current,
          expectedVersion: result.version,
        });
      },
    }),
  );

  const submitMove = useCallback(
    async (move: Move): Promise<boolean> => {
      if (!view || pendingRef.current || makeMove.isPending) return false;

      const pending: TrackedPendingMoveSubmit = {
        id: nextPendingIdRef.current,
        move,
        submittedAtMs: now(),
        submittedSeq: view.lastSeq,
        submittedVersion: view.version,
      };
      nextPendingIdRef.current += 1;
      setFeedback(null);
      setTrackedPending(pending);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );

      try {
        await makeMove.mutateAsync({
          gameId,
          move,
          version: view.version,
        });
        return true;
      } catch (error) {
        const currentPending =
          pendingRef.current as TrackedPendingMoveSubmit | null;
        if (currentPending?.id === pending.id) {
          handleSubmitError(error);
        }
        return false;
      }
    },
    [gameId, handleSubmitError, makeMove, now, setTrackedPending, view],
  );

  useEffect(() => {
    const pending = pendingRef.current;
    if (!view || !pending) return;
    const echo = firstMatchingEcho(view.recentEvents, pending);
    if (!echo) return;

    const roundTripMs = now() - pending.submittedAtMs;
    roundTripSamplesRef.current = [
      ...roundTripSamplesRef.current.slice(-49),
      roundTripMs,
    ];

    if (process.env.NODE_ENV !== 'production') {
      logger.info('game.move.round_trip', {
        eventSeq: echo.seq,
        expectedVersion: pending.expectedVersion,
        gameId,
        p50Ms: p50(roundTripSamplesRef.current),
        roundTripMs,
        submittedVersion: pending.submittedVersion,
      });
    }

    setTrackedPending(null);
  }, [gameId, logger, now, setTrackedPending, view]);

  const submitting = pendingMove !== null;

  return {
    canSubmit: !submitting && !makeMove.isPending && view !== null,
    clearFeedback: () => setFeedback(null),
    feedback,
    pendingMove,
    selectedCardDisabled: submitting,
    submitMove,
    submitting,
  };
}
