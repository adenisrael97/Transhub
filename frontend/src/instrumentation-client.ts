/**
 * Browser Sentry init (Next.js 15.3+ client instrumentation hook).
 *
 * Captures: React render errors (via global-error + ErrorBoundary), unhandled
 * runtime errors, hydration errors, route-navigation errors, and API failures
 * (reported explicitly from the axios layer). Automatically attaches browser
 * info (UA/OS/browser), session (release health), and breadcrumbs.
 *
 * Security: sendDefaultPii=false + scrubEvent/scrubBreadcrumb strip anything
 * sensitive. No DSN ⇒ disabled (safe no-op for local/dev without Sentry).
 */
import * as Sentry from "@sentry/nextjs";
import { scrubEvent, scrubBreadcrumb } from "./lib/sentry-scrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // Never send IPs/cookies; we attach only { id, role } + route ourselves.
  sendDefaultPii: false,

  // Performance: trace page loads + navigations. 100% in dev, 10% in prod.
  tracesSampleRate: environment === "production" ? 0.1 : 1.0,

  // Final sanitization safety net.
  beforeSend: scrubEvent,
  beforeSendTransaction: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
});

// Instruments client-side route navigations for tracing + route error capture.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
