import {
  RULE_VIOLATION_MESSAGES,
  type RuleViolationCode,
} from '@sequence/client-state';

import { mapTRPCErrorToPolicy } from '../../api/error-policy.ts';

export type MoveSubmitFeedbackHaptic = 'error' | 'warning';
export type MoveSubmitFeedbackTone = 'error' | 'info';

export interface MoveSubmitFeedback {
  haptic: MoveSubmitFeedbackHaptic;
  message: string;
  tone: MoveSubmitFeedbackTone;
}

export const GAME_UPDATED_FEEDBACK = {
  haptic: 'warning',
  message: 'Game updated. Try again.',
  tone: 'info',
} as const satisfies MoveSubmitFeedback;

export const AUTO_SWAP_FEEDBACK = {
  haptic: 'warning',
  message: 'Auto-swapped a dead card.',
  tone: 'info',
} as const satisfies MoveSubmitFeedback;

const GENERIC_MOVE_FAILURE = {
  haptic: 'error',
  message: 'Move failed. Try again.',
  tone: 'error',
} as const satisfies MoveSubmitFeedback;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRuleViolationCode(value: string): value is RuleViolationCode {
  return value in RULE_VIOLATION_MESSAGES;
}

function errorMessage(error: unknown): string | null {
  if (!isRecord(error)) return null;
  const message = error.message;
  return typeof message === 'string' && message.length > 0 ? message : null;
}

export function feedbackForRuleViolationCode(
  code: RuleViolationCode,
): MoveSubmitFeedback {
  return {
    haptic: 'error',
    message: RULE_VIOLATION_MESSAGES[code],
    tone: 'error',
  };
}

export function feedbackForMoveSubmitError(error: unknown): MoveSubmitFeedback {
  const policy = mapTRPCErrorToPolicy(error);

  if (policy === 'refetch-feedback') {
    return GAME_UPDATED_FEEDBACK;
  }

  if (policy.startsWith('violation:')) {
    const code = policy.slice('violation:'.length);
    if (isRuleViolationCode(code)) {
      return feedbackForRuleViolationCode(code);
    }
  }

  const message = errorMessage(error);
  return message
    ? { haptic: 'error', message, tone: 'error' }
    : GENERIC_MOVE_FAILURE;
}
