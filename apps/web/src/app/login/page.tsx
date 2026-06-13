'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { signIn } from '@/lib/auth-client.ts';

import { AuthForm } from './auth-form.tsx';

/**
 * Login screen (p05-t03). Email+password via the Better Auth client; on success
 * redirects to the dashboard. A failed sign-in surfaces a form-level error.
 */
export default function LoginPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          router.replace('/dashboard');
        }}
      />
    </main>
  );
}
