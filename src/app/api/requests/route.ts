import { NextResponse } from "next/server";
import { createVehicleRequest } from "@/lib/approvalService";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const user = await getCurrentUser();
  if (!user || user.type !== "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    path_type,
    request_type,
    vehicle_nature,
    number_of_persons,
    travel_date_from,
    travel_date_to,
    required_time_from,
    required_time_to,
    purpose,
    distance_type,
    places_to_visit,
    travel_route,
    special_notes,
    request_letter_path,
  } = body;

  // Validate required fields
  if (
    !path_type ||
    !request_type ||
    !vehicle_nature ||
    !number_of_persons ||
    !travel_date_from ||
    !travel_date_to ||
    !required_time_from ||
    !required_time_to ||
    !purpose ||
    !distance_type
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["via_dean", "skip_dean"].includes(path_type)) {
    return NextResponse.json({ error: "Invalid path_type. Must be 'via_dean' or 'skip_dean'" }, { status: 400 });
  }

  try {
    const created = await createVehicleRequest({
      requester_id: user.id,
      path_type,
      request_type,
      vehicle_nature,
      number_of_persons: Number(number_of_persons),
      travel_date_from: new Date(travel_date_from),
      travel_date_to: new Date(travel_date_to),
      required_time_from,
      required_time_to,
      purpose,
      distance_type,
      places_to_visit,
      travel_route,
      special_notes,
      request_letter_path,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}