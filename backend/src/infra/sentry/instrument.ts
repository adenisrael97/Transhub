/**
 * Sentry initialization — MUST be the very first import in server.ts.
 *
 * Sentry v10 auto-instruments core libraries (http, express, postgres/pg, redis)
 * by patching them at require time, so `Sentry.init()` has to run BEFORE those
 * modules are imported. Keeping init in its own tiny module (imported first)
 * guarantees that ordering without scattering side effects across the codebase.
 *
 * When SENTRY_DSN is absent the SDK initializes in a disabled state: no events,
 * no network, effectively a no-op. That is the safe default for local/test.
 */
import * as Sentry from "@sentry/node";
import { env } from "../../config/env";
import { scrubEvent } from "./scrub";

const environment = env.SENTRY_ENVIRONMENT ?? env.NODE_ENV;

// Sensible per-environment tracing defaults (overridable via env):
//  - dev: trace everything (low volume, useful locally)
//  - prod/staging: sample 10% to control cost; tune via SENTRY_TRACES_SAMPLE_RATE.
const defaultTraces = environment === "production" ? 0.1 : 1.0;

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment,
  release: env.SENTRY_RELEASE,
  enabled: Boolean(env.SENTRY_DSN),

  // NEVER attach IPs, cookies, request bodies or headers automatically. We attach
  // only what we explicitly choose ({ id, role } user, request_id) and scrub the
  // rest in beforeSend. This is the cornerstone of the "no sensitive data" rule.
  sendDefaultPii: false,

  tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE ?? defaultTraces,

  // Final safety net: deep-scrub every error event and transaction before send,
  // even ones produced by auto-instrumentation we don't directly control.
  beforeSend(event) {
    return scrubEvent(event);
  },
  beforeSendTransaction(event) {
    return scrubEvent(event);
  },
  // Breadcrumbs can capture outgoing HTTP/console data — scrub their payloads too.
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.data) {
      breadcrumb.data = scrubEvent({ extra: breadcrumb.data }).extra;
    }
    return breadcrumb;
  },
});
