import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Optimized query with selective fields and limit
    const warehouses = await prisma.warehouse.findMany({
      select: {
        id: true,
        name: true,
      },
      take: 10, // Limit to prevent too much data
    });

    return NextResponse.json(warehouses);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch warehouses" },
      { status: 500 }
    );
  }
}