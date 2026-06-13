-- Migration: add trip status fields to VehicleRequest
ALTER TABLE "vehicle_request"
ADD COLUMN "trip_status" TEXT,
ADD COLUMN "trip_status_updated_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
ADD COLUMN "trip_status_note" TEXT;

