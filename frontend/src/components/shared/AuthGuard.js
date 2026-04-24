'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';

/**
 * Wraps protected pages. Redirects unauthenticated users to login.
 *
 * Usage:
 *   <AuthGuard role="admin">
 *     {children}
 *   </AuthGuard>
 *
 * @param {'admin'|'operator'|null} role — required role, or null for any authenticated user
 */
export default function AuthGuard({ children, role = null, fallback = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      const loginPath = role === 'operator' ? '/operator/login' : '/auth/login';
      router.replace(`${loginPath}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, role, router, pathname]);

  // Not authenticated — show nothing (or a fallback) while redirecting
  if (!isAuthenticated) {
    return fallback ?? (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Checking access…</p>
        </div>
      </div>
    );
  }

  // Role mismatch — show access denied
  if (role && user?.role !== role) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">🔒</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-500 mb-6">
            You need <strong>{role}</strong> access to view this page.
          </p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 font-semibold text-sm hover:underline"
          >
            Go to homepage
          </button>
        </div>
      </div>
    );
  }

  return children;
}
