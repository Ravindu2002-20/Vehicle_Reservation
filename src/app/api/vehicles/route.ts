import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { vehicle_number: "asc" },
      select: {
        id: true,
        vehicle_number: true,
        vehicle_type: true,
        capacity: true,
        availability_status: true,
      },
    });

    return NextResponse.json({ data: vehicles });
  } catch (err) {
    return NextResponse.json({ status: 500, error: (err as Error).message });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const vehicle_number = String(body?.vehicle_number ?? "").trim();
    const vehicle_type = String(body?.vehicle_type ?? "").trim();
    const capacityRaw = body?.capacity;
    const capacity = capacityRaw == null || capacityRaw === "" ? 1 : Number(capacityRaw);
    const availability_status = String(body?.availability_status ?? "available").trim();

    if (!vehicle_number) {
      return NextResponse.json({ error: "vehicle_number is required" }, { status: 400 });
    }
    if (!vehicle_type) {
      return NextResponse.json({ error: "vehicle_type is required" }, { status: 400 });
    }
    if (!Number.isFinite(capacity) || capacity <= 0) {
      return NextResponse.json({ error: "capacity must be a positive number" }, { status: 400 });
    }
    if (!availability_status) {
      return NextResponse.json(
        { error: "availability_status is required" },
        { status: 400 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        vehicle_number,
        vehicle_type,
        capacity: Math.trunc(capacity),
        availability_status,
      },
      select: {
        id: true,
        vehicle_number: true,
        vehicle_type: true,
        capacity: true,
        availability_status: true,
      },
    });

    return NextResponse.json({ data: vehicle }, { status: 201 });
  } catch (err: any) {
    console.error("Vehicle create error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create vehicle" },
      { status: 500 }
    );
  }
}

