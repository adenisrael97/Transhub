/**
 * Public interface — other modules import only from here.
 *
 * Side effect: registers the payment.charter.succeeded event listener so the
 * charters module can confirm payment in the DB without a direct import from
 * the payments module (which would create a circular dependency).
 * This module must be imported before the server starts accepting webhooks.
 */
import { eventBus } from "../../infra/events";
import { logger } from "../../infra/logger";
import { chartersService } from "./charters.service";

eventBus.on("payment.charter.succeeded", ({ charterId, reference, paidAt, webhookAmountKobo }) => {
  chartersService
    .processWebhookPayment(charterId, reference, paidAt, webhookAmountKobo)
    .catch((err) => {
      logger.error({ err, charterId }, "Failed to process charter payment confirmation");
    });
});

export { chartersRouter }  from "./charters.routes";
export { chartersService } from "./charters.service";
export type { CharterDTO } from "./charters.repository";
