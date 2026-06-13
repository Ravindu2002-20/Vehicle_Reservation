import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// GET /api/availability/drivers?tripType=short|long&travel_date_from=...&travel_date_to=...
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    if (currentUser.role !== "senior-officer") return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const tripType = searchParams.get("tripType") || "short";
    const travelDateFrom = searchParams.get("travel_date_from");
    const travelDateTo = searchParams.get("travel_date_to");

    // Find drivers that do NOT have an overlapping allocated trip
    // A driver is unavailable if there exists an allocated trip where:
    //   existing.travel_date_from <= new.travel_date_to
    //   AND existing.travel_date_to >= new.travel_date_from
    const driversUnavailable = travelDateFrom && travelDateTo
      ? await prisma.vehicleRequest.findMany({
          where: {
            allocation_status: "allocated",
            travel_date_from: { lte: travelDateTo },
            travel_date_to: { gte: travelDateFrom },
          },
          select: { driver_id: true },
          distinct: ["driver_id"],
        }).then((rows) => rows.map((r) => r.driver_id).filter((id): id is number => id !== null))
      : [];

    const drivers = await prisma.driver.findMany({
      where: {
        ...(driversUnavailable.length > 0 ? { id: { notIn: driversUnavailable } } : {}),
      },
      select: {
        id: true,
        full_name: true,
        telephone: true,
        license_number: true,
        availability_status: true,
      },
      orderBy: { full_name: "asc" },
    });

    return NextResponse.json({ data: { tripType, drivers } });
  } catch (err) {
    console.error("Available drivers error:", err);
    return NextResponse.json({ status: 500, error: "Failed to fetch" }, { status: 500 });
  }
}