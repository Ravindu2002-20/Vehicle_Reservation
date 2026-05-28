import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getAuthUser();
    if (!authUser) {
      return unauthorized();
    }

    const requestId = parseInt(params.id);

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