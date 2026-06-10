-- Waybill Hub-Flow migration.
-- Adds transport-company assignment, admin quote, and per-stage timestamps
-- so the full hub-based lifecycle can be tracked:
--   pending → quote_sent → paid → dropped_off → picked_up
--   → in_transit → arrived_at_hub → completed

-- Make fee nullable (0 until admin quotes) and add new columns.
ALTER TABLE "waybills"
  ALTER COLUMN "fee" SET DEFAULT 0,
  ADD COLUMN "assignedOperatorId" TEXT,
  ADD COLUMN "quoteNote"          TEXT,
  ADD COLUMN "quoteSentAt"        TIMESTAMP(3),
  ADD COLUMN "droppedOffAt"       TIMESTAMP(3),
  ADD COLUMN "pickedUpAt"         TIMESTAMP(3),
  ADD COLUMN "inTransitAt"        TIMESTAMP(3),
  ADD COLUMN "arrivedAt"          TIMESTAMP(3),
  ADD COLUMN "completedAt"        TIMESTAMP(3);

-- FK: waybill → operator (the transport company assigned by admin)
ALTER TABLE "waybills"
  ADD CONSTRAINT "waybills_assignedOperatorId_fkey"
  FOREIGN KEY ("assignedOperatorId")
  REFERENCES "operators"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for operator-scoped queries
CREATE INDEX "waybills_assignedOperatorId_idx" ON "waybills"("assignedOperatorId");
