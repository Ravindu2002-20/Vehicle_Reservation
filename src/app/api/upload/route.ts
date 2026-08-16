import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import {
  createSupabaseServiceClient,
  getStorageObjectPath,
  REQUEST_LETTER_BUCKET,
} from "@/lib/supabase/server";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"];

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only PDF, JPG, and PNG files are allowed" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 400 });
    }

    const objectPath = getStorageObjectPath(user.id, file.name);
    const supabase = createSupabaseServiceClient();
    const arrayBuffer = await file.arrayBuffer();
    const uploadResult = await supabase.storage.from(REQUEST_LETTER_BUCKET).upload(objectPath, arrayBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
      cacheControl: "3600",
    });

    if (uploadResult.error) {
      console.error("[POST /api/upload] storage upload failed:", uploadResult.error.message);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    const signedUrlResult = await supabase.storage
      .from(REQUEST_LETTER_BUCKET)
      .createSignedUrl(objectPath, 60 * 60 * 6);

    if (signedUrlResult.error) {
      console.error("[POST /api/upload] signed URL generation failed:", signedUrlResult.error.message);
      return NextResponse.json({ error: "Failed to generate file URL" }, { status: 500 });
    }

    return NextResponse.json({
      path: objectPath,
      url: signedUrlResult.data?.signedUrl ?? objectPath,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/upload] unexpected error:", error?.message ?? error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
