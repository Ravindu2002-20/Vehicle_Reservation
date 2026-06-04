-- CreateTable
CREATE TABLE "department" (
    "id" SERIAL NOT NULL,
    "department_name" TEXT NOT NULL,
    "faculty_name" TEXT NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "user_type" TEXT NOT NULL,
    "registration_or_employee_no" TEXT NOT NULL,
    "designation" TEXT,
    "telephone" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "department_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_admin" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "admin_role" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "department_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "telephone" TEXT,
    "license_number" TEXT NOT NULL,
    "availability_status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" SERIAL NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "availability_status" TEXT NOT NULL,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_request" (
    "id" SERIAL NOT NULL,
    "requester_id" INTEGER NOT NULL,
    "approved_by" INTEGER,
    "vehicle_id" INTEGER,
    "driver_id" INTEGER,
    "request_type" TEXT NOT NULL,
    "vehicle_nature" TEXT NOT NULL,
    "number_of_persons" INTEGER NOT NULL,
    "travel_date_from" TIMESTAMP(3) NOT NULL,
    "travel_date_to" TIMESTAMP(3) NOT NULL,
    "required_time_from" TEXT NOT NULL,
    "required_time_to" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "places_to_visit" TEXT,
    "travel_route" TEXT,
    "distance_type" TEXT NOT NULL,
    "special_notes" TEXT,
    "approval_status" TEXT NOT NULL,
    "allocation_status" TEXT NOT NULL,
    "admin_remarks" TEXT,
    "trip_remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_registration_or_employee_no_key" ON "user"("registration_or_employee_no");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "system_admin_email_key" ON "system_admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "driver_license_number_key" ON "driver"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_vehicle_number_key" ON "vehicle"("vehicle_number");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_admin" ADD CONSTRAINT "system_admin_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_request" ADD CONSTRAINT "vehicle_request_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_request" ADD CONSTRAINT "vehicle_request_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "system_admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_request" ADD CONSTRAINT "vehicle_request_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_request" ADD CONSTRAINT "vehicle_request_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
