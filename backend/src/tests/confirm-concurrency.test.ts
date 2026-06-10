/**
 * Confirm-phase (payment webhook) concurrency test — the MONEY path.
 *
 * The hold test (seat-concurrency.test.ts) proves the pre-payment hold is
 * race-free. This one proves the thing that actually matters for double-booking:
 * the CONFIRM path that runs inside the Paystack webhook
 * (bookingsService.confirm → SELECT … FOR UPDATE → booked).
 *
 * It fires N concurrent, individually HMAC-signed `charge.success` webhooks at
 * POST /payments/webhook, all for the SAME single seat but each with a DISTINCT
 * payment reference (so webhook idempotency does NOT short-circuit them — they
 * genuinely race into the confirm transaction). Exactly ONE must create a
 * booking; the rest must lose the row lock and resolve as "captured but seat
 * unavailable" (logged for manual refund) — never a second booking.
 *
 * Then it re-sends the WINNING reference to prove webhook idempotency: a
 * duplicate delivery must NOT create a second booking.
 *
 * Requires the backend running (NODE_ENV=test) with the admin seed present, and
 * the same PAYSTACK_SECRET the server booted with (used to sign the webhooks):
 *   NODE_ENV=test npx tsx src/server.ts &
 *   API_BASE=http://localhost:4000 npx tsx src/tests/confirm-concurrency.test.ts
 */
import "dotenv/config";
import crypto from "node:crypto";
import argon2 from "argon2";
import { prisma } from "../infra/db/client";
import { ARGON2_OPTIONS } from "../shared/security";

const BASE          = process.env.API_BASE ?? "http://localhost:4000";
const CONCURRENCY   = 10;
const SEAT_PRICE    = 3000; // naira
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

if (!PAYSTACK_SECRET) {
  console.error("PAYSTACK_SECRET must be set (and match the running server) to sign webhooks");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Typed fetch helpers
// ---------------------------------------------------------------------------
async function request<T>(method: string, path: string, body?: unknown, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}
const post  = <T>(p: string, b: unknown, t?: string) => request<T>("POST", p, b, t);
const patch = <T>(p: string, b: unknown, t?: string) => request<T>("PATCH", p, b, t);
async function get<T>(path: string, token?: string) {
  const res = await fetch(`${BASE}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: res.status, data: (await res.json()) as T };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ ${message}`);
  }
}

/** Sign a webhook body exactly as Paystack does (HMAC-SHA512 over the raw bytes). */
function signWebhook(rawBody: string): string {
  return crypto.createHmac("sha512", PAYSTACK_SECRET!).update(rawBody).digest("hex");
}

/** POST a raw, pre-signed webhook body to the webhook endpoint. */
async function sendWebhook(rawBody: string): Promise<number> {
  const res = await fetch(`${BASE}/payments/webhook`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "x-paystack-signature": signWebhook(rawBody) },
    body:    rawBody,
  });
  return res.status;
}

