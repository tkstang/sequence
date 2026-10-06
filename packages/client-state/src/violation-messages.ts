import type { RuleViolation } from '@sequence/game-logic';

export type RuleViolationCode = RuleViolation['code'];

export const RULE_VIOLATION_MESSAGES: Record<RuleViolationCode, string> = {
  'not-your-turn': 'It is not your turn.',
  'card-not-in-hand': 'That card is no longer in your hand.',
  'space-occupied': 'That space is already occupied.',
  'wrong-card-for-space': 'That card cannot be played there.',
  'not-a-one-eyed-jack': 'A one-eyed jack is required.',
  'chip-locked': 'That chip is locked in a sequence.',
  'own-chip': 'You can only remove an opponent chip.',
  'empty-cell': 'There is no chip to remove.',
  'not-a-dead-card': 'That card is still playable.',
  'pending-choice-unresolved': 'Resolve the sequence choice first.',
  'no-pending-choice': 'There is no sequence choice to resolve.',
  'invalid-sequence-choice': 'Choose exactly five valid sequence cells.',
  'game-not-active': 'This game is not active.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function ruleViolationMessage(error: unknown): string {
  if (!isRecord(error)) return 'Move failed.';
  const data = isRecord(error.data) ? error.data : undefined;
  const violation = isRecord(data?.ruleViolation)
    ? data.ruleViolation
    : undefined;
  const code = typeof violation?.code === 'string' ? violation.code : undefined;
  if (code) {
    const message = RULE_VIOLATION_MESSAGES[code as RuleViolationCode];
    if (message) return message;
  }
  if (data?.code === 'CONFLICT') return 'Game changed. Try again.';
  return typeof error.message === 'string' ? error.message : 'Move failed.';
}
