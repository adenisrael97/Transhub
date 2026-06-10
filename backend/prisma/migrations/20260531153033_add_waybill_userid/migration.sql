/*
  Warnings:

  - Added the required column `userId` to the `waybills` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "waybills" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "waybills" ADD CONSTRAINT "waybills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
