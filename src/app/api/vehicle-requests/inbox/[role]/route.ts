import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { role: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const role = params.role;

  let requests;

  if (role === "GENERAL_DEPUTY") {
    // Get requests approved by the Dean and forwarded to General Deputy
    requests = await prisma.vehicleRequest.findMany({
      where: {
        approval_status: "approved_by_dean",
      },
      include: {
        requester: true,
      },
      orderBy: { created_at: "desc" },
    });
  } else if (role === "DEAN") {
    // Get pending and returned requests for Dean
    requests = await prisma.vehicleRequest.findMany({
      where: {
        approver_type: "DEAN",
        approval_status: {
          in: ["pending", "returned_to_dean"],
        },
      },
      include: {
        requester: true,
      },
      orderBy: { created_at: "desc" },
    });
  } else if (role === "UDR") {
    // Get pending requests for UDR (University Deputy Registrar)
    requests = await prisma.vehicleRequest.findMany({
      where: {
        approver_type: "UDR",
        approval_status: "pending",
      },
      include: {
        requester: true,
      },
      orderBy: { created_at: "desc" },
    });
  } else {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  return NextResponse.json({ data: requests }, { status: 200 });
}
