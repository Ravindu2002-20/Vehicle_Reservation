import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";


// ─────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    // Auth on the Next.js server is based on JWT cookie. Query params should not be trusted.
    // However, to keep compatibility with the existing frontend, we accept either:
    //   - x-user-id header (preferred by the current client), or
    //   - user_id query param (legacy)
    const userIdHeader = req.headers.get("x-user-id");
    const { searchParams } = new URL(req.url);
    const userIdQuery = searchParams.get("user_id");

    const userIdRaw = userIdHeader ?? userIdQuery;
    const userId = userIdRaw ? Number(userIdRaw) : null;

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }


    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: {
          include: {
            faculty: true,
          },
        },
      },
    });

    // Unified payload (used by both user and admin profile pages)
    // Shape: { id, full_name, email, telephone, role }
    if (user) {
      return NextResponse.json({
        data: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          telephone: user.telephone,
          role: user.user_type,
          // keep existing fields for current UI compatibility
          user_type: user.user_type,
          registration_or_employee_no: user.registration_or_employee_no,
          department: {
            faculty: user.department?.faculty?.name ?? null,
            name: user.department?.department_name ?? null,
          },
        },
      });
    }

    // Fallback: if no user row exists, check if this is an admin account.
    // NOTE: sessionStorage is not accessible from Next.js route handlers.
    // We therefore fall back to a safe behavior:
    //   - try admin lookup unconditionally
    //   - if admin exists, return unified admin details
    //   - otherwise, 404
    const admin = await prisma.admin.findUnique({ where: { id: userId } });

    if (!admin) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        telephone: (admin as any).telephone ?? null,
        role: admin.admin_role,
        // keep existing fields for current UI compatibility
        admin_role: admin.admin_role,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}



// ─────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    const {
      userId,
      field,
      value,
      password,
    } = body;

    if (!userId || !field || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    // Allowed fields only
    const allowedFields = [
      "name",
      "email",
      "telephone",
    ];

    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { error: "Invalid field" },
        { status: 400 }
      );
    }

    // Map frontend field → DB field
    const fieldMap: Record<string, string> = {
      name: "full_name",
      email: "email",
      telephone: "telephone",
    };

    const updatedUser = await prisma.user.update({
      where: {
        id: Number(userId),
      },

      data: {
        [fieldMap[field]]: value,
      },
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}