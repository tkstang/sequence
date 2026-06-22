'use client';

import * as stylex from '@stylexjs/stylex';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useState } from 'react';

import { signIn } from '@/lib/auth-client.ts';
import { color, fontSize, space } from '@/styles/tokens.stylex.ts';

import { AuthForm } from './auth-form.tsx';

const styles = stylex.create({
  main: {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxl,
    padding: space.xxxl,
    backgroundColor: color.bg,
  },
  loading: {
    fontSize: fontSize.sm,
    color: color.textMuted,
  },
});

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
        <main {...stylex.props(styles.main, styles.loading)}>Loading...</main>
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
    <main {...stylex.props(styles.main)}>
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
