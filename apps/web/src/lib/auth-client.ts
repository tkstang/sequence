import { createAuthClient } from 'better-auth/react';

/**
 * The Better Auth browser client (p05-t03).
 *
 * Points at the API origin's `/api/auth/*` mount (the auth REST surface is NOT
 * wrapped in tRPC). `credentials: 'include'` (Better Auth's default for a
 * cross-origin `baseURL`) carries the httpOnly session cookie. Email+password is
 * the only enabled method for the MVP.
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const authClient = createAuthClient({
  baseURL: `${apiUrl}/api/auth`,
});

export const { signIn, signUp, signOut, useSession } = authClient;
