import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  console.log("[api/auth/me] start");
  const authUser = await getCurrentUser();
  console.log("[api/auth/me] authUser:", authUser);

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



