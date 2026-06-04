import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forbiddenRoles = ["student", "lecturer", "senior-officer"];
  if (forbiddenRoles.includes(currentUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  const request = await prisma.vehicleRequest.findUnique({
    where: { id },
    include: {
      requester: {
        include: { department: true },
      },
    },
  });

  if (!request) return NextResponse.json({ error: "Vehicle request not found" }, { status: 404 });

  if (currentUser.role === "dean") {
    if (request.approval_status !== "pending_dean") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dean = await prisma.admin.findUnique({ where: { id: currentUser.id } });
    if (!dean || dean.faculty_id == null) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const requesterFacultyId = request.requester.department.faculty_id;
    if (dean.faculty_id !== requesterFacultyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.vehicleRequest.update({
      where: { id },
      data: { approval_status: "pending_admin_deputy", approved_by: currentUser.id },
    });

    await prisma.approvalHistory.create({
      data: {
        request_id: id,
        admin_id: currentUser.id,
        action: "approved",
        from_status: "pending_dean",
        to_status: "pending_admin_deputy",
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  }

  if (currentUser.role === "admin-deputy") {
    if (request.approval_status !== "pending_admin_deputy") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.vehicleRequest.update({
      where: { id },
      data: { approval_status: "pending_university_deputy", approved_by: currentUser.id },
    });

    await prisma.approvalHistory.create({
      data: {
        request_id: id,
        admin_id: currentUser.id,
        action: "approved",
        from_status: "pending_admin_deputy",
        to_status: "pending_university_deputy",
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  }

  if (currentUser.role === "university-deputy") {
    if (request.approval_status !== "pending_university_deputy") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.vehicleRequest.update({
      where: { id },
      data: { approval_status: "approved_for_allocation", approved_by: currentUser.id },
    });

    await prisma.approvalHistory.create({
      data: {
        request_id: id,
        admin_id: currentUser.id,
        action: "approved",
        from_status: "pending_university_deputy",
        to_status: "approved_for_allocation",
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
