import {
  RULE_VIOLATION_MESSAGES,
  type RuleViolationCode,
} from '@sequence/client-state';

import {
  GAME_UPDATED_FEEDBACK,
  feedbackForMoveSubmitError,
  feedbackForRuleViolationCode,
} from './toasts.ts';

describe('move submit feedback toasts', () => {
  it.each(
    Object.entries(RULE_VIOLATION_MESSAGES) as Array<
      [RuleViolationCode, string]
    >,
  )('maps %s rule violations through the shared catalog', (code, message) => {
    expect(feedbackForRuleViolationCode(code).message).toBe(message);
    expect(
      feedbackForMoveSubmitError({
        data: {
          code: 'BAD_REQUEST',
          ruleViolation: { code },
        },
      }).message,
    ).toBe(message);
  });

  it('maps version conflicts to game-updated feedback', () => {
    expect(feedbackForMoveSubmitError({ data: { code: 'CONFLICT' } })).toEqual(
      GAME_UPDATED_FEEDBACK,
    );
  });

  it('falls back to a generic submit failure message', () => {
    expect(feedbackForMoveSubmitError({ message: 'network down' })).toEqual({
      haptic: 'error',
      message: 'network down',
      tone: 'error',
    });
    expect(feedbackForMoveSubmitError(null).message).toBe(
      'Move failed. Try again.',
    );
  });
});
