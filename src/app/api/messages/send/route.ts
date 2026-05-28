import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  try {
    const sender_type = body.sender_type === "user" ? "user" : "admin";
    const data: any = {};

    // Support both payload styles:
    // 1) { sender_type, sender_id, receiver_user_id|receiver_admin_id }
    // 2) { sender_user_id, receiver_admin_id }
    if (sender_type === "user") {
      data.sender_user_id = body.sender_user_id ?? body.sender_id;
    } else {
      data.sender_admin_id = body.sender_admin_id ?? body.sender_id;
    }

    data.receiver_user_id = body.receiver_user_id;
    data.receiver_admin_id = body.receiver_admin_id;

    data.message = body.message;
    data.subject = body.subject;

    if (!data.message || (!data.receiver_user_id && !data.receiver_admin_id)) {
      return NextResponse.json(
        { status: 400, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await prisma.message.create({ data });
    return NextResponse.json({ status: 200, data: result });
  } catch (err) {
    return NextResponse.json(
      { status: 500, error: (err as Error).message },
      { status: 500 }
    );
  }
}

