import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ status: 200, message: "Logged out" });

  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}