import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import fs from "fs";
import path from "path";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });

    if (currentUser.role !== "senior-officer") {
      return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });
    }

    const requestId = Number(params.id);
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ status: 400, error: "Invalid request id" }, { status: 400 });
    }

    // NOTE: This repo currently does not have `request_letter_path` in Prisma.
    // This endpoint is a placeholder for Step 5 implementation.
    // Once Prisma schema is updated to include request_letter_path, enable the file streaming.
    const request = await prisma.vehicleRequest.findUnique({
      where: { id: requestId },
      select: { id: true, approval_status: true, allocation_status: true },
    });

    if (!request) return NextResponse.json({ status: 404, error: "Not found" }, { status: 404 });

    return NextResponse.json({
      status: 200,
      error: "Not implemented: request_letter_path missing from Prisma schema. Implement Step 5 to enable PDF viewing.",
    });
  } catch (err) {
    console.error("Letter view error:", err);
    return NextResponse.json({ status: 500, error: "Failed to fetch" }, { status: 500 });
  }
}

