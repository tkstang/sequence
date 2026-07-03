import type { ReactNode } from 'react';
import { css, html } from 'react-strict-dom';

import { color } from '../theme/vars.css.ts';

export type CardVariant = 'surface' | 'raised' | 'sunken' | 'accent';
export type CardElevation = 'none' | 'raised';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  elevation?: CardElevation;
  testID?: string;
}

export function Card({
  children,
  elevation = 'none',
  testID,
  variant = 'surface',
}: CardProps) {
  return (
    <html.div
      data-testid={testID}
      style={[
        styles.root,
        styles[variant],
        elevation === 'raised' ? styles.elevationRaised : null,
      ]}
    >
      {children}
    </html.div>
  );
}

const styles = css.create({
  root: {
    borderColor: color.border,
    borderRadius: 8,
    borderStyle: 'solid',
    borderWidth: 1,
    padding: 16,
  },
  surface: {
    backgroundColor: color.surface,
  },
  raised: {
    backgroundColor: color.surfaceRaised,
    borderColor: color.borderStrong,
  },
  sunken: {
    backgroundColor: color.surfaceSunken,
  },
  accent: {
    backgroundColor: color.felt,
    borderColor: color.accent,
  },
  elevationRaised: {
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.14)',
  },
});
