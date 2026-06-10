/**
 * QA fixture (NOT app code): create one APPROVED operator + its loginable
 * operator-User with a KNOWN password, so the end-to-end test can sign in as an
 * operator. The production approval flow emails a random temp password, which a
 * headless test cannot read — this simulates "operator received and set it".
 * Idempotent. Run: NODE_ENV=development tsx scripts/qa-bootstrap-operator.ts
 */
import argon2 from "argon2";
import { prisma } from "../src/infra/db/client";
import { ARGON2_OPTIONS } from "../src/shared/security";

const EMAIL = "operator@test.ng";
const PASSWORD = "Operator1234!";

async function main() {
  const operator = await prisma.operator.upsert({
    where: { email: EMAIL },
    update: { status: "approved", reviewedAt: new Date() },
    create: {
      companyName: "TestLine Express",
      contactName: "Test Operator",
      email: EMAIL,
      phone: "08055551111",
      city: "Lagos",
      fleetSize: "11-50",
      vehicleTypes: ["Bus", "Luxury Bus"],
      routes: "Lagos to Abuja, Lagos to Ibadan",
      yearsInOperation: "5",
      cacNumber: "RC-123456",
      status: "approved",
      reviewedAt: new Date(),
    },
  });

  const passwordHash = await argon2.hash(PASSWORD, ARGON2_OPTIONS);
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { password: passwordHash, role: "operator", operatorId: operator.id },
    create: {
      email: EMAIL,
      password: passwordHash,
      fullName: "Test Operator",
      phone: "08055551111",
      role: "operator",
      operatorId: operator.id,
    },
  });

  console.log(JSON.stringify({ operatorId: operator.id, userId: user.id, email: EMAIL, password: PASSWORD, status: operator.status }));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
