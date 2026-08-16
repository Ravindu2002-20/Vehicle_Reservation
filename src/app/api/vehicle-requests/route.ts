import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { createVehicleRequest } from "@/lib/approvalService";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.type !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    const isMultipart = contentType.toLowerCase().includes("multipart/form-data");
    const isJson = contentType.toLowerCase().includes("application/json");

    let requestData: any = {};
    let request_letter_path: string | undefined;

    if (isMultipart) {
      const formData = await req.formData();
      const file = formData.get("request_letter") as File | null;

      if (file) {
        if (file.type !== "application/pdf") {
          return NextResponse.json({ error: "Only application/pdf is allowed" }, { status: 400 });
        }

        // Write to system temp dir instead of project files (serverless-safe)
        const os = await import("node:os");
        const fs = await import("node:fs");
        const path = await import("node:path");
        const uploadDir = path.join(os.tmpdir(), "vehicle-request-letters");
        fs.mkdirSync(uploadDir, { recursive: true });

        const requestLetterBytes = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, requestLetterBytes);
        // Note: temp path will not be publicly available. Consider using Supabase Storage for production.
        request_letter_path = filePath;
      }

      requestData = Object.fromEntries(formData) as any;
    } else if (isJson) {
      requestData = await req.json().catch(() => null);
    } else {
      return NextResponse.json(
        { error: "Unsupported content type. Use application/json or multipart/form-data." },
        { status: 400 }
      );
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
    } = requestData || {};

    if (
      !path_type ||
      !request_type ||
      !vehicle_nature ||
      number_of_persons == null ||
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
      return NextResponse.json({ error: "Invalid path_type" }, { status: 400 });
    }

    const numPersons = Number(number_of_persons);
    if (!Number.isFinite(numPersons) || numPersons <= 0) {
      return NextResponse.json({ error: "Invalid number_of_persons" }, { status: 400 });
    }

    const fromDate = new Date(travel_date_from);
    const toDate = new Date(travel_date_to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json({ error: "Invalid travel dates" }, { status: 400 });
    }

    const created = await createVehicleRequest({
      requester_id: currentUser.id,
      path_type,
      request_type,
      vehicle_nature,
      number_of_persons: numPersons,
      travel_date_from: fromDate,
      travel_date_to: toDate,
      required_time_from,
      required_time_to,
      purpose,
      distance_type,
      places_to_visit: places_to_visit || undefined,
      travel_route: travel_route || undefined,
      special_notes: special_notes || undefined,
      request_letter_path,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/vehicle-requests] error:", err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");

const statusByRole: Record<string, string> = {
    dean: "pending_dean",
    "admin-deputy": "pending_admin_deputy",
    "university-deputy": "pending_university_deputy",
    "vice-chancellor": "pending_vice_chancellor",
    "senior-officer": "approved_for_allocation",
  };

  let where: any = {};

  if (statusParam) {
    const statuses = statusParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    where.approval_status = { in: statuses };
    if (currentUser.type === "user") {
      where.requester_id = currentUser.id;
    }
  } else {
    const visibleStatus = statusByRole[currentUser.role];
    where = visibleStatus ? { approval_status: visibleStatus } : { requester_id: currentUser.id };

    if (currentUser.role === "dean") {
      const dean = await prisma.admin.findUnique({ where: { id: currentUser.id } });
      if (dean?.faculty_id == null) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      where.requester = {
        department: { faculty_id: dean.faculty_id },
      };
    }
  }

  const items = await prisma.vehicleRequest.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: {
      requester: {
        include: {
          department: {
            include: { faculty: true },
          },
        },
      },
      vehicle: true,
      driver: true,
    },
  });

  return NextResponse.json({ data: items });
}
