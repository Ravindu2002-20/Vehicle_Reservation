import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { approveRequest, getApprovalRequest } from "@/lib/approvalService";
import { canApproveRole } from "@/lib/rbac";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(params.id);
  const reqRecord = await getApprovalRequest(id);
  if (!reqRecord) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canApproveRole(user.role, reqRecord)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const res = await approveRequest(id, { id: user.id, role: user.role });
    return NextResponse.json({ data: res });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 400 });
  }
}
