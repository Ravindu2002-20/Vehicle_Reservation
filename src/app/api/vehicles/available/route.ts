import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    }

    // Available vehicles can be viewed by senior-officer only
    if (currentUser.role !== "senior-officer") {
      return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const travelDateFrom = searchParams.get("travel_date_from");
    const travelDateTo = searchParams.get("travel_date_to");

    // Find vehicles that do NOT have an overlapping allocated trip
    // A vehicle is unavailable if there exists an allocated trip where:
    //   existing.travel_date_from <= new.travel_date_to
    //   AND existing.travel_date_to >= new.travel_date_from
    const vehiclesUnavailable = travelDateFrom && travelDateTo
      ? await prisma.vehicleRequest.findMany({
          where: {
            allocation_status: "allocated",
            travel_date_from: { lte: travelDateTo },
            travel_date_to: { gte: travelDateFrom },
          },
          select: { vehicle_id: true },
          distinct: ["vehicle_id"],
        }).then((rows) => rows.map((r) => r.vehicle_id).filter((id): id is number => id !== null))
      : [];

    const vehicles = await prisma.vehicle.findMany({
      where: {
        // availability_status is a secondary flag; primary check is date-based
        ...(vehiclesUnavailable.length > 0 ? { id: { notIn: vehiclesUnavailable } } : {}),
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