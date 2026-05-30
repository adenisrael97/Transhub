-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "amenities" TEXT[],
ADD COLUMN     "parkName" TEXT;

-- CreateTable
CREATE TABLE "passenger_info" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "nextOfKinName" TEXT NOT NULL,
    "nextOfKinPhone" TEXT NOT NULL,
    "specialNeeds" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passenger_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "passenger_info_bookingId_idx" ON "passenger_info"("bookingId");

-- AddForeignKey
ALTER TABLE "passenger_info" ADD CONSTRAINT "passenger_info_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
