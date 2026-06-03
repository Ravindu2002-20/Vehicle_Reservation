import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { rejectRequest, getApprovalRequest } from "@/lib/approvalService";
import { canApproveRole } from "@/lib/rbac";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const reason = body?.reason;
  if (!reason) return NextResponse.json({ error: "Missing reason" }, { status: 400 });

  const id = Number(params.id);
  const reqRecord = await getApprovalRequest(id);
  if (!reqRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canApproveRole(user.role, reqRecord)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const res = await rejectRequest(id, { id: user.id, role: user.role }, reason);
    return NextResponse.json({ data: res });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 400 });
  }
}
