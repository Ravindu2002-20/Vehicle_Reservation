import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

import fs from "fs";
import path from "path";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    }

    const requestId = Number(params.id);
    if (!Number.isFinite(requestId)) {
      return NextResponse.json({ status: 400, error: "Invalid request id" }, { status: 400 });
    }

    const request = await prisma.vehicleRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        requester_id: true,
        request_letter_path: true,
      },
    });

    if (!request) {
      return NextResponse.json({ status: 404, error: "Not found" }, { status: 404 });
    }

    const isOwner = request.requester_id === currentUser.id;
    const allowedRoles = ["dean", "admin-deputy", "university-deputy", "senior-officer"];
    const allowed = isOwner || allowedRoles.includes(currentUser.role);

    if (!allowed) {
      return NextResponse.json({ status: 403, error: "Forbidden" }, { status: 403 });
    }

    if (!request.request_letter_path) {
      return NextResponse.json({ status: 404, error: "PDF not found" }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), request.request_letter_path);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ status: 404, error: "PDF not found" }, { status: 404 });
    }

    const stream = fs.createReadStream(filePath);

    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="request_${requestId}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Letter download error:", err);
    return NextResponse.json({ status: 500, error: "Failed to fetch" }, { status: 500 });
  }
}


