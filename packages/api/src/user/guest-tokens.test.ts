import { describe, expect, it } from 'vitest';

import {
  hashToken,
  issueGuestToken,
  verifyGuestToken,
} from './guest-tokens.ts';

const secret = 'test-guest-secret-which-is-long-enough';
const gameId = '11111111-1111-1111-1111-111111111111';
const otherGame = '22222222-2222-2222-2222-222222222222';

describe('guest tokens', () => {
  it('verifies an issued token for its own game', () => {
    const token = issueGuestToken(gameId, 2, secret);
    const result = verifyGuestToken(token, gameId, secret);
    expect(result).toEqual({ gameId, seat: 2 });
  });

  it('fails verification for a different game', () => {
    const token = issueGuestToken(gameId, 2, secret);
    expect(verifyGuestToken(token, otherGame, secret)).toBeNull();
  });

  it('rejects a tampered token', () => {
    const token = issueGuestToken(gameId, 2, secret);
    // Flip a character in the payload portion.
    const dot = token.indexOf('.');
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const lastChar = payload.at(-1);
    const tamperedPayload = `${payload.slice(0, -1)}${
      lastChar === 'A' ? 'B' : 'A'
    }`;
    const tampered = `${tamperedPayload}.${sig}`;
    expect(verifyGuestToken(tampered, gameId, secret)).toBeNull();
  });

  it('rejects a token signed with a different secret', () => {
    const token = issueGuestToken(gameId, 2, secret);
    expect(verifyGuestToken(token, gameId, 'a-different-secret')).toBeNull();
  });

  it('rejects a structurally malformed token', () => {
    expect(verifyGuestToken('not-a-token', gameId, secret)).toBeNull();
    expect(verifyGuestToken('', gameId, secret)).toBeNull();
    expect(verifyGuestToken('a.b.c', gameId, secret)).toBeNull();
  });

  it('only stores the hash — verify takes the raw token, hash is derivable', () => {
    const token = issueGuestToken(gameId, 3, secret);
    const hash = hashToken(token);
    // The hash is a stable, non-reversible digest of the token.
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).toBe(hash);
    expect(hashToken(issueGuestToken(gameId, 4, secret))).not.toBe(hash);
  });

  it('issues distinct tokens for different seats', () => {
    const a = issueGuestToken(gameId, 1, secret);
    const b = issueGuestToken(gameId, 2, secret);
    expect(a).not.toBe(b);
    expect(verifyGuestToken(a, gameId, secret)).toEqual({ gameId, seat: 1 });
    expect(verifyGuestToken(b, gameId, secret)).toEqual({ gameId, seat: 2 });
  });
});
