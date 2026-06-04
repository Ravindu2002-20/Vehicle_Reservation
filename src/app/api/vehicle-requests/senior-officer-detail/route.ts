import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// GET /api/vehicle-requests/senior-officer-detail?requestId=...
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    if (currentUser.role !== "senior-officer") return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const requestId = Number(searchParams.get("requestId"));
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ status: 400, error: "Invalid requestId" }, { status: 400 });
    }

    const request = await prisma.vehicleRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        approval_status: true,
        allocation_status: true,
        request_letter_path: true,
        purpose: true,
        places_to_visit: true,
        travel_route: true,
        travel_date_from: true,
        travel_date_to: true,
        number_of_persons: true,
        distance_type: true,
        vehicle_nature: true,
        requester: {
          select: {
            id: true,
            full_name: true,
            department: { select: { faculty_id: true } },
          },
        },
        vehicle: { select: { id: true, vehicle_number: true, vehicle_type: true } },
        driver: { select: { id: true, full_name: true } },
      },
    });

    if (!request) return NextResponse.json({ status: 404, error: "Not found" }, { status: 404 });
    if (request.approval_status !== "approved_for_allocation") {
      return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: request });
  } catch (err) {
    console.error("Senior officer detail error:", err);
    return NextResponse.json({ status: 500, error: "Failed" }, { status: 500 });
  }
}
