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
import { redis } from "../../infra/redis/client";
import { env } from "../../config/env";
import { logger } from "../../infra/logger";
import {
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from "../../shared/errors";
import { bookingsService } from "../bookings";
import { usersService }    from "../users";
import { paymentsRepository } from "./payments.repository";
import { webhookBodySchema, type InitializeInput } from "./payments.schema";

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

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const paymentsService = {
  /**
   * Initialize a Paystack transaction.
   * Verifies that all requested seats are held by this user in Redis before
   * contacting Paystack — prevents initializing payment for seats someone
   * else holds or that were never held.
   */
  async initialize(userId: string, input: InitializeInput): Promise<{ authorizationUrl: string; reference: string }> {
    const { tripId, seatIds } = input;

    // Verify each seat is held by this user
    const pipeline = redis.pipeline();
    for (const seatId of seatIds) {
      pipeline.get(`seat_hold:${tripId}:${seatId}`);
    }
    const holdResults = await pipeline.exec();
    const allHeld = holdResults?.every((r) => r[1] === userId) ?? false;
    if (!allHeld) {
      throw new ConflictError("Seat hold not found or expired — please select seats again");
    }

    // Fetch trip for price (never trust the client for amount)
    const price = await paymentsRepository.findTripPrice(tripId);
    if (price === null) throw new NotFoundError("Trip not found");

    const user = await usersService.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    const amountKobo = seatIds.length * price * 100;
    const reference  = generateRef();

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

    // 4. Idempotency — same webhook fires twice → booking already exists → return early
    const existing = await bookingsService.getByPaymentRef(data.reference);
    if (existing) return;

    // 5. Extract our custom metadata
    if (!data.metadata) {
      logger.error({ event }, "charge.success webhook missing metadata — cannot confirm booking");
      return;
    }
    const { tripId, seatIds, userId } = data.metadata;

    // 6. Amount verification — NEVER trust the webhook amount; recalculate from DB
    const price = await paymentsRepository.findTripPrice(tripId);
    if (price === null) {
      logger.error({ tripId }, "Webhook references unknown trip");
      return;
    }
    const expectedKobo = seatIds.length * price * 100;
    if (data.amount !== expectedKobo) {
      logger.error(
        { expected: expectedKobo, received: data.amount, tripId },
        "Webhook amount mismatch — possible fraud, booking NOT confirmed"
      );
      return;
    }

    // 7. Confirm the booking (Phase 4 logic: SELECT FOR UPDATE → booked).
    //    A ConflictError means the payment succeeded but the seats are no longer
    //    available (hold expired and they were re-booked). Retrying can never
    //    succeed, so we log loudly for manual refund/reconciliation and return
    //    200 — otherwise Paystack would retry this forever. Any OTHER error is
    //    treated as transient (e.g. DB blip): rethrow so Paystack retries.
    //    (Reference is intentionally NOT logged — see security rules.)
    try {
      await bookingsService.confirm({ paymentRef: data.reference, tripId, seatIds }, userId);
    } catch (err) {
      if (err instanceof ConflictError) {
        logger.error(
          { tripId, userId, seatCount: seatIds.length },
          "PAYMENT CAPTURED BUT SEATS UNAVAILABLE — manual refund/reconciliation required"
        );
        return;
      }
      throw err;
    }
  },

  /**
   * Look up the booking created for a given payment reference.
   * Returns null if the webhook hasn't fired yet (caller should poll).
   * Throws ForbiddenError if the booking belongs to a different user.
   */
  async verifyPayment(reference: string, userId: string) {
    const booking = await bookingsService.getByPaymentRef(reference);
    if (!booking) return null;
    if (booking.userId !== userId) throw new ForbiddenError();
    return booking;
  },
};
