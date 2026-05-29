/**
 * Seat concurrency integration test.
 *
 * Fires 10 concurrent POST /bookings/hold requests for the SAME single seat,
 * each from a different user. Exactly ONE must succeed (201) and exactly NINE
 * must fail with 409.  This test proves the hold mechanism is race-free.
 *
 * Requires the backend running on :4000 with admin seed in the DB:
 *   npm --prefix backend run dev &  sleep 3 && npx tsx backend/src/tests/seat-concurrency.test.ts
 */
import "dotenv/config";
import argon2 from "argon2";
import { prisma } from "../infra/db/client";
import { ARGON2_OPTIONS } from "../shared/security";

const BASE        = process.env.API_BASE ?? "http://localhost:4000";
const CONCURRENCY = 10;

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

interface TripDetailResponse {
  trip: { id: string; seats: Array<{ id: string; label: string; isBooked: boolean }> };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("=== Seat Concurrency Test ===\n");

  // -------------------------------------------------------------------------
  // 1. Admin login
  // -------------------------------------------------------------------------
  console.log("1. Admin login...");
  const adminToken = await adminLogin();
  console.log("   ✓ admin authenticated\n");

  // -------------------------------------------------------------------------
  // 2. Create a self-contained operator and a trip with exactly 1 seat
  // -------------------------------------------------------------------------
  console.log("2. Creating approved operator + 1-seat trip...");
  const operatorToken = await createApprovedOperator(adminToken);

  const departureTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  const createTripRes = await post<{ trip: { id: string } }>(
    "/trips",
    {
      from:         "Lagos",
      to:           "Abuja",
      departureTime,
      price:        3000,
      totalSeats:   1,
      vehicleType:  "Bus",
    },
    operatorToken
  );

  if (createTripRes.status !== 201) {
    throw new Error(`Trip creation failed: ${JSON.stringify(createTripRes.data)}`);
  }

  const tripId     = createTripRes.data.trip.id;
  const tripDetail = await get<TripDetailResponse>(`/trips/${tripId}`);
  const seats      = tripDetail.data.trip.seats;

  if (seats.length !== 1) throw new Error(`Expected 1 seat, got ${seats.length}`);

  const seatId = seats[0].id;
  console.log(`   ✓ trip ${tripId}`);
  console.log(`   ✓ seat ${seatId}\n`);

  // -------------------------------------------------------------------------
  // 3. Create CONCURRENCY passenger tokens
  // -------------------------------------------------------------------------
  console.log(`3. Creating ${CONCURRENCY} test passengers...`);
  const tokens = await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, i) => createPassengerAndLogin(i + 1))
  );
  console.log(`   ✓ ${CONCURRENCY} passengers ready\n`);

  // -------------------------------------------------------------------------
  // 4. Fire all hold requests concurrently — THE core test
  // -------------------------------------------------------------------------
  console.log(`4. Firing ${CONCURRENCY} concurrent hold requests for the same seat...`);

  const results = await Promise.all(
    tokens.map((token) =>
      post<{ holdId?: string; message?: string }>(
        "/bookings/hold",
        { tripId, seatIds: [seatId] },
        token
      )
    )
  );

  const successes = results.filter((r) => r.status === 201);
  const conflicts = results.filter((r) => r.status === 409);
  const others    = results.filter((r) => r.status !== 201 && r.status !== 409);

  console.log("\n   Response breakdown:");
  console.log(`   201 (held):      ${successes.length}`);
  console.log(`   409 (conflict):  ${conflicts.length}`);
  if (others.length > 0) {
    console.log(`   Other (bad):     ${others.length}`);
    others.forEach((r) => console.log("      status", r.status, JSON.stringify(r.data)));
  }
  console.log();

  // -------------------------------------------------------------------------
  // 5. Assertions
  // -------------------------------------------------------------------------
  console.log("5. Assertions:");
  assert(successes.length === 1, `Exactly 1 hold succeeded (got ${successes.length})`);
  assert(conflicts.length === 9, `Exactly 9 conflicts (got ${conflicts.length})`);
  assert(others.length   === 0, `No unexpected status codes`);

  // Confirm the seat is now marked unavailable (isBooked=true means held or booked)
  const final      = await get<TripDetailResponse>(`/trips/${tripId}`);
  const finalSeat  = final.data.trip.seats.find((s) => s.id === seatId);
  assert(finalSeat?.isBooked === true, `Seat is now unavailable (isBooked=true) in the database`);

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
