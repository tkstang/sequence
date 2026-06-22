import * as stylex from '@stylexjs/stylex';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/components/theme/theme-provider.tsx';
import { TRPCReactProvider } from '@/lib/trpc/provider.tsx';
import { color, fontFamily } from '@/styles/tokens.stylex.ts';

import './globals.css';

export const metadata: Metadata = {
  title: 'Sequence',
  description: 'Multiplayer Sequence — server-authoritative, real-time.',
};

const styles = stylex.create({
  html: {
    colorScheme: color.scheme,
  },
  body: {
    minHeight: '100vh',
    margin: 0,
    backgroundColor: color.bg,
    color: color.text,
    fontFamily: fontFamily.sans,
  },
});

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" {...stylex.props(styles.html)}>
      <body {...stylex.props(styles.body)}>
        <ThemeProvider>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
