import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(req: Request) {
  try {
    const authUser = await getCurrentUser();

    console.log("=== SEND MESSAGE API ===");
    console.log("AUTH USER:", authUser);

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    console.log("REQUEST BODY:", body);

    const email = body.email?.trim();
    const subject = body.subject?.trim() || null;
    const message = body.message?.trim();

    if (!email || !message) {
      return NextResponse.json(
        {
          error: "Email and message are required",
          received: body,
        },
        { status: 400 }
      );
    }

    // Find recipient in User table
    const userRecipient = await prisma.user.findUnique({
      where: { email },
    });

    // Find recipient in Admin table
    const adminRecipient = await prisma.admin.findUnique({
      where: { email },
    });

    console.log("USER RECIPIENT:", userRecipient);
    console.log("ADMIN RECIPIENT:", adminRecipient);

    if (!userRecipient && !adminRecipient) {
      return NextResponse.json(
        {
          error: "Recipient not found",
          email,
        },
        { status: 404 }
      );
    }

    const data: any = {
      subject,
      message,
    };

    // Sender
    if (authUser.type === "user") {
      data.sender_user_id = authUser.id;
    } else {
      data.sender_admin_id = authUser.id;
    }

    // Receiver
    if (userRecipient) {
      data.receiver_user_id = userRecipient.id;
    }

    if (adminRecipient) {
      data.receiver_admin_id = adminRecipient.id;
    }

    console.log("MESSAGE DATA:", data);

    const result = await prisma.message.create({
      data,
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      data: result,
    });
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}