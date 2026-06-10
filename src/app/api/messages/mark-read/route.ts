import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const readToMessageId = body?.readToMessageId;

    const whereBase =
      authUser.type === "user"
        ? { receiver_user_id: authUser.id as number }
        : { receiver_admin_id: authUser.id as number };

    if (typeof readToMessageId === "number") {
      await prisma.message.updateMany({
        where: {
          ...whereBase,
          id: { lte: readToMessageId },
          is_read: false,
        },
        data: { is_read: true },
      });
    } else {
      // Mark all receiver messages as read
      await prisma.message.updateMany({
        where: {
          ...whereBase,
          is_read: false,
        },
        data: { is_read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("mark-read error:", err);
    return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 });
  }
}

