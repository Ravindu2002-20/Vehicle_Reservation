import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { createSupabaseServiceClient, REQUEST_LETTER_BUCKET } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

async function getLetterBufferOrUrl(requestLetterPath: string) {
  if (!requestLetterPath) return null;

  if (requestLetterPath.includes("/") && !requestLetterPath.startsWith("/") && !path.isAbsolute(requestLetterPath)) {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.storage
      .from(REQUEST_LETTER_BUCKET)
      .createSignedUrl(requestLetterPath, 60 * 5, { download: false });

    if (!error && data?.signedUrl) {
      return { signedUrl: data.signedUrl };
    }
  }

  if (path.isAbsolute(requestLetterPath)) {
    const filePath = requestLetterPath;
    if (!fs.existsSync(filePath)) return null;
    const stream = fs.createReadStream(filePath);
    return { stream };
  }

  const filePath = path.join(process.cwd(), requestLetterPath);
  if (!fs.existsSync(filePath)) return null;
  const stream = fs.createReadStream(filePath);
  return { stream };
}

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

    const document = await getLetterBufferOrUrl(request.request_letter_path);
    if (!document) {
      return NextResponse.json({ status: 404, error: "PDF not found" }, { status: 404 });
    }

    if ("signedUrl" in document && document.signedUrl) {
      const response = await fetch(document.signedUrl);
      if (!response.ok) {
        return NextResponse.json({ status: 404, error: "PDF not found" }, { status: 404 });
      }

      return new NextResponse(await response.arrayBuffer(), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
        },
      });
    }

    return new NextResponse(document.stream as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  } catch (err) {
    console.error("Letter view error:", err);
    return NextResponse.json({ status: 500, error: "Failed to fetch" }, { status: 500 });
  }
}


