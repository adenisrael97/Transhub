/**
 * Sentry init for the Next.js Edge runtime (middleware / edge route handlers).
 * Imported by src/instrumentation.ts → register() when NEXT_RUNTIME === "edge".
 */
import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "./src/lib/sentry-scrub";

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
});
