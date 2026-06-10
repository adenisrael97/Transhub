/**
 * Client-side PII / secret scrubbing for Sentry — the browser counterpart of the
 * backend scrubber. Wired as `beforeSend` / `beforeSendTransaction` so no error
 * event leaves the browser carrying a password, token, secret, or card field,
 * regardless of where in the payload it appears.
 */
import type { Event as SentryEvent, EventHint, Breadcrumb } from "@sentry/nextjs";

const SENSITIVE_KEY =
  /pass(word|wd)?|secret|token|authorization|cookie|api[-_]?key|card(num(ber)?)?|cvv|cvc|\bpin\b|\botp\b|\bjwt\b|\bdsn\b|credential|paystack|signature|refresh[-_]?token/i;

const TOKEN_VALUE = [
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\b/, // JWT
  /\bBearer\s+[A-Za-z0-9._-]{8,}/i,                                    // Bearer token
  /\b(sk|pk)_(live|test)_[A-Za-z0-9]+/,                               // provider keys
];

const REDACTED = "[Filtered]";
const MAX_DEPTH = 8;

function redactString(value: string): string {
  return TOKEN_VALUE.reduce((acc, re) => acc.replace(re, REDACTED), value);
}

export function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return REDACTED;
  if (value == null) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => scrubValue(v, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE_KEY.test(key) ? REDACTED : scrubValue(v, depth + 1);
  }
  return out;
}

/** beforeSend / beforeSendTransaction hook. */
export function scrubEvent<T extends SentryEvent>(event: T, _hint?: EventHint): T {
  if (event.request) {
    if (event.request.headers) event.request.headers = scrubValue(event.request.headers) as Record<string, string>;
    if (event.request.cookies) delete event.request.cookies;
    if (event.request.data !== undefined) event.request.data = scrubValue(event.request.data);
    if (typeof event.request.query_string === "string") {
      event.request.query_string = redactString(event.request.query_string);
    }
  }
  if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>;
  if (event.contexts) event.contexts = scrubValue(event.contexts) as typeof event.contexts;
  if (Array.isArray(event.breadcrumbs)) {
    for (const b of event.breadcrumbs) {
      if (b.data !== undefined) b.data = scrubValue(b.data) as Record<string, unknown>;
      if (typeof b.message === "string") b.message = redactString(b.message);
    }
  }
  return event;
}

/** beforeBreadcrumb hook — scrub breadcrumb payloads (e.g. fetch/xhr bodies). */
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (breadcrumb.data) breadcrumb.data = scrubValue(breadcrumb.data) as Record<string, unknown>;
  if (typeof breadcrumb.message === "string") breadcrumb.message = redactString(breadcrumb.message);
  return breadcrumb;
}
