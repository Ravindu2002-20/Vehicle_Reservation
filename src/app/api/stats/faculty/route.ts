import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth";

/**
 * Faculty stats that avoids per-faculty N+1 queries and avoids loading large row sets into memory.
 *
 * Output shape stays the same: { data: [{ name, requestsCount, vehiclesCount }] }
 */
export async function GET(req: Request) {
  try {
    const authUser = getAuthUser();
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(req.url);

    // Safety cap: if you ever have many faculties, keep response bounded.
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    // ---- Requests per faculty (DB aggregated) ----
    // faculty -> department -> user (requester) -> vehicle_request
    const requestRows = await prisma.$queryRaw<Array<{
      faculty_name: string;
      requests_count: bigint;
    }>>`
      SELECT f.name AS faculty_name,
             COUNT(vr.id) AS requests_count
      FROM faculty f
      JOIN department d ON d.faculty_id = f.id
      JOIN "user" u ON u.department_id = d.id
      JOIN vehicle_request vr ON vr.requester_id = u.id
      GROUP BY f.id, f.name
      ORDER BY requests_count DESC
      LIMIT ${limit}
    `;

    // ---- Unique vehicles per faculty (DB aggregated distinct) ----
    // Only count vehicle_id that isn't null.
    const vehicleRows = await prisma.$queryRaw<Array<{
      faculty_name: string;
      vehicles_unique_count: bigint;
    }>>`
      SELECT f.name AS faculty_name,
             COUNT(DISTINCT vr.vehicle_id) AS vehicles_unique_count
      FROM faculty f
      JOIN department d ON d.faculty_id = f.id
      JOIN "user" u ON u.department_id = d.id
      JOIN vehicle_request vr ON vr.requester_id = u.id
      WHERE vr.vehicle_id IS NOT NULL
      GROUP BY f.id, f.name
      ORDER BY vehicles_unique_count DESC
      LIMIT ${limit}
    `;

    const vehicleMap = new Map<string, number>();
    for (const r of vehicleRows) {
      vehicleMap.set(r.faculty_name, Number(r.vehicles_unique_count));
    }

    const results = requestRows.map((r) => ({
      name: r.faculty_name,
      requestsCount: Number(r.requests_count),
      vehiclesCount: vehicleMap.get(r.faculty_name) ?? 0,
    }));

    return NextResponse.json({ data: results });
  } catch (err) {
    console.error("Faculty stats error:", err);
    return NextResponse.json(
      { status: 500, error: "Failed to fetch faculty stats" },
      { status: 500 }
    );
  }
}


