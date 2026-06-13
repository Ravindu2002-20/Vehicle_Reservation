import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (currentUser.role !== "senior-officer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const requestId = Number(params.id);
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }

    const body = await req.json();
    const vehicleId = Number(body.vehicleId);
    const primaryDriverId = body.primaryDriverId != null ? Number(body.primaryDriverId) : null;
    const secondaryDriverId = body.secondaryDriverId != null ? Number(body.secondaryDriverId) : null;

    if (!Number.isFinite(vehicleId) || !Number.isFinite(primaryDriverId as number)) {
      return NextResponse.json({ error: "vehicleId and primaryDriverId are required" }, { status: 400 });
    }

    const request = await prisma.vehicleRequest.findUnique({
      where: { id: requestId },
      include: { requester: true },
    });

    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    if (request.approval_status !== "approved_for_allocation") {
      return NextResponse.json({ error: "Request is not approved for allocation" }, { status: 403 });
    }
    if (request.allocation_status !== "pending") {
      return NextResponse.json({ error: "Request is not pending allocation" }, { status: 409 });
    }

    const travelFrom = request.travel_date_from;
    const travelTo = request.travel_date_to;

    if (!travelFrom || !travelTo) {
      return NextResponse.json({ error: "Request travel dates are required" }, { status: 400 });
    }

    // Overlap: existing.from <= new.to AND existing.to >= new.from
    const overlapWhere = {
      travel_date_from: { lte: travelTo },
      travel_date_to:   { gte: travelFrom },
    };

    // Check vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Check vehicle has no overlapping allocated trip
    const vehicleConflict = await prisma.vehicleRequest.findFirst({
      where: {
        allocation_status: "allocated",
        vehicle_id: vehicleId,
        ...overlapWhere,
      },
      select: { id: true },
    });
    if (vehicleConflict) {
      return NextResponse.json({ error: "Vehicle already allocated for overlapping trip dates" }, { status: 409 });
    }

    // Check primary driver exists
    const primaryDriver = await prisma.driver.findUnique({ where: { id: primaryDriverId as number } });
    if (!primaryDriver) {
      return NextResponse.json({ error: "Primary driver not found" }, { status: 404 });
    }

    // Check primary driver has no overlapping allocated trip
    const primaryDriverConflict = await prisma.vehicleRequest.findFirst({
      where: {
        allocation_status: "allocated",
        driver_id: primaryDriverId as number,
        ...overlapWhere,
      },
      select: { id: true },
    });
    if (primaryDriverConflict) {
      return NextResponse.json({ error: "Primary driver already allocated for overlapping trip dates" }, { status: 409 });
    }

    // Long trip: require secondary driver
    if (request.distance_type.toLowerCase() === "long") {
      if (!secondaryDriverId || !Number.isFinite(secondaryDriverId)) {
        return NextResponse.json({ error: "secondaryDriverId is required for long trips" }, { status: 400 });
      }
      if (secondaryDriverId === primaryDriverId) {
        return NextResponse.json({ error: "Primary and secondary drivers must be different" }, { status: 400 });
      }

      // Check secondary driver exists
      const secondaryDriver = await prisma.driver.findUnique({ where: { id: secondaryDriverId } });
      if (!secondaryDriver) {
        return NextResponse.json({ error: "Secondary driver not found" }, { status: 404 });
      }

      // Check secondary driver has no overlapping allocated trip
      const secondaryDriverConflict = await prisma.vehicleRequest.findFirst({
        where: {
          allocation_status: "allocated",
          driver_id: secondaryDriverId,
          ...overlapWhere,
        },
        select: { id: true },
      });
      if (secondaryDriverConflict) {
        return NextResponse.json({ error: "Secondary driver already allocated for overlapping trip dates" }, { status: 409 });
      }
    }

    // All checks passed — commit atomically
    const txOperations: Array<any> = [
      prisma.vehicleRequest.update({
        where: { id: requestId },
        data: {
          allocation_status: "allocated",
          approval_status: "allocated",
          vehicle_id: vehicleId,
          driver_id: primaryDriverId as number,
        },
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: { availability_status: "allocated" },
      }),
      prisma.driver.update({
        where: { id: primaryDriverId as number },
        data: { availability_status: "allocated" },
      }),
      prisma.approvalHistory.create({
        data: {
          request_id: requestId,
          admin_id: currentUser.id,
          action: "allocated",
          from_status: "approved_for_allocation",
          to_status: "allocated",
        },
      }),
    ];

    // Long trip: mark secondary driver as allocated too
    if (request.distance_type.toLowerCase() === "long") {
      txOperations.splice(
        3,
        0,
        prisma.driver.update({
          where: { id: secondaryDriverId as number },
          data: { availability_status: "allocated" },
        })
      );
    }

    const [updated] = await prisma.$transaction(txOperations);
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (err) {
    console.error("Allocate error:", err);
    return NextResponse.json({ error: "Failed to allocate" }, { status: 500 });
  }
}