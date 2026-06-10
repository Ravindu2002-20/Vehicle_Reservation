import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowed = ["university-deputy", "admin-deputy"] as const;
    if (!allowed.includes(currentUser.role as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [faculties, vehicles, drivers] = await Promise.all([
      prisma.faculty.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.vehicle.findMany({
        orderBy: { vehicle_number: "asc" },
      }),
      prisma.driver.findMany({
        orderBy: { full_name: "asc" },
      }),
    ]);

    return NextResponse.json({ faculties, vehicles, drivers }, { status: 200 });
  } catch (err) {
    console.error("Reports filter-options error:", err);
    return NextResponse.json({ error: "Failed to fetch filter options" }, { status: 500 });
  }
}

