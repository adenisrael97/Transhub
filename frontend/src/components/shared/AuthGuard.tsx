"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import useAuthStore from "@/store/authStore";
import type { Role } from "@/types";

interface AuthGuardProps {
  children: ReactNode;
  /** Required role, or null/undefined for any authenticated user. */
  role?: Role | null;
  fallback?: ReactNode;
}

/**
 * Wraps protected pages. Redirects unauthenticated users to login.
 *
 * Waits for the persisted auth store to finish hydrating before making any
 * redirect decision — otherwise an authenticated user would be bounced to
 * login on every page refresh (the store starts `isAuthenticated: false`
 * and only flips true once localStorage is read).
 */
export default function AuthGuard({ children, role = null, fallback = null }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return; // wait for rehydration before deciding
    if (!isAuthenticated) {
      const loginPath =
        role === "operator" ? "/operator/login" :
        role === "driver"   ? "/driver/login"   :
        "/auth/login";
      router.replace(`${loginPath}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [hasHydrated, isAuthenticated, role, router, pathname]);

  // Still hydrating, or not authenticated yet — show a spinner while we settle.
  if (!hasHydrated || !isAuthenticated) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-[3px] border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#64748B]">Checking access…</p>
          </div>
        </div>
      )
    );
  }

  // Role mismatch — show access denied
  if (role && user?.role !== role) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-[#FEF2F2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={26} className="text-[#DC2626]" />
          </div>
          <h2 className="text-xl font-bold text-[#0F172A] mb-2">Access Denied</h2>
          <p className="text-sm text-[#64748B] mb-6">
            You need <strong>{role}</strong> access to view this page.
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-[#2563EB] font-semibold text-sm hover:underline"
          >
            Go to homepage
          </button>
        </div>
      </div>
    );
  }

  return children;
}
