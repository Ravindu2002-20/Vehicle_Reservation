import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "student";

    if (type === "student") {
      const totalVehicles = await prisma.vehicle.count();
      const activeBookings = await prisma.vehicleRequest.count({
        where: {
          requester_id: authUser.type === "user" ? authUser.id : -1,
          allocation_status: "allocated",
        },
      });
      const unreadMessages = await prisma.message.count({
        where: {
          receiver_user_id: authUser.type === "user" ? authUser.id : null,
          is_read: false,
        },
      });

      return NextResponse.json({
        data: {
          availableVehicles: totalVehicles,
          activeBookings,
          unreadMessages,
        },
      });
    }

    if (type === "admin") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

      // ── Role-specific pending count ──────────────────────────────────────
      let pendingApprovals = 0;
      const role = authUser.role;

      if (role === "dean") {
        // Dean only sees requests from their own faculty
        const dean = await prisma.admin.findUnique({
          where: { id: authUser.id },
          select: { faculty_id: true },
        });
        if (dean?.faculty_id != null) {
          pendingApprovals = await prisma.vehicleRequest.count({
            where: {
              approval_status: "pending_dean",
              requester: {
                department: { faculty_id: dean.faculty_id },
              },
            },
          });
        }
      } else if (role === "admin-deputy") {
        pendingApprovals = await prisma.vehicleRequest.count({
          where: { approval_status: "pending_admin_deputy" },
        });
} else if (role === "university-deputy") {
        pendingApprovals = await prisma.vehicleRequest.count({
          where: { approval_status: "pending_university_deputy" },
        });
      } else if (role === "vice-chancellor") {
        pendingApprovals = await prisma.vehicleRequest.count({
          where: { approval_status: "pending_vice_chancellor" },
        });
      } else {
        // Fallback: count all pending across all stages
        pendingApprovals = await prisma.vehicleRequest.count({
          where: {
            approval_status: {
              in: ["pending_dean", "pending_admin_deputy", "pending_university_deputy", "pending_vice_chancellor"],
            },
          },
        });
      }

      // ── Accurate approval counts from approval_history ───────────────────
      const [approvedToday, approvedThisMonth, rejectedCount, totalUsers] =
        await Promise.all([
          prisma.approvalHistory.count({
            where: {
              action: "approved",
              created_at: { gte: startOfToday },
            },
          }),
          prisma.approvalHistory.count({
            where: {
              action: "approved",
              created_at: { gte: startOfMonth },
            },
          }),
          prisma.vehicleRequest.count({
            where: { approval_status: "rejected" },
          }),
          prisma.user.count(),
        ]);

      // Important: Admin dashboard cards read these exact keys.
      return NextResponse.json({
        data: {
          pendingApprovals: Number(pendingApprovals ?? 0),
          approvedToday: Number(approvedToday ?? 0),
          approvedThisMonth: Number(approvedThisMonth ?? 0),
          rejectedCount: Number(rejectedCount ?? 0),
          totalUsers: Number(totalUsers ?? 0),
        },
      });
    }


const totalVehicles = await prisma.vehicle.count();
    const pendingRequests = await prisma.vehicleRequest.count({
      where: {
        approval_status: {
          in: ["pending_dean", "pending_admin_deputy", "pending_university_deputy", "pending_vice_chancellor"],
        },
      },
    });

    return NextResponse.json({
      data: {
        totalVehicles,
        pendingRequests,
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
