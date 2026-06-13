'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useState } from 'react';

import { signIn } from '@/lib/auth-client.ts';

import { AuthForm } from './auth-form.tsx';

const DEFAULT_NEXT = '/dashboard';

export function sanitizeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return DEFAULT_NEXT;
  }
  try {
    const url = new URL(next, 'https://sequence.local');
    if (url.origin !== 'https://sequence.local') return DEFAULT_NEXT;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_NEXT;
  }
}

/**
 * Login screen (p05-t03). Email+password via the Better Auth client; on success
 * redirects to a safe relative `next` path, or the dashboard. A failed sign-in
 * surfaces a form-level error.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-sm text-black/50">
          Loading...
        </main>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nextPath = sanitizeNextPath(searchParams.get('next'));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <AuthForm
        mode="login"
        submitError={submitError}
        isSubmitting={isSubmitting}
        onSubmit={async ({ email, password }) => {
          setSubmitError(null);
          setIsSubmitting(true);
          const { error } = await signIn.email({ email, password });
          setIsSubmitting(false);
          if (error) {
            setSubmitError(error.message ?? 'Invalid email or password');
            return;
          }
          router.replace(nextPath);
        }}
      />
    </main>
  );
}
