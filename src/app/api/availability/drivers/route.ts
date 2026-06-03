import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// GET /api/availability/drivers?type=available&tripType=short|long
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    if (currentUser.role !== "senior-officer") return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const tripType = searchParams.get("tripType") || "short";

    // Drivers are "available" when driver.availability_status matches and they are not already assigned
    // to allocated requests.
    // For long trips, frontend will enforce distinct drivers; backend validates only availability.

    const drivers = await prisma.driver.findMany({
      where: {
        availability_status: { in: ["available", "Available"] },
        id: {
          notIn: [
            ...(await prisma.vehicleRequest
              .findMany({
                where: {
                  allocation_status: "allocated",
                  approval_status: "approved_for_allocation",
                  driver_id: { not: null },
                },
                select: { driver_id: true },
              }))
              .map((r) => r.driver_id)
              .filter((v): v is number => typeof v === "number"),
          ],
        },
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

