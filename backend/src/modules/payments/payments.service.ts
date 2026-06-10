/**
 * Payments business logic — Paystack integration.
 *
 * initialize: verify holds in Redis → calculate amount from DB → call Paystack
 *             API → return { authorizationUrl, reference }
 *
 * handleWebhook: verify HMAC-SHA512 signature (hard reject on mismatch) →
 *                idempotency check → verify amount against DB → delegate confirm
 *                to bookingsService
 *
 * verifyPayment: look up the booking created by the webhook (polling target for
 *                the frontend callback URL handler)
 *
 * Security invariants:
 *   - Paystack secret NEVER logged, NEVER returned to a client
 *   - Payment reference NEVER logged
 *   - Amount ALWAYS recalculated from DB, never trusted from webhook
 *   - Webhooks rejected without a valid HMAC-SHA512 signature
 */
import crypto from "crypto";
import { env } from "../../config/env";
import { redis } from "../../infra/redis/client";
import { logger } from "../../infra/logger";
import {
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../shared/errors";
import { eventBus } from "../../infra/events";
import { reportPaymentIssue, type PaymentStage } from "../../infra/sentry";
import { bookingsService, type BookingDTO } from "../bookings";
import { usersService }    from "../users";
import type { CharterDTO } from "../charters";
import type { WaybillDTO } from "../waybills";
import { paymentsRepository } from "./payments.repository";
import { webhookBodySchema, type InitializeInput, type PassengerInfoInput, type WebhookBody } from "./payments.schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateRef(): string {
  return `TH-${crypto.randomBytes(12).toString("hex").toUpperCase()}`;
}

/**
 * Constant-time HMAC-SHA512 signature check.
 * Using `===` on the digest would leak how many leading bytes matched via
 * timing, so we compare with crypto.timingSafeEqual. Lengths must match first
 * (timingSafeEqual throws on unequal-length buffers); the length check itself
 * leaks nothing since a SHA-512 hex digest is always 128 chars.
 */
function isValidSignature(rawBody: Buffer, signature: string): boolean {
  const expected = crypto
    .createHmac("sha512", env.PAYSTACK_SECRET)
    .update(rawBody)
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

// Cap how long we wait on Paystack so a hung provider request can't stall a
// checkout (and tie up a connection) indefinitely.
const PAYSTACK_TIMEOUT_MS = 10_000;

async function paystackPost(path: string, body: unknown): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`https://api.paystack.co${path}`, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${env.PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body:   JSON.stringify(body),
      signal: AbortSignal.timeout(PAYSTACK_TIMEOUT_MS),
    });
  } catch (err) {
    // Network failure or timeout (AbortError). Don't leak details to the client.
    logger.error({ err: (err as Error).name }, "Paystack request failed (network/timeout)");
    throw new ConflictError("Payment provider is unreachable. Please try again.");
  }
  if (!res.ok) {
    // Log only status + Paystack's own message field — never the raw body,
    // which can echo back the payment reference we sent.
    const text = await res.text().catch(() => "");
    let providerMessage = "unknown";
    try { providerMessage = (JSON.parse(text) as { message?: string })?.message ?? "unknown"; } catch { /* non-JSON body */ }
    logger.error({ status: res.status, providerMessage }, "Paystack API request failed");
    // Generic message to the client — no provider internals leak past the API.
    throw new ConflictError("Payment provider error. Please try again.");
  }
  return res.json();
}

