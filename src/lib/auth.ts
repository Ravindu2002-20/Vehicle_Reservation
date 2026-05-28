import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "vehicle-reservation-secret-key-change-in-production";

export interface JWTPayload {
  id: number;
  email: string;
  full_name: string;
  user_type: string;
  department_id: number;
  registration_or_employee_no: string;
  type: "user" | "admin";
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getAuthUser(): JWTPayload | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
}