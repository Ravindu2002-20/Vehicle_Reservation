import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";


// ─────────────────────────────────────────────
// GET PROFILE
// ─────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    // Temporary placeholder for authenticated user id.
    // Current frontend stores auth in sessionStorage; server can't access it,
    // so we accept a header as a stand-in.
    const userIdHeader = req.headers.get("x-user-id");
    const userId = userIdHeader ? Number(userIdHeader) : null;

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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        full_name: user.full_name,
        email: user.email,
        telephone: user.telephone,
        user_type: user.user_type,
        registration_or_employee_no: user.registration_or_employee_no,
        department: {
          faculty: user.department?.faculty?.name ?? null,
          name: user.department?.department_name ?? null,
        },
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