import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PathType = "via_dean" | "skip_dean";

export type ApprovalStatus =
  | "pending_dean"
  | "pending_admin_deputy"
  | "pending_university_deputy"
  | "approved_for_allocation"
  | "allocated"
  | "rejected";

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createVehicleRequest(data: {
  requester_id: number;
  path_type: PathType;
  request_type: string;
  vehicle_nature: string;
  number_of_persons: number;
  travel_date_from: Date;
  travel_date_to: Date;
  required_time_from: string;
  required_time_to: string;
  purpose: string;
  distance_type: string;
  places_to_visit?: string;
  travel_route?: string;
  special_notes?: string;
  request_letter_path?: string;
}) {
  const initialStatus: ApprovalStatus =
    data.path_type === "via_dean" ? "pending_dean" : "pending_admin_deputy";

  const request = await prisma.vehicleRequest.create({
    data: {
      ...data,
      approval_status: initialStatus,
      allocation_status: "pending",
    },
  });

  // Write initial audit entry
  await prisma.approvalHistory.create({
    data: {
      request_id: request.id,
      admin_id: null,
      action: "submitted",
      from_status: "",
      to_status: initialStatus,
      remarks: "Request submitted",
    },
  });

  return request;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getVehicleRequest(id: number) {
  return prisma.vehicleRequest.findUnique({
    where: { id },
    include: {
      requester: true,
      approver: true,
      vehicle: true,
      driver: true,
      approval_history: { orderBy: { created_at: "asc" } },
    },
  });
}

export async function getInboxForRole(role: string) {
  const statusByRole: Record<string, ApprovalStatus> = {
    "dean":                "pending_dean",
    "admin-deputy":        "pending_admin_deputy",
    "university-deputy":   "pending_university_deputy",
    "senior-officer":      "approved_for_allocation",
  };

  const status = statusByRole[role];
  if (!status) return [];

  return prisma.vehicleRequest.findMany({
    where: { approval_status: status },
    include: {
      requester: true,
      vehicle: true,
      driver: true,
    },
    orderBy: { created_at: "desc" },
  });
}

// ---------------------------------------------------------------------------
// Approve
// ---------------------------------------------------------------------------

// Transition map: given current status + approver role → next status
const APPROVE_TRANSITIONS: Record<string, Partial<Record<string, ApprovalStatus>>> = {
  pending_dean: {
    "dean": "pending_admin_deputy",
  },
  pending_admin_deputy: {
    "admin-deputy": "pending_university_deputy",
  },
  pending_university_deputy: {
    "university-deputy": "approved_for_allocation",
  },
};

export async function approveRequest(
  id: number,
  approver: { id: number; role: string }
) {
  const request = await prisma.vehicleRequest.findUnique({ where: { id } });
  if (!request) throw new Error("Request not found");

  const transitions = APPROVE_TRANSITIONS[request.approval_status];
  if (!transitions) throw new Error("Request is not in an approvable state");

  const nextStatus = transitions[approver.role];
  if (!nextStatus) throw new Error("Unauthorized: your role cannot approve at this stage");

  const updated = await prisma.vehicleRequest.update({
    where: { id },
    data: {
      approval_status: nextStatus,
      approved_by: approver.id,
    },
  });

  await prisma.approvalHistory.create({
    data: {
      request_id: id,
      admin_id: approver.id,
      action: "approved",
      from_status: request.approval_status,
      to_status: nextStatus,
    },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// Reject
// ---------------------------------------------------------------------------

const REJECTABLE_STATUSES: ApprovalStatus[] = [
  "pending_dean",
  "pending_admin_deputy",
  "pending_university_deputy",
];

const REJECT_PERMISSIONS: Record<string, ApprovalStatus> = {
  "dean":                "pending_dean",
  "admin-deputy":        "pending_admin_deputy",
  "university-deputy":   "pending_university_deputy",
};

export async function rejectRequest(
  id: number,
  approver: { id: number; role: string },
  reason: string
) {
  if (!reason?.trim()) throw new Error("Rejection reason is required");

  const request = await prisma.vehicleRequest.findUnique({ where: { id } });
  if (!request) throw new Error("Request not found");

  const expectedStatus = REJECT_PERMISSIONS[approver.role];
  if (!expectedStatus) throw new Error("Your role cannot reject requests");
  if (request.approval_status !== expectedStatus) {
    throw new Error("Unauthorized: request is not in your approval queue");
  }

  const updated = await prisma.vehicleRequest.update({
    where: { id },
    data: {
      approval_status: "rejected",
      rejected_by: approver.id,
      rejected_at: new Date(),
      rejection_reason: reason,
    },
  });

  await prisma.approvalHistory.create({
    data: {
      request_id: id,
      admin_id: approver.id,
      action: "rejected",
      from_status: request.approval_status,
      to_status: "rejected",
      remarks: reason,
    },
  });

  return updated;
}

// ---------------------------------------------------------------------------
// Allocate
// ---------------------------------------------------------------------------

export async function allocateRequest(
  id: number,
  officer: { id: number; role: string },
  allocation: { vehicle_id: number; driver_id: number }
) {
  if (officer.role !== "senior-officer") throw new Error("Only Senior Officers can allocate");

  const request = await prisma.vehicleRequest.findUnique({ where: { id } });
  if (!request) throw new Error("Request not found");
  if (request.approval_status !== "approved_for_allocation") {
    throw new Error("Request is not ready for allocation");
  }

  const updated = await prisma.vehicleRequest.update({
    where: { id },
    data: {
      vehicle_id: allocation.vehicle_id,
      driver_id: allocation.driver_id,
      allocation_status: "allocated",
    },
  });

  await prisma.approvalHistory.create({
    data: {
      request_id: id,
      admin_id: officer.id,
      action: "allocated",
      from_status: "approved_for_allocation",
      to_status: "allocated",
    },
  });

  return updated;
}
