import { mapTRPCErrorToPolicy } from './error-policy.ts';

describe('mapTRPCErrorToPolicy', () => {
  it.each([
    ['UNAUTHORIZED', 'redirect-login'],
    ['FORBIDDEN', 'not-participant'],
    ['TOO_MANY_REQUESTS', 'backoff-toast'],
    ['CONFLICT', 'refetch-feedback'],
  ] as const)('maps %s to %s', (code, expected) => {
    expect(mapTRPCErrorToPolicy({ data: { code } })).toBe(expected);
  });

  it('passes through BAD_REQUEST rule violation codes', () => {
    expect(
      mapTRPCErrorToPolicy({
        data: {
          code: 'BAD_REQUEST',
          ruleViolation: { code: 'chip-locked' },
        },
      }),
    ).toBe('violation:chip-locked');
  });
});
