// Registers eventBus → notificationsQueue subscriptions and starts the worker.
// Import this once in server.ts — the side effects do all the work.
import { eventBus } from "../../infra/events";
import { notificationsQueue } from "../../infra/queue/client";
import { logger } from "../../infra/logger";
import { notificationsWorker } from "./notifications.job";

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

export { notificationsWorker };
