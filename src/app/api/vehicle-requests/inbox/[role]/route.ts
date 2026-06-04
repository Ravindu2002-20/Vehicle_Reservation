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

  if (role === "dean") {
    // Dean can only see requests from their own faculty
    const dean = await prisma.admin.findUnique({ where: { id: user.id } });
    if (!dean || dean.faculty_id == null) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    requests = await prisma.vehicleRequest.findMany({
      where: {
        approval_status: "pending_dean",
        requester: {
          department: { faculty_id: dean.faculty_id },
        },
      },
      include: { requester: true },
      orderBy: { created_at: "desc" },
    });
  } else if (role === "admin-deputy") {
    requests = await prisma.vehicleRequest.findMany({
      where: { approval_status: "pending_admin_deputy" },
      include: { requester: true },
      orderBy: { created_at: "desc" },
    });
  } else if (role === "university-deputy") {
    requests = await prisma.vehicleRequest.findMany({
      where: { approval_status: "pending_university_deputy" },
      include: { requester: true },
      orderBy: { created_at: "desc" },
    });
  } else {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  return NextResponse.json({ data: requests }, { status: 200 });
}
