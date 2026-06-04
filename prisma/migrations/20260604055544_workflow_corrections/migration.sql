/*
  Warnings:

  - You are about to drop the column `approver_type` on the `vehicle_request` table. All the data in the column will be lost.
  - You are about to drop the column `forwarded_to_general` on the `vehicle_request` table. All the data in the column will be lost.
  - You are about to drop the column `rejection_attachment_url` on the `vehicle_request` table. All the data in the column will be lost.
  - You are about to drop the `approval_meta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `approval_request` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `path_type` to the `vehicle_request` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "approval_meta" DROP CONSTRAINT "approval_meta_vehicle_request_id_fkey";

-- AlterTable
ALTER TABLE "vehicle_request" DROP COLUMN "approver_type",
DROP COLUMN "forwarded_to_general",
DROP COLUMN "rejection_attachment_url",
ADD COLUMN     "path_type" TEXT NOT NULL,
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejected_by" INTEGER,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "request_letter_path" TEXT,
ALTER COLUMN "approval_status" DROP DEFAULT;

-- DropTable
DROP TABLE "approval_meta";

-- DropTable
DROP TABLE "approval_request";

-- DropEnum
DROP TYPE "ApproverType";

-- DropEnum
DROP TYPE "RequestStatus";

-- CreateTable
CREATE TABLE "approval_history" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "admin_id" INTEGER,
    "action" TEXT NOT NULL,
    "from_status" TEXT NOT NULL,
    "to_status" TEXT NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vehicle_request" ADD CONSTRAINT "vehicle_request_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "vehicle_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_history" ADD CONSTRAINT "approval_history_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
