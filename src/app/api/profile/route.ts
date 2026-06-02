import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

// GET /api/profile
export async function GET() {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    if (authUser.type === "user") {
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { department: { include: { faculty: true } } },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({
        data: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          telephone: user.telephone ?? null,
          role: user.user_type,
          user_type: user.user_type,
          registration_or_employee_no: user.registration_or_employee_no,
          designation: user.designation ?? null,
          department: user.department
            ? { name: user.department.department_name, faculty: user.department.faculty.name }
            : null,
        },
      });
    }

    // Admin
    const admin = await prisma.admin.findUnique({
      where: { id: authUser.id },
      include: { department: { include: { faculty: true } }, faculty: true },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        telephone: admin.telephone ?? null,
        role: admin.admin_role,
        admin_role: admin.admin_role,
        department_id: admin.department_id ?? 0,
        department: admin.department
          ? { name: admin.department.department_name, faculty: admin.department.faculty?.name ?? "" }
          : null,
      },
    });
  } catch (err) {
    console.error("[GET /api/profile] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/profile — users and admins
export async function PATCH(req: NextRequest) {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Accept both "full_name" and "name"
  const full_name =
    typeof body.full_name === "string" ? body.full_name.trim() :
    typeof body.name === "string"      ? body.name.trim()      : null;

  const email =
    typeof body.email === "string" ? body.email.trim() : null;

  const telephone =
    typeof body.telephone === "string" ? body.telephone.trim() || null : null;

  if (!full_name && !email && telephone === undefined) {
    return NextResponse.json({ error: "No valid fields provided to update" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (full_name)            updateData.full_name  = full_name;
  if (email)                updateData.email      = email;
  if (telephone !== undefined) updateData.telephone = telephone;

  try {
    if (authUser.type === "user") {
      const updated = await prisma.user.update({
        where: { id: authUser.id },
        data: updateData,
      });
      return NextResponse.json({
        data: {
          id: updated.id,
          full_name: updated.full_name,
          email: updated.email,
          telephone: updated.telephone ?? null,
        },
      });
    }

    // Admin update
    const updated = await prisma.admin.update({
      where: { id: authUser.id },
      data: updateData,
    });
    return NextResponse.json({
      data: {
        id: updated.id,
        full_name: updated.full_name,
        email: updated.email,
        telephone: updated.telephone ?? null,
      },
    });
  } catch (err: any) {
    console.error("[PATCH /api/profile] error:", err);
    if (err?.code === "P2002") {
      const field = err?.meta?.target?.[0] ?? "field";
      return NextResponse.json({ error: `That ${field} is already in use` }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}