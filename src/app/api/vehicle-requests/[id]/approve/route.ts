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
      return NextResponse.json({ status: 403, error: "Only admins can approve requests" }, { status: 403 });
    }

    const requestId = parseInt(params.id);
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ status: 400, error: "Invalid request id" }, { status: 400 });
    }

    const updated = await prisma.vehicleRequest.update({
      where: { id: requestId },
      data: {
        approval_status: "approved",
        // approved_by references Admin table ID in schema
        approved_by: authUser.id,
      },
    });

    return NextResponse.json({ status: 200, data: updated });
  } catch (err) {
    console.error("Approve error:", err);
    return NextResponse.json({ status: 500, error: "Failed to approve request" }, { status: 500 });
  }
}

