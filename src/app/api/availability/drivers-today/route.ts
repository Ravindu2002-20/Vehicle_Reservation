import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

function startOfToday(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfToday(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// GET /api/availability/drivers-today
// Returns drivers annotated with availability "available" | "allocated" as-of-today
// Based on vehicle_request date overlap and allocation_status.
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    }
    if (currentUser.role !== "senior-officer") {
      return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const includeAllocated = searchParams.get("includeAllocated") === "true"; // optional

    const sod = startOfToday();
    const eod = endOfToday();

    // Allocation overlap with today:
    // travel_date_from <= endOfToday AND travel_date_to >= startOfToday
    // Consider allocated drivers where allocation_status is allocated/completed/cancelled
    // Note: completed/cancelled should likely be treated as freed; but existing allocation updates free resources.
    // We'll treat allocated/completed/cancelled as "not free" only when the trip overlaps today.
    const allocations = await prisma.vehicleRequest.findMany({
      where: {
        allocation_status: { in: ["allocated", "completed", "cancelled"] },
        driver_id: { not: null },
        travel_date_from: { lte: eod },
        travel_date_to: { gte: sod },
      },
      select: {
        driver_id: true,
      },
    });

    const allocatedDriverIds = new Set(
      allocations.map((a) => String(a.driver_id))
    );

    const drivers = await prisma.driver.findMany({
      select: {
        id: true,
        full_name: true,
        telephone: true,
        license_number: true,
        availability_status: true,
      },
      orderBy: { full_name: "asc" },
    });

    const data = drivers.map((d) => {
      const allocatedToday = allocatedDriverIds.has(String(d.id));
      return {
        id: d.id,
        full_name: d.full_name,
        license_number: d.license_number,
        telephone: d.telephone,
        availability_status: allocatedToday ? "allocated" : "available",
      };
    });

    const filtered = includeAllocated ? data : data.filter((d) => d.availability_status === "available");

    return NextResponse.json({ data: filtered });
  } catch (err) {
    console.error("Available drivers (today) error:", err);
    return NextResponse.json({ status: 500, error: "Failed to fetch" }, { status: 500 });
  }
}

