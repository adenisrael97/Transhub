import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { logger } from "../logger";

// Cache the in-flight creation promise (not just the resolved transporter) so
// concurrent first-callers — the worker processes up to 5 jobs at once — share a
// single transporter instead of each spinning up its own (and, in dev, each
// creating a separate Ethereal account).
let mailerPromise: Promise<nodemailer.Transporter> | undefined;

async function createTransporter(): Promise<nodemailer.Transporter> {
  if (env.NODE_ENV === "production") {
    return nodemailer.createTransport({
      host:   env.SMTP_HOST,
      port:   env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:   { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  // Ethereal: free fake SMTP — captures emails for inspection, no real delivery
  const testAccount = await nodemailer.createTestAccount();
  logger.info({ user: testAccount.user }, "Ethereal test SMTP account created");
  return nodemailer.createTransport({
    host:   "smtp.ethereal.email",
    port:   587,
    secure: false,
    auth:   { user: testAccount.user, pass: testAccount.pass },
  });
}

export function getMailer(): Promise<nodemailer.Transporter> {
  if (!mailerPromise) {
    // Reset on failure so a transient error (e.g. Ethereal unreachable) doesn't
    // permanently cache a rejected promise — the next call retries.
    mailerPromise = createTransporter().catch((err) => {
      mailerPromise = undefined;
      throw err;
    });
  }
  return mailerPromise;
}

export async function sendMail(options: nodemailer.SendMailOptions): Promise<void> {
  const mailer = await getMailer();
  const info = await mailer.sendMail({ from: env.SMTP_FROM, ...options });
  if (env.NODE_ENV !== "production") {
    logger.info({ previewUrl: nodemailer.getTestMessageUrl(info) }, "Email preview");
  }
}
