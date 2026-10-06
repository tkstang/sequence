import type { RuleViolation } from '@sequence/game-logic';
import { describe, expect, it } from 'vitest';

import {
  RULE_VIOLATION_MESSAGES,
  ruleViolationMessage,
} from './violation-messages.ts';

const ALL_RULE_VIOLATION_CODES = [
  'not-your-turn',
  'card-not-in-hand',
  'space-occupied',
  'wrong-card-for-space',
  'not-a-one-eyed-jack',
  'chip-locked',
  'own-chip',
  'empty-cell',
  'not-a-dead-card',
  'pending-choice-unresolved',
  'no-pending-choice',
  'invalid-sequence-choice',
  'game-not-active',
] as const satisfies readonly RuleViolation['code'][];

type MissingRuleViolationCodes = Exclude<
  RuleViolation['code'],
  (typeof ALL_RULE_VIOLATION_CODES)[number]
>;

const allRuleViolationCodesCovered: Record<MissingRuleViolationCodes, never> =
  {};

describe('rule violation messages', () => {
  it('maps every rules-engine violation code to a user-facing string', () => {
    expect(ALL_RULE_VIOLATION_CODES).toHaveLength(13);
    expect(Object.keys(RULE_VIOLATION_MESSAGES)).toEqual([
      ...ALL_RULE_VIOLATION_CODES,
    ]);
    for (const code of ALL_RULE_VIOLATION_CODES) {
      const message = RULE_VIOLATION_MESSAGES[code];
      expect(message).toEqual(expect.any(String));
      expect(message.length).toBeGreaterThan(0);
    }
    expect(allRuleViolationCodesCovered).toEqual({});
  });

  it('extracts typed rule violations and conflict feedback from errors', () => {
    expect(
      ruleViolationMessage({
        data: { ruleViolation: { code: 'chip-locked' } },
      }),
    ).toBe('That chip is locked in a sequence.');
    expect(ruleViolationMessage({ data: { code: 'CONFLICT' } })).toBe(
      'Game changed. Try again.',
    );
  });
});
