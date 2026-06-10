/**
 * Public interface for the waybills module.
 *
 * Side effects on import:
 *  - registers payment.waybill.succeeded listener (confirms payment without a
 *    direct import from payments — breaks the potential circular dependency)
 */
import { eventBus } from "../../infra/events";
import { logger } from "../../infra/logger";
import { waybillsService } from "./waybills.service";

export { waybillsRouter } from "./waybills.routes";
export type { WaybillDTO } from "./waybills.repository";

eventBus.on("payment.waybill.succeeded", ({ waybillId, paidAt, webhookAmountKobo }) => {
  waybillsService.handlePaymentConfirmed(waybillId, paidAt, webhookAmountKobo).catch((err) => {
    logger.error({ err, waybillId }, "Failed to confirm waybill payment");
  });
});
