import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// GET /api/schedule?type=senior-officer-week
export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    if (currentUser.role !== "senior-officer") return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });

    const now = new Date();
    const day = now.getDay(); // 0=Sun..6=Sat
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const allocations = await prisma.vehicleRequest.findMany({
      where: {
        approval_status: "approved_for_allocation",
        allocation_status: "allocated",
        travel_date_from: { gte: monday, lte: sunday },
      },
      include: {
        requester: { select: { full_name: true, id: true } },
        vehicle: { select: { vehicle_number: true, vehicle_type: true, id: true } },
        driver: { select: { full_name: true, id: true } },
      },
      orderBy: { travel_date_from: "asc" },
    });

    // Group by date string
    const toKey = (d: Date) => d.toISOString().slice(0, 10);
    const grouped = new Map<string, typeof allocations>();
    for (const a of allocations) {
      const key = toKey(a.travel_date_from);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(a);
    }

    // Avoid Object.fromEntries + iterator spreading for older TS targets
    // (keeps build compatible with current tsconfig target).
    const groupedObj: Record<string, any[]> = {};
    grouped.forEach((v, k) => {
      groupedObj[k] = v as any[];
    });

    return NextResponse.json({
      data: {
        weekStart: monday.toISOString(),
        weekEnd: sunday.toISOString(),
        grouped: groupedObj,
      },
    });
  } catch (err) {
    console.error("Schedule error:", err);
    return NextResponse.json({ status: 500, error: "Failed to fetch" }, { status: 500 });
  }
}

