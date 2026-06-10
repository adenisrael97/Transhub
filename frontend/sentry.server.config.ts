/**
 * Sentry init for the Next.js Node server runtime (SSR, Server Components, Route
 * Handlers). Imported by src/instrumentation.ts → register(). Captures SSR/render
 * errors and server-side API route exceptions in the frontend app.
 */
import * as Sentry from "@sentry/nextjs";
import { scrubEvent, scrubBreadcrumb } from "./src/lib/sentry-scrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  sendDefaultPii: false,
  tracesSampleRate: environment === "production" ? 0.1 : 1.0,
  beforeSend: scrubEvent,
  beforeSendTransaction: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
});
