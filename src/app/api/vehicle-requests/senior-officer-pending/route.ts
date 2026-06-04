import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role !== "senior-officer") {
      return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });
    }

    const requests = await prisma.vehicleRequest.findMany({
      where: {
        approval_status: "approved_for_allocation",
        allocation_status: "pending",
      },
      include: {
        requester: {
          select: {
            id: true,
            full_name: true,
            department_id: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            vehicle_number: true,
            vehicle_type: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: requests });
  } catch (err) {
    console.error("Senior officer pending allocation list error:", err);
    return NextResponse.json({ status: 500, error: "Failed to fetch" }, { status: 500 });
  }
}

