/**
 * Sentry helpers used across the app. `instrument.ts` performs init (imported
 * first in server.ts); this module only adds typed, context-aware capture on top
 * of the already-initialized singleton.
 *
 * Design rules:
 *  - User context is ONLY ever { id, role } — never email/phone/IP (PII rule).
 *  - Payment events tag a 6-char reference SUFFIX, never the full reference
 *    (the codebase deliberately never logs full payment references).
 *  - Everything else is scrubbed by beforeSend (see scrub.ts).
 */
import * as Sentry from "@sentry/node";
import type { Request } from "express";
import { env } from "../../config/env";

export { Sentry };

/** True when a DSN is configured — callers can cheaply skip work when disabled. */
export function sentryEnabled(): boolean {
  return Boolean(env.SENTRY_DSN);
}

export type ErrorCategory =
  | "api"
  | "database"
  | "auth"
  | "authorization"
  | "payment"
  | "webhook"
  | "validation"
  | "internal";

/** Attach { id, role } as the Sentry user for the current request's isolation scope. */
export function setSentryUser(user: { id: string; role: string } | undefined): void {
  if (!sentryEnabled() || !user) return;
  Sentry.setUser({ id: user.id, role: user.role });
}

/** Tag the current request scope with request id + route (no body/headers). */
export function tagRequest(req: Request): void {
  if (!sentryEnabled()) return;
  const scope = Sentry.getCurrentScope();
  if (req.id) scope.setTag("request_id", String(req.id));
  scope.setTag("route", `${req.method} ${req.path}`);
}

interface CaptureOptions {
  req?: Request;
  category?: ErrorCategory;
  level?: Sentry.SeverityLevel;
  /** Extra non-sensitive context (scrubbed by beforeSend regardless). */
  extra?: Record<string, unknown>;
}

/**
 * Capture an exception with request context (user id+role, request id, route,
 * category). Use from the central error handler and anywhere a caught error
 * deserves a Sentry event.
 */
export function captureError(err: unknown, opts: CaptureOptions = {}): void {
  if (!sentryEnabled()) return;
  Sentry.withScope((scope) => {
    if (opts.category) scope.setTag("error.category", opts.category);
    if (opts.level) scope.setLevel(opts.level);
    if (opts.req) {
      if (opts.req.user) scope.setUser({ id: opts.req.user.id, role: opts.req.user.role });
      if (opts.req.id) scope.setTag("request_id", String(opts.req.id));
      scope.setTag("route", `${opts.req.method} ${opts.req.path}`);
      scope.setTag("http.status", String(opts.req.res?.statusCode ?? ""));
    }
    if (opts.extra) scope.setContext("detail", opts.extra);
    if (err instanceof Error) Sentry.captureException(err);
    else Sentry.captureMessage(String(err), opts.level ?? "error");
  });
}

export type PaymentType = "booking" | "charter" | "waybill";
export type PaymentStage = "init" | "verify" | "webhook" | "callback" | "confirm";

interface PaymentIssue {
  type: PaymentType;
  stage: PaymentStage;
  /** Full Paystack reference — only its last 6 chars are sent, for reconciliation. */
  reference?: string | null;
  userId?: string;
  role?: string;
  level?: Sentry.SeverityLevel;
  /** Human summary used when there is no Error object (e.g. amount mismatch). */
  message?: string;
  error?: unknown;
  /** Extra non-sensitive diagnostics (amounts, ids, codes) — scrubbed too. */
  context?: Record<string, unknown>;
}

/**
 * Report a payment-flow problem (failed charge, verification failure, webhook /
 * callback failure, amount mismatch). Groups in Sentry by type+stage so the
 * "Payment Monitoring" dashboards/alerts stay clean.
 */
export function reportPaymentIssue(issue: PaymentIssue): void {
  if (!sentryEnabled()) return;
  Sentry.withScope((scope) => {
    scope.setTag("error.category", "payment");
    scope.setTag("payment.type", issue.type);
    scope.setTag("payment.stage", issue.stage);
    if (issue.reference) scope.setTag("payment.ref_suffix", issue.reference.slice(-6));
    if (issue.userId) scope.setUser({ id: issue.userId, role: issue.role ?? "passenger" });
    if (issue.context) scope.setContext("payment", issue.context);
    scope.setLevel(issue.level ?? "error");
    // Stable grouping per failure class.
    scope.setFingerprint(["payment", issue.type, issue.stage]);
    if (issue.error instanceof Error) {
      Sentry.captureException(issue.error);
    } else {
      Sentry.captureMessage(issue.message ?? `payment ${issue.type} ${issue.stage} failed`, issue.level ?? "error");
    }
  });
}

/** Record a slow-operation performance signal (slow query / slow request). */
export function reportSlow(kind: "query" | "request", durationMs: number, detail: Record<string, unknown>): void {
  if (!sentryEnabled()) return;
  Sentry.withScope((scope) => {
    scope.setTag("performance.kind", kind);
    scope.setLevel("warning");
    scope.setContext("performance", { durationMs, ...detail });
    scope.setFingerprint(["slow", kind, String(detail.target ?? "")]);
    Sentry.captureMessage(`Slow ${kind} (${durationMs}ms)`, "warning");
  });
}

/** Record an oversized-response performance signal. */
export function reportLargePayload(route: string, bytes: number): void {
  if (!sentryEnabled()) return;
  Sentry.withScope((scope) => {
    scope.setTag("performance.kind", "large_payload");
    scope.setLevel("warning");
    scope.setContext("performance", { bytes, route });
    scope.setFingerprint(["large_payload", route]);
    Sentry.captureMessage(`Large response payload (${bytes} bytes)`, "warning");
  });
}

/** Flush buffered events on shutdown (best-effort, time-boxed). */
export async function flushSentry(timeoutMs = 2000): Promise<void> {
  if (!sentryEnabled()) return;
  try {
    await Sentry.flush(timeoutMs);
  } catch {
    /* never let telemetry block shutdown */
  }
}
