import { Decimal } from "@prisma/client/runtime/library";
import { NotFoundError, ForbiddenError, ConflictError } from "../../shared/errors";
import { eventBus } from "../../infra/events";
import { logger } from "../../infra/logger";
import { reportPaymentIssue } from "../../infra/sentry";
import { generateWaybillNo } from "../../shared/waybillNo";
import { pageMeta, type PaginationQuery, type PageMeta } from "../../shared/pagination";
import { usersService } from "../users";
import { waybillsRepository, type WaybillListFilter } from "./waybills.repository";
import {
  VALID_TRANSITIONS,
  type CreateWaybillInput,
  type SendQuoteInput,
  type UpdateStatusInput,
} from "./waybills.schema";
import { paymentsService } from "../payments";
import type { WaybillDTO, WaybillEventDTO } from "./waybills.repository";

// ---------------------------------------------------------------------------
// Public tracking projection — strips PII from unauthenticated responses
// ---------------------------------------------------------------------------

export interface PublicWaybillDTO {
  waybillNo:          string;
  status:             string;
  fromLocation:       string;
  toLocation:         string;
  senderName:         string;
  recipientName:      string;
  description:        string;
  weightKg:           WaybillDTO["weightKg"];
  fee:                WaybillDTO["fee"];
  assignedOperator:   WaybillDTO["assignedOperator"];
  quoteSentAt:        Date | null;
  paidAt:             Date | null;
  droppedOffAt:       Date | null;
  pickedUpAt:         Date | null;
  inTransitAt:        Date | null;
  arrivedAt:          Date | null;
  completedAt:        Date | null;
  createdAt:          Date;
  updatedAt:          Date;
  events:             WaybillEventDTO[];
}

