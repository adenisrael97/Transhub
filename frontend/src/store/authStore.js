import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setToken, clearToken, getUser } from '@/lib/auth';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      /** Call after a successful login/register — stores token + decodes user */
      login(token) {
        setToken(token);
        set({ token, user: getUser(), isAuthenticated: true });
      },

      logout() {
        clearToken();
        set({ token: null, user: null, isAuthenticated: false });
      },

      /** Patch individual user fields (e.g. after profile update) */
      setUser(patch) {
        set((s) => ({ user: { ...s.user, ...patch } }));
      },
    }),
    {
      name: 'transhub-auth',
      // Only persist the raw token; re-derive user on hydration
      partialize: (s) => ({ token: s.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          const user = getUser();
          if (user) {
            state.user = user;
            state.isAuthenticated = true;
          } else {
            clearToken();
            state.token = null;
          }
        }
      },
    }
  )
);

export default useAuthStore;