function buildWebhookBody(reference: string, tripId: string, seatId: string, userId: string): string {
  return JSON.stringify({
    event: "charge.success",
    data: {
      reference,
      status:   "success",
      amount:   1 * SEAT_PRICE * 100, // one seat, in kobo — must match DB recompute
      metadata: { tripId, seatIds: [seatId], userId },
    },
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
async function adminLogin(): Promise<string> {
  const res = await post<{ token: string }>("/auth/login", { email: "admin@transhub.ng", password: "Admin1234!" });
  if (res.status !== 200) throw new Error(`Admin login failed (${res.status}) — seed the DB first`);
  return res.data.token;
}

async function createApprovedOperatorToken(adminToken: string): Promise<string> {
  const tag   = Date.now();
  const email = `confirmtest_op_${tag}@test.invalid`;
  const reg = await post<{ operator: { id: string } }>("/operators/register", {
    companyName: `ConfirmTest Bus ${tag}`, contactName: "Test Operator", email,
    phone: "07000000002", city: "Lagos", fleetSize: "5", vehicleTypes: ["Bus"],
    routes: "Lagos-Abuja", yearsInOperation: "2", cacNumber: `CAC${tag}`,
  });
  if (reg.status !== 201) throw new Error(`Operator register failed: ${JSON.stringify(reg.data)}`);

  const approve = await patch<{ operator: { id: string } }>(`/operators/${reg.data.operator.id}/approve`, {}, adminToken);
  if (approve.status !== 200) throw new Error(`Approve failed: ${JSON.stringify(approve.data)}`);

  // Temp password is email-only; set a known one directly for the test login.
  const knownPassword = "OpTest1234!";
  await prisma.user.update({ where: { email }, data: { password: await argon2.hash(knownPassword, ARGON2_OPTIONS) } });
  const login = await post<{ token: string }>("/auth/login", { email, password: knownPassword });
  if (login.status !== 200) throw new Error(`Operator login failed: ${JSON.stringify(login.data)}`);
  return login.data.token;
}

async function createPassenger(): Promise<{ token: string; userId: string }> {
  const email = `confirmtest_pass_${Date.now()}@test.invalid`;
  const password = "Test1234!";
  await post("/auth/register", { fullName: "Confirm Test Passenger", email, phone: "07099999999", password });
  const login = await post<{ token: string }>("/auth/login", { email, password });
  if (login.status !== 200) throw new Error("Passenger login failed");
  const me = await get<{ user: { id: string } }>("/auth/me", login.data.token);
  return { token: login.data.token, userId: me.data.user.id };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("=== Confirm (Webhook) Concurrency Test ===\n");

  console.log("1. Admin login...");
  const adminToken = await adminLogin();
  console.log("   ✓ admin authenticated\n");

  console.log("2. Creating approved operator + 1-seat trip...");
  const operatorToken = await createApprovedOperatorToken(adminToken);
  const departureTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const createTrip = await post<{ trip: { id: string } }>(
    "/trips",
    { from: "Lagos", to: "Abuja", departureTime, price: SEAT_PRICE, totalSeats: 1, vehicleType: "Bus" },
    operatorToken
  );
  if (createTrip.status !== 201) throw new Error(`Trip creation failed: ${JSON.stringify(createTrip.data)}`);
  const tripId = createTrip.data.trip.id;

  // The trip has exactly one seat-slot (totalSeats:1). Seatless model: the public
  // trip detail no longer exposes per-seat rows, so read the single seat's id from
  // the DB to build the webhook metadata (the webhook path bypasses payment-init).
  const seatRow = await prisma.seat.findFirst({ where: { tripId }, select: { id: true } });
  if (!seatRow) throw new Error("No seat row was created for the trip");
  const seatId = seatRow.id;
  console.log(`   ✓ trip ${tripId}`);
  console.log(`   ✓ seat ${seatId}\n`);

  console.log("3. Passenger holds the seat...");
  const passenger = await createPassenger();
  const hold = await post<{ holdId?: string }>("/bookings/hold", { tripId, quantity: 1 }, passenger.token);
  if (hold.status !== 201) throw new Error(`Hold failed: ${JSON.stringify(hold.data)}`);
  console.log("   ✓ seat held by passenger\n");

  console.log(`4. Firing ${CONCURRENCY} concurrent webhooks (same seat, DISTINCT refs)...`);
  const refs = Array.from({ length: CONCURRENCY }, (_, i) => `TH-CONFIRMTEST-${Date.now()}-${i}`);
  const bodies = new Map(refs.map((ref) => [ref, buildWebhookBody(ref, tripId, seatId, passenger.userId)]));
  const statuses = await Promise.all(refs.map((ref) => sendWebhook(bodies.get(ref)!)));

  const ok200 = statuses.filter((s) => s === 200).length;
  console.log(`   ${ok200}/${CONCURRENCY} webhooks acknowledged 200 (webhook always 200 unless bad signature)\n`);

  console.log("5. Assertions — the database is the source of truth:");
  assert(ok200 === CONCURRENCY, `All ${CONCURRENCY} webhooks acknowledged 200 (no signature/4xx errors)`);

  const bookingCount = await prisma.booking.count({ where: { tripId, status: "confirmed" } });
  assert(bookingCount === 1, `Exactly 1 confirmed booking exists for the seat (got ${bookingCount})`);

  const seat = await prisma.seat.findUnique({ where: { id: seatId } });
  assert(seat?.status === "booked", `Seat is 'booked' (got '${seat?.status}')`);

  const bookedSeatCount = await prisma.bookedSeat.count({ where: { seatId } });
  assert(bookedSeatCount === 1, `Exactly 1 booked_seats row for the seat (got ${bookedSeatCount})`);

  console.log("\n6. Idempotency — re-deliver the WINNING webhook:");
  const winner = await prisma.booking.findFirst({ where: { tripId, status: "confirmed" }, select: { paymentRef: true } });
  const winningRef = winner?.paymentRef ?? "";
  const replayStatus = await sendWebhook(bodies.get(winningRef)!);
  assert(replayStatus === 200, `Replayed webhook acknowledged 200`);
  const afterReplay = await prisma.booking.count({ where: { tripId, status: "confirmed" } });
  assert(afterReplay === 1, `Still exactly 1 booking after replay — idempotent (got ${afterReplay})`);

  await prisma.$disconnect();

  console.log();
  if (process.exitCode === 1) console.error("=== FAILED ===\n");
  else console.log("=== PASSED ===\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
