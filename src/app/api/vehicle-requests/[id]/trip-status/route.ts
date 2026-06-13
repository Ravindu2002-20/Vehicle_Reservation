import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

const VALID_STATUSES = [
  "ongoing",
  "completed",
  "postponed",
  "cancelled",
] as const;

type TripStatus = (typeof VALID_STATUSES)[number];

// PATCH /api/vehicle-requests/[id]/trip-status
// Body: { status: TripStatus, note?: string }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (currentUser.role !== "senior-officer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const requestId = Number(params.id);
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }

    const body = await req.json();
    const status: TripStatus = body.status;
    const note: string | undefined = body.note?.trim() || undefined;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const request = await prisma.vehicleRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        allocation_status: true,
        trip_remarks: true,
        vehicle_id: true,
        driver_id: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    const updatableStatuses = ["allocated", "completed", "cancelled", "postponed"];
    if (!updatableStatuses.includes(request.allocation_status)) {
      return NextResponse.json(
        { error: "Only allocated requests can have their trip status updated" },
        { status: 409 }
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // Immutability hardening:
    // Once a trip is finalized (completed/postponed/cancelled), senior officer
    // must not be able to change it again.
    // ─────────────────────────────────────────────────────────────────────
    const finalizedStatuses = ["completed", "postponed", "cancelled"] as const;
    if (finalizedStatuses.includes(request.allocation_status as any)) {
      const current = request.allocation_status as TripStatus;
      return NextResponse.json(
        {
          error: `Trip status is finalized as "${current}" and cannot be changed again`,
        },
        { status: 409 }
      );
    }

    const prevNote = request.trip_remarks ?? "";
    const prevStatus = prevNote.startsWith("trip_status:")
      ? (prevNote.split(":")[1]?.split("|")[0]?.trim() ?? "ongoing")
      : "ongoing";

    // When a trip ends (completed or cancelled), free the vehicle and driver.

    const shouldFreeResources =
      status === "completed" || status === "cancelled";

    const newTripRemarks = `trip_status:${status}${note ? ` | ${note}` : ""}`;

    if (shouldFreeResources) {
      const ops: any[] = [
        prisma.vehicleRequest.update({
          where: { id: requestId },
          data: {
            trip_remarks: newTripRemarks,
            allocation_status:
              status === "cancelled" ? "cancelled" : "completed",
          },
        }),
        prisma.approvalHistory.create({
          data: {
            request_id: requestId,
            admin_id: currentUser.id,
            action: "trip_status_change",
            from_status: prevStatus ?? "ongoing",
            to_status: status,
            remarks: note,
          },
        }),
      ];

      if (request.vehicle_id) {
        ops.push(
          prisma.vehicle.update({
            where: { id: request.vehicle_id },
            data: { availability_status: "available" },
          })
        );
      }

      if (request.driver_id) {
        ops.push(
          prisma.driver.update({
            where: { id: request.driver_id },
            data: { availability_status: "available" },
          })
        );
      }

      await prisma.$transaction(ops);
    } else {
      // postponed or back to ongoing — just update the remark, keep resources allocated
      await prisma.$transaction([
        prisma.vehicleRequest.update({
          where: { id: requestId },
          data: { trip_remarks: newTripRemarks },
        }),
        prisma.approvalHistory.create({
          data: {
            request_id: requestId,
            admin_id: currentUser.id,
            action: "trip_status_change",
            from_status: prevStatus ?? "ongoing",
            to_status: status,
            remarks: note,
          },
        }),
      ]);
    }



    return NextResponse.json({
      success: true,
      message: `Trip status updated to "${status}"${
        shouldFreeResources
          ? ". Vehicle and driver are now available."
          : "."
      }`,

      freedResources: shouldFreeResources,
    });
  } catch (err) {
    console.error("Trip status update error:", err);
    return NextResponse.json(
      { error: "Failed to update trip status" },
      { status: 500 }
    );
  }
}

