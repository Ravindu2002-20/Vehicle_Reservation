import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// GET /api/vehicle-requests/senior-officer?status=pending-allocation
// Returns pending allocation requests for Senior Officer.
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    if (currentUser.role !== "senior-officer") return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending-allocation";

    if (status !== "pending-allocation") {
      return NextResponse.json({ data: [] });
    }

    const requests = await prisma.vehicleRequest.findMany({
      where: {
        approval_status: "approved_for_allocation",
        allocation_status: "pending",
      },
      include: {
        requester: { select: { id: true, full_name: true, department_id: true } },
        vehicle: { select: { id: true, vehicle_number: true, vehicle_type: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: requests });
  } catch (err) {
    console.error("Senior officer vehicle-requests error:", err);
    return NextResponse.json({ status: 500, error: "Failed" }, { status: 500 });
  }
}

