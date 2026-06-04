import { NextResponse } from "next/server";
import { getInboxForRole } from "@/lib/approvalService";
import { getCurrentUser } from "@/lib/current-user";

const VALID_INBOX_ROLES = ["dean", "admin-deputy", "university-deputy", "senior-officer"];

export async function GET(_req: Request, { params }: { params: { role: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.type !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const requestedRole = (params.role || "").toLowerCase();

  // User can only access their own role's inbox
  if (!VALID_INBOX_ROLES.includes(requestedRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (user.role !== requestedRole) {
    return NextResponse.json({ error: "Forbidden: cannot access another role's inbox" }, { status: 403 });
  }

  const items = await getInboxForRole(requestedRole);
  return NextResponse.json({ data: items });
}