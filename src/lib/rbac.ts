// Maps each approval_status to the role that is allowed to act on it
const APPROVE_PERMISSIONS: Record<string, string> = {
  pending_dean:                "dean",
  pending_admin_deputy:        "admin-deputy",
  pending_university_deputy:   "university-deputy",
};

const REJECT_PERMISSIONS: Record<string, string> = {
  pending_dean:                "dean",
  pending_admin_deputy:        "admin-deputy",
  pending_university_deputy:   "university-deputy",
};

/**
 * Returns true if the given role is allowed to approve
 * a request at its current approval_status.
 */
export function canApprove(role: string, approvalStatus: string): boolean {
  return APPROVE_PERMISSIONS[approvalStatus] === role;
}

/**
 * Returns true if the given role is allowed to reject
 * a request at its current approval_status.
 */
export function canReject(role: string, approvalStatus: string): boolean {
  return REJECT_PERMISSIONS[approvalStatus] === role;
}