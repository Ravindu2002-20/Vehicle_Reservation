import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for /api/upload");
}

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for /api/upload");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const content = await file.arrayBuffer();
  const fileName = `rejections/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const { data, error } = await supabase.storage.from("request-attachments").upload(fileName, Buffer.from(content), {
    contentType: file.type,
    upsert: false,
  });

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Upload failed" }, { status: 500 });
  }

  const { data: urlData, error: urlError } = supabase.storage.from("request-attachments").getPublicUrl(data.path);
  if (urlError || !urlData?.publicUrl) {
    return NextResponse.json({ error: urlError?.message ?? "Could not generate public URL" }, { status: 500 });
  }

  return NextResponse.json({ url: urlData.publicUrl });
}
