import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth";

function parseId(idParam: string) {
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getAuthUser();
    if (!authUser) return unauthorized();

    const requestId = parseId(params.id);
    if (!requestId) {
      return NextResponse.json({ status: 400, error: "Invalid request id" }, { status: 400 });
    }

    // Student can only view own requests.
    // Admin roles can view all (if you later add role checks, extend here).
    const request = await prisma.vehicleRequest.findFirst({
      where: {
        id: requestId,
        requester_id: authUser.type === "user" ? authUser.id : undefined,
      },
      include: {
        requester: {
          select: { id: true, full_name: true, email: true },
        },
        vehicle: {
          select: { id: true, vehicle_number: true, vehicle_type: true },
        },
        driver: {
          select: { id: true, full_name: true },
        },
        approver: {
          select: { id: true, full_name: true },
        },
      } as any,
    });

    if (!request) {
      return NextResponse.json({ status: 404, error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ data: request });
  } catch (err) {
    console.error("Request GET error:", err);
    return NextResponse.json(
      { status: 500, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getAuthUser();
    if (!authUser) return unauthorized();

    const requestId = parseId(params.id);
    if (!requestId) {
      return NextResponse.json({ status: 400, error: "Invalid request id" }, { status: 400 });
    }

    // Student can delete only their own requests.
    const deleted = await prisma.vehicleRequest.deleteMany({
      where: {
        id: requestId,
        requester_id: authUser.type === "user" ? authUser.id : undefined,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { status: 404, error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Request DELETE error:", err);
    return NextResponse.json(
      { status: 500, error: (err as Error).message },
      { status: 500 }
    );
  }
}

