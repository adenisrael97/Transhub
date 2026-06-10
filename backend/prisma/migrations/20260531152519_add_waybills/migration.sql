-- CreateTable
CREATE TABLE "waybills" (
    "id" TEXT NOT NULL,
    "waybillNo" TEXT NOT NULL,
    "tripId" TEXT,
    "senderName" TEXT NOT NULL,
    "senderPhone" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weightKg" DECIMAL(8,2),
    "declaredValue" DECIMAL(12,2),
    "fee" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waybills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waybill_events" (
    "id" TEXT NOT NULL,
    "waybillId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waybill_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "waybills_waybillNo_key" ON "waybills"("waybillNo");

-- CreateIndex
CREATE INDEX "waybills_waybillNo_idx" ON "waybills"("waybillNo");

-- CreateIndex
CREATE INDEX "waybills_status_idx" ON "waybills"("status");

-- CreateIndex
CREATE INDEX "waybill_events_waybillId_idx" ON "waybill_events"("waybillId");

-- AddForeignKey
ALTER TABLE "waybills" ADD CONSTRAINT "waybills_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waybill_events" ADD CONSTRAINT "waybill_events_waybillId_fkey" FOREIGN KEY ("waybillId") REFERENCES "waybills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
