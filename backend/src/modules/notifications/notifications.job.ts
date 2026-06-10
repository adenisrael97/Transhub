import { Worker } from "bullmq";
import { env } from "../../config/env";
import { prisma } from "../../infra/db/client";
import { logger } from "../../infra/logger";
import { connection } from "../../infra/queue/client";
import { sendMail } from "../../infra/mailer/client";
import {
  bookingConfirmedEmail,
  operatorWelcomeEmail,
  passwordResetEmail,
  charterRequestedEmail,
  charterQuotedEmail,
  charterConfirmedEmail,
  charterBookingConfirmedEmail,
  charterCompletedEmail,
  waybillQuoteSentEmail,
  waybillConfirmedEmail,
  waybillDeliveredEmail,
} from "./notifications.templates";
import { eventBus } from "../../infra/events";
import { notificationsQueue } from "../../infra/queue/client";

export const notificationsWorker = new Worker(
  "notifications",
  async (job) => {
    switch (job.name) {

      case "booking-confirmed": {
        const { bookingId } = job.data as { bookingId: string };

        const booking = await prisma.booking.findUnique({
          where:   { id: bookingId },
          include: {
            user:   { select: { fullName: true, email: true } },
            trip:   { include: { operator: { select: { companyName: true } } } },
            _count: { select: { seats: true } },
          },
        });

        if (!booking) {
          // Missing booking will not appear on retry — skip rather than throwing
          logger.warn({ bookingId }, "booking-confirmed: booking not found, skipping email");
          return;
        }
        if (booking.status !== "confirmed") {
          logger.warn({ bookingId, status: booking.status }, "booking-confirmed: not confirmed, skipping");
          return;
        }

        const depFormatted = new Date(booking.trip.departureTime).toLocaleString("en-NG", {
          weekday:  "long",
          day:      "numeric",
          month:    "long",
          year:     "numeric",
          hour:     "2-digit",
          minute:   "2-digit",
          timeZone: "Africa/Lagos",
        });

        const { subject, text, html } = bookingConfirmedEmail({
          passengerName: booking.user.fullName,
          from:          booking.trip.from,
          to:            booking.trip.to,
          departureTime: depFormatted,
          seatCount:     booking._count.seats,
          operator:      booking.trip.operator.companyName,
          vehicleType:   booking.trip.vehicleType,
          totalAmount:   booking.totalAmount,
          paymentRef:    booking.paymentRef ?? "",
          ticketUrl:     `${env.FRONTEND_URL}/tickets/${bookingId}`,
        });

        await sendMail({ to: booking.user.email, subject, text, html });
        logger.info({ bookingId, to: booking.user.email }, "Booking confirmation email sent");
        break;
      }

      case "operator-approved": {
        const { email, contactName, companyName, tempPassword } = job.data as {
          email: string;
          contactName: string;
          companyName: string;
          tempPassword: string;
        };

        const { subject, text, html } = operatorWelcomeEmail({
          contactName,
          companyName,
          email,
          tempPassword,
          loginUrl: `${env.FRONTEND_URL}/operator/login`,
        });

        await sendMail({ to: email, subject, text, html });
        logger.info({ to: email, companyName }, "Operator welcome email sent");
        break;
      }

      case "password-reset": {
        const { email, fullName, resetUrl } = job.data as {
          email: string;
          fullName: string;
          resetUrl: string;
        };

        const { subject, text, html } = passwordResetEmail({ fullName, resetUrl });
        await sendMail({ to: email, subject, text, html });
        // Never log resetUrl/token — it's a bearer secret. Log the recipient only.
        logger.info({ to: email }, "Password reset email sent");
        break;
      }

      case "charter-requested": {
        const { adminEmail, passengerName, fromLocation, toLocation, departureAt, vehicleType, adminUrl } =
          job.data as {
            adminEmail:    string;
            passengerName: string;
            fromLocation:  string;
            toLocation:    string;
            departureAt:   string;
            vehicleType:   string;
            adminUrl:      string;
          };

        const depFormatted = new Date(departureAt).toLocaleString("en-NG", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos",
        });

        const { subject, text, html } = charterRequestedEmail({
          passengerName,
          fromLocation,
          toLocation,
          departureAt: depFormatted,
          vehicleType,
          adminUrl,
        });

        await sendMail({ to: adminEmail, subject, text, html });
        logger.info({ to: adminEmail }, "Charter requested email sent to admin");
        break;
      }

      case "charter-quoted": {
        const { passengerEmail, passengerName, fromLocation, toLocation, departureAt, quotedPrice, payUrl } =
          job.data as {
            passengerEmail: string;
            passengerName:  string;
            fromLocation:   string;
            toLocation:     string;
            departureAt:    string;
            quotedPrice:    number;
            payUrl:         string;
          };

        const depFormatted = new Date(departureAt).toLocaleString("en-NG", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos",
        });

        const { subject, text, html } = charterQuotedEmail({
          passengerName,
          fromLocation,
          toLocation,
          departureAt: depFormatted,
          quotedPrice,
          payUrl,
        });

        await sendMail({ to: passengerEmail, subject, text, html });
        logger.info({ to: passengerEmail }, "Charter quoted email sent to passenger");
        break;
      }

      case "charter-confirmed": {
        const { passengerEmail, passengerName, fromLocation, toLocation, departureAt, vehicleType, quotedPrice, myChartersUrl } =
          job.data as {
            passengerEmail: string;
            passengerName:  string;
            fromLocation:   string;
            toLocation:     string;
            departureAt:    string;
            vehicleType:    string;
            quotedPrice:    number;
            myChartersUrl:  string;
          };

        const depFormatted = new Date(departureAt).toLocaleString("en-NG", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos",
        });

        const { subject, text, html } = charterConfirmedEmail({
          passengerName,
          fromLocation,
          toLocation,
          departureAt: depFormatted,
          vehicleType,
          quotedPrice,
          myChartersUrl,
        });

        await sendMail({ to: passengerEmail, subject, text, html });
        logger.info({ to: passengerEmail }, "Charter confirmed email sent to passenger");
        break;
      }

      case "charter-booking-confirmed": {
        const { passengerEmail, passengerName, fromLocation, toLocation, departureAt, assignedOperator, pickupInfo, travelInfo, myChartersUrl } =
          job.data as {
            passengerEmail:   string;
            passengerName:    string;
            fromLocation:     string;
            toLocation:       string;
            departureAt:      string;
            assignedOperator: string;
            pickupInfo:       string;
            travelInfo:       string;
            myChartersUrl:    string;
          };

        const depFormatted = new Date(departureAt).toLocaleString("en-NG", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos",
        });

        const { subject, text, html } = charterBookingConfirmedEmail({
          passengerName, fromLocation, toLocation,
          departureAt: depFormatted,
          assignedOperator, pickupInfo, travelInfo, myChartersUrl,
        });

        await sendMail({ to: passengerEmail, subject, text, html });
        logger.info({ to: passengerEmail }, "Charter booking-confirmed email sent");
        break;
      }

      case "charter-completed": {
        const { passengerEmail, passengerName, fromLocation, toLocation, departureAt, myChartersUrl } =
          job.data as {
            passengerEmail: string;
            passengerName:  string;
            fromLocation:   string;
            toLocation:     string;
            departureAt:    string;
            myChartersUrl:  string;
          };

        const depFormatted = new Date(departureAt).toLocaleString("en-NG", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos",
        });

        const { subject, text, html } = charterCompletedEmail({
          passengerName, fromLocation, toLocation,
          departureAt: depFormatted,
          myChartersUrl,
        });

        await sendMail({ to: passengerEmail, subject, text, html });
        logger.info({ to: passengerEmail }, "Charter completed email sent");
        break;
      }

      case "waybill-quote-sent": {
        const { senderName, customerEmail, waybillNo, fromLocation, toLocation, quoteAmount, payUrl } = job.data as {
          senderName:    string;
          customerEmail: string;
          waybillNo:     string;
          fromLocation:  string;
          toLocation:    string;
          quoteAmount:   number;
          payUrl:        string;
        };
        if (!customerEmail) {
          logger.warn({ waybillNo }, "No customer email — skipping waybill-quote-sent email");
          break;
        }
        const { subject, text, html } = waybillQuoteSentEmail({
          senderName, waybillNo, fromLocation, toLocation, quoteAmount, payUrl,
        });
        await sendMail({ to: customerEmail, subject, text, html });
        logger.info({ waybillNo, to: customerEmail }, "Waybill quote-sent email sent to customer");
        break;
      }

      case "waybill-paid": {
        const { senderName, senderEmail, waybillNo, fromLocation, toLocation, trackUrl } = job.data as {
          senderName:   string;
          senderEmail:  string;
          waybillNo:    string;
          fromLocation: string;
          toLocation:   string;
          trackUrl:     string;
        };
        logger.info({ waybillNo }, "SMS to sender: waybill confirmed (SMS not yet implemented)");
        if (!senderEmail) {
          logger.warn({ waybillNo }, "No sender email — skipping waybill-paid email");
          break;
        }
        const { subject, text, html } = waybillConfirmedEmail({
          senderName, waybillNo, fromLocation, toLocation, trackUrl,
        });
        await sendMail({ to: senderEmail, subject, text, html });
        logger.info({ waybillNo, to: senderEmail }, "Waybill confirmed email sent to sender");
        break;
      }

      case "waybill-delivered": {
        const { recipientName, waybillNo, fromLocation, toLocation } = job.data as {
          recipientName: string;
          waybillNo:     string;
          fromLocation:  string;
          toLocation:    string;
        };
        const { subject, text, html } = waybillDeliveredEmail({
          recipientName, waybillNo, fromLocation, toLocation,
        });
        logger.info({ waybillNo }, "SMS to recipient: waybill delivered (not yet implemented)");
        // We don't necessarily have the recipient's email — log the intent and skip.
        // A future enhancement would store recipientEmail on the waybill.
        logger.info({ waybillNo, recipientName }, "Waybill delivered notification (no recipient email stored — skipping email)");
        void subject; void text; void html; // suppress unused-var warnings
        break;
      }

      default:
        logger.warn({ jobName: job.name }, "Unknown notification job — skipped");
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

