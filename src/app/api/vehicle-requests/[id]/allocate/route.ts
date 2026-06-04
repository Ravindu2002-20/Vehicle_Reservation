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

    // Validate vehicle availability
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.availability_status !== "Available") {
      return NextResponse.json({ error: "Vehicle is not available" }, { status: 400 });
    }

    // Validate primary driver availability
    const primaryDriver = await prisma.driver.findUnique({ where: { id: primaryDriverId as number } });
    if (
      !primaryDriver ||
      (primaryDriver.availability_status !== "available" && primaryDriver.availability_status !== "Available")
    ) {
      return NextResponse.json({ error: "Primary driver is not available" }, { status: 400 });
    }

    // Conflict check: driver already allocated to another request
    const conflict = await prisma.vehicleRequest.findFirst({
      where: {
        allocation_status: "allocated",
        driver_id: primaryDriverId as number,
      },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ error: "Primary driver already allocated" }, { status: 409 });
    }

    // Long trip: require secondary driver
    if (request.vehicle_nature === "long") {
      if (!secondaryDriverId || !Number.isFinite(secondaryDriverId)) {
        return NextResponse.json({ error: "secondaryDriverId is required for long trips" }, { status: 400 });
      }
      if (secondaryDriverId === primaryDriverId) {
        return NextResponse.json({ error: "Primary and secondary drivers must be different" }, { status: 400 });
      }
      const secondaryDriver = await prisma.driver.findUnique({ where: { id: secondaryDriverId } });
      if (
        !secondaryDriver ||
        (secondaryDriver.availability_status !== "available" && secondaryDriver.availability_status !== "Available")
      ) {
        return NextResponse.json({ error: "Secondary driver is not available" }, { status: 400 });
      }
      const conflict2 = await prisma.vehicleRequest.findFirst({
        where: {
          allocation_status: "allocated",
          driver_id: secondaryDriverId,
        },
        select: { id: true },
      });
      if (conflict2) return NextResponse.json({ error: "Secondary driver already allocated" }, { status: 409 });
    }

    const updated = await prisma.vehicleRequest.update({
      where: { id: requestId },
      data: {
        allocation_status: "allocated",
        vehicle_id: vehicleId,
        driver_id: primaryDriverId as number,
      },
    });

    await prisma.approvalHistory.create({
      data: {
        request_id: requestId,
        admin_id: currentUser.id,
        action: "allocated",
        from_status: "approved_for_allocation",
        to_status: "allocated",
      },
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (err) {
    console.error("Allocate error:", err);
    return NextResponse.json({ error: "Failed to allocate" }, { status: 500 });
  }
}
