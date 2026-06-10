-- Add charter quote + payment + fulfillment columns that were added to
-- schema.prisma but never captured in a migration file.
-- All columns are nullable so no default is needed and existing rows are unaffected.
-- IF NOT EXISTS guards make the migration safe to re-run on a DB that already
-- has these columns (e.g. a developer's local environment).

ALTER TABLE "charters"
  ADD COLUMN IF NOT EXISTS "referenceNo"      TEXT,
  ADD COLUMN IF NOT EXISTS "operatorName"     TEXT,
  ADD COLUMN IF NOT EXISTS "operatorCost"     DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "serviceFee"       DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "adminNotes"       TEXT,
  ADD COLUMN IF NOT EXISTS "paidAmount"       DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "assignedOperator" TEXT,
  ADD COLUMN IF NOT EXISTS "pickupInfo"       TEXT,
  ADD COLUMN IF NOT EXISTS "travelInfo"       TEXT,
  ADD COLUMN IF NOT EXISTS "completedAt"      TIMESTAMP(3);

-- Unique constraint on referenceNo (mirrors @unique in schema.prisma).
-- IF NOT EXISTS prevents a duplicate-index error on envs that already have it.
CREATE UNIQUE INDEX IF NOT EXISTS "charters_referenceNo_key" ON "charters"("referenceNo");

-- Composite index for admin list (filter by status, order by recency).
-- Also guards against re-running on envs that already have this index.
CREATE INDEX IF NOT EXISTS "charters_status_createdAt_idx" ON "charters"("status", "createdAt" DESC);
