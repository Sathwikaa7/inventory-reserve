import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    // Fetch the confirmed reservation with related product and warehouse data
    const reservation = await prisma.reservation.findUnique({
      where: {
        id,
        status: "CONFIRMED" // Only allow confirmed reservations
      },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        },
        warehouse: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Confirmed reservation not found" },
        { status: 404 }
      );
    }

    // Format the response data
    const confirmationData = {
      reservation: {
        id: reservation.id,
        quantity: reservation.quantity,
        status: reservation.status,
        createdAt: reservation.createdAt.toISOString(),
        updatedAt: reservation.updatedAt.toISOString(),
        productId: reservation.productId,
        warehouseId: reservation.warehouseId
      },
      product: reservation.product,
      warehouse: reservation.warehouse
    };

    return NextResponse.json(confirmationData);
  } catch (error) {
    console.error("Failed to fetch confirmation data:", error);
    return NextResponse.json(
      { error: "Failed to fetch confirmation data" },
      { status: 500 }
    );
  }
}