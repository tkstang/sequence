import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Chrome-less render target for the `/dev` viewport-preview iframes. Lives
 * outside the `/dev` layout so it has no sidebar — just the root layout (which
 * provides the ThemeProvider and base styles). Dev-only, like `/dev`.
 */
export default function DevFrameLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return children;
}
