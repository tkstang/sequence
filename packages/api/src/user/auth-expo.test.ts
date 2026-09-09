import { describe, expect, it } from 'vitest';

import type { Database } from '../db/client.ts';
import { parseEnv, type Env } from '../env.ts';
import { createAuth } from './auth.ts';

const db = {} as Database;

function testEnv(nodeEnv: Env['NODE_ENV']): Env {
  return parseEnv({
    BETTER_AUTH_SECRET: 'test-secret-at-least-32-characters',
    BETTER_AUTH_URL: 'http://localhost:3001',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/sequence',
    NODE_ENV: nodeEnv,
    WEB_ORIGIN: 'http://localhost:3000',
  } as NodeJS.ProcessEnv);
}

describe('auth native client config', () => {
  it('registers the Better Auth Expo plugin', () => {
    const auth = createAuth(db, testEnv('test'));

    expect(auth.options.plugins?.map((plugin) => plugin.id)).toContain('expo');
  });

  it('trusts app scheme and Expo dev origins outside production', () => {
    const auth = createAuth(db, testEnv('test'));

    expect(auth.options.trustedOrigins).toEqual([
      'http://localhost:3000',
      'sequence://',
      'exp://**',
    ]);
  });

  it('omits Expo dev origins in production', () => {
    const auth = createAuth(db, testEnv('production'));

    expect(auth.options.trustedOrigins).toEqual([
      'http://localhost:3000',
      'sequence://',
    ]);
  });
});
