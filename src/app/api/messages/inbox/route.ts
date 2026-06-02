import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await prisma.message.findMany({
      where: {
        ...(authUser.type === "user"
          ? { receiver_user_id: authUser.id }
          : { receiver_admin_id: authUser.id }),
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
    return NextResponse.json(
      { status: 500, error: (err as Error).message },
      { status: 500 }
    );
  }
}

