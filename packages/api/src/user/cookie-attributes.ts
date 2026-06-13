import type { Env } from '../env.ts';

export type AuthCookieSameSite = 'lax' | 'none';

export interface AuthCookieAttributes {
  httpOnly: true;
  sameSite: AuthCookieSameSite;
  secure: boolean;
}

/**
 * Resolve cookie attributes for Better Auth and game-scoped guest tokens.
 *
 * Cross-site deploys (Vercel web on one site, Railway API on another) require
 * SameSite=None plus Secure, otherwise credentialed tRPC calls and WS upgrades
 * arrive without session cookies. Local/test default to Lax for normal
 * localhost development.
 */
export function resolveAuthCookieAttributes(env: Env): AuthCookieAttributes {
  const sameSite =
    env.AUTH_COOKIE_SAME_SITE ??
    (env.NODE_ENV === 'production' ? 'none' : 'lax');
  return {
    httpOnly: true,
    sameSite,
    secure:
      env.AUTH_COOKIE_SECURE ??
      (env.NODE_ENV !== 'development' || sameSite === 'none'),
  };
}

/** Serialize attributes for the game-scoped guest cookie. */
export function serializeGuestCookieAttributes(
  attributes: AuthCookieAttributes,
): string {
  return [
    'Path=/',
    'HttpOnly',
    `SameSite=${attributes.sameSite === 'none' ? 'None' : 'Lax'}`,
    attributes.secure ? 'Secure' : null,
  ]
    .filter((part): part is string => part !== null)
    .join('; ');
}
