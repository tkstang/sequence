import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Cream/white surface container used across dashboard, history, join. */
export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-black/10 bg-white p-4 shadow-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
