import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    }

    // Available vehicles can be viewed by senior-officer only
    if (currentUser.role !== "senior-officer") {
      return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });
    }

    // Availability filtering: availability_status=Available and NOT allocated/under repair/inactive.
    // Schema: we approximate by matching availability_status.
    const vehicles = await prisma.vehicle.findMany({
      where: {
        availability_status: { in: ["Available", "available"] },
      },
      select: {
        id: true,
        vehicle_number: true,
        vehicle_type: true,
        availability_status: true,
      },
      orderBy: { vehicle_number: "asc" },
    });

    return NextResponse.json({ data: vehicles });
  } catch (err) {
    console.error("Available vehicles error:", err);
    return NextResponse.json({ status: 500, error: "Failed to fetch" }, { status: 500 });
  }
}

