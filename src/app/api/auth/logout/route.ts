import { NextResponse } from "next/server";

export async function POST() {
  // Supabase session logout should be handled client-side.
  // Keeping this endpoint for backward compatibility.
  return NextResponse.json({ status: 200, message: "Logged out" });
}

