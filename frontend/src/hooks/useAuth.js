'use client';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import { login as loginApi, register } from '@/services/auth';

/**
 * Authentication hook — provides signIn, signUp, and signOut.
 * Wraps authStore actions with API calls and router navigation.
 * Pass an optional redirectTo to override the default "/" after auth.
 * @param {{ redirectTo?: string }} options
 * @returns {{ user, isAuthenticated, signIn, signUp, signOut }}
 */
export function useAuth({ redirectTo = '/' } = {}) {
  const router = useRouter();
  const { user, isAuthenticated, login, logout } = useAuthStore();

  async function signIn(email, password) {
    const data = await loginApi(email, password);
    login(data.token);
    router.push(redirectTo);
    return data;
  }

  async function signUp(payload) {
    const data = await register(payload);
    login(data.token);
    router.push(redirectTo);
    return data;
  }

  function signOut() {
    logout();
    router.push('/auth/login');
  }

  return { user, isAuthenticated, signIn, signUp, signOut };
}
