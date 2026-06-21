import { describe, expect, it } from 'vitest';

import { resolveClientIp } from './trpc.ts';

/**
 * I3 regression: the tRPC WS context must carry a real per-client IP.
 *
 * On HTTP the adapter hands tRPC a `FastifyRequest` with a resolved `.ip`. On
 * WS it hands the bare Node `IncomingMessage` (no `.ip`) — without a fallback
 * every WS caller collapses to one shared rate-limit bucket, so one client
 * could lock out all guest joins. `resolveClientIp` must therefore degrade
 * through the stamped `raw.ip` (set by the server's onRequest hook) and the
 * socket `remoteAddress` before ever returning 'unknown'.
 */
describe('resolveClientIp (I3)', () => {
  it('uses request.ip on the HTTP path', () => {
    expect(resolveClientIp({ ip: '203.0.113.7' })).toBe('203.0.113.7');
  });

  it('uses the stamped raw.ip when .ip is absent (WS upgrade hook)', () => {
    // The WS context receives the bare IncomingMessage; the onRequest hook in
    // server.ts copies the resolved ip onto raw.ip before the protocol switch.
    const wsReq = { raw: { ip: '198.51.100.4' } };
    expect(resolveClientIp(wsReq)).toBe('198.51.100.4');
  });

  it('falls back to the socket remoteAddress for an un-stamped upgrade', () => {
    const wsReq = { socket: { remoteAddress: '192.0.2.9' } };
    expect(resolveClientIp(wsReq)).toBe('192.0.2.9');
    const rawSocket = { raw: { socket: { remoteAddress: '192.0.2.10' } } };
    expect(resolveClientIp(rawSocket)).toBe('192.0.2.10');
  });

  it('distinct WS clients resolve to distinct keys (no shared bucket)', () => {
    const a = resolveClientIp({
      raw: { socket: { remoteAddress: '10.0.0.1' } },
    });
    const b = resolveClientIp({
      raw: { socket: { remoteAddress: '10.0.0.2' } },
    });
    expect(a).not.toBe(b);
  });

  it('only returns "unknown" when no source is available at all', () => {
    expect(resolveClientIp({})).toBe('unknown');
  });
});