async function paystackGet(path: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`https://api.paystack.co${path}`, {
      method:  "GET",
      headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET}` },
      signal:  AbortSignal.timeout(PAYSTACK_TIMEOUT_MS),
    });
  } catch (err) {
    logger.error({ err: (err as Error).name }, "Paystack request failed (network/timeout)");
    throw new ConflictError("Payment provider is unreachable. Please try again.");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let providerMessage = "unknown";
    try { providerMessage = (JSON.parse(text) as { message?: string })?.message ?? "unknown"; } catch { /* non-JSON body */ }
    // 400 ("Transaction reference not found.") or 404 means Paystack has no
    // usable record of this reference — e.g. the user abandoned before a charge
    // was created. That's an expected "unpaid" outcome, not a server error:
    // return the body ({status:false}) so the caller resolves it as not-success.
    if (res.status === 400 || res.status === 404) {
      logger.info({ status: res.status, providerMessage }, "Paystack verify: no usable transaction for reference");
      try { return JSON.parse(text); } catch { return {}; }
    }
    // 401/403/5xx etc. are real failures (bad key, outage) — surface as retryable.
    logger.error({ status: res.status, providerMessage }, "Paystack verify request failed");
    throw new ConflictError("Payment provider error. Please try again.");
  }
  return res.json().catch(() => ({}));
}

/**
 * Normalised result of a Paystack transaction lookup. `state` collapses
 * Paystack's many statuses into the three the product cares about; `raw` is
 * kept only for logging/diagnostics (never the reference).
 */
export type TxState = "success" | "failed" | "pending";
export interface VerifiedTransaction {
  state:      TxState;
  amountKobo: number;
  metadata:   WebhookBody["data"]["metadata"];
  raw:        string;
}

/**
 * Authoritatively ask Paystack about a transaction. This is the fallback the
 * frontend callback relies on when the asynchronous webhook is delayed, dropped,
 * or (in local dev) simply can't reach the server — and the only way to tell a
 * failed/abandoned payment apart from one that's merely still in flight.
 * Returns null when Paystack has no such transaction (invalid/abandoned ref).
 */
async function verifyWithPaystack(reference: string): Promise<VerifiedTransaction | null> {
  const res = (await paystackGet(`/transaction/verify/${encodeURIComponent(reference)}`)) as {
    status?: boolean;
    data?:   { status?: string; amount?: number; metadata?: unknown };
  };
  if (!res?.status || !res.data) return null;

  const rawStatus = res.data.status ?? "unknown";
  const state: TxState =
    rawStatus === "success"                                         ? "success"
    : ["failed", "abandoned", "reversed"].includes(rawStatus)      ? "failed"
    : "pending";

  // Paystack echoes back the metadata object we sent at initialize time. Validate
  // its shape with the same schema the webhook uses so the confirm path can trust it.
  const metaParse = webhookBodySchema.shape.data.shape.metadata.safeParse(res.data.metadata);

  return {
    state,
    amountKobo: res.data.amount ?? 0,
    metadata:   metaParse.success ? metaParse.data : undefined,
    raw:        rawStatus,
  };
}

/**
 * Confirm a booking from a successful charge — the single code path shared by
 * the webhook handler and the verify fallback. Idempotent: a duplicate delivery
 * (or webhook + verify racing) finds the booking already exists and returns it.
 * Amount is ALWAYS recomputed from the DB — the webhook/Paystack amount is only
 * ever compared, never trusted. The reference is never logged.
 */
type SettleResult =
  | { ok: true;  booking: BookingDTO }
  | { ok: false; reason: string; code: "META" | "TRIP" | "AMOUNT" | "SEATS_GONE" };

async function settleBookingCharge(
  reference: string,
  amountKobo: number,
  metadata: WebhookBody["data"]["metadata"],
  stage: PaymentStage
): Promise<SettleResult> {
  const existing = await bookingsService.getByPaymentRef(reference);
  if (existing) return { ok: true, booking: existing };

  const tripId  = metadata?.tripId;
  const seatIds = metadata?.seatIds;
  const userId  = metadata?.userId;
  if (!tripId || !seatIds || seatIds.length === 0 || !userId) {
    logger.error({ metadata }, "charge.success missing required booking metadata fields");
    reportPaymentIssue({
      type: "booking", stage, reference, userId,
      message: "Booking payment metadata incomplete", context: { code: "META" },
    });
    return { ok: false, reason: "Payment metadata was incomplete.", code: "META" };
  }

  // Read passenger info cached at initialize time. Degrade gracefully if Redis
  // lost the key (TTL expiry, restart) — the booking is still confirmed.
  let passengers: PassengerInfoInput[] | undefined;
  try {
    const paxJson = await redis.get(`pax:${reference}`);
    if (paxJson) passengers = JSON.parse(paxJson) as PassengerInfoInput[];
  } catch (err) {
    logger.warn({ err }, "Could not read passenger info from Redis — booking confirmed without passenger details");
  }

  // Amount verification — NEVER trust the provider amount; recalculate from DB.
  const price = await paymentsRepository.findTripPrice(tripId);
  if (price === null) {
    logger.error({ tripId }, "Charge references unknown trip");
    reportPaymentIssue({
      type: "booking", stage, reference, userId,
      message: "Booking payment references unknown trip", context: { code: "TRIP", tripId },
    });
    return { ok: false, reason: "The trip for this payment no longer exists.", code: "TRIP" };
  }
  const expectedKobo = seatIds.length * price * 100;
  if (amountKobo !== expectedKobo) {
    logger.error({ expected: expectedKobo, received: amountKobo, tripId }, "Amount mismatch — possible fraud, booking NOT confirmed");
    reportPaymentIssue({
      type: "booking", stage, reference, userId,
      message: "Booking payment amount mismatch — possible fraud",
      context: { code: "AMOUNT", expectedKobo, receivedKobo: amountKobo, tripId },
    });
    return { ok: false, reason: "Payment amount did not match the booking.", code: "AMOUNT" };
  }

  // Confirm (Phase 4: SELECT FOR UPDATE → booked). A ConflictError means the
  // seats are gone (hold expired and re-booked) — non-retryable; caller decides
  // how to surface it (webhook logs for refund, verify returns failed).
  try {
    const booking = await bookingsService.confirm({ paymentRef: reference, tripId, seatIds, passengers }, userId);
    return { ok: true, booking };
  } catch (err) {
    if (err instanceof ConflictError) {
      // Critical: money captured but seats are gone — needs manual refund.
      reportPaymentIssue({
        type: "booking", stage, reference, userId, level: "error",
        message: "Payment captured but seats unavailable — manual refund required",
        context: { code: "SEATS_GONE", tripId },
      });
      return { ok: false, reason: "Seats are no longer available.", code: "SEATS_GONE" };
    }
    // Unexpected confirm failure (DB/txn) — capture the real exception.
    reportPaymentIssue({ type: "booking", stage, reference, userId, error: err, context: { tripId } });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/** Outcome of a callback-driven payment verification, mapped to HTTP by the controller. */
export type VerifyOutcome =
  | { state: "success"; booking: BookingDTO }
  | { state: "pending" }
  | { state: "failed";  reason: string };

export const paymentsService = {
  /** Expose Paystack verification to sibling modules (charters/waybills) so
   *  their callbacks get the same webhook-independent confirmation. Returns null
   *  when Paystack has no record of the reference. */
  async lookupTransaction(reference: string): Promise<VerifiedTransaction | null> {
    return verifyWithPaystack(reference);
  },

  /**
   * Initialize a Paystack transaction.
   * Verifies that all requested seats are held by this user in Redis before
   * contacting Paystack — prevents initializing payment for seats someone
   * else holds or that were never held.
   */
  async initialize(userId: string, input: InitializeInput): Promise<{ authorizationUrl: string; reference: string }> {
    const { tripId, passengers } = input;

    // Resolve the seats this user holds against the DB (authoritative), NOT Redis.
    // The hold phase persists ownership in seats.heldBy inside a transaction; Redis
    // hold keys are only a best-effort cache. Reading the DB here means a Redis blip
    // during the hold can't wrongly reject a user paying for seats they legitimately
    // hold. This server-resolved set — never a client-supplied one — drives both the
    // charged amount and the webhook metadata, so the client can't tamper with either.
    const seatIds = await bookingsService.getHeldSeatIds(tripId, userId);
    if (seatIds.length === 0) {
      throw new ConflictError("Seat hold not found or expired — please select seats again");
    }

    // Fetch trip for price (never trust the client for amount)
    const price = await paymentsRepository.findTripPrice(tripId);
    if (price === null) throw new NotFoundError("Trip not found");
    // Guard against a bad operator input / migration bug initializing a ₦0 (or
    // negative) Paystack transaction. Better to block checkout than charge nothing.
    if (price <= 0) throw new ConflictError("This trip has an invalid price — please contact the operator", "INVALID_PRICE");

    const user = await usersService.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const amountKobo = seatIds.length * price * 100;
    const reference  = generateRef();

    // Store passenger PII in Redis keyed by reference (24 h TTL). NOT in Paystack
    // metadata: metadata has a size cap and embedding PII in a third-party payload
    // is a compliance risk. The webhook handler reads this key to persist rows.
    // TTL must comfortably exceed Paystack's webhook retry window (it retries a
    // failed delivery for up to 72 h, but realistically succeeds within minutes);
    // 24 h keeps PII recoverable for any same-day retry without hoarding it.
    await redis.set(
      `pax:${reference}`,
      JSON.stringify(passengers),
      "EX",
      86400
    ).catch((err) => {
      logger.warn({ err }, "Failed to cache passenger info in Redis — passengers will not be persisted");
    });

    const result = await paystackPost("/transaction/initialize", {
      email:     user.email,
      amount:    amountKobo,
      reference,
      metadata:  { tripId, seatIds, userId },
      // Paystack redirects here after payment; frontend reads ?reference= and polls verify.
      // Use FRONTEND_URL (the browser origin), not CORS_ORIGIN — they only coincide on
      // localhost and can diverge in production (e.g. an API gateway origin).
      callback_url: `${env.FRONTEND_URL}/checkout?reference=${reference}`,
    }) as { status?: boolean; data?: { authorization_url?: string } };

    const authorizationUrl = result?.data?.authorization_url;
    if (!authorizationUrl) {
      logger.error({ status: result?.status }, "Paystack initialize returned no authorization_url");
      throw new ConflictError("Could not start payment. Please try again.");
    }

    return { authorizationUrl, reference };
  },

  /**
   * Process a Paystack webhook.
   * The raw body (Buffer) is required for HMAC verification — do NOT call
   * this after the body has been JSON-parsed by express.json().
   */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    // 1. Signature — constant-time compare; hard reject on mismatch (→401).
    //    This is the ONLY path that produces a non-200 response: an attacker
    //    fabricating a webhook must be rejected, not acknowledged.
    if (!isValidSignature(rawBody, signature)) {
      throw new UnauthorizedError("Invalid webhook signature");
    }

    // 2. Parse body. After the signature passes the payload is trusted to be
    //    from Paystack, so a parse/shape failure is non-retryable garbage —
    //    log and return (→200) rather than 500-looping Paystack on it.
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody.toString());
    } catch {
      logger.warn("Paystack webhook body was not valid JSON — ignoring");
      return;
    }
    const parsed = webhookBodySchema.safeParse(payload);
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, "Ignoring malformed Paystack webhook");
      return;
    }
    const { event, data } = parsed.data;

    // 3. Only process successful charges
    if (event !== "charge.success") return;
    if (data.status !== "success") {
      logger.info({ event, status: data.status }, "Non-success charge event — ignoring");
      return;
    }

    // 4. Route by payment type (charter vs. normal booking)
    // Charter path uses the event bus to avoid a circular import with the charters module.
    if (data.metadata?.type === "charter") {
      const { charterId } = data.metadata;
      if (!charterId) {
        logger.error({ event }, "charter webhook missing charterId in metadata");
        return;
      }
      eventBus.emit("payment.charter.succeeded", {
        charterId,
        reference:         data.reference,
        paidAt:            new Date(),
        webhookAmountKobo: data.amount,
      });
      return;
    }

    // --- Waybill payment path ---
    if (data.metadata?.type === "waybill") {
      const { waybillId } = data.metadata;
      if (!waybillId) {
        logger.error({ event }, "waybill webhook missing waybillId in metadata");
        return;
      }
      eventBus.emit("payment.waybill.succeeded", {
        waybillId,
        paidAt:            new Date(),
        webhookAmountKobo: data.amount, // re-verified against the DB fee downstream
      });
      return;
    }

    // --- Normal booking path ---
    // Shared with the verify fallback (settleBookingCharge) so both entry points
    // apply identical idempotency, amount verification and confirm logic. A
    // ConflictError result ("seats gone") is rethrown here as the one transient
    // case Paystack should NOT retry — we log for refund and ack 200.
    const result = await settleBookingCharge(data.reference, data.amount, data.metadata, "webhook");
    if (!result.ok && result.code === "SEATS_GONE") {
      logger.error({ code: result.code }, "PAYMENT CAPTURED BUT SEATS UNAVAILABLE — manual refund/reconciliation required");
    }
  },

  /**
   * Resolve the outcome of a booking payment for the frontend callback.
   *
   * Source-of-truth order:
   *   1. A confirmed booking already exists (webhook won the race) → success.
   *   2. Otherwise ask Paystack directly (webhook delayed/dropped/unreachable):
   *      - success → confirm the booking now (idempotent) and return it,
   *      - failed/abandoned → report failure so the UI can offer a retry,
   *      - pending → tell the caller to keep polling.
   *
   * This makes confirmation resilient to webhook delivery and lets the UI tell a
   * cancelled/failed payment apart from one still in flight — instead of every
   * non-success silently timing out as "pending".
   */
  async verifyPayment(reference: string, userId: string): Promise<VerifyOutcome> {
    const existing = await bookingsService.getByPaymentRef(reference);
    if (existing) {
      if (existing.userId !== userId) throw new ForbiddenError();
      return { state: "success", booking: existing };
    }

    const tx = await verifyWithPaystack(reference);
    if (!tx)                     return { state: "failed",  reason: "We couldn't find this payment. If you were charged, contact support." };
    if (tx.state === "pending") return { state: "pending" };
    if (tx.state === "failed")  return { state: "failed",  reason: "Your payment was not completed. You can try again." };

    // Paystack says success but no booking exists yet — confirm it now.
    if (tx.metadata?.userId && tx.metadata.userId !== userId) throw new ForbiddenError();

    const result = await settleBookingCharge(reference, tx.amountKobo, tx.metadata, "verify");
    if (result.ok) return { state: "success", booking: result.booking };

    if (result.code === "SEATS_GONE") {
      logger.error({ code: result.code }, "PAYMENT CAPTURED BUT SEATS UNAVAILABLE (verify path) — manual refund required");
      return { state: "failed", reason: "Your seats were taken before payment confirmed. Our team will arrange a refund." };
    }
    return { state: "failed", reason: result.reason };
  },

  /**
   * Initialize a Paystack transaction for a waybill (parcel shipping) payment.
   * Amount comes from the DB-computed fee (never the client).
   * metadata.type = 'waybill' routes the webhook to the waybills module.
   */
  async initializeWaybillPayment(
    waybill: WaybillDTO,
    userEmail: string
  ): Promise<{ authorizationUrl: string; reference: string }> {
    const amountKobo = Number(waybill.fee) * 100;
    if (amountKobo <= 0) {
      throw new ConflictError("Waybill fee is invalid", "INVALID_PRICE");
    }

    const reference = generateRef();

    const result = await paystackPost("/transaction/initialize", {
      email:        userEmail,
      amount:       amountKobo,
      reference,
      metadata:     { type: "waybill", waybillId: waybill.id },
      // Carry the reference so /pay-success can verify the REAL outcome with
      // Paystack instead of assuming success from the redirect alone.
      callback_url: `${env.FRONTEND_URL}/pay-success?waybillNo=${waybill.waybillNo}&reference=${reference}`,
    }) as { status?: boolean; data?: { authorization_url?: string } };

    const authorizationUrl = result?.data?.authorization_url;
    if (!authorizationUrl) {
      logger.error({ status: result?.status }, "Paystack waybill initialize returned no authorization_url");
      throw new ConflictError("Could not start waybill payment. Please try again.");
    }

    return { authorizationUrl, reference };
  },

  /**
   * Initialize a Paystack transaction for a charter payment.
   * Amount comes from the DB-stored quotedPrice (never the client).
   * metadata.type = 'charter' lets the webhook handler route correctly.
   */
  async initializeCharterPayment(
    charter: CharterDTO,
    userEmail: string
  ): Promise<{ authorizationUrl: string; reference: string }> {
    if (!charter.quotedPrice) {
      throw new ConflictError("Charter has no quoted price — cannot initialize payment", "CHARTER_NO_PRICE");
    }

    const amountKobo = Number(charter.quotedPrice) * 100;
    if (amountKobo <= 0) {
      throw new ConflictError("Charter quoted price is invalid", "INVALID_PRICE");
    }

    const reference = generateRef();

    const result = await paystackPost("/transaction/initialize", {
      email:        userEmail,
      amount:       amountKobo,
      reference,
      metadata:     { type: "charter", charterId: charter.id },
      callback_url: `${env.FRONTEND_URL}/my-charters?reference=${reference}`,
    }) as { status?: boolean; data?: { authorization_url?: string } };

    const authorizationUrl = result?.data?.authorization_url;
    if (!authorizationUrl) {
      logger.error({ status: result?.status }, "Paystack charter initialize returned no authorization_url");
      throw new ConflictError("Could not start charter payment. Please try again.");
    }

    return { authorizationUrl, reference };
  },
};
