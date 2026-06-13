import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const drivers = await prisma.driver.findMany({
      orderBy: { full_name: "asc" },
      select: {
        id: true,
        full_name: true,
        license_number: true,
        availability_status: true,
      },
    });

    return NextResponse.json({ data: drivers });
  } catch (err) {
    console.error("Drivers list error:", err);
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));

    const full_name = String(body?.full_name ?? "").trim();
    const license_number = String(body?.license_number ?? "").trim();
    const telephone = body?.telephone != null ? String(body.telephone).trim() : null;
    const availability_status = String(body?.availability_status ?? "available").trim();

    if (!full_name) {
      return NextResponse.json({ error: "full_name is required" }, { status: 400 });
    }
    if (!license_number) {
      return NextResponse.json({ error: "license_number is required" }, { status: 400 });
    }
    if (!availability_status) {
      return NextResponse.json(
        { error: "availability_status is required" },
        { status: 400 }
      );
    }

    const driver = await prisma.driver.create({
      data: {
        full_name,
        license_number,
        telephone: telephone || null,
        availability_status,
      },
      select: {
        id: true,
        full_name: true,
        license_number: true,
        availability_status: true,
      },
    });

    return NextResponse.json({ data: driver }, { status: 201 });
  } catch (err: any) {
    console.error("Driver create error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create driver" },
      { status: 500 }
    );
  }
}

