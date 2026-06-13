import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    if (currentUser.role !== "senior-officer")
      return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });

    const url = new URL(req.url);
    const view = url.searchParams.get("view") ?? "all"; // "all" | "week"

    const baseWhere: Record<string, any> = {
      allocation_status: { in: ["allocated", "completed", "cancelled"] },
    };

    if (view === "week") {
      const now = new Date();
      const diffToMonday = (now.getDay() + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      baseWhere.travel_date_from = { gte: monday, lte: sunday };
    }

    const allocations = await prisma.vehicleRequest.findMany({
      where: baseWhere,
      include: {
        requester: { select: { full_name: true, id: true } },
        vehicle: { select: { vehicle_number: true, vehicle_type: true, id: true } },
        driver: { select: { full_name: true, id: true } },
      },
      orderBy: { travel_date_from: "asc" },
    });

    return NextResponse.json({ data: { allocations } });
  } catch (err) {
    console.error("Schedule error:", err);
    return NextResponse.json({ status: 500, error: "Failed to fetch" }, { status: 500 });
  }
}


