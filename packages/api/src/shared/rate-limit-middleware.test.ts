import { TRPCError } from '@trpc/server';
import { describe, expect, it } from 'vitest';

import type { Context } from '../trpc.ts';
import { createRateLimiter } from './rate-limit-middleware.ts';

function ctxWithIp(ip: string, opts: { xff?: string } = {}): Context {
  return {
    user: null,
    guest: null,
    db: {} as Context['db'],
    auth: {} as Context['auth'],
    headers: new Headers(opts.xff ? { 'x-forwarded-for': opts.xff } : {}),
    ip,
    guestSecret: 'x',
  };
}

async function call(
  limiter: ReturnType<typeof createRateLimiter>,
  ctx: Context,
): Promise<'ok' | 'limited'> {
  try {
    return await limiter.middleware({ ctx, next: async () => 'ok' as const });
  } catch (err) {
    if (err instanceof TRPCError && err.code === 'TOO_MANY_REQUESTS') {
      return 'limited';
    }
    throw err;
  }
}

describe('createRateLimiter', () => {
  it('allows up to `max` calls then throws TOO_MANY_REQUESTS', async () => {
    const limiter = createRateLimiter({ max: 3, windowMs: 60_000 });
    const ctx = ctxWithIp('1.1.1.1');
    expect(await call(limiter, ctx)).toBe('ok');
    expect(await call(limiter, ctx)).toBe('ok');
    expect(await call(limiter, ctx)).toBe('ok');
    expect(await call(limiter, ctx)).toBe('limited');
  });

  it('buckets per key — distinct IPs do not share a budget', async () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    expect(await call(limiter, ctxWithIp('1.1.1.1'))).toBe('ok');
    expect(await call(limiter, ctxWithIp('2.2.2.2'))).toBe('ok');
    expect(await call(limiter, ctxWithIp('1.1.1.1'))).toBe('limited');
  });

  it('frees the budget as the window slides past old calls', async () => {
    let clock = 1_000;
    const limiter = createRateLimiter({
      max: 2,
      windowMs: 1_000,
      now: () => clock,
    });
    const ctx = ctxWithIp('1.1.1.1');
    expect(await call(limiter, ctx)).toBe('ok');
    expect(await call(limiter, ctx)).toBe('ok');
    expect(await call(limiter, ctx)).toBe('limited');
    // Advance past the window — old calls fall out, budget restored.
    clock += 1_500;
    expect(await call(limiter, ctx)).toBe('ok');
  });

  it('reset() clears all buckets', async () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    const ctx = ctxWithIp('1.1.1.1');
    expect(await call(limiter, ctx)).toBe('ok');
    expect(await call(limiter, ctx)).toBe('limited');
    limiter.reset();
    expect(await call(limiter, ctx)).toBe('ok');
  });

  it('keys on the resolved ctx.ip, ignoring a spoofable x-forwarded-for', async () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    // Two requests from the same resolved IP but with different (spoofed) XFF
    // headers must share one budget — the limiter cannot be bypassed by
    // rotating the X-Forwarded-For value.
    expect(await call(limiter, ctxWithIp('9.9.9.9', { xff: '1.1.1.1' }))).toBe(
      'ok',
    );
    expect(await call(limiter, ctxWithIp('9.9.9.9', { xff: '2.2.2.2' }))).toBe(
      'limited',
    );
  });

  it('keys authed callers by user id', async () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
    const ctx: Context = {
      ...ctxWithIp('1.1.1.1'),
      user: { id: 'u1', email: 'a@b.c', name: 'A' },
    };
    expect(await call(limiter, ctx)).toBe('ok');
    expect(await call(limiter, ctx)).toBe('limited');
  });
});
