export function roleToApproverKey(role?: string) {
  if (!role) return null;
  const r = role.toLowerCase();
  if (r === "dean") return "DEAN";
  if (r === "university-deputy") return "UDR";
  if (r === "admin-deputy") return "ADMIN_DR";
  return null;
}

export function canApproveRole(userRole: string | undefined, approvalRequest: any) {
  if (!userRole || !approvalRequest) return false;
  const approverKey = roleToApproverKey(userRole);
  // If currentApprover is set, match that first
  if (approvalRequest.currentApprover) {
    return approvalRequest.currentApprover === approverKey;
  }
  // Fallback to approverType
  if (approvalRequest.approverType === "DEAN") {
    return approverKey === "DEAN" || approverKey === "ADMIN_DR";
  }
  if (approvalRequest.approverType === "UDR") {
    return approverKey === "UDR";
  }
  return false;
}
