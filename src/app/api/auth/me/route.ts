import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const authUser = await getCurrentUser();

  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Preserve current frontend response shape: { data: { id, email, role, type, department_id } }
  return NextResponse.json({
    data: {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role,
      type: authUser.type,
      department_id: authUser.department_id,
    },
  });
}



