/*
  Warnings:

  - You are about to drop the column `password` on the `admin` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `user` table. All the data in the column will be lost.
  - Made the column `supabase_id` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "admin" DROP COLUMN "password";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "password",
ALTER COLUMN "supabase_id" SET NOT NULL;
