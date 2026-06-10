/**
 * Seed script — idempotent. Creates the platform admin account used by manual
 * QA and by the seat-concurrency integration test (which logs in as admin to
 * bootstrap an operator + trip).
 *
 * Run: `npx prisma db seed` (wired via the "prisma.seed" key in package.json).
 *
 * Credentials are intentionally fixed and well-known — this account is for
 * non-production environments only. Do NOT run this against production.
 */
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { ARGON2_OPTIONS } from "../src/shared/security";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@transhub.ng";
const ADMIN_PASSWORD = "Admin1234!";

async function main(): Promise<void> {
  // Hard stop in production: these credentials are fixed and public, so seeding
  // them on a live system would plant a known-password admin backdoor. The
  // comment alone isn't enough — enforce it.
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Refusing to run the dev seed in production (would create a known-password admin).");
    process.exit(1);
  }

  const password = await argon2.hash(ADMIN_PASSWORD, ARGON2_OPTIONS);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {}, // leave an existing admin untouched (don't reset its password)
    create: {
      email:    ADMIN_EMAIL,
      password,
      fullName: "Platform Admin",
      phone:    "08000000000",
      role:     "admin",
    },
  });

  console.log(`✅ Seed complete — admin: ${ADMIN_EMAIL}`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
