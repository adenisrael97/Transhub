/**
 * QA helper (NOT app code): simulate a Paystack `charge.success` webhook for the
 * seats a given user currently holds on a trip. Signs the body with the real
 * PAYSTACK_SECRET (HMAC-SHA512) so it passes the production signature check —
 * this is how we exercise the confirm path without a live Paystack key.
 *
 * Usage: tsx scripts/qa-simulate-webhook.ts <userEmail> <tripId> [reference]
 * Re-running with the SAME reference proves idempotency (no second ticket).
 */
import crypto from "crypto";
import { env } from "../src/config/env";
import { prisma } from "../src/infra/db/client";

async function main() {
  const [userEmail, tripId, refArg] = process.argv.slice(2);
  if (!userEmail || !tripId) {
    console.error("Usage: tsx scripts/qa-simulate-webhook.ts <userEmail> <tripId> [reference]");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) throw new Error(`No user ${userEmail}`);

  const heldSeats = await prisma.seat.findMany({
    where: { tripId, heldBy: user.id, status: "held" },
    select: { id: true },
  });
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { price: true } });
  if (!trip) throw new Error("trip not found");

  const seatIds = heldSeats.map((s) => s.id);
  if (seatIds.length === 0) throw new Error("user holds no seats on this trip (hold may have expired)");

  const reference = refArg ?? `TH-QA-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  const amount = seatIds.length * trip.price * 100;

  const payload = {
    event: "charge.success",
    data: { reference, status: "success", amount, metadata: { tripId, seatIds, userId: user.id } },
  };
  const rawBody = JSON.stringify(payload);
  const signature = crypto.createHmac("sha512", env.PAYSTACK_SECRET).update(rawBody).digest("hex");

  const res = await fetch("http://localhost:4000/payments/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-paystack-signature": signature },
    body: rawBody,
  });

  console.log(JSON.stringify({
    sent: { reference, amount, seatCount: seatIds.length, userId: user.id },
    webhookStatus: res.status,
    webhookBody: await res.text(),
  }));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e.message); await prisma.$disconnect(); process.exit(1); });
