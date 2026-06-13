import type { ReactNode } from 'react';

type BadgeTone = 'frozen' | 'saved' | 'neutral' | 'win' | 'loss';

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

const tones: Record<BadgeTone, string> = {
  frozen: 'bg-frozen-bg text-frozen-fg',
  saved: 'bg-saved-bg text-saved-fg',
  neutral: 'bg-black/10 text-slate',
  win: 'bg-team-green text-white',
  loss: 'bg-team-red text-white',
};

/** Small status pill (dashboard FROZEN/SAVED, history W/L, etc.). */
export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-lg px-2 py-0.5 text-xs font-bold tracking-wide uppercase ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
