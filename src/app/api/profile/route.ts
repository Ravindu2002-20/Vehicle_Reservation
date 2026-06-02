import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

const allowedFields = ["name", "email", "telephone"] as const;

export async function GET() {
  try {
    const authUser = await getCurrentUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Profile UI expects unified shape: { id, full_name, email, telephone, role/user_type, registration_or_employee_no, department:{faculty,name} }
    if (authUser.type === "user") {
      const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: {
          department: {
            include: { faculty: true },
          },
        },
      });

      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      return NextResponse.json({
        data: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          telephone: user.telephone,
          role: user.user_type,
          user_type: user.user_type,
          registration_or_employee_no: user.registration_or_employee_no,
          department: {
            faculty: user.department?.faculty?.name ?? null,
            name: user.department?.department_name ?? null,
          },
        },
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: authUser.id },
    });

    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    return NextResponse.json({
      data: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        telephone: (admin as any).telephone ?? null,
        role: admin.admin_role,
        admin_role: admin.admin_role,
        department_id: admin.department_id || 0,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authUser = await getCurrentUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { field, value } = body as {
      field: string;
      value: string;
    };

    if (!field || !value) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!allowedFields.includes(field as any)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    // Supabase owns passwords; do not validate password in Prisma.

    if (authUser.type !== "user") {
      return NextResponse.json({ error: "Only student users can update this profile" }, { status: 403 });
    }

    const fieldMap: Record<string, string> = {
      name: "full_name",
      email: "email",
      telephone: "telephone",
    };

    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        [fieldMap[field]]: value,
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        telephone: true,
        registration_or_employee_no: true,
      },
    });

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

