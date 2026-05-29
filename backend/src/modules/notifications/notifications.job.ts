import { Worker } from "bullmq";
import { env } from "../../config/env";
import { prisma } from "../../infra/db/client";
import { logger } from "../../infra/logger";
import { connection } from "../../infra/queue/client";
import { sendMail } from "../../infra/mailer/client";
import { bookingConfirmedEmail, operatorWelcomeEmail } from "./notifications.templates";

export const notificationsWorker = new Worker(
  "notifications",
  async (job) => {
    switch (job.name) {

      case "booking-confirmed": {
        const { bookingId } = job.data as { bookingId: string };

        const booking = await prisma.booking.findUnique({
          where:   { id: bookingId },
          include: {
            user:  { select: { fullName: true, email: true } },
            trip:  { include: { operator: { select: { companyName: true } } } },
            seats: { include: { seat: { select: { label: true } } } },
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

        // Numeric-aware sort so labels read A1, A2, …, A10 — not A1, A10, A2.
        const seatLabels = booking.seats
          .map((s) => s.seat.label)
          .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
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
          seats:         seatLabels,
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

      default:
        logger.warn({ jobName: job.name }, "Unknown notification job — skipped");
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

notificationsWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, jobName: job?.name, err }, "Notification job failed");
});

// Connection-level errors (Redis down, auth failure) surface here, not on a job.
// Without a listener BullMQ would emit an unhandled 'error' and crash the process.
notificationsWorker.on("error", (err) => {
  logger.error({ err }, "Notifications worker error");
});
