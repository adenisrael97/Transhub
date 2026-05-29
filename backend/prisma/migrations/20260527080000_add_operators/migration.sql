-- CreateEnum
CREATE TYPE "OperatorStatus" AS ENUM ('pending', 'approved', 'declined');

-- CreateTable
CREATE TABLE "operators" (
    "id"               TEXT NOT NULL,
    "companyName"      TEXT NOT NULL,
    "contactName"      TEXT NOT NULL,
    "email"            TEXT NOT NULL,
    "phone"            TEXT NOT NULL,
    "city"             TEXT NOT NULL,
    "fleetSize"        TEXT NOT NULL,
    "vehicleTypes"     TEXT[],
    "routes"           TEXT NOT NULL,
    "yearsInOperation" TEXT NOT NULL,
    "cacNumber"        TEXT NOT NULL,
    "additionalInfo"   TEXT,
    "status"           "OperatorStatus" NOT NULL DEFAULT 'pending',
    "appliedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt"       TIMESTAMP(3),

    CONSTRAINT "operators_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add operatorId FK to users
ALTER TABLE "users" ADD COLUMN "operatorId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "operators_email_key" ON "operators"("email");

-- CreateIndex: enforces the 1-to-1 User ↔ Operator relationship
CREATE UNIQUE INDEX "users_operatorId_key" ON "users"("operatorId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_operatorId_fkey"
    FOREIGN KEY ("operatorId") REFERENCES "operators"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
