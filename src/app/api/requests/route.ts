import { NextResponse } from "next/server";
import { createApprovalRequest } from "@/lib/approvalService";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const user = await getCurrentUser();
  if (!user || user.type !== "user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleDetails, purpose, approverType } = body;
  if (!vehicleDetails || !purpose || !approverType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const created = await createApprovalRequest({
    user_id: user.id,
    vehicleDetails,
    purpose,
    approverType,
  });

  return NextResponse.json({ data: created });
}
