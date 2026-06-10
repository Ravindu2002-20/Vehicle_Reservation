import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type VehicleRequestRow = {
  id: number;
  requester_id: number;
  vehicle_id: number | null;
  driver_id: number | null;
  approval_status: string;
  allocation_status: string;
  travel_date_from: Date;
  travel_date_to: Date;
  required_time_from: string;
  required_time_to: string;
  purpose: string;
  distance_type: string;
  vehicle_nature: string;
  number_of_persons: number;
  path_type: string;
  requester?: {
    id: number;
    full_name: string;
    department: {
      id: number;
      department_name: string;
      faculty: {
        id: number;
        name: string;
      };
    };
  };
  vehicle?: {
    id: number;
    vehicle_number: string;
    vehicle_type: string;
    availability_status: string;
  } | null;
  driver?: {
    id: number;
    full_name: string;
    availability_status: string;
  } | null;
};

function toOptionalNumber(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  if (Number.isNaN(n)) return undefined;
  return n;
}

function toOptionalDate(v: string | null): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

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

    const { searchParams } = new URL(req.url);

    const facultyId = toOptionalNumber(searchParams.get("facultyId"));
    const vehicleId = toOptionalNumber(searchParams.get("vehicleId"));
    const driverId = toOptionalNumber(searchParams.get("driverId"));
    const status = searchParams.get("status") || undefined;
    const dateFrom = toOptionalDate(searchParams.get("dateFrom"));
    const dateTo = toOptionalDate(searchParams.get("dateTo"));
    const distanceType = searchParams.get("distanceType") || undefined;

    const where: any = {};

    if (facultyId != null) {
      where.requester = {
        department: {
          faculty_id: facultyId,
        },
      };
    }

    if (vehicleId != null) {
      where.vehicle_id = vehicleId;
    }

    if (driverId != null) {
      where.driver_id = driverId;
    }

    if (status) {
      where.approval_status = status;
    }

    if (distanceType) {
      where.distance_type = distanceType;
    }

    if (dateFrom || dateTo) {
      where.AND = [];
      if (dateFrom) {
        where.AND.push({ travel_date_from: { gte: dateFrom } });
      }
      if (dateTo) {
        where.AND.push({ travel_date_to: { lte: dateTo } });
      }
    }

    const [data, total] = await Promise.all([
      prisma.vehicleRequest.findMany({
        where,
        orderBy: { created_at: "desc" },
        include: {
          requester: {
            include: {
              department: {
                include: {
                  faculty: true,
                },
              },
            },
          },
          vehicle: true,
          driver: true,
        },
      }),
      prisma.vehicleRequest.count({ where }),
    ]);

    return NextResponse.json({ data: data as VehicleRequestRow[], total }, { status: 200 });
  } catch (err) {
    console.error("Reports vehicle-requests error:", err);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

