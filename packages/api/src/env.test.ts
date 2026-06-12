import { describe, expect, it } from 'vitest';

import { parseEnv } from './env.ts';

const base = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  BETTER_AUTH_SECRET: 'a-very-secret-value',
};

describe('parseEnv', () => {
  it('rejects a missing DATABASE_URL', () => {
    const { DATABASE_URL: _omit, ...rest } = base;
    expect(() => parseEnv(rest as NodeJS.ProcessEnv)).toThrow(/DATABASE_URL/);
  });

  it('rejects a missing BETTER_AUTH_SECRET', () => {
    const { BETTER_AUTH_SECRET: _omit, ...rest } = base;
    expect(() => parseEnv(rest as NodeJS.ProcessEnv)).toThrow(
      /BETTER_AUTH_SECRET/,
    );
  });

  it('defaults PORT to 3001 when unset', () => {
    const env = parseEnv(base as NodeJS.ProcessEnv);
    expect(env.PORT).toBe(3001);
  });

  it('coerces a string PORT to a number', () => {
    const env = parseEnv({ ...base, PORT: '4000' } as NodeJS.ProcessEnv);
    expect(env.PORT).toBe(4000);
  });

  it('defaults WEB_ORIGIN and BETTER_AUTH_URL', () => {
    const env = parseEnv(base as NodeJS.ProcessEnv);
    expect(env.WEB_ORIGIN).toBe('http://localhost:3000');
    expect(env.BETTER_AUTH_URL).toBe('http://localhost:3001');
  });

  it('accepts a valid full environment', () => {
    const env = parseEnv({
      ...base,
      PORT: '3001',
      WEB_ORIGIN: 'https://example.com',
      BETTER_AUTH_URL: 'https://api.example.com',
      DATABASE_URL_TEST: 'postgresql://user:pass@localhost:5432/test',
    } as NodeJS.ProcessEnv);
    expect(env.DATABASE_URL_TEST).toBe(
      'postgresql://user:pass@localhost:5432/test',
    );
    expect(env.WEB_ORIGIN).toBe('https://example.com');
  });
});
