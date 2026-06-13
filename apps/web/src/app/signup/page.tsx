'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { signUp } from '@/lib/auth-client.ts';

import { AuthForm } from '../login/auth-form.tsx';

/**
 * Signup screen (p05-t03). Name + email + password via the Better Auth client;
 * on success the session is established and the player lands on the dashboard.
 */
export default function SignupPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <AuthForm
        mode="signup"
        submitError={submitError}
        isSubmitting={isSubmitting}
        onSubmit={async ({ name, email, password }) => {
          setSubmitError(null);
          setIsSubmitting(true);
          const { error } = await signUp.email({ name, email, password });
          setIsSubmitting(false);
          if (error) {
            setSubmitError(error.message ?? 'Could not create your account');
            return;
          }
          router.replace('/dashboard');
        }}
      />
    </main>
  );
}
