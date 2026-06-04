import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

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
  const body = await req.json().catch(() => ({}));
  const { subject, reason, attachment_url } = body;

  if (!subject || !reason) {
    return NextResponse.json(
      { error: "Subject and reason are required" },
      { status: 400 }
    );
  }

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

  // Update the request to return to Dean
  await prisma.vehicleRequest.update({
    where: { id: requestId },
    data: {
      approval_status: "returned_to_dean",
      admin_remarks: reason,
      rejection_attachment_url: attachment_url ?? null,
      forwarded_to_general: false,
    },
  });

  // Look up the Dean admin
  const dean = await prisma.admin.findFirst({
    where: { admin_role: "dean" },
  });

  if (dean) {
    // Create message to Dean with return notification
    let messageText = reason;
    if (attachment_url) {
      messageText += `\n\nAttachment: ${attachment_url}`;
    }

    await prisma.message.create({
      data: {
        sender_admin_id: admin.id,
        receiver_admin_id: dean.id,
        subject: subject,
        message: messageText,
        is_read: false,
      },
    });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
