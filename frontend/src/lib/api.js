/**
 * Axios instance pre-configured with:
 * - Base URL from NEXT_PUBLIC_API_URL env variable (validated)
 * - Auto-attached JWT token on every request
 * - Auto-unwrapped response.data
 * - 401 handler that clears auth store and redirects to login
 * - Automatic retry on 5xx / network errors (2 attempts)
 */
import axios from 'axios';
import { getToken, clearToken } from './auth';

// Env validation — warn loudly if API URL is missing
if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    '[TransHub] NEXT_PUBLIC_API_URL is not set — API calls will target relative paths and likely fail.'
  );
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Attach JWT to every outgoing request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Retry on 5xx or network error (max 2 retries with exponential backoff)
api.interceptors.response.use(undefined, async (error) => {
  const config = error.config;
  const status = error.response?.status;
  const isRetryable = !status || (status >= 500 && status < 600);

  if (isRetryable && !config.__retryCount) config.__retryCount = 0;
  if (isRetryable && config.__retryCount < 2) {
    config.__retryCount += 1;
    const delay = config.__retryCount * 1000; // 1s, 2s
    await new Promise((r) => setTimeout(r, delay));
    return api(config);
  }

  return Promise.reject(error);
});

// Unwrap data payload; handle 401 by clearing auth and redirecting
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      // Sync Zustand auth store (lazy import to avoid circular deps)
      import('@/store/authStore').then((mod) => {
        const store = mod.default;
        if (store.getState().isAuthenticated) {
          store.getState().logout();
        }
      });
      // Redirect to login (client-side only)
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error.response?.data ?? { message: 'Network error. Please try again.' });
  }
);

export default api;
