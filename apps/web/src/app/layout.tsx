import type { Metadata } from 'next';
import type { ReactNode } from 'react';

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
        {children}
      </body>
    </html>
  );
}
