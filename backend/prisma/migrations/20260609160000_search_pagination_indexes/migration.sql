-- Search / pagination / filtering optimization.
--
-- Two kinds of index:
--  1. B-tree composites for the new filter+sort access paths (Prisma-managed —
--     these mirror the @@index declarations added to schema.prisma).
--  2. GIN trigram indexes for the case-insensitive `ILIKE '%term%'` searches the
--     admin/operator/customer list endpoints run. A leading-wildcard ILIKE cannot
--     use a b-tree, so without pg_trgm these would seq-scan the whole table on
--     every keystroke. pg_trgm is NOT expressible in the Prisma schema, so it
--     lives here as raw SQL (the canonical Prisma workaround for trigram indexes).
--
-- All statements are idempotent (IF NOT EXISTS) so the migration is safe to
-- re-run and to apply over an environment that already has some indexes.

-- ---------------------------------------------------------------------------
-- 1. B-tree composites (filter + order-by access paths)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "users_role_createdAt_idx"          ON "users"     ("role", "createdAt");
CREATE INDEX IF NOT EXISTS "operators_status_appliedAt_idx"    ON "operators" ("status", "appliedAt");
CREATE INDEX IF NOT EXISTS "waybills_status_createdAt_idx"     ON "waybills"  ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "waybills_userId_createdAt_idx"     ON "waybills"  ("userId", "createdAt");

-- ---------------------------------------------------------------------------
-- 2. Trigram indexes for ILIKE search (pg_trgm)
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Customers/Users directory search (name / email / phone) — largest table.
CREATE INDEX IF NOT EXISTS "users_fullName_trgm_idx" ON "users" USING gin ("fullName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "users_email_trgm_idx"    ON "users" USING gin ("email"    gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "users_phone_trgm_idx"    ON "users" USING gin ("phone"    gin_trgm_ops);

-- Operator applications search (company / contact / city).
CREATE INDEX IF NOT EXISTS "operators_companyName_trgm_idx" ON "operators" USING gin ("companyName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "operators_contactName_trgm_idx" ON "operators" USING gin ("contactName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "operators_city_trgm_idx"        ON "operators" USING gin ("city"        gin_trgm_ops);

-- Bookings search by payment reference (admin + transactions feed).
CREATE INDEX IF NOT EXISTS "bookings_paymentRef_trgm_idx" ON "bookings" USING gin ("paymentRef" gin_trgm_ops);

-- Charter search by reference number.
CREATE INDEX IF NOT EXISTS "charters_referenceNo_trgm_idx" ON "charters" USING gin ("referenceNo" gin_trgm_ops);

-- Waybill search (waybill no / sender / recipient).
CREATE INDEX IF NOT EXISTS "waybills_waybillNo_trgm_idx"     ON "waybills" USING gin ("waybillNo"     gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "waybills_senderName_trgm_idx"    ON "waybills" USING gin ("senderName"    gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "waybills_recipientName_trgm_idx" ON "waybills" USING gin ("recipientName" gin_trgm_ops);

-- Trip route search (admin booking list joins/filters on trip from/to via ILIKE).
CREATE INDEX IF NOT EXISTS "trips_from_trgm_idx" ON "trips" USING gin ("from" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "trips_to_trgm_idx"   ON "trips" USING gin ("to"   gin_trgm_ops);
