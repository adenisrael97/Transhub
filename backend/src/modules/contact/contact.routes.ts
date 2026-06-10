import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { validateBody } from "../../middleware/validate";
import { rateLimit } from "../../middleware/rate-limit";
import { sendMail } from "../../infra/mailer/client";
import { env } from "../../config/env";
import { logger } from "../../infra/logger";

export const contactRouter = Router();

const contactSchema = z.object({
  name:    z.string().min(1, "Name is required").max(100),
  email:   z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

// 3 requests per IP per hour — tighter than the global API limiter (100/min)
const contactLimiter = rateLimit({ keyPrefix: "contact", max: 3, windowSec: 3600 });

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

contactRouter.post(
  "/",
  contactLimiter,
  validateBody(contactSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, subject, message } = req.body as z.infer<typeof contactSchema>;

      if (!env.CONTACT_EMAIL) {
        logger.warn({ name, email, subject }, "CONTACT_EMAIL not set — contact form submission logged but not emailed");
        res.json({ message: "Message received" });
        return;
      }

      const h = {
        name:    escapeHtml(name),
        email:   escapeHtml(email),
        subject: escapeHtml(subject),
        message: escapeHtml(message).replace(/\n/g, "<br>"),
      };

      await sendMail({
        to:      env.CONTACT_EMAIL,
        replyTo: email,
        subject: `[TransHub Contact] ${subject}`,
        text:    `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
        html: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:600px;width:100%">
        <tr><td style="background:#1E40AF;padding:28px 32px">
          <p style="margin:0;font-size:22px;font-weight:bold;color:#fff">TransHub — Contact Form</p>
        </td></tr>
        <tr><td style="padding:32px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:24px">
            <tr style="background:#f9fafb"><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;width:22%">From</td><td style="padding:10px 16px;font-size:14px;color:#111827">${h.name} &lt;${h.email}&gt;</td></tr>
            <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#6b7280;border-top:1px solid #e5e7eb">Subject</td><td style="padding:10px 16px;font-size:14px;color:#111827;border-top:1px solid #e5e7eb">${h.subject}</td></tr>
          </table>
          <div style="padding:20px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;font-size:14px;color:#374151;line-height:1.6">${h.message}</div>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e5e7eb"><p style="margin:0;font-size:12px;color:#9ca3af">© 2026 TransHub Technologies Ltd.</p></td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
      });

      logger.info({ from: email, subject }, "Contact form email sent");
      res.json({ message: "Message received" });
    } catch (err) {
      next(err);
    }
  }
);
