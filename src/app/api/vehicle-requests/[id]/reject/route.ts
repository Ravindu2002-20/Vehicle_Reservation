import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    }
    if (authUser.type !== "admin") {
      return NextResponse.json({ status: 403, error: "Only admins can reject requests" }, { status: 403 });
    }

    const requestId = parseInt(params.id);
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ status: 400, error: "Invalid request id" }, { status: 400 });
    }

    const updated = await prisma.vehicleRequest.update({
      where: { id: requestId },
      data: {
        approval_status: "rejected",
      },
    });

    return NextResponse.json({ status: 200, data: updated });
  } catch (err) {
    console.error("Reject error:", err);
    return NextResponse.json({ status: 500, error: "Failed to reject request" }, { status: 500 });
  }
}

