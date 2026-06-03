import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    if (currentUser.role !== "senior-officer") return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });

    const requestId = Number(params.id);
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ status: 400, error: "Invalid request id" }, { status: 400 });
    }

    const body = await req.json();
    const vehicleId = Number(body.vehicleId);
    const primaryDriverId = body.primaryDriverId != null ? Number(body.primaryDriverId) : null;
    const secondaryDriverId = body.secondaryDriverId != null ? Number(body.secondaryDriverId) : null;

    if (!Number.isFinite(vehicleId) || !Number.isFinite(primaryDriverId as number)) {
      return NextResponse.json({ status: 400, error: "vehicleId and primaryDriverId are required" }, { status: 400 });
    }

    const request = await prisma.vehicleRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: true,
      },
    });

    if (!request) return NextResponse.json({ status: 404, error: "Request not found" }, { status: 404 });

    // Enforce workflow permissions
    if (request.approval_status !== "approved_for_allocation") {
      return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });
    }
    if (request.allocation_status !== "pending") {
      return NextResponse.json({ status: 409, error: "Request is not pending allocation" }, { status: 409 });
    }

    // Enforce availability
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.availability_status !== "Available") {
      return NextResponse.json({ status: 400, error: "Vehicle is not available" }, { status: 400 });
    }

    const primaryDriver = await prisma.driver.findUnique({ where: { id: primaryDriverId as number } });
    if (!primaryDriver || primaryDriver.availability_status !== "available" && primaryDriver.availability_status !== "Available") {
      return NextResponse.json({ status: 400, error: "Primary driver is not available" }, { status: 400 });
    }

    // Basic conflict check: ensure driver not already allocated in an allocated request
    const conflict = await prisma.vehicleRequest.findFirst({
      where: {
        allocation_status: "allocated",
        driver_id: primaryDriverId as number,
        approval_status: "approved_for_allocation",
      },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ status: 409, error: "Primary driver already allocated" }, { status: 409 });
    }

    // Schema limitation: only driver_id single field. For long trip we still validate distinct drivers,
    // but we store primary driver in driver_id.
    if (request.vehicle_nature === "long") {
      if (!secondaryDriverId || !Number.isFinite(secondaryDriverId)) {
        return NextResponse.json({ status: 400, error: "secondaryDriverId is required for long trips" }, { status: 400 });
      }
      if (secondaryDriverId === primaryDriverId) {
        return NextResponse.json({ status: 400, error: "Primary and secondary drivers must be different" }, { status: 400 });
      }
      const secondaryDriver = await prisma.driver.findUnique({ where: { id: secondaryDriverId } });
      if (!secondaryDriver || (secondaryDriver.availability_status !== "available" && secondaryDriver.availability_status !== "Available")) {
        return NextResponse.json({ status: 400, error: "Secondary driver is not available" }, { status: 400 });
      }
      const conflict2 = await prisma.vehicleRequest.findFirst({
        where: {
          allocation_status: "allocated",
          driver_id: secondaryDriverId,
          approval_status: "approved_for_allocation",
        },
        select: { id: true },
      });
      if (conflict2) return NextResponse.json({ status: 409, error: "Secondary driver already allocated" }, { status: 409 });
    }

    const updated = await prisma.vehicleRequest.update({
      where: { id: requestId },
      data: {
        allocation_status: "allocated",
        vehicle_id: vehicleId,
        driver_id: primaryDriverId as number,
      },
    });

    return NextResponse.json({ status: 200, data: updated });
  } catch (err) {
    console.error("Allocate error:", err);
    return NextResponse.json({ status: 500, error: "Failed to allocate" }, { status: 500 });
  }
}

