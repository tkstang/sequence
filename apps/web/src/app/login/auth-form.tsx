'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '@/components/button.tsx';

export interface AuthFormValues {
  name?: string;
  email: string;
  password: string;
}

export interface AuthFormErrors {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * Client-side validation shared by login + signup (p05-t03). Structural only —
 * the server is the real authority. Exported for direct unit testing.
 */
export function validateAuthForm(
  values: AuthFormValues,
  mode: 'login' | 'signup',
): AuthFormErrors {
  const errors: AuthFormErrors = {};
  if (mode === 'signup' && !values.name?.trim()) {
    errors.name = 'Name is required';
  }
  const email = values.email.trim();
  if (!email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email';
  }
  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  return errors;
}

export interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (values: Required<AuthFormValues>) => Promise<void>;
  /** A submit-time error surfaced from the server (bad credentials, etc.). */
  submitError?: string | null;
  isSubmitting?: boolean;
}

/**
 * The email+password form for both auth screens. Validates on submit, blocks
 * the network call when invalid, and surfaces per-field + form-level errors.
 */
export function AuthForm({
  mode,
  onSubmit,
  submitError,
  isSubmitting = false,
}: AuthFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<AuthFormErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: AuthFormValues = { name, email, password };
    const found = validateAuthForm(values, mode);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    await onSubmit({ name, email, password });
  }

  const isSignup = mode === 'signup';

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex w-full max-w-sm flex-col gap-4"
      aria-label={isSignup ? 'Sign up' : 'Log in'}
    >
      <h1 className="text-2xl font-bold">
        {isSignup ? 'Create your account' : 'Welcome back'}
      </h1>

      {isSignup ? (
        <div className="flex flex-col gap-1 text-sm font-medium">
          <label htmlFor="auth-name">Name</label>
          <input
            id="auth-name"
            type="text"
            name="name"
            aria-label="Name"
            value={name}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            className="rounded-lg border border-black/20 bg-white px-3 py-2 text-base"
          />
          {errors.name ? (
            <span
              id="name-error"
              role="alert"
              className="text-team-red text-xs"
            >
              {errors.name}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1 text-sm font-medium">
        <label htmlFor="auth-email">Email</label>
        <input
          id="auth-email"
          type="email"
          name="email"
          aria-label="Email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="rounded-lg border border-black/20 bg-white px-3 py-2 text-base"
        />
        {errors.email ? (
          <span id="email-error" role="alert" className="text-team-red text-xs">
            {errors.email}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1 text-sm font-medium">
        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          type="password"
          name="password"
          aria-label="Password"
          value={password}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? 'password-error' : undefined}
          className="rounded-lg border border-black/20 bg-white px-3 py-2 text-base"
        />
        {errors.password ? (
          <span
            id="password-error"
            role="alert"
            className="text-team-red text-xs"
          >
            {errors.password}
          </span>
        ) : null}
      </div>

      {submitError ? (
        <p role="alert" className="text-team-red text-sm">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
      </Button>

      <p className="text-center text-sm">
        {isSignup ? (
          <>
            Already have an account?{' '}
            <Link href="/login" className="text-team-blue font-semibold">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link href="/signup" className="text-team-blue font-semibold">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
