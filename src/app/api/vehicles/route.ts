import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany();
    return NextResponse.json({ data: vehicles });
  } catch (err) {
    return NextResponse.json({ status: 500, error: (err as Error).message });
  }
}
