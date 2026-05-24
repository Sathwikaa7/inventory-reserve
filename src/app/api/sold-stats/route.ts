import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Optimized query - only get confirmed reservations with minimal data
    const confirmedReservations = await prisma.reservation.findMany({
      where: {
        status: "CONFIRMED"
      },
      select: {
        productId: true,
        warehouseId: true,
        quantity: true,
      },
      // Limit to recent confirmations for performance
      take: 50,
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Calculate sold quantities by product and warehouse
    const soldStats: { [key: string]: number } = {};
    
    confirmedReservations.forEach((reservation) => {
      const key = `${reservation.productId}-${reservation.warehouseId}`;
      soldStats[key] = (soldStats[key] || 0) + reservation.quantity;
    });

    return NextResponse.json(soldStats);
  } catch (error) {
    console.error("Failed to fetch sold stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch sold statistics" },
      { status: 500 }
    );
  }
}