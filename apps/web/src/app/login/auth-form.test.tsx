import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AuthForm, validateAuthForm } from './auth-form.tsx';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('validateAuthForm', () => {
  it('requires a name in signup mode only', () => {
    expect(
      validateAuthForm(
        { name: '', email: 'a@b.com', password: 'password1' },
        'signup',
      ).name,
    ).toBeTruthy();
    expect(
      validateAuthForm({ email: 'a@b.com', password: 'password1' }, 'login')
        .name,
    ).toBeUndefined();
  });

  it('rejects malformed emails', () => {
    expect(
      validateAuthForm({ email: 'nope', password: 'password1' }, 'login').email,
    ).toBeTruthy();
    expect(
      validateAuthForm({ email: 'a@b.com', password: 'password1' }, 'login')
        .email,
    ).toBeUndefined();
  });

  it('requires a password of at least 8 characters', () => {
    expect(
      validateAuthForm({ email: 'a@b.com', password: 'short' }, 'login')
        .password,
    ).toBeTruthy();
    expect(
      validateAuthForm({ email: 'a@b.com', password: 'longenough' }, 'login')
        .password,
    ).toBeUndefined();
  });
});

describe('<AuthForm>', () => {
  it('blocks submit and shows field errors when invalid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AuthForm mode="login" onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('submits valid credentials', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AuthForm mode="login" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Email'), 'player@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'supersecret');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        name: '',
        email: 'player@example.com',
        password: 'supersecret',
      }),
    );
  });

  it('shows the name field and validates it in signup mode', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AuthForm mode="signup" onSubmit={onSubmit} />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
    await userEvent.type(screen.getByLabelText('Password'), 'supersecret');
    await userEvent.click(
      screen.getByRole('button', { name: /create account/i }),
    );
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('surfaces a server submit error', () => {
    render(
      <AuthForm
        mode="login"
        onSubmit={vi.fn()}
        submitError="Invalid email or password"
      />,
    );
    expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
  });
});