function toPublicView(w: WaybillDTO): PublicWaybillDTO {
  return {
    waybillNo:        w.waybillNo,
    status:           w.status,
    fromLocation:     w.fromLocation,
    toLocation:       w.toLocation,
    senderName:       w.senderName,
    recipientName:    w.recipientName,
    description:      w.description,
    weightKg:         w.weightKg,
    fee:              w.fee,
    assignedOperator: w.assignedOperator,
    quoteSentAt:      w.quoteSentAt,
    paidAt:           w.paidAt,
    droppedOffAt:     w.droppedOffAt,
    pickedUpAt:       w.pickedUpAt,
    inTransitAt:      w.inTransitAt,
    arrivedAt:        w.arrivedAt,
    completedAt:      w.completedAt,
    createdAt:        w.createdAt,
    updatedAt:        w.updatedAt,
    events:           w.events,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const waybillsService = {
  /** Customer: submit a waybill request. No payment — admin quotes later. */
  async createWaybill(
    data: CreateWaybillInput,
    userId: string
  ): Promise<WaybillDTO> {
    let waybill!: WaybillDTO;

    await generateWaybillNo(async (no) => {
      waybill = await waybillsRepository.create({ ...data, waybillNo: no, userId });
    });

    logger.info({ waybillNo: waybill.waybillNo, userId }, "Waybill request created");
    return waybill;
  },

  /** Customer: list their own waybills (paginated + filtered). */
  async listMyWaybills(
    userId: string,
    filter: WaybillListFilter,
    pagination: PaginationQuery
  ): Promise<{ waybills: WaybillDTO[]; pagination: PageMeta }> {
    const { items, total } = await waybillsRepository.findAll({ ...filter, userId }, pagination);
    return { waybills: items, pagination: pageMeta(total, pagination) };
  },

  /**
   * Public unauthenticated tracking. Returns ONLY the non-sensitive projection
   * (phone numbers, userId, paymentRef, declaredValue stripped).
   */
  async trackWaybill(waybillNo: string): Promise<PublicWaybillDTO> {
    const waybill = await waybillsRepository.findByNo(waybillNo);
    if (!waybill) throw new NotFoundError("Waybill not found");
    return toPublicView(waybill);
  },

  /**
   * Admin: list all waybills with optional filters.
   * Operator: list ONLY the waybills assigned to that operator — the
   * assignedOperatorId filter is forced to the requester's own id and any
   * client-supplied value is ignored. Without this an operator could read
   * every customer's waybill PII across the whole platform (BOLA).
   */
  async listWaybills(
    filters: WaybillListFilter,
    requester: { role: string; operatorId?: string },
    pagination: PaginationQuery
  ): Promise<{ waybills: WaybillDTO[]; pagination: PageMeta }> {
    if (requester.role === "operator") {
      // An operator with no linked operator record can own no waybills.
      if (!requester.operatorId) {
        return { waybills: [], pagination: pageMeta(0, pagination) };
      }
      // Force the operator scope; ignore any client-supplied assignedOperatorId (BOLA).
      const { items, total } = await waybillsRepository.findAll(
        { ...filters, assignedOperatorId: requester.operatorId },
        pagination
      );
      return { waybills: items, pagination: pageMeta(total, pagination) };
    }
    const { items, total } = await waybillsRepository.findAll(filters, pagination);
    return { waybills: items, pagination: pageMeta(total, pagination) };
  },

  /**
   * Admin: assign transport company and send a quote.
   * Transitions: pending → quote_sent.
   */
  async sendQuote(
    id: string,
    data: SendQuoteInput
  ): Promise<WaybillDTO> {
    const waybill = await waybillsRepository.findById(id);
    if (!waybill) throw new NotFoundError("Waybill not found");

    if (waybill.status !== "pending") {
      throw new ConflictError(
        `Cannot send quote — waybill is '${waybill.status}', expected 'pending'`,
        "INVALID_STATUS_TRANSITION"
      );
    }

    const fee = new Decimal(data.quoteAmount);
    const updated = await waybillsRepository.sendQuote(
      id,
      fee,
      data.assignedOperatorId,
      data.quoteNote
    );

    logger.info({ id, quoteAmount: data.quoteAmount }, "Waybill quote sent");

    emitTrackingUpdate(updated);

    // Resolve the customer's email so the notification can tell them the quote
    // is ready and link them to payment. Best-effort: a missing email must not
    // block the quote (the customer can still see it in My Shipments).
    let customerEmail = "";
    try {
      const user = await usersService.findById(updated.userId);
      customerEmail = user?.email ?? "";
    } catch {
      logger.warn({ id }, "Could not resolve customer email for quote_sent notification");
    }

    eventBus.emit("waybill.quote_sent", {
      waybillId:     updated.id,
      waybillNo:     updated.waybillNo,
      senderName:    updated.senderName,
      customerEmail,
      quoteAmount:   data.quoteAmount,
      fromLocation:  updated.fromLocation,
      toLocation:    updated.toLocation,
      userId:        updated.userId,
    });

    return updated;
  },

  /**
   * Customer: initiate Paystack payment for a quoted waybill.
   * Returns a Paystack authorization URL. Transitions on webhook: quote_sent → paid.
   */
  async initiatePay(
    id: string,
    userId: string,
    userEmail: string
  ): Promise<{ paymentUrl: string }> {
    const waybill = await waybillsRepository.findById(id);
    if (!waybill) throw new NotFoundError("Waybill not found");
    if (waybill.userId !== userId) throw new ForbiddenError("Not your waybill");

    if (waybill.status !== "quote_sent") {
      throw new ConflictError(
        `Cannot pay — waybill is '${waybill.status}', expected 'quote_sent'`,
        "INVALID_STATUS_TRANSITION"
      );
    }

    if (Number(waybill.fee) <= 0) {
      throw new ConflictError("Waybill has no quoted fee — contact admin", "NO_QUOTE");
    }

    const { authorizationUrl, reference } = await paymentsService.initializeWaybillPayment(
      waybill,
      userEmail
    );

    await waybillsRepository.setPaymentRef(waybill.id, reference);
    return { paymentUrl: authorizationUrl };
  },

  /**
   * Admin/operator: update waybill status (post-payment lifecycle).
   * Covers: dropped_off, picked_up, in_transit, arrived_at_hub, completed, cancelled.
   *
   * Authorization:
   *  - admin    → may update any waybill, including cancellation.
   *  - operator → may only update a waybill ASSIGNED TO THEM, and may NOT
   *               cancel (cancelling a paid shipment is a refund decision that
   *               belongs to admin). Without the ownership check any operator
   *               could drive another operator's shipment through its lifecycle.
   */
  async updateWaybillStatus(
    id: string,
    requester: { role: string; operatorId?: string },
    data: UpdateStatusInput
  ): Promise<WaybillDTO> {
    const waybill = await waybillsRepository.findById(id);
    if (!waybill) throw new NotFoundError("Waybill not found");

    if (requester.role !== "admin" && requester.role !== "operator") {
      throw new ForbiddenError("Only operators and admins can update waybill status");
    }

    if (requester.role === "operator") {
      if (!requester.operatorId || waybill.assignedOperatorId !== requester.operatorId) {
        throw new ForbiddenError("This waybill is not assigned to your company");
      }
      if (data.status === "cancelled") {
        throw new ForbiddenError("Only an admin can cancel a waybill");
      }
    }

    const allowed = (VALID_TRANSITIONS as Record<string, string[]>)[waybill.status] ?? [];
    if (!allowed.includes(data.status)) {
      throw new ConflictError(
        `Cannot transition from '${waybill.status}' to '${data.status}'`,
        "INVALID_STATUS_TRANSITION"
      );
    }

    const updated = await waybillsRepository.updateStatus(id, data.status, data.location, data.note);

    // Push the new status to anyone tracking this parcel in real time.
    emitTrackingUpdate(updated);

    if (data.status === "completed") {
      eventBus.emit("waybill.delivered", {
        waybillId:      updated.id,
        waybillNo:      updated.waybillNo,
        recipientName:  updated.recipientName,
        recipientPhone: updated.recipientPhone,
        fromLocation:   updated.fromLocation,
        toLocation:     updated.toLocation,
      });
    }

    return updated;
  },

  /**
   * Verify a waybill payment from the Paystack callback (webhook-independent).
   * The /pay-success page calls this so it reflects the REAL payment outcome
   * instead of trusting the redirect — a cancelled/failed payment must not show
   * a "confirmed" page. If the webhook hasn't landed yet, this asks Paystack and
   * confirms on success (idempotent — handlePaymentConfirmed re-verifies amount
   * and atomically flips quote_sent → paid).
   */
  async verifyPayment(
    reference: string,
    userId: string
  ): Promise<{ state: "success" | "pending" | "failed"; waybill: WaybillDTO }> {
    const waybill = await waybillsRepository.findByPaymentRef(reference);
    if (!waybill) throw new NotFoundError("Waybill not found");
    if (waybill.userId !== userId) throw new ForbiddenError("Not your waybill");

    if (waybill.paidAt !== null)        return { state: "success", waybill };
    if (waybill.status !== "quote_sent") return { state: "pending", waybill };

    const tx = await paymentsService.lookupTransaction(reference);
    if (!tx)                    return { state: "failed",  waybill };
    if (tx.state === "pending") return { state: "pending", waybill };
    if (tx.state === "failed")  return { state: "failed",  waybill };

    await this.handlePaymentConfirmed(waybill.id, new Date(), tx.amountKobo);
    const updated = (await waybillsRepository.findById(waybill.id)) ?? waybill;
    return { state: updated.paidAt !== null ? "success" : "failed", waybill: updated };
  },

  /**
   * Called by the payment webhook (after HMAC verification) when a waybill
   * payment is confirmed.
   *
   * Defense-in-depth, mirroring the booking & charter paths:
   *  - amount is re-verified against the DB-quoted fee (never trust the webhook);
   *  - confirmation is an atomic conditional update so a duplicated webhook
   *    delivery (Paystack retries) can never double-confirm or double-notify.
   */
  async handlePaymentConfirmed(
    waybillId: string,
    paidAt: Date,
    webhookAmountKobo: number
  ): Promise<void> {
    const waybill = await waybillsRepository.findById(waybillId);
    if (!waybill) {
      logger.error({ waybillId }, "payment.waybill.succeeded: waybill not found");
      return;
    }

    // Fast idempotency path — already confirmed by an earlier delivery.
    if (waybill.paidAt !== null) {
      logger.info({ waybillId }, "payment.waybill.succeeded: already confirmed, skipping");
      return;
    }

    // Amount verification — recompute from the DB-quoted fee. A mismatch means a
    // tampered/replayed charge; refuse to confirm and flag for reconciliation.
    const expectedKobo = Math.round(Number(waybill.fee) * 100);
    if (webhookAmountKobo !== expectedKobo) {
      logger.error(
        { waybillId, expected: expectedKobo, received: webhookAmountKobo },
        "payment.waybill.succeeded: amount mismatch — possible fraud, NOT confirming"
      );
      reportPaymentIssue({
        type: "waybill", stage: "webhook", reference: waybill.paymentRef, userId: waybill.userId,
        message: "Waybill payment amount mismatch — possible fraud",
        context: { code: "AMOUNT", expectedKobo, receivedKobo: webhookAmountKobo, waybillId },
      });
      return;
    }

    // Atomic confirm: only flips quote_sent → paid when paidAt is still null, so
    // two concurrent webhook deliveries can't both pass. Returns false if another
    // delivery won the race or the waybill is no longer payable (e.g. cancelled).
    const confirmed = await waybillsRepository.confirmPayment(waybillId, paidAt);
    if (!confirmed) {
      logger.info({ waybillId }, "payment.waybill.succeeded: not confirmed (race or non-payable state)");
      return;
    }

    const updated = await waybillsRepository.findById(waybillId);
    if (updated) emitTrackingUpdate(updated);

    let senderEmail = "";
    try {
      const user = await usersService.findById(waybill.userId);
      senderEmail = user?.email ?? "";
    } catch {
      logger.warn({ waybillId }, "Could not resolve sender email for notification");
    }

    eventBus.emit("waybill.paid", {
      waybillId,
      waybillNo:    waybill.waybillNo,
      senderName:   waybill.senderName,
      senderPhone:  waybill.senderPhone,
      senderEmail,
      fromLocation: waybill.fromLocation,
      toLocation:   waybill.toLocation,
    });
  },
};

/**
 * Bridge a waybill mutation to the real-time tracking channel. Tracking is a
 * UX nicety, never a source of truth, so this is fire-and-forget — a socket
 * hiccup must not affect the business flow.
 */
function emitTrackingUpdate(w: WaybillDTO): void {
  eventBus.emit("waybill.tracking_updated", {
    waybillNo: w.waybillNo,
    status:    w.status,
    events:    w.events,
  });
}
