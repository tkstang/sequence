import { describe, expect, it } from 'vitest';

import { parseEnv } from './env.ts';
import { resolveTrustProxy } from './server.ts';

const base = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  BETTER_AUTH_SECRET: 'a-very-secret-value-at-least-32-chars',
};

describe('server deployment config', () => {
  it('defaults production trustProxy off unless explicitly configured', () => {
    const env = parseEnv({
      ...base,
      NODE_ENV: 'production',
    } as NodeJS.ProcessEnv);

    expect(resolveTrustProxy(env)).toBe(false);
  });

  it('defaults local/test trustProxy off', () => {
    const env = parseEnv(base as NodeJS.ProcessEnv);

    expect(resolveTrustProxy(env)).toBe(false);
  });

  it('honors an explicit numeric trustProxy override', () => {
    const env = parseEnv({
      ...base,
      NODE_ENV: 'production',
      TRUST_PROXY: '2',
    } as NodeJS.ProcessEnv);

    expect(resolveTrustProxy(env)).toBe(2);
  });
});
