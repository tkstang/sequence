import type { GameViewState, LoggedGameEvent } from '@sequence/client-state';
import type { Team } from '@sequence/game-logic';

import type { GameFeedback } from './toasts.ts';

export interface StreamEventNotification {
  eventSeq: number;
  feedback: GameFeedback;
}

export interface StreamEventNotificationInput {
  event: LoggedGameEvent;
  view: GameViewState;
}

export interface CollectTurnNotificationsInput {
  lastSeenSeq: number | null;
  view: GameViewState;
}

function seatFromPayload(event: LoggedGameEvent): number | null {
  const seat = event.payload.seat;
  return typeof seat === 'number' && Number.isInteger(seat) ? seat : null;
}

function teamFromPayload(event: LoggedGameEvent): Team | null {
  const team = event.payload.team;
  return team === 1 || team === 2 || team === 3 ? team : null;
}

function myTeam(view: GameViewState): Team | null {
  const team = view.teams[view.mySeat];
  if (team !== undefined) return team;
  return (
    view.players.find((player) => player.seat === view.mySeat)?.team ?? null
  );
}

function playerName(view: GameViewState, seat: number | null): string | null {
  if (seat === null) return null;
  return view.players.find((player) => player.seat === seat)?.name ?? null;
}

export function notificationForStreamEvent({
  event,
  view,
}: StreamEventNotificationInput): GameFeedback | null {
  switch (event.type) {
    case 'TurnAdvanced': {
      const nextSeat = seatFromPayload(event);
      if (nextSeat !== view.mySeat) return null;
      return {
        haptic: 'success',
        message: 'Your turn.',
        tone: 'info',
      };
    }
    case 'SequenceCompleted': {
      const sequenceTeam = teamFromPayload(event);
      const ownTeam = myTeam(view);
      if (
        sequenceTeam !== null &&
        ownTeam !== null &&
        sequenceTeam === ownTeam
      ) {
        return null;
      }
      return {
        haptic: 'warning',
        message: 'Opponent completed a sequence.',
        tone: 'info',
      };
    }
    case 'GameConceded':
      return {
        haptic: 'warning',
        message: 'Game conceded.',
        tone: 'info',
      };
    case 'PlayerDisconnected': {
      const name = playerName(view, seatFromPayload(event));
      return {
        haptic: 'warning',
        message: name
          ? `${name} disconnected. Game paused.`
          : 'A player disconnected. Game paused.',
        tone: 'info',
      };
    }
    default:
      return null;
  }
}

export function collectTurnNotifications({
  lastSeenSeq,
  view,
}: CollectTurnNotificationsInput): StreamEventNotification[] {
  const minimumSeq = lastSeenSeq ?? view.lastSeq;
  const notifications: StreamEventNotification[] = [];

  for (const event of view.recentEvents) {
    if (event.seq <= minimumSeq) continue;
    const feedback = notificationForStreamEvent({ event, view });
    if (feedback) {
      notifications.push({ eventSeq: event.seq, feedback });
    }
  }

  return notifications;
}
