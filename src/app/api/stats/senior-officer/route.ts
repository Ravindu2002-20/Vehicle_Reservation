import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    }

    // Senior Officer can view their dashboard only
    if (currentUser.role !== "senior-officer") {
      return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });
    }

    const [totalDrivers, totalVehicles, newRequestsAwaitingAllocation, ongoingAllocations] =
      await Promise.all([
        prisma.driver.count(),
        prisma.vehicle.count(),
        prisma.vehicleRequest.count({
          where: {
            approval_status: "approved_for_allocation",
            allocation_status: "pending",
          },
        }),
        prisma.vehicleRequest.count({
          where: {
            approval_status: "approved_for_allocation",
            allocation_status: "allocated",
          },
        }),
      ]);

    return NextResponse.json({
      data: {
        totalDrivers,
        totalVehicles,
        newRequestsAwaitingAllocation,
        ongoingAllocations,
      },
    });
  } catch (err) {
    console.error("Senior officer stats error:", err);
    return NextResponse.json({ status: 500, error: "Failed to fetch stats" }, { status: 500 });
  }
}

