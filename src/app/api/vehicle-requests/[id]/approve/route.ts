import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({
    where: { supabase_id: user.id },
  });

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  const requestId = parseInt(params.id);

  // Get the vehicle request
  const vehicleRequest = await prisma.vehicleRequest.findUnique({
    where: { id: requestId },
    include: { requester: true },
  });

  if (!vehicleRequest) {
    return NextResponse.json(
      { error: "Vehicle request not found" },
      { status: 404 }
    );
  }

  // Determine if caller is Dean or General Deputy (admin-deputy)
  const isDean = admin.admin_role === "dean";
  const isGeneralDeputy = admin.admin_role === "admin-deputy";

  if (!isDean && !isGeneralDeputy) {
    return NextResponse.json(
      { error: "Only Dean or General Deputy can approve requests" },
      { status: 403 }
    );
  }

  if (isDean) {
    // Dean approval: set status to "approved_by_dean" and forward to General Deputy
    await prisma.vehicleRequest.update({
      where: { id: requestId },
      data: {
        approval_status: "approved_by_dean",
        approved_by: admin.id,
        forwarded_to_general: true,
      },
    });

    // Notify the General Deputy admin(s) (avoid hardcoded email)
    const generalDeputyAdmins = await prisma.admin.findMany({
      where: { admin_role: "admin-deputy" },
      select: { id: true },
      take: 10,
    });

    if (generalDeputyAdmins?.length) {
      await prisma.message.createMany({
        data: generalDeputyAdmins.map((gd) => ({
          sender_admin_id: admin.id,
          receiver_admin_id: gd.id,
          subject: "Vehicle request forwarded for your approval",
          message: `A vehicle request from ${vehicleRequest.requester.full_name} (Purpose: ${vehicleRequest.purpose}) has been approved by the Dean and forwarded for your final approval. Request ID: ${vehicleRequest.id}`,
          is_read: false,
        })),
      });
    }
  } else if (isGeneralDeputy) {
    // General Deputy approval: fully approve and clear forwarded flag
    await prisma.vehicleRequest.update({
      where: { id: requestId },
      data: {
        approval_status: "approved",
        approved_by: admin.id,
        forwarded_to_general: false,
      },
    });

    // Send message to requester user
    await prisma.message.create({
      data: {
        sender_admin_id: admin.id,
        receiver_user_id: vehicleRequest.requester_id,
        subject: "Your vehicle request has been approved",
        message: "Your vehicle request has been fully approved.",
        is_read: false,
      },
    });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
