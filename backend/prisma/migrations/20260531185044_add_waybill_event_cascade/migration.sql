-- DropForeignKey
ALTER TABLE "waybill_events" DROP CONSTRAINT "waybill_events_waybillId_fkey";

-- AddForeignKey
ALTER TABLE "waybill_events" ADD CONSTRAINT "waybill_events_waybillId_fkey" FOREIGN KEY ("waybillId") REFERENCES "waybills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
