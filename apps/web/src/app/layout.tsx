import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { TRPCReactProvider } from '@/lib/trpc/provider.tsx';

import './globals.css';

export const metadata: Metadata = {
  title: 'Sequence',
  description: 'Multiplayer Sequence — server-authoritative, real-time.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-cream text-slate min-h-screen antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
