import type { Rng } from '@sequence/game-logic';

/**
 * Invite-code generation.
 *
 * ~10-char codes over an **unambiguous** alphabet (no `0/O`, `1/I/L`) so a code
 * can be read aloud or typed without confusion, and so enumeration is costly
 * (the join/preview routes are also rate-limited). Codes are generated with an
 * injectable {@link Rng} for deterministic tests.
 */

/** Crockford-style unambiguous alphabet: no 0/O, 1/I/L to avoid mis-reads. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;

/** Generate one ~10-char invite code from the given RNG. */
export function generateInviteCode(rng: Rng): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const idx = Math.floor(rng.next() * ALPHABET.length);
    code += ALPHABET[idx];
  }
  return code;
}
