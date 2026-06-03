import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.type !== "user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { vehicleDetails, requestDate, purpose, approver_type } = body;
  if (!vehicleDetails || !requestDate || !purpose || !approver_type) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Validate approver_type
  if (!["DEAN", "UDR"].includes(approver_type)) {
    return NextResponse.json({ error: "Invalid approver_type" }, { status: 400 });
  }

  // Create VehicleRequest with the approver_type
  const created = await prisma.vehicleRequest.create({
    data: {
      requester_id: user.id,
      approver_type: approver_type,
      request_type: "official",
      vehicle_nature: "university_owned",
      number_of_persons: 1,
      travel_date_from: new Date(requestDate),
      travel_date_to: new Date(requestDate),
      required_time_from: "09:00",
      required_time_to: "17:00",
      purpose: purpose,
      distance_type: "local",
      approval_status: "pending",
      allocation_status: "pending",
    },
  });

  return NextResponse.json({ data: created });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userIdParam = url.searchParams.get("userId");
  if (userIdParam === "me") {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const items = await prisma.approvalRequest.findMany({ where: { user_id: user.id }, orderBy: { requestDate: "desc" } });
    return NextResponse.json({ data: items });
  }

  // For admins: return all
  const all = await prisma.approvalRequest.findMany({ orderBy: { requestDate: "desc" } });
  return NextResponse.json({ data: all });
}


