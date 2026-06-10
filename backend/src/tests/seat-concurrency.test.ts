/**
 * Capacity (oversell) concurrency integration test.
 *
 * Seatless model: a passenger books a QUANTITY of seats, not specific labels, and
 * the server auto-claims free slots with SELECT … FOR UPDATE SKIP LOCKED. The thing
 * that must never happen is OVERSELL: more seats held/booked than the trip's capacity.
 *
 * Phase 1 — fire N+overflow concurrent `quantity:1` holds at a trip with exactly N
 *   seats, each from a different user. Exactly N must succeed (201), the rest 409,
 *   and availableSeats must end at 0.
 * Phase 2 — multi-seat holds (`quantity:2`) against a fresh N-seat trip prove there
 *   is no PARTIAL oversell: total seats held never exceeds capacity.
 *
 * Requires the backend running on :4000 with admin seed in the DB:
 *   npm --prefix backend run dev &  sleep 3 && npm --prefix backend run test:concurrency
 */
import "dotenv/config";
import argon2 from "argon2";
import { prisma } from "../infra/db/client";
import { ARGON2_OPTIONS } from "../shared/security";

const BASE     = process.env.API_BASE ?? "http://localhost:4000";
const CAPACITY = 5;   // seats per trip
const OVERFLOW = 15;  // extra passengers beyond capacity (Phase 1 fires CAPACITY+OVERFLOW)

// ---------------------------------------------------------------------------
// Typed fetch helpers
// ---------------------------------------------------------------------------
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; data: T }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as T;
  return { status: res.status, data };
}

async function post<T>(path: string, body: unknown, token?: string) {
  return request<T>("POST", path, body, token);
}

async function patch<T>(path: string, body: unknown, token?: string) {
  return request<T>("PATCH", path, body, token);
}

