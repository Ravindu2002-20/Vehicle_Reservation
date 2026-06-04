import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { approveRequest, getVehicleRequest } from "@/lib/approvalService";
import { canApprove } from "@/lib/rbac";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.type !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);

  const request = await getVehicleRequest(id);
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canApprove(user.role, request.approval_status)) {
    return NextResponse.json({ error: "Forbidden: your role cannot approve at this stage" }, { status: 403 });
  }

  try {
    const updated = await approveRequest(id, { id: user.id, role: user.role });
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 400 });
  }
}