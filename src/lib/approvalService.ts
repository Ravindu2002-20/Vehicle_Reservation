import { prisma } from "@/lib/prisma";
import type { ApprovalRequest as ApprovalRequestModel } from "@prisma/client";

type HistoryItem = { actor: string; action: string; reason?: string; timestamp: string };

export async function createApprovalRequest(data: {
  user_id: number;
  vehicleDetails: string;
  purpose: string;
  approverType: "DEAN" | "UDR";
}) {
  const now = new Date();
  const record = await prisma.approvalRequest.create({
    data: {
      user_id: data.user_id,
      vehicleDetails: data.vehicleDetails,
      purpose: data.purpose,
      approverType: data.approverType,
      status: "PENDING",
      currentApprover: data.approverType === "DEAN" ? "DEAN" : "UDR",
      history: [{ actor: `user:${data.user_id}`, action: "SUBMIT", timestamp: now.toISOString() }],
    },
  });
  return record;
}

export async function getApprovalRequest(id: number) {
  return prisma.approvalRequest.findUnique({ where: { id } });
}

export async function getInboxForRole(role: string) {
  // role expects values like 'DEAN', 'UDR', 'ADMIN_DR'
  if (role === "DEAN") {
    return prisma.approvalRequest.findMany({ where: { currentApprover: "DEAN", status: "PENDING" } });
  }
  if (role === "UDR") {
    return prisma.approvalRequest.findMany({ where: { currentApprover: "UDR", status: "PENDING" } });
  }
  if (role === "ADMIN_DR") {
    return prisma.approvalRequest.findMany({ where: { currentApprover: "ADMIN_DR", status: "APPROVED_BY_DEAN" } });
  }
  return [];
}

export async function approveRequest(id: number, approver: { id: number; role: string }) {
  const req = await getApprovalRequest(id);
  if (!req) throw new Error("Not found");

  const now = new Date();
  const history = (req.history as any[] | null) ?? [];

  if (req.approverType === "DEAN") {
    if (approver.role === "dean") {
      // Dean approves -> forward to Admin DR
      history.push({ actor: `dean:${approver.id}`, action: "APPROVE", timestamp: now.toISOString() });
      return prisma.approvalRequest.update({
        where: { id },
        data: { status: "APPROVED_BY_DEAN", currentApprover: "ADMIN_DR", history },
      });
    }
    if (approver.role === "admin-deputy") {
      // Admin DR final approval
      history.push({ actor: `admindr:${approver.id}`, action: "APPROVE", timestamp: now.toISOString() });
      return prisma.approvalRequest.update({ where: { id }, data: { status: "APPROVED", currentApprover: null, history } });
    }
  }

  if (req.approverType === "UDR") {
    if (approver.role === "university-deputy") {
      history.push({ actor: `udr:${approver.id}`, action: "APPROVE", timestamp: now.toISOString() });
      return prisma.approvalRequest.update({ where: { id }, data: { status: "APPROVED", currentApprover: null, history } });
    }
  }

  throw new Error("Unauthorized or invalid approver role");
}

export async function rejectRequest(id: number, approver: { id: number; role: string }, reason: string) {
  const req = await getApprovalRequest(id);
  if (!req) throw new Error("Not found");

  const now = new Date();
  const history = (req.history as any[] | null) ?? [];

  history.push({ actor: `${approver.role}:${approver.id}`, action: "REJECT", reason, timestamp: now.toISOString() });

  // Decide recipients based on workflow
  // For DEAN path: if Dean rejects -> return to User; if Admin DR rejects -> return to User and Dean
  let updated: any = {
    status: "REJECTED",
    rejectionReason: reason,
    currentApprover: null,
    history,
  };

  const res = await prisma.approvalRequest.update({ where: { id }, data: updated });
  return res;
}
