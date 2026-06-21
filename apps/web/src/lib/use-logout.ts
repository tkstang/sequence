'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { signOut } from './auth-client.ts';

export function useLogout(redirectTo = '/login') {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function logout() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      queryClient.clear();
      router.replace(redirectTo);
    }
  }

  return { logout, isSigningOut };
}
