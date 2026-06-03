-- CreateEnum
CREATE TYPE "ApproverType" AS ENUM ('DEAN', 'UDR');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED_BY_DEAN', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "approval_meta" (
    "id" SERIAL NOT NULL,
    "vehicle_request_id" INTEGER NOT NULL,
    "approver_type" "ApproverType" NOT NULL DEFAULT 'UDR',
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "current_approver" TEXT,
    "rejection_reason" TEXT,
    "history" JSONB,

    CONSTRAINT "approval_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_request" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vehicleDetails" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purpose" TEXT NOT NULL,
    "approverType" "ApproverType" NOT NULL DEFAULT 'UDR',
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "currentApprover" TEXT,
    "rejectionReason" TEXT,
    "history" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "approval_meta_vehicle_request_id_key" ON "approval_meta"("vehicle_request_id");

-- AddForeignKey
ALTER TABLE "approval_meta" ADD CONSTRAINT "approval_meta_vehicle_request_id_fkey" FOREIGN KEY ("vehicle_request_id") REFERENCES "vehicle_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
