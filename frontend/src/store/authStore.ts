import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as Sentry from "@sentry/nextjs";
import { setToken, clearToken, getUser } from "@/lib/auth";
import type { User } from "@/types";

/** Attach { id, role } (never email/PII) to Sentry, or clear it on logout. */
function syncSentryUser(user: User | null): void {
  Sentry.setUser(user ? { id: String(user.id ?? ""), role: user.role } : null);
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /**
   * False until the persisted token has been read from localStorage.
   * Guards against redirecting an authenticated user before hydration.
   */
  hasHydrated: boolean;

  login: (token: string) => void;
  logout: () => void;
  setUser: (patch: Partial<User>) => void;
  setHasHydrated: (value: boolean) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,

      /** Call after a successful login/register — stores token + decodes user */
      login(token) {
        setToken(token);
        const user = getUser();
        set({ token, user, isAuthenticated: true });
        syncSentryUser(user);
      },

      logout() {
        clearToken();
        set({ token: null, user: null, isAuthenticated: false });
        syncSentryUser(null);
      },

      /** Patch individual user fields (e.g. after profile update) */
      setUser(patch) {
        set((s) => ({ user: { ...s.user, ...patch } }));
      },

      setHasHydrated(value) {
        set({ hasHydrated: value });
      },
    }),
    {
      name: "transhub-auth",
      // Only persist the raw token; re-derive user on hydration
      partialize: (s) => ({ token: s.token }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.token) {
          const user = getUser();
          if (user) {
            state.user = user;
            state.isAuthenticated = true;
            syncSentryUser(user);
          } else {
            clearToken();
            state.token = null;
          }
        }
        state.setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;
