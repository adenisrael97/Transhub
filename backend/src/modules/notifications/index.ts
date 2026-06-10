// Registers eventBus → notificationsQueue subscriptions and starts the worker.
// Import this once in server.ts — the side effects do all the work.
import { eventBus } from "../../infra/events";
import { notificationsQueue } from "../../infra/queue/client";
import { env } from "../../config/env";
import { logger } from "../../infra/logger";
import { notificationsWorker } from "./notifications.job";

eventBus.on("auth.password_reset_requested", (data) => {
  // removeOnComplete: the payload contains the raw reset token (in resetUrl) —
  // purge it from Redis the moment the email is sent, exactly like the operator
  // welcome email's one-time password. Failed jobs are still retained for triage.
  notificationsQueue.add("password-reset", data, { removeOnComplete: true }).catch((err) => {
    logger.error({ err, email: data.email }, "Failed to enqueue password-reset notification");
  });
});

eventBus.on("booking.confirmed", ({ bookingId }) => {
  notificationsQueue.add("booking-confirmed", { bookingId }).catch((err) => {
    logger.error({ err, bookingId }, "Failed to enqueue booking-confirmed notification");
  });
});

eventBus.on("operator.approved", (data) => {
  // This payload carries a one-time plaintext password. Override the queue's
  // default retention so it's purged from Redis the moment the email is sent,
  // instead of sitting in the completed-jobs set. Failed jobs are still retained
  // (default removeOnFail) so delivery problems remain inspectable.
  notificationsQueue.add("operator-approved", data, { removeOnComplete: true }).catch((err) => {
    logger.error({ err }, "Failed to enqueue operator-approved notification");
  });
});

// ---------------------------------------------------------------------------
// Charter notifications
// ---------------------------------------------------------------------------

eventBus.on("charter.requested", (data) => {
  const adminEmail = env.ADMIN_EMAIL;
  if (!adminEmail) {
    logger.warn("ADMIN_EMAIL not set — skipping charter.requested admin notification");
    return;
  }
  notificationsQueue
    .add("charter-requested", {
      adminEmail,
      passengerName: data.passengerName,
      fromLocation:  data.fromLocation,
      toLocation:    data.toLocation,
      departureAt:   data.departureAt,
      vehicleType:   data.vehicleType,
      adminUrl:      `${env.FRONTEND_URL}/charters`,
    })
    .catch((err) => {
      logger.error({ err, charterId: data.charterId }, "Failed to enqueue charter-requested notification");
    });
});

eventBus.on("charter.quoted", (data) => {
  notificationsQueue
    .add("charter-quoted", {
      passengerEmail: data.passengerEmail,
      passengerName:  data.passengerName,
      fromLocation:   data.fromLocation,
      toLocation:     data.toLocation,
      departureAt:    data.departureAt,
      quotedPrice:    data.quotedPrice,
      payUrl:         `${env.FRONTEND_URL}/my-charters`,
    })
    .catch((err) => {
      logger.error({ err, charterId: data.charterId }, "Failed to enqueue charter-quoted notification");
    });
});

eventBus.on("charter.confirmed", (data) => {
  notificationsQueue
    .add("charter-confirmed", {
      passengerEmail: data.passengerEmail,
      passengerName:  data.passengerName,
      fromLocation:   data.fromLocation,
      toLocation:     data.toLocation,
      departureAt:    data.departureAt,
      vehicleType:    data.vehicleType,
      quotedPrice:    data.quotedPrice,
      myChartersUrl:  `${env.FRONTEND_URL}/my-charters`,
    })
    .catch((err) => {
      logger.error({ err, charterId: data.charterId }, "Failed to enqueue charter-confirmed notification");
    });
});

eventBus.on("charter.booking_confirmed", (data) => {
  notificationsQueue
    .add("charter-booking-confirmed", {
      passengerEmail:   data.passengerEmail,
      passengerName:    data.passengerName,
      fromLocation:     data.fromLocation,
      toLocation:       data.toLocation,
      departureAt:      data.departureAt,
      assignedOperator: data.assignedOperator,
      pickupInfo:       data.pickupInfo,
      travelInfo:       data.travelInfo,
      myChartersUrl:    `${env.FRONTEND_URL}/my-charters`,
    })
    .catch((err) => {
      logger.error({ err, charterId: data.charterId }, "Failed to enqueue charter-booking-confirmed notification");
    });
});

eventBus.on("charter.completed", (data) => {
  notificationsQueue
    .add("charter-completed", {
      passengerEmail: data.passengerEmail,
      passengerName:  data.passengerName,
      fromLocation:   data.fromLocation,
      toLocation:     data.toLocation,
      departureAt:    data.departureAt,
      myChartersUrl:  `${env.FRONTEND_URL}/my-charters`,
    })
    .catch((err) => {
      logger.error({ err, charterId: data.charterId }, "Failed to enqueue charter-completed notification");
    });
});

export { notificationsWorker };
