import { TRPCError } from '@trpc/server';

import type { Context } from '../trpc.ts';

/**
 * A reusable, in-memory, per-key sliding-window rate limiter for tRPC
 * procedures. Used to throttle `preview` / `join` (attached in p04-t03) and any
 * other public hot procedure. In-memory is sufficient: a single API instance
 * owns all traffic (no horizontal scaling for the MVP).
 */

export interface RateLimitOptions {
  /** Max calls allowed within the window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
  /** Derive the bucket key from context (default: caller IP, then user id). */
  keyFromContext?: (ctx: Context) => string;
  /** Injectable clock for tests. */
  now?: () => number;
}

export interface RateLimiter {
  /** A tRPC middleware enforcing the limit; throws TOO_MANY_REQUESTS on burst. */
  middleware: <T>(opts: { ctx: Context; next: () => Promise<T> }) => Promise<T>;
  /** Clear all buckets (test helper). */
  reset(): void;
}

function defaultKey(ctx: Context): string {
  if (ctx.user) return `user:${ctx.user.id}`;
  // Key on the resolved client IP (`ctx.ip` from Fastify's `request.ip`, which
  // honors `trustProxy`). Parsing the raw `x-forwarded-for` header here would
  // let a client behind a direct connection rotate the value to evade the
  // limit; `request.ip` is only derived from XFF when the edge proxy is trusted.
  return `ip:${ctx.ip || 'unknown'}`;
}

/**
 * Build a rate limiter. Returns a tRPC middleware plus a `reset()` for tests.
 *
 * @example
 *   const limiter = createRateLimiter({ max: 10, windowMs: 60_000 });
 *   const limited = publicProcedure.use(limiter.middleware);
 */
export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  const { max, windowMs } = options;
  const keyFromContext = options.keyFromContext ?? defaultKey;
  const now = options.now ?? Date.now;

  // key -> ascending timestamps of calls still within the window.
  const buckets = new Map<string, number[]>();

  return {
    async middleware({ ctx, next }) {
      const key = keyFromContext(ctx);
      const current = now();
      const cutoff = current - windowMs;

      const recent = (buckets.get(key) ?? []).filter((t) => t > cutoff);
      if (recent.length >= max) {
        // Refresh the pruned window so stale timestamps don't linger on a key
        // that keeps getting throttled.
        buckets.set(key, recent);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded. Try again shortly.',
        });
      }
      recent.push(current);
      buckets.set(key, recent);

      // Sweep keys whose window has fully drained so the map can't grow
      // unbounded with one entry per distinct IP over a long-lived process.
      for (const [k, times] of buckets) {
        if (k === key) continue;
        if (times.length === 0 || times[times.length - 1]! <= cutoff) {
          buckets.delete(k);
        }
      }

      return next();
    },
    reset() {
      buckets.clear();
    },
  };
}
