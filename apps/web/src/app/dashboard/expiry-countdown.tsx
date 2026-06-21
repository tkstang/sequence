'use client';

import { useEffect, useState } from 'react';

/** Format a remaining-millisecond span as "42 min" / "6 days" / "expired". */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return 'expired';
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'}`;
}

/**
 * Live expiry countdown for a resumable game (dashboard, FR10). Re-renders on a
 * coarse interval (resumables expire in hours/days, so per-minute is plenty).
 */
export function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const remaining = new Date(expiresAt).getTime() - now;
  return <span>expires in {formatRemaining(remaining)}</span>;
}
