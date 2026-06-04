-- AlterTable
ALTER TABLE "approval_request" ADD COLUMN     "approved_by" INTEGER,
ADD COLUMN     "rejection_attachment_url" TEXT;

-- AlterTable
ALTER TABLE "vehicle_request" ADD COLUMN     "approver_type" TEXT NOT NULL DEFAULT 'DEAN',
ADD COLUMN     "rejection_attachment_url" TEXT;
