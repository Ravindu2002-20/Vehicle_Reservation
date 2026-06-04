import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "student";

    if (type === "student") {
      const totalVehicles = await prisma.vehicle.count();
      const activeBookings = await prisma.vehicleRequest.count({
        where: {
          requester_id: authUser.type === "user" ? authUser.id : -1,
          approval_status: "approved",
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
      const pendingApprovals = await prisma.vehicleRequest.count({
        where: { approval_status: "pending" },
      });
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

      const approvedToday = await prisma.vehicleRequest.count({
        where: {
          approval_status: "approved",
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });

      const approvedThisMonth = await prisma.vehicleRequest.count({
        where: {
          approval_status: "approved",
          created_at: {
            gte: startOfMonth,
          },
        },
      });

      const rejectedCount = await prisma.vehicleRequest.count({
        where: { approval_status: "rejected" },
      });
      const totalUsers = await prisma.user.count();

      return NextResponse.json({
        data: {
          pendingApprovals,
          approvedToday,
          approvedThisMonth,
          rejectedCount,
          totalUsers,
        },
      });

    }

    const totalVehicles = await prisma.vehicle.count();
    const pendingRequests = await prisma.vehicleRequest.count({
      where: { approval_status: "pending" },
    });

    return NextResponse.json({
      data: {
        totalVehicles,
        pendingRequests,
      },
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ status: 500, error: "Failed to fetch stats" }, { status: 500 });
  }
}

