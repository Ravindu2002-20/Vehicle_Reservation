import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");
    const status = searchParams.get("status");

    const where: any = {};
    if (user_id) where.requester_id = Number(user_id);
    if (status) where.approval_status = status;

    const requests = await prisma.vehicleRequest.findMany({
      where,
      include: {
        requester: {
          select: { id: true, full_name: true, email: true, department_id: true },
        },
        vehicle: {
          select: { id: true, vehicle_number: true, vehicle_type: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: requests });
  } catch (err) {
    console.error("Vehicle requests error:", err);
    return NextResponse.json({ status: 500, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = getAuthUser();
    if (!authUser) {
      return unauthorized();
    }

    const body = await req.json();

    const result = await prisma.vehicleRequest.create({
      data: {
        requester_id: authUser.id,
        request_type: body.request_type || "official",
        vehicle_nature: body.vehicle_nature || body.vehicleType || "",
        number_of_persons: parseInt(body.number_of_persons || body.numberOfPassengers || "1"),
        travel_date_from: new Date(body.travel_date_from || body.dateOfJourney || new Date()),
        travel_date_to: new Date(body.travel_date_to || body.dateOfJourney || new Date()),
        required_time_from: body.required_time_from || body.timeOfDeparture || "",
        required_time_to: body.required_time_to || body.expectedReturnTime || "",
        purpose: body.purpose || "",
        places_to_visit: body.places_to_visit || body.destination || "",
        travel_route: body.travel_route || body.routeDetails || "",
        distance_type: body.distance_type || "local",
        special_notes: body.special_notes || body.specialRequirements || "",
        approval_status: "pending",
        allocation_status: "pending",
      },
    });

    return NextResponse.json({ status: 200, data: result });
  } catch (err) {
    console.error("Vehicle request creation error:", err);
    return NextResponse.json({ status: 500, error: (err as Error).message }, { status: 500 });
  }
}