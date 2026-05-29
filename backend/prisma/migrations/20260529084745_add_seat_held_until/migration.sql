-- AlterTable
ALTER TABLE "seats" ADD COLUMN     "heldUntil" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "seats_status_heldUntil_idx" ON "seats"("status", "heldUntil");
