'use client';

import type { ReactNode } from 'react';

type StageBackground = 'cream' | 'slate' | 'felt' | 'white';

const BACKGROUNDS: Record<StageBackground, string> = {
  cream: 'bg-cream',
  slate: 'bg-slate',
  felt: 'bg-felt',
  white: 'bg-white',
};

export interface StageProps {
  title: string;
  description?: string;
  /** Surface behind the preview, matching where the component lives in prod. */
  background?: StageBackground;
  children: ReactNode;
}

/**
 * Frames a single preview variant: a caption plus a production-faithful
 * surface (same Tailwind tokens as the live app) so the rendered component is
 * pixel-identical to what ships.
 */
export function Stage({
  title,
  description,
  background = 'cream',
  children,
}: StageProps) {
  return (
    <figure className="overflow-hidden rounded-xl border border-black/10 bg-white">
      <figcaption className="flex flex-col gap-0.5 border-b border-black/10 px-4 py-2">
        <span className="text-sm font-bold text-black">{title}</span>
        {description ? (
          <span className="text-xs text-black/55">{description}</span>
        ) : null}
      </figcaption>
      <div className={`${BACKGROUNDS[background]} flex justify-center p-4`}>
        {children}
      </div>
    </figure>
  );
}

/** Vertical stack of stages for a section page. */
export function StageGrid({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6">{children}</div>;
}
