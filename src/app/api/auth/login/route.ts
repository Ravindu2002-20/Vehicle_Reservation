import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { status: 400, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Try finding user first (matches Prisma "user" table)
    let user = await prisma.user.findUnique({ where: { email } });
    let userType: "user" | "admin" = "user";
    let payloadData: any = null;

    if (user) {
      // Support both bcrypt-hashed and plain text passwords for DB compatibility
      const passwordValid =
        user.password.startsWith("$2") 
          ? await bcrypt.compare(password, user.password)
          : user.password === password;
      
      if (!passwordValid) {
        return NextResponse.json(
          { status: 401, error: "Invalid credentials" },
          { status: 401 }
        );
      }
      payloadData = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        department_id: user.department_id,
        registration_or_employee_no: user.registration_or_employee_no,
      };
    } else {
      // Try admin table
      let admin = await prisma.admin.findUnique({ where: { email } });
      if (!admin) {
        return NextResponse.json(
          { status: 401, error: "Invalid credentials" },
          { status: 401 }
        );
      }
      // Support both bcrypt-hashed and plain text passwords
      const passwordValid =
        admin.password.startsWith("$2")
          ? await bcrypt.compare(password, admin.password)
          : admin.password === password;
      
      if (!passwordValid) {
        return NextResponse.json(
          { status: 401, error: "Invalid credentials" },
          { status: 401 }
        );
      }
      userType = "admin";
      payloadData = {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        user_type: admin.admin_role,
        department_id: admin.department_id || 0,
        registration_or_employee_no: "",
      };
    }

    const tokenPayload = {
      ...payloadData,
      type: userType as "user" | "admin",
    };

    const token = signToken(tokenPayload);

    const response = NextResponse.json({
      status: 200,
      data: {
        user: tokenPayload,
        token,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { status: 500, error: "An error occurred during login" },
      { status: 500 }
    );
  }
}