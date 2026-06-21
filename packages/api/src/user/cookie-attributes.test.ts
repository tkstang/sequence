import { describe, expect, it } from 'vitest';

import { parseEnv } from '../env.ts';
import {
  resolveAuthCookieAttributes,
  serializeGuestCookieAttributes,
} from './cookie-attributes.ts';

const base = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  BETTER_AUTH_SECRET: 'a-very-secret-value-at-least-32-chars',
};

describe('auth cookie attributes', () => {
  it('defaults production deploys to cross-site cookie attributes', () => {
    const env = parseEnv({
      ...base,
      NODE_ENV: 'production',
      BETTER_AUTH_URL: 'https://sequence-api.up.railway.app',
      WEB_ORIGIN: 'https://sequence.vercel.app',
    } as NodeJS.ProcessEnv);

    const attributes = resolveAuthCookieAttributes(env);

    expect(attributes).toEqual({
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
    expect(serializeGuestCookieAttributes(attributes)).toBe(
      'Path=/; HttpOnly; SameSite=None; Secure',
    );
  });

  it('allows a shared-site deploy to opt back into Lax cookies', () => {
    const env = parseEnv({
      ...base,
      NODE_ENV: 'production',
      AUTH_COOKIE_SAME_SITE: 'lax',
    } as NodeJS.ProcessEnv);

    expect(resolveAuthCookieAttributes(env)).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    });
  });

  it('keeps local development cookies non-secure and same-site', () => {
    const env = parseEnv(base as NodeJS.ProcessEnv);

    expect(resolveAuthCookieAttributes(env)).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    });
  });
});
