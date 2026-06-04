import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await prisma.vehicleRequest.findUnique({
    where: { id },
    include: {
      requester: true,
      approver: true,
      vehicle: true,
      driver: true,
      approval_history: {
        orderBy: { created_at: "asc" },
      },
    },
  });

  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Requester can only view their own request
  if (user.type === "user" && user.id !== record.requester_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data: record });
}