/*
  Warnings:

  - You are about to drop the column `faculty_name` on the `department` table. All the data in the column will be lost.
  - You are about to drop the `system_admin` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[supabase_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `faculty_id` to the `department` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "system_admin" DROP CONSTRAINT "system_admin_department_id_fkey";

-- DropForeignKey
ALTER TABLE "vehicle_request" DROP CONSTRAINT "vehicle_request_approved_by_fkey";

-- AlterTable
ALTER TABLE "department" DROP COLUMN "faculty_name",
ADD COLUMN     "faculty_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "supabase_id" TEXT;

-- AlterTable
ALTER TABLE "vehicle_request" ALTER COLUMN "approval_status" SET DEFAULT 'pending',
ALTER COLUMN "allocation_status" SET DEFAULT 'pending';

-- DropTable
DROP TABLE "system_admin";

-- CreateTable
CREATE TABLE "faculty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin" (
    "id" SERIAL NOT NULL,
    "supabase_id" TEXT,
    "full_name" TEXT NOT NULL,
    "admin_role" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "department_id" INTEGER,
    "faculty_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" SERIAL NOT NULL,
    "sender_user_id" INTEGER,
    "receiver_user_id" INTEGER,
    "sender_admin_id" INTEGER,
    "receiver_admin_id" INTEGER,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faculty_name_key" ON "faculty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "admin_supabase_id_key" ON "admin"("supabase_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_email_key" ON "admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_supabase_id_key" ON "user"("supabase_id");

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "admin_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "admin_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_request" ADD CONSTRAINT "vehicle_request_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_receiver_admin_id_fkey" FOREIGN KEY ("receiver_admin_id") REFERENCES "admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_receiver_user_id_fkey" FOREIGN KEY ("receiver_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_sender_admin_id_fkey" FOREIGN KEY ("sender_admin_id") REFERENCES "admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
