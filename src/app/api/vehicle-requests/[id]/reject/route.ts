import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowedRoles: Record<string, string> = {
    dean: "pending_dean",
    "admin-deputy": "pending_admin_deputy",
    "university-deputy": "pending_university_deputy",
  };

  const expectedStatus = allowedRoles[currentUser.role];
  if (!expectedStatus) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Phase 11 — Forbidden Action Hardening
  const forbiddenRoles = ["student", "lecturer", "senior-officer"]; // for approve/reject
  if (forbiddenRoles.includes(currentUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
  }

  // Load request
  const request = await prisma.vehicleRequest.findUnique({
    where: { id },
    include: {
      requester: {
        include: { department: true },
      },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Vehicle request not found" }, { status: 404 });
  }

  // Validate request status matches role
  if (request.approval_status !== expectedStatus) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // For Dean: enforce faculty ownership
  if (currentUser.role === "dean") {
    const dean = await prisma.admin.findUnique({ where: { id: currentUser.id } });
    if (!dean || dean.faculty_id == null) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const requesterFacultyId = request.requester.department.faculty_id;
    if (dean.faculty_id !== requesterFacultyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Require rejection reason in body
  const { rejection_reason } = await req.json();
  if (!rejection_reason?.trim()) {
    return NextResponse.json({ error: "rejection_reason is required" }, { status: 400 });
  }

  // Update request
  await prisma.vehicleRequest.update({
    where: { id },
    data: {
      approval_status: "rejected",
      rejected_by: currentUser.id,
      rejected_at: new Date(),
      rejection_reason,
    },
  });

  // Write approval history
  await prisma.approvalHistory.create({
    data: {
      request_id: id,
      admin_id: currentUser.id,
      action: "rejected",
      from_status: request.approval_status,
      to_status: "rejected",
      remarks: rejection_reason,
    },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

