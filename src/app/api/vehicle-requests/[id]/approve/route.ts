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

    // Only admins can approve (approved_by references Admin table in schema)
    if (authUser.type === "user") {
      return NextResponse.json(
        { status: 403, error: "Only admins can approve requests" },
        { status: 403 }
      );
    }

    // Look up the admin by email to get correct admin ID
    const admin = await prisma.admin.findUnique({
      where: { email: authUser.email },
      select: { id: true },
    });

    if (!admin) {
      return NextResponse.json(
        { status: 403, error: "Admin account not found" },
        { status: 403 }
      );
    }

    const updated = await prisma.vehicleRequest.update({
      where: { id: requestId },
      data: {
        approval_status: "approved",
        approved_by: admin.id, // Must match Admin table ID per schema
      },
    });

    return NextResponse.json({ status: 200, data: updated });
  } catch (err) {
    console.error("Approve error:", err);
    return NextResponse.json(
      { status: 500, error: "Failed to approve request" },
      { status: 500 }
    );
  }
}