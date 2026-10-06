import {
  RULE_VIOLATION_MESSAGES,
  type RuleViolationCode,
} from '@sequence/client-state';

import {
  AUTO_SWAP_FEEDBACK,
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

  it('defines default-mode dead-card auto-swap feedback', () => {
    expect(AUTO_SWAP_FEEDBACK).toEqual({
      haptic: 'warning',
      message: 'Auto-swapped a dead card.',
      tone: 'info',
    });
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
