/**
 * PII / secret scrubbing for Sentry.
 *
 * Defence-in-depth: even though we init Sentry with sendDefaultPii=false (so it
 * won't auto-attach cookies / IPs / headers), the Express + HTTP integrations
 * and our own captures can still carry request bodies, headers and breadcrumb
 * data. Every event passes through `scrubEvent` (wired as Sentry's beforeSend /
 * beforeSendTransaction) which deep-redacts anything whose KEY looks sensitive
 * and any VALUE that looks like a token/JWT/bearer credential.
 *
 * This is the single source of truth for "what must never leave the server".
 */

/** Key names whose values must always be redacted (case-insensitive substring). */
const SENSITIVE_KEY = /pass(word|wd)?|secret|token|authorization|cookie|api[-_]?key|access[-_]?key|client[-_]?secret|paystack|signature|card(num(ber)?)?|cvv|cvc|\bpin\b|\bssn\b|\botp\b|\bjwt\b|\bdsn\b|credential|private[-_]?key|refresh[-_]?token/i;

/** Header names we strip outright (auth material / session). */
const SENSITIVE_HEADER = /^(authorization|cookie|set-cookie|x-paystack-signature|proxy-authorization)$/i;

/** Value patterns that are secrets regardless of their key (token leakage). */
const TOKEN_VALUE = [
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\b/, // JWT
  /\bBearer\s+[A-Za-z0-9._-]{8,}/i,                                    // Bearer <token>
  /\bsk_(live|test)_[A-Za-z0-9]+/,                                     // Paystack/Stripe secret key
];

const REDACTED = "[Filtered]";
const MAX_DEPTH = 8;

function redactString(value: string): string {
  let out = value;
  for (const re of TOKEN_VALUE) out = out.replace(re, REDACTED);
  return out;
}

/**
 * Recursively redact sensitive keys/values in place-safe fashion (returns a new
 * structure; never mutates the caller's object). Depth-capped so a cyclic or
 * pathologically deep payload can't hang the scrubber.
 */
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

/** Strip auth headers and redact the rest of a headers map. */
function scrubHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(headers)) {
    if (SENSITIVE_HEADER.test(key)) continue;            // drop entirely
    out[key] = SENSITIVE_KEY.test(key) ? REDACTED : scrubValue(v);
  }
  return out;
}

type SentryEventLike = {
  request?: {
    headers?: Record<string, unknown>;
    cookies?: unknown;
    data?: unknown;
    query_string?: unknown;
  };
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  breadcrumbs?: Array<{ data?: unknown; message?: unknown }>;
  // user is intentionally left as-is: we only ever set { id, role } on it.
};

/**
 * beforeSend hook. Scrub the parts of an event that can carry request payloads,
 * headers, breadcrumb data and extras. Returns the same event reference with
 * scrubbed fields so Sentry forwards the sanitized copy.
 */
export function scrubEvent<T extends SentryEventLike>(event: T): T {
  if (event.request) {
    if (event.request.headers) event.request.headers = scrubHeaders(event.request.headers);
    if (event.request.cookies) delete event.request.cookies;
    if (event.request.data !== undefined) event.request.data = scrubValue(event.request.data);
    if (typeof event.request.query_string === "string") {
      event.request.query_string = redactString(event.request.query_string);
    }
  }
  if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>;
  if (event.contexts) event.contexts = scrubValue(event.contexts) as Record<string, unknown>;
  if (Array.isArray(event.breadcrumbs)) {
    for (const b of event.breadcrumbs) {
      if (b.data !== undefined) b.data = scrubValue(b.data);
      if (typeof b.message === "string") b.message = redactString(b.message);
    }
  }
  return event;
}
