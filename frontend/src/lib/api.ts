/**
 * Axios instance pre-configured with:
 * - Base URL from NEXT_PUBLIC_API_URL env variable (validated)
 * - Auto-attached JWT token on every request
 * - Auto-unwrapped response.data
 * - 401 handler that clears auth store and redirects to login
 * - Automatic retry on 5xx / network errors (2 attempts) — IDEMPOTENT methods only
 */
import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import * as Sentry from "@sentry/nextjs";
import { getToken, clearToken } from "./auth";

/**
 * Report an API failure to Sentry — server errors (5xx) and network/timeout
 * failures only; expected 4xx (validation, auth, conflicts) are deliberately
 * skipped as noise. Sends method + path + status + request id ONLY — never the
 * request/response body (which can contain PII). scrubEvent is a further net.
 */
function captureApiFailure(error: AxiosError): void {
  const status = error.response?.status;
  if (status !== undefined && status < 500) return; // skip expected 4xx
  const method = (error.config?.method ?? "GET").toUpperCase();
  const path = (error.config?.url ?? "").split("?")[0] ?? ""; // drop query (may carry tokens/refs)
  const requestId =
    (error.response?.headers as Record<string, string> | undefined)?.["x-request-id"];
  const route = typeof window !== "undefined" ? window.location.pathname : undefined;

  Sentry.withScope((scope) => {
    scope.setTag("error.category", "api");
    scope.setTag("api.method", method);
    scope.setTag("api.path", path);
    scope.setTag("api.status", String(status ?? "network_error"));
    if (requestId) scope.setTag("request_id", requestId);
    if (route) scope.setTag("route", route);
    scope.setLevel("error");
    scope.setFingerprint(["api", method, path, String(status ?? "network")]);
    Sentry.captureException(error);
  });
}

// Carries a retry counter on the request config across interceptor passes.
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

// Env validation — warn loudly if API URL is missing
if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    "[TransHub] NEXT_PUBLIC_API_URL is not set — API calls will target relative paths and likely fail."
  );
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// Attach JWT to every outgoing request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Retry on 5xx or network error (max 2 retries with exponential backoff).
//
// ONLY for idempotent methods (GET/HEAD/OPTIONS). Retrying a non-idempotent
// request is dangerous: when the first attempt actually reached the server and
// mutated state but the response was lost (timeout / dropped connection / a 5xx
// raised after the write), a blind retry re-runs the side effect. For POST
// /auth/register and /operators/register that manifests as the classic
// "first attempt fails, second says email already exists" — the row was created
// by the lost first request, and the retry hits the uniqueness check. For
// /payments/initialize it would open a second Paystack transaction. We therefore
// never auto-retry POST/PATCH/PUT/DELETE; callers surface the error and the user
// (or a purpose-built poller like verifyPayment, which is a GET) decides.
const IDEMPOTENT_METHODS = new Set(["get", "head", "options"]);

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetryableRequestConfig | undefined;
  if (!config) return Promise.reject(error);

  const status = error.response?.status;
  const method = (config.method ?? "get").toLowerCase();
  const isRetryableStatus = !status || (status >= 500 && status < 600);
  const isRetryable = IDEMPOTENT_METHODS.has(method) && isRetryableStatus;

  if (isRetryable) {
    config.__retryCount = config.__retryCount ?? 0;
    if (config.__retryCount < 2) {
      config.__retryCount += 1;
      const delay = config.__retryCount * 1000; // 1s, 2s
      await new Promise((r) => setTimeout(r, delay));
      return api(config);
    }
  }

  return Promise.reject(error);
});

// Unwrap data payload; handle 401 by clearing auth and redirecting
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      clearToken();
      // Sync Zustand auth store (lazy import to avoid circular deps)
      void import("@/store/authStore").then((mod) => {
        const store = mod.default;
        if (store.getState().isAuthenticated) {
          store.getState().logout();
        }
      });
      // Redirect to login (client-side only).
      // Do NOT redirect when the 401 comes from a login page itself
      // (driver login, operator login, passenger login) — those pages
      // catch the error locally and show an inline error message. Only
      // redirect when a protected page receives a 401 (expired session).
      const loginPaths = ["/auth/", "/driver/login", "/operator/login"];
      const isLoginPage =
        typeof window !== "undefined" &&
        loginPaths.some((p) => window.location.pathname.startsWith(p));
      if (typeof window !== "undefined" && !isLoginPage) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
      }
    }
    // Preserve the HTTP status on the rejected value. The interceptor otherwise
    // unwraps to response.data only, which drops the status — callers that branch
    // on `err.status` (409 seat conflicts, 4xx vs transient 5xx during payment
    // verify) would silently fall through to a generic path without it.
    const status = error.response?.status;
    const data = error.response?.data;
    // Server always returns { error: { code, message } }. Extract to top-level so
    // getErrorMessage(err) and err?.message work uniformly across all call sites.
    let message = "Network error. Please try again.";
    let code: string | undefined;
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      const nested = d.error as Record<string, unknown> | undefined;
      if (typeof nested?.message === "string") message = nested.message;
      else if (typeof d.message === "string") message = d.message;
      if (typeof nested?.code === "string") code = nested.code;
      else if (typeof d.code === "string") code = d.code;
    }
    // Telemetry: record server/network failures (after retries are exhausted).
    captureApiFailure(error);
    return Promise.reject({ message, code, status });
  }
);

export default api;
