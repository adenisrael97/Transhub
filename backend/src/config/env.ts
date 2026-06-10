/**
 * Environment configuration — validated at boot with Zod.
 *
 * Importing this module parses process.env. If anything required is missing or
 * malformed, the process exits immediately with a readable error — so the app
 * never starts in a half-configured state and fails mysteriously later.
 */
import "dotenv/config"; // load .env into process.env before anything reads it
import { z } from "zod";

/**
 * Validate that a value is an absolute http(s) URL and return its canonical
 * origin (scheme://host[:port], no path or trailing slash). Throws on a bare
 * host like "app.vercel.app".
 *
 * Why this matters: a scheme-less CORS origin silently breaks the browser. The
 * `cors` package echoes the configured string verbatim as
 * Access-Control-Allow-Origin, but the browser compares it against the request's
 * Origin header — which ALWAYS includes the scheme. "app.vercel.app" never
 * equals "https://app.vercel.app", so every cross-origin response is discarded
 * and the frontend sees an opaque "Network Error". Failing boot here turns that
 * impossible-to-diagnose runtime symptom into a clear startup error.
 */
function toHttpOrigin(value: string, label: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `${label} must be an absolute URL with a scheme (e.g. https://app.example.com), got "${value}"`
    );
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${label} scheme must be http or https, got "${value}"`);
  }
  return url.origin;
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  // CORS allowlist. Comma-separated so the prod domain and Vercel preview URLs
  // can coexist (e.g. "https://transhub.ng,https://transhub-woad.vercel.app").
  // Each entry is validated + normalized below into `corsOrigins`.
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  // Must be a valid ms-style duration so an invalid value is caught at boot
  // instead of at the first user login (e.g. "7d", "1h", "30m", "60s").
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/i, 'JWT_EXPIRES_IN must be a duration like "7d", "1h", "30m"')
    .default("7d"),
  // Paystack secret key (sk_test_... or sk_live_...) — never logged, never exposed to client
  PAYSTACK_SECRET: z.string().min(20, "PAYSTACK_SECRET appears invalid"),
  // Public key forwarded to the frontend via env — safe to expose
  PAYSTACK_PUBLIC_KEY: z.string().min(10, "PAYSTACK_PUBLIC_KEY appears invalid"),
  // Email delivery — Ethereal auto-creates an account in dev so these can be empty
  SMTP_HOST: z.string().min(1).default("smtp.ethereal.email"),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default("TransHub <noreply@transhub.ng>"),
  // Base URL of the frontend (used in email links)
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  // Admin email for platform notifications (charter requests, etc.). Optional — if unset,
  // admin email notifications are skipped (logged as a warning).
  ADMIN_EMAIL: z.string().email().optional(),
  // Destination for contact-form submissions. Optional — submissions are logged
  // but not emailed when unset (useful in dev without a configured inbox).
  CONTACT_EMAIL: z.string().email().optional(),

  // --- Sentry monitoring (all optional; absent DSN ⇒ Sentry is a no-op) ---
  // Backend (server) DSN. NOT validated as a URL on purpose: a slightly-off DSN
  // should disable Sentry, never block boot. The SDK validates + no-ops itself.
  SENTRY_DSN: z.string().optional(),
  // Logical environment shown in Sentry (development | staging | production).
  // Defaults to NODE_ENV when unset.
  SENTRY_ENVIRONMENT: z.string().optional(),
  // Release identifier (e.g. git SHA) for regression tracking. Optional.
  SENTRY_RELEASE: z.string().optional(),
  // Tracing sample rate (0–1). Defaults per-environment in instrument.ts.
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  // Slow-request / slow-query thresholds (ms) for performance signals.
  SLOW_REQUEST_MS: z.coerce.number().int().positive().default(1000),
  SLOW_QUERY_MS: z.coerce.number().int().positive().default(300),
  // Response payload size (bytes) above which we flag a "large payload".
  LARGE_PAYLOAD_BYTES: z.coerce.number().int().positive().default(1_000_000),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // console (not the pino logger) on purpose: this runs before the logger, which
  // itself depends on validated env, can be constructed.
  console.error("❌ Invalid environment variables:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

// Validate + normalize origin config. Runs in EVERY environment: a scheme-less
// CORS_ORIGIN or FRONTEND_URL is a foot-gun anywhere, and the failure mode (an
// opaque browser "Network Error" on every API call) is miserable to debug.
export let corsOrigins: string[];
try {
  corsOrigins = env.CORS_ORIGIN.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => toHttpOrigin(s, "CORS_ORIGIN"));
  if (corsOrigins.length === 0) {
    throw new Error("CORS_ORIGIN must list at least one origin");
  }
  // FRONTEND_URL is the single browser origin used as a base for email/callback
  // links; normalize it (strip any path/trailing slash) and enforce a scheme.
  env.FRONTEND_URL = toHttpOrigin(env.FRONTEND_URL, "FRONTEND_URL");
} catch (e) {
  console.error("❌ Invalid environment variables:");
  console.error(`  - ${(e as Error).message}`);
  process.exit(1);
}

// Extra production-only guards. These values are valid in dev/test but are
// foot-guns in production, so we refuse to boot rather than ship with them:
//   - authenticated SMTP must be configured (else no email ever sends),
//   - a Paystack TEST key in prod means real customers can't actually pay,
//   - localhost CORS/FRONTEND_URL means the deployed frontend can't reach us.
if (env.NODE_ENV === "production") {
  const problems: string[] = [];
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    problems.push("SMTP_USER and SMTP_PASS are required");
  }
  if (env.PAYSTACK_SECRET.startsWith("sk_test_")) {
    problems.push("PAYSTACK_SECRET is a test key — use the live key (sk_live_…)");
  }
  if (/localhost|127\.0\.0\.1/i.test(env.CORS_ORIGIN)) {
    problems.push("CORS_ORIGIN must not point at localhost");
  }
  if (/localhost|127\.0\.0\.1/i.test(env.FRONTEND_URL)) {
    problems.push("FRONTEND_URL must not point at localhost");
  }
  if (problems.length > 0) {
    console.error("❌ Invalid production configuration:");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
}
