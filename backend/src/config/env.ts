/**
 * Environment configuration — validated at boot with Zod.
 *
 * Importing this module parses process.env. If anything required is missing or
 * malformed, the process exits immediately with a readable error — so the app
 * never starts in a half-configured state and fails mysteriously later.
 */
import "dotenv/config"; // load .env into process.env before anything reads it
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
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

// Refuse to start if production SMTP is not configured. Both are needed for
// authenticated SMTP — failing here beats discovering it at the first email.
if (env.NODE_ENV === "production" && (!env.SMTP_USER || !env.SMTP_PASS)) {
  console.error("❌ SMTP_USER and SMTP_PASS are required in production");
  process.exit(1);
}
