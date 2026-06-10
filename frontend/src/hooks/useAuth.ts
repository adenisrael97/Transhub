"use client";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import { login as loginApi, register, type AuthResponse, type RegisterPayload } from "@/services/auth";
import type { User } from "@/types";

interface UseAuthOptions {
  redirectTo?: string;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (payload: RegisterPayload) => Promise<AuthResponse>;
  signOut: () => void;
}

/**
 * Authentication hook — provides signIn, signUp, and signOut.
 * Wraps authStore actions with API calls and router navigation.
 */
export function useAuth({ redirectTo = "/" }: UseAuthOptions = {}): UseAuthReturn {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  async function signIn(email: string, password: string): Promise<AuthResponse> {
    const data = await loginApi(email, password);
    login(data.token);
    router.push(redirectTo);
    return data;
  }

  async function signUp(payload: RegisterPayload): Promise<AuthResponse> {
    const data = await register(payload);
    login(data.token);
    router.push(redirectTo);
    return data;
  }

  function signOut(): void {
    logout();
    router.push("/auth/login");
  }

  return { user, isAuthenticated, signIn, signUp, signOut };
}
