/**
 * Next.js server instrumentation hook. Loads the right Sentry config per runtime
 * and exposes `onRequestError` so errors thrown in Server Components, Route
 * Handlers and middleware are captured (Route Errors). No-op without a DSN.
 */
import * as Sentry from "@sentry/nextjs";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Captures server-side request errors (Server Components, route handlers, proxies).
export const onRequestError = Sentry.captureRequestError;