async function get<T>(path: string, token?: string): Promise<{ status: number; data: T }> {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = (await res.json()) as T;
  return { status: res.status, data };
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ ${message}`);
  }
}

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------
async function adminLogin(): Promise<string> {
  const res = await post<{ token: string }>("/auth/login", {
    email:    "admin@transhub.ng",
    password: "Admin1234!",
  });
  if (res.status !== 200) throw new Error(`Admin login failed (${res.status}) — seed the DB first`);
  return res.data.token;
}

interface OperatorRegisterResult { operator: { id: string } }

async function createApprovedOperator(adminToken: string): Promise<string> {
  const tag   = Date.now();
  const email = `conctest_op_${tag}@test.invalid`;

  // Register application
  const reg = await post<OperatorRegisterResult>("/operators/register", {
    companyName:      `ConcTest Bus ${tag}`,
    contactName:      "Test Operator",
    email,
    phone:            "07000000001",
    city:             "Lagos",
    fleetSize:        "5",
    vehicleTypes:     ["Bus"],
    routes:           "Lagos-Abuja",
    yearsInOperation: "2",
    cacNumber:        `CAC${tag}`,
  });
  if (reg.status !== 201) throw new Error(`Operator register failed: ${JSON.stringify(reg.data)}`);

  const operatorId = reg.data.operator.id;

  // Admin approves (creates the operator User account)
  const approve = await patch<{ operator: { id: string } }>(
    `/operators/${operatorId}/approve`,
    {},
    adminToken
  );
  if (approve.status !== 200) throw new Error(`Approve failed: ${JSON.stringify(approve.data)}`);

  // The temp password is delivered only by email, never in the API response, so
  // for the test we set a known password directly in the DB, then log in with it.
  const knownPassword = "OpTest1234!";
  await prisma.user.update({
    where: { email },
    data:  { password: await argon2.hash(knownPassword, ARGON2_OPTIONS) },
  });

  // Operator login
  const login = await post<{ token: string }>("/auth/login", { email, password: knownPassword });
  if (login.status !== 200) throw new Error(`Operator login failed: ${JSON.stringify(login.data)}`);

  return login.data.token;
}

async function createPassengerAndLogin(n: number): Promise<string> {
  const email    = `conctest_pass_${n}_${Date.now()}@test.invalid`;
  const password = "Test1234!";

  await post("/auth/register", {
    fullName: `Test Passenger ${n}`,
    email,
    phone:    `070${String(n + Date.now() % 100000000).padStart(8, "0")}`,
    password,
  });

  const login = await post<{ token: string }>("/auth/login", { email, password });
  if (login.status !== 200) throw new Error(`Passenger ${n} login failed`);
  return login.data.token;
}

async function createTrip(operatorToken: string, totalSeats: number): Promise<string> {
  const departureTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  const res = await post<{ trip: { id: string } }>(
    "/trips",
    { from: "Lagos", to: "Abuja", departureTime, price: 3000, totalSeats, vehicleType: "Bus" },
    operatorToken
  );
  if (res.status !== 201) throw new Error(`Trip creation failed: ${JSON.stringify(res.data)}`);
  return res.data.trip.id;
}

interface TripResponse {
  trip: { id: string; availableSeats: number };
}

async function availableSeats(tripId: string): Promise<number> {
  const res = await get<TripResponse>(`/trips/${tripId}`);
  return res.data.trip.availableSeats;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("=== Capacity (Oversell) Concurrency Test ===\n");

  console.log("1. Admin login...");
  const adminToken = await adminLogin();
  console.log("   ✓ admin authenticated\n");

  console.log(`2. Creating approved operator + trip with ${CAPACITY} seats...`);
  const operatorToken = await createApprovedOperator(adminToken);
  const tripId        = await createTrip(operatorToken, CAPACITY);
  console.log(`   ✓ trip ${tripId} (capacity ${CAPACITY})\n`);

  // -------------------------------------------------------------------------
  // Phase 1 — CAPACITY+OVERFLOW concurrent single-seat holds; exactly CAPACITY win
  // -------------------------------------------------------------------------
  const total = CAPACITY + OVERFLOW;
  console.log(`3. Creating ${total} test passengers...`);
  const tokens = await Promise.all(
    Array.from({ length: total }, (_, i) => createPassengerAndLogin(i + 1))
  );
  console.log(`   ✓ ${total} passengers ready\n`);

  console.log(`4. Firing ${total} concurrent quantity:1 holds at a ${CAPACITY}-seat trip...`);
  const results = await Promise.all(
    tokens.map((token) =>
      post<{ holdId?: string; message?: string }>("/bookings/hold", { tripId, quantity: 1 }, token)
    )
  );

  const successes = results.filter((r) => r.status === 201);
  const conflicts = results.filter((r) => r.status === 409);
  const others    = results.filter((r) => r.status !== 201 && r.status !== 409);

  console.log("\n   Response breakdown:");
  console.log(`   201 (held):      ${successes.length}`);
  console.log(`   409 (full):      ${conflicts.length}`);
  if (others.length > 0) {
    console.log(`   Other (bad):     ${others.length}`);
    others.forEach((r) => console.log("      status", r.status, JSON.stringify(r.data)));
  }
  console.log();

  console.log("5. Assertions:");
  assert(successes.length === CAPACITY, `Exactly ${CAPACITY} holds succeeded (got ${successes.length})`);
  assert(conflicts.length === OVERFLOW, `Exactly ${OVERFLOW} conflicts (got ${conflicts.length})`);
  assert(others.length    === 0,        `No unexpected status codes`);
  assert((await availableSeats(tripId)) === 0, `Trip is sold out (availableSeats=0)`);

  // -------------------------------------------------------------------------
  // Phase 2 — multi-seat holds must not partially oversell
  // -------------------------------------------------------------------------
  console.log(`\n6. Multi-seat: ${CAPACITY}-seat trip, ${CAPACITY} concurrent quantity:2 holds...`);
  const tripId2 = await createTrip(operatorToken, CAPACITY);
  const tokens2 = await Promise.all(
    Array.from({ length: CAPACITY }, (_, i) => createPassengerAndLogin(100 + i))
  );
  const results2 = await Promise.all(
    tokens2.map((token) =>
      post<{ holdId?: string }>("/bookings/hold", { tripId: tripId2, quantity: 2 }, token)
    )
  );
  const wins2  = results2.filter((r) => r.status === 201).length;
  const seatsHeld = CAPACITY - (await availableSeats(tripId2));

  console.log(`   ${wins2} holds of 2 seats succeeded; ${seatsHeld} seats now held`);
  // With capacity 5 and 2 seats per hold, at most 2 holds can fully succeed (4 seats);
  // a partial claim (1 of 2 left) must roll back, never leaving 5+ held.
  assert(wins2 === 2,        `Exactly 2 multi-seat holds won (got ${wins2})`);
  assert(seatsHeld === 4,    `Exactly 4 seats held, 1 unclaimable remainder (got ${seatsHeld})`);
  assert(seatsHeld <= CAPACITY, `Never oversold capacity (${seatsHeld} <= ${CAPACITY})`);

  // Release the Prisma connection so the process can exit on success.
  await prisma.$disconnect();

  console.log();
  if (process.exitCode === 1) {
    console.error("=== FAILED ===\n");
  } else {
    console.log("=== PASSED ===\n");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
