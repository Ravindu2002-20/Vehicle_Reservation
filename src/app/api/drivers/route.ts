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

