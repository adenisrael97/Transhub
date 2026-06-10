-- CreateTable
CREATE TABLE "charters" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "returnAt" TIMESTAMP(3),
    "passengerCount" INTEGER NOT NULL,
    "notes" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "quotedPrice" DECIMAL(12,2),
    "paymentRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "charters_paymentRef_key" ON "charters"("paymentRef");

-- CreateIndex
CREATE INDEX "charters_passengerId_idx" ON "charters"("passengerId");

-- CreateIndex
CREATE INDEX "charters_status_idx" ON "charters"("status");

-- AddForeignKey
ALTER TABLE "charters" ADD CONSTRAINT "charters_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