// Subscribe to waybill events and enqueue notification jobs.
eventBus.on("waybill.quote_sent", ({ waybillNo, senderName, customerEmail, quoteAmount, fromLocation, toLocation }) => {
  notificationsQueue.add("waybill-quote-sent", {
    senderName,
    customerEmail,
    waybillNo,
    fromLocation,
    toLocation,
    quoteAmount,
    payUrl: `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/my-shipments`,
  }).catch((err: unknown) => {
    logger.error({ err, waybillNo }, "Failed to enqueue waybill-quote-sent notification");
  });
});

eventBus.on("waybill.paid", ({ waybillId: _wid, waybillNo, senderName, senderPhone: _sp, senderEmail, fromLocation, toLocation }) => {
  notificationsQueue.add("waybill-paid", {
    senderName,
    senderEmail,
    waybillNo,
    fromLocation,
    toLocation,
    trackUrl: `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/track/${waybillNo}`,
  }).catch((err: unknown) => {
    logger.error({ err, waybillNo }, "Failed to enqueue waybill-paid notification");
  });
});

eventBus.on("waybill.delivered", ({ waybillId: _wid, waybillNo, recipientName, recipientPhone: _rp, fromLocation, toLocation }) => {
  notificationsQueue.add("waybill-delivered", {
    recipientName,
    waybillNo,
    fromLocation,
    toLocation,
  }).catch((err: unknown) => {
    logger.error({ err, waybillNo }, "Failed to enqueue waybill-delivered notification");
  });
});

notificationsWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, jobName: job?.name, err }, "Notification job failed");
});

// Connection-level errors (Redis down, auth failure) surface here, not on a job.
// Without a listener BullMQ would emit an unhandled 'error' and crash the process.
notificationsWorker.on("error", (err) => {
  logger.error({ err }, "Notifications worker error");
});
