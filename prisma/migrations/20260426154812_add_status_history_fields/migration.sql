/*
  Warnings:

  - You are about to drop the column `fromStatus` on the `application_status_history` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `application_status_history` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `application_status_history` table. All the data in the column will be lost.
  - You are about to drop the column `toStatus` on the `application_status_history` table. All the data in the column will be lost.
  - Added the required column `newStatus` to the `application_status_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "application_status_history" DROP COLUMN "fromStatus",
DROP COLUMN "note",
DROP COLUMN "source",
DROP COLUMN "toStatus",
ADD COLUMN     "newStatus" "ApplicationStatus" NOT NULL,
ADD COLUMN     "previousStatus" "ApplicationStatus",
ADD COLUMN     "reason" TEXT;
