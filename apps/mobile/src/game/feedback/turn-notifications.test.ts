import {
  RULE_VIOLATION_MESSAGES,
  getGameFixture,
  stateFromSnapshot,
  type GameViewState,
  type LoggedGameEvent,
  type RuleViolationCode,
} from '@sequence/client-state';

import { feedbackForRuleViolationCode } from './toasts.ts';
import {
  collectTurnNotifications,
  notificationForStreamEvent,
} from './turn-notifications.ts';

function view(overrides: Partial<GameViewState> = {}): GameViewState {
  const fixture = getGameFixture('active-your-turn');
  if (!fixture) {
    throw new Error('missing active-your-turn fixture');
  }
  return {
    ...stateFromSnapshot(fixture.snapshot),
    currentSeat: 1,
    lastSeq: 4,
    recentEvents: [],
    ...overrides,
  };
}

function event(
  type: string,
  payload: Record<string, unknown>,
  seq = 5,
): LoggedGameEvent {
  return { payload, seq, type, version: seq };
}

describe('turn notifications', () => {
  it('maps a turn change to my seat to success feedback', () => {
    expect(
      notificationForStreamEvent({
        event: event('TurnAdvanced', { round: 3, seat: 0 }),
        view: view({ currentSeat: 0, mySeat: 0 }),
      }),
    ).toEqual({
      haptic: 'success',
      message: 'Your turn.',
      tone: 'info',
    });
  });

  it('surfaces significant opponent sequence, concede, and freeze events', () => {
    const currentView = view({
      mySeat: 0,
      players: [
        {
          connected: true,
          isCreator: true,
          isGuest: false,
          name: 'You',
          seat: 0,
          team: 1,
        },
        {
          connected: true,
          isCreator: false,
          isGuest: false,
          name: 'Riya',
          seat: 1,
          team: 2,
        },
      ],
      teams: [1, 2],
    });

    expect(
      notificationForStreamEvent({
        event: event('SequenceCompleted', { team: 2 }),
        view: currentView,
      })?.message,
    ).toBe('Opponent completed a sequence.');
    expect(
      notificationForStreamEvent({
        event: event('GameConceded', { team: 2 }),
        view: currentView,
      })?.message,
    ).toBe('Game conceded.');
    expect(
      notificationForStreamEvent({
        event: event('PlayerDisconnected', { seat: 1 }),
        view: currentView,
      })?.message,
    ).toBe('Riya disconnected. Game paused.');
  });

  it('collects only newly applied event notifications', () => {
    const currentView = view({
      currentSeat: 0,
      lastSeq: 7,
      mySeat: 0,
      recentEvents: [
        event('SequenceCompleted', { team: 2 }, 4),
        event('TurnAdvanced', { round: 2, seat: 0 }, 7),
      ],
    });

    expect(
      collectTurnNotifications({ lastSeenSeq: 4, view: currentView }),
    ).toEqual([
      {
        eventSeq: 7,
        feedback: {
          haptic: 'success',
          message: 'Your turn.',
          tone: 'info',
        },
      },
    ]);
  });

  it.each(
    Object.entries(RULE_VIOLATION_MESSAGES) as Array<
      [RuleViolationCode, string]
    >,
  )('keeps %s rule violations covered by UI feedback', (code, message) => {
    expect(Object.keys(RULE_VIOLATION_MESSAGES)).toHaveLength(13);
    expect(feedbackForRuleViolationCode(code).message).toBe(message);
  });
});
