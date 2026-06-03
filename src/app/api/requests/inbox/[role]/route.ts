import { NextResponse } from "next/server";
import { getInboxForRole } from "@/lib/approvalService";
import { getCurrentUser } from "@/lib/current-user";
import { roleToApproverKey } from "@/lib/rbac";

export async function GET(_req: Request, { params }: { params: { role: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requested = (params.role || "").toUpperCase();
  const userKey = roleToApproverKey(user.role);
  if (!userKey || userKey !== requested) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await getInboxForRole(requested);
  return NextResponse.json({ data: items });
}
