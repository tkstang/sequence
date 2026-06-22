'use client';

import * as stylex from '@stylexjs/stylex';
import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '@/components/button.tsx';
import {
  color,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  space,
} from '@/styles/tokens.stylex.ts';

const styles = stylex.create({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.lg,
    width: '100%',
    maxWidth: '24rem',
  },
  title: {
    margin: 0,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.tight,
    color: color.text,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.xs,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: color.text,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: color.border, ':focus-visible': color.focusRing },
    backgroundColor: color.surface,
    color: color.text,
    paddingBlock: space.sm,
    paddingInline: space.md,
    fontSize: fontSize.md,
    fontFamily: 'inherit',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '140ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '1px',
  },
  inputInvalid: {
    borderColor: color.danger,
  },
  fieldError: {
    color: color.teamRed,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
  },
  formError: {
    margin: 0,
    color: color.teamRed,
    fontSize: fontSize.sm,
  },
  footer: {
    margin: 0,
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: color.textMuted,
  },
  link: {
    color: { default: color.teamBlue, ':hover': color.accentHover },
    fontWeight: fontWeight.semibold,
    textDecorationLine: { default: 'none', ':hover': 'underline' },
    transitionProperty: 'color',
    transitionDuration: '120ms',
    transitionTimingFunction: 'ease',
    outlineStyle: { default: 'none', ':focus-visible': 'solid' },
    outlineWidth: { default: '0', ':focus-visible': '2px' },
    outlineColor: color.focusRing,
    outlineOffset: '2px',
    borderRadius: radius.sm,
  },
});

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
      {...stylex.props(styles.form)}
      aria-label={isSignup ? 'Sign up' : 'Log in'}
    >
      <h1 {...stylex.props(styles.title)}>
        {isSignup ? 'Create your account' : 'Welcome back'}
      </h1>

      {isSignup ? (
        <div {...stylex.props(styles.field)}>
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
            {...stylex.props(
              styles.input,
              Boolean(errors.name) && styles.inputInvalid,
            )}
          />
          {errors.name ? (
            <span
              id="name-error"
              role="alert"
              {...stylex.props(styles.fieldError)}
            >
              {errors.name}
            </span>
          ) : null}
        </div>
      ) : null}

      <div {...stylex.props(styles.field)}>
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
          {...stylex.props(
            styles.input,
            Boolean(errors.email) && styles.inputInvalid,
          )}
        />
        {errors.email ? (
          <span
            id="email-error"
            role="alert"
            {...stylex.props(styles.fieldError)}
          >
            {errors.email}
          </span>
        ) : null}
      </div>

      <div {...stylex.props(styles.field)}>
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
          {...stylex.props(
            styles.input,
            Boolean(errors.password) && styles.inputInvalid,
          )}
        />
        {errors.password ? (
          <span
            id="password-error"
            role="alert"
            {...stylex.props(styles.fieldError)}
          >
            {errors.password}
          </span>
        ) : null}
      </div>

      {submitError ? (
        <p role="alert" {...stylex.props(styles.formError)}>
          {submitError}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
      </Button>

      <p {...stylex.props(styles.footer)}>
        {isSignup ? (
          <>
            Already have an account?{' '}
            <Link href="/login" {...stylex.props(styles.link)}>
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{' '}
            <Link href="/signup" {...stylex.props(styles.link)}>
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
