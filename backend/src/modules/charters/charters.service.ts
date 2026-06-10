/**
 * Charter business logic.
 *
 * Status flow:
 *   pending → quote_sent → awaiting_payment → confirmed → completed | cancelled
 *
 * Security invariants:
 *   - Quote can only be sent by an admin (route guard enforces this)
 *   - Payment can only be initiated when status === 'awaiting_payment'
 *   - Passengers can only read/act on their own charters
 *   - Webhook confirmation is idempotent (status check before updating)
 *   - Amount verification: webhook amount must match DB quotedPrice × 100
 */
import { Decimal } from "@prisma/client/runtime/library";
import { logger } from "../../infra/logger";
import { eventBus } from "../../infra/events";
import { reportPaymentIssue } from "../../infra/sentry";
import { ConflictError, ForbiddenError, NotFoundError } from "../../shared/errors";
import { pageMeta, type PaginationQuery, type PageMeta } from "../../shared/pagination";
import { chartersRepository, type CharterDTO, type CharterListFilter } from "./charters.repository";
import type { CreateCharterInput, SendQuoteInput, ConfirmBookingInput } from "./charters.schema";
import type { VerifiedTransaction } from "../payments";

const MIN_LEAD_TIME_MS = 24 * 60 * 60 * 1000;

export const chartersService = {
  async requestCharter(passengerId: string, data: CreateCharterInput): Promise<CharterDTO> {
    const depAt = new Date(data.departureAt);
    if (depAt.getTime() - Date.now() < MIN_LEAD_TIME_MS) {
      throw new ConflictError(
        "Charter departure must be at least 24 hours from now",
        "CHARTER_LEAD_TIME"
      );
    }
    if (data.returnAt) {
      const retAt = new Date(data.returnAt);
      if (retAt <= depAt) {
        throw new ConflictError("returnAt must be after departureAt", "CHARTER_RETURN_BEFORE_DEP");
      }
    }

    const charter = await chartersRepository.create(passengerId, data);

    eventBus.emit("charter.requested", {
      charterId:      charter.id,
      passengerId:    charter.passengerId,
      passengerName:  charter.passenger.fullName,
      passengerEmail: charter.passenger.email,
      fromLocation:   charter.fromLocation,
      toLocation:     charter.toLocation,
      departureAt:    charter.departureAt.toISOString(),
      vehicleType:    charter.vehicleType,
    });

    return charter;
  },

  /** Passenger: own charter history (paginated + filtered). */
  async getMyCharters(
    passengerId: string,
    filter: CharterListFilter,
    pagination: PaginationQuery
  ): Promise<{ charters: CharterDTO[]; pagination: PageMeta }> {
    const { items, total } = await chartersRepository.findAll({ ...filter, passengerId }, pagination);
    return { charters: items, pagination: pageMeta(total, pagination) };
  },

  /** Admin: all charters (paginated + filtered + searchable). */
  async getAllCharters(
    filter: CharterListFilter,
    pagination: PaginationQuery
  ): Promise<{ charters: CharterDTO[]; pagination: PageMeta }> {
    const { items, total } = await chartersRepository.findAll(filter, pagination);
    return { charters: items, pagination: pageMeta(total, pagination) };
  },

  async getCharterById(id: string, requestingUserId: string, role: string): Promise<CharterDTO> {
    const charter = await chartersRepository.findById(id);
    if (!charter) throw new NotFoundError("Charter not found");
    if (role === "passenger" && charter.passengerId !== requestingUserId) {
      throw new ForbiddenError("You do not have access to this charter");
    }
    return charter;
  },

  async sendQuote(id: string, data: SendQuoteInput): Promise<CharterDTO> {
    const charter = await chartersRepository.findById(id);
    if (!charter) throw new NotFoundError("Charter not found");
    if (charter.status !== "pending") {
      throw new ConflictError(
        `Charter cannot be quoted in status '${charter.status}'`,
        "CHARTER_INVALID_STATUS"
      );
    }

    const updated = await chartersRepository.sendQuote(id, data);

    eventBus.emit("charter.quoted", {
      charterId:      updated.id,
      passengerId:    updated.passengerId,
      passengerName:  updated.passenger.fullName,
      passengerEmail: updated.passenger.email,
      quotedPrice:    data.quotedPrice,
      fromLocation:   updated.fromLocation,
      toLocation:     updated.toLocation,
      departureAt:    updated.departureAt.toISOString(),
    });

    return updated;
  },

  async acceptQuote(id: string, passengerId: string): Promise<CharterDTO> {
    const charter = await chartersRepository.findById(id);
    if (!charter) throw new NotFoundError("Charter not found");
    if (charter.passengerId !== passengerId) {
      throw new ForbiddenError("You do not have access to this charter");
    }
    if (charter.status !== "quote_sent") {
      throw new ConflictError(
        `Quote can only be accepted when status is 'quote_sent' (current: '${charter.status}')`,
        "CHARTER_INVALID_STATUS"
      );
    }

    return chartersRepository.acceptQuote(id);
  },

  async rejectQuote(id: string, passengerId: string): Promise<CharterDTO> {
    const charter = await chartersRepository.findById(id);
    if (!charter) throw new NotFoundError("Charter not found");
    if (charter.passengerId !== passengerId) {
      throw new ForbiddenError("You do not have access to this charter");
    }
    if (charter.status !== "quote_sent") {
      throw new ConflictError(
        `Quote can only be rejected when status is 'quote_sent' (current: '${charter.status}')`,
        "CHARTER_INVALID_STATUS"
      );
    }

    return chartersRepository.updateStatus(id, "cancelled");
  },

  async initiatePayment(
    id: string,
    passengerId: string,
    initializeFn: (charter: CharterDTO, userEmail: string) => Promise<{ authorizationUrl: string; reference: string }>
  ): Promise<{ paymentUrl: string }> {
    const charter = await chartersRepository.findById(id);
    if (!charter) throw new NotFoundError("Charter not found");
    if (charter.passengerId !== passengerId) {
      throw new ForbiddenError("You do not have access to this charter");
    }
    if (charter.status !== "awaiting_payment") {
      throw new ConflictError(
        `Payment can only be initiated after accepting the quote (current: '${charter.status}')`,
        "CHARTER_INVALID_STATUS"
      );
    }
    if (!charter.quotedPrice) {
      throw new ConflictError("Charter has no quoted price", "CHARTER_NO_PRICE");
    }

    const { authorizationUrl, reference } = await initializeFn(
      charter,
      charter.passenger.email
    );

    await chartersRepository.setPaymentRef(id, reference);

    return { paymentUrl: authorizationUrl };
  },

  /**
   * Called by the Paystack webhook handler after signature verification.
   * Idempotent: already-confirmed charters are skipped without error.
   */
  async processWebhookPayment(
    charterId: string,
    reference: string,
    paidAt: Date,
    webhookAmountKobo: number
  ): Promise<void> {
    const charter = await chartersRepository.findById(charterId);
    if (!charter) {
      logger.error({ charterId }, "charter.webhook: charter not found");
      return;
    }

    if (charter.status === "confirmed" || charter.status === "completed") {
      logger.info({ charterId }, "charter.webhook: already confirmed, skipping");
      return;
    }

    if (!charter.quotedPrice) {
      logger.error({ charterId }, "charter.webhook: charter has no quotedPrice, cannot verify amount");
      reportPaymentIssue({
        type: "charter", stage: "webhook", reference, userId: charter.passengerId,
        message: "Charter payment but no quoted price to verify", context: { code: "NO_PRICE", charterId },
      });
      return;
    }

    const expectedKobo = Number(charter.quotedPrice) * 100;
    if (webhookAmountKobo !== expectedKobo) {
      logger.error(
        { expected: expectedKobo, received: webhookAmountKobo, charterId },
        "charter.webhook: amount mismatch — possible fraud, NOT confirming"
      );
      reportPaymentIssue({
        type: "charter", stage: "webhook", reference, userId: charter.passengerId,
        message: "Charter payment amount mismatch — possible fraud",
        context: { code: "AMOUNT", expectedKobo, receivedKobo: webhookAmountKobo, charterId },
      });
      return;
    }

    // Atomic flip — returns false if another delivery (or the verify fallback)
    // already confirmed, so the confirmation event fires exactly once.
    const confirmed = await chartersRepository.confirmPayment(charterId, paidAt, new Decimal(charter.quotedPrice));
    if (!confirmed) {
      logger.info({ charterId }, "charter.webhook: not confirmed (race or non-payable state), skipping event");
      return;
    }

    eventBus.emit("charter.confirmed", {
      charterId,
      passengerId:    charter.passengerId,
      passengerName:  charter.passenger.fullName,
      passengerEmail: charter.passenger.email,
      fromLocation:   charter.fromLocation,
      toLocation:     charter.toLocation,
      departureAt:    charter.departureAt.toISOString(),
      vehicleType:    charter.vehicleType,
      quotedPrice:    Number(charter.quotedPrice),
    });
  },

  /**
   * Verify a charter payment from the Paystack callback (webhook-independent).
   * Mirrors the booking verify path: if the charter is already confirmed, report
   * success; otherwise ask Paystack and confirm now on success. Lets the UI tell
   * a cancelled/failed payment apart from one still settling. The transaction
   * lookup is injected (controller passes paymentsService.lookupTransaction) to
   * keep the charters→payments dependency type-only and avoid a runtime cycle.
   */
  async verifyPayment(
    id: string,
    userId: string,
    lookupTransaction: (reference: string) => Promise<VerifiedTransaction | null>
  ): Promise<{ state: "success" | "pending" | "failed"; charter: CharterDTO }> {
    const charter = await chartersRepository.findById(id);
    if (!charter) throw new NotFoundError("Charter not found");
    if (charter.passengerId !== userId) throw new ForbiddenError("You do not have access to this charter");

    if (charter.status === "confirmed" || charter.status === "completed") {
      return { state: "success", charter };
    }
    // No charge in flight to verify (payment never initiated, or already cancelled).
    if (!charter.paymentRef || charter.status !== "awaiting_payment") {
      return { state: "pending", charter };
    }

    const tx = await lookupTransaction(charter.paymentRef);
    if (!tx)                     return { state: "failed",  charter };
    if (tx.state === "pending")  return { state: "pending", charter };
    if (tx.state === "failed")   return { state: "failed",  charter };

    // Paystack reports success — confirm now (idempotent; amount re-verified inside).
    await this.processWebhookPayment(charter.id, charter.paymentRef, new Date(), tx.amountKobo);
    const updated = (await chartersRepository.findById(id)) ?? charter;
    const settled = updated.status === "confirmed" || updated.status === "completed";
    return { state: settled ? "success" : "failed", charter: updated };
  },

  async adminConfirmBooking(id: string, data: ConfirmBookingInput): Promise<CharterDTO> {
    const charter = await chartersRepository.findById(id);
    if (!charter) throw new NotFoundError("Charter not found");
    if (charter.status !== "confirmed") {
      throw new ConflictError(
        `Booking can only be confirmed when status is 'confirmed' (current: '${charter.status}')`,
        "CHARTER_INVALID_STATUS"
      );
    }

    const updated = await chartersRepository.adminConfirmBooking(id, data);

    eventBus.emit("charter.booking_confirmed", {
      charterId:        updated.id,
      passengerId:      updated.passengerId,
      passengerName:    updated.passenger.fullName,
      passengerEmail:   updated.passenger.email,
      fromLocation:     updated.fromLocation,
      toLocation:       updated.toLocation,
      departureAt:      updated.departureAt.toISOString(),
      assignedOperator: data.assignedOperator,
      pickupInfo:       data.pickupInfo,
      travelInfo:       data.travelInfo,
    });

    return updated;
  },

  async completeCharter(id: string): Promise<CharterDTO> {
    const charter = await chartersRepository.findById(id);
    if (!charter) throw new NotFoundError("Charter not found");
    if (charter.status !== "confirmed") {
      throw new ConflictError(
        `Charter can only be completed when status is 'confirmed' (current: '${charter.status}')`,
        "CHARTER_INVALID_STATUS"
      );
    }

    const updated = await chartersRepository.complete(id);

    eventBus.emit("charter.completed", {
      charterId:      updated.id,
      passengerId:    updated.passengerId,
      passengerName:  updated.passenger.fullName,
      passengerEmail: updated.passenger.email,
      fromLocation:   updated.fromLocation,
      toLocation:     updated.toLocation,
      departureAt:    updated.departureAt.toISOString(),
    });

    return updated;
  },

  async cancelCharter(id: string, requestingUserId: string, role: string): Promise<CharterDTO> {
    const charter = await chartersRepository.findById(id);
    if (!charter) throw new NotFoundError("Charter not found");

    if (role === "passenger" && charter.passengerId !== requestingUserId) {
      throw new ForbiddenError("You cannot cancel this charter");
    }

    if (!["pending", "quote_sent", "awaiting_payment"].includes(charter.status)) {
      throw new ConflictError(
        `Cannot cancel a charter in status '${charter.status}'`,
        "CHARTER_INVALID_STATUS"
      );
    }

    return chartersRepository.updateStatus(id, "cancelled");
  },

  async getByPaymentRef(paymentRef: string): Promise<CharterDTO | null> {
    return chartersRepository.findByPaymentRef(paymentRef);
  },

  quotedPriceKobo(charter: { quotedPrice: Decimal | null }): number | null {
    if (!charter.quotedPrice) return null;
    return Number(charter.quotedPrice) * 100;
  },
};
