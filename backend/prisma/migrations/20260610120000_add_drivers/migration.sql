-- Add the Driver module schema that was added to schema.prisma (Driver model +
-- Trip.driverId FK) but never captured in a migration. CI builds the DB from
-- migrations only, so without this the `drivers` table and `trips.driverId`
-- column are absent and every trip INSERT (which sets driverId) fails. The
-- legacy free-text `trips.driverNumber` column is replaced by the FK.
--
-- All statements are idempotent (IF NOT EXISTS / IF EXISTS + guarded FK DO-blocks)
-- so the migration is safe to apply over a developer's local DB that already moved
-- to this shape via `prisma db push`, mirroring the add_charter_quote_fields fix.

-- ---------------------------------------------------------------------------
-- 1. drivers table (operator-owned; drivers authenticate with phone + password)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "drivers" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "licenseNo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "drivers_phone_key"       ON "drivers"("phone");
CREATE INDEX        IF NOT EXISTS "drivers_operatorId_idx"  ON "drivers"("operatorId");
CREATE INDEX        IF NOT EXISTS "drivers_phone_idx"       ON "drivers"("phone");

-- ---------------------------------------------------------------------------
-- 2. trips: replace legacy free-text driverNumber with the driverId FK
-- ---------------------------------------------------------------------------
ALTER TABLE "trips" ADD COLUMN IF NOT EXISTS "driverId" TEXT;
ALTER TABLE "trips" DROP COLUMN IF EXISTS "driverNumber";

-- ---------------------------------------------------------------------------
-- 3. Foreign keys (Postgres has no ADD CONSTRAINT IF NOT EXISTS — guard by name)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drivers_operatorId_fkey') THEN
    ALTER TABLE "drivers"
      ADD CONSTRAINT "drivers_operatorId_fkey"
      FOREIGN KEY ("operatorId") REFERENCES "operators"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'trips_driverId_fkey') THEN
    ALTER TABLE "trips"
      ADD CONSTRAINT "trips_driverId_fkey"
      FOREIGN KEY ("driverId") REFERENCES "drivers"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
