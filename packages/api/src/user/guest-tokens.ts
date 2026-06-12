import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Signed, game-scoped guest tokens — no JWT dependency.
 *
 * A token is `base64url(payload) . base64url(hmac-sha256(payload, secret))`.
 * The payload binds the token to a single `{ gameId, seat }`, so a guest token
 * is useless for any other game. Only the token's hash is stored server-side
 * (in `game_players.guest_token_hash`); the raw token lives only in the
 * guest's httpOnly cookie.
 */

export interface GuestTokenPayload {
  gameId: string;
  seat: number;
  /** Random nonce so two tokens for the same seat differ (and to widen the space). */
  nonce: string;
}

export interface GuestIdentity {
  gameId: string;
  seat: number;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('base64url');
}

/** Constant-time string comparison that tolerates length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Issue a signed token binding a guest to `{ gameId, seat }`.
 *
 * @param gameId - the game this token authorizes.
 * @param seat - the seat the guest occupies.
 * @param secret - HMAC signing secret (the app's `BETTER_AUTH_SECRET`).
 */
export function issueGuestToken(
  gameId: string,
  seat: number,
  secret: string,
): string {
  const payload: GuestTokenPayload = {
    gameId,
    seat,
    nonce: createHash('sha256')
      .update(`${gameId}:${seat}:${Date.now()}:${Math.random()}`)
      .digest('base64url')
      .slice(0, 16),
  };
  const payloadB64 = base64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

/**
 * Verify a token against an expected game. Returns the resolved identity when
 * the signature is valid AND the token's `gameId` matches `expectedGameId`;
 * otherwise `null`. Never throws on malformed input.
 *
 * @param token - the raw token from the guest cookie.
 * @param expectedGameId - the game the caller is trying to act in.
 * @param secret - the same HMAC secret used to issue.
 */
export function verifyGuestToken(
  token: string,
  expectedGameId: string,
  secret: string,
): GuestIdentity | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  if (!safeEqual(sig, sign(payloadB64, secret))) return null;

  let payload: GuestTokenPayload;
  try {
    payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8'),
    ) as GuestTokenPayload;
  } catch {
    return null;
  }

  if (
    typeof payload?.gameId !== 'string' ||
    typeof payload?.seat !== 'number' ||
    payload.gameId !== expectedGameId
  ) {
    return null;
  }

  return { gameId: payload.gameId, seat: payload.seat };
}

/**
 * Stable, non-reversible digest of a token for at-rest storage. The verify
 * path takes the raw token; the DB only ever holds this hash.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
