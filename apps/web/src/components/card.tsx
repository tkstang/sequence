import * as stylex from '@stylexjs/stylex';
import type { HTMLAttributes, ReactNode } from 'react';

import { color, radius, shadow, space } from '@/styles/tokens.stylex.ts';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const styles = stylex.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: color.border,
    backgroundColor: color.surface,
    color: color.text,
    padding: space.lg,
    boxShadow: shadow.sm,
  },
});

/** Cream/white surface container used across dashboard, history, join. */
export function Card({ className = '', children, ...rest }: CardProps) {
  const props = stylex.props(styles.base);
  return (
    <div
      className={`${props.className ?? ''} ${className}`.trim()}
      style={props.style}
      {...rest}
    >
      {children}
    </div>
  );
}
