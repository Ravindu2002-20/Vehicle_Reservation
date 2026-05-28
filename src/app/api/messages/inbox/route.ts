import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    if (!user_id) return NextResponse.json({ data: [] });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { receiver_user_id: Number(user_id) },
          { receiver_admin_id: Number(user_id) },
        ],
      },
      include: {
        sender_user: {
          select: { id: true, full_name: true, email: true },
        },
        sender_admin: {
          select: { id: true, full_name: true, email: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: messages });
  } catch (err) {
    console.error("Messages inbox error:", err);
    return NextResponse.json({ status: 500, error: (err as Error).message }, { status: 500 });
  }
}