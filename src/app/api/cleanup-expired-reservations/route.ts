import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {

    const expiredReservations =
      await prisma.reservation.findMany({
        where: {
          status: "PENDING",
          expiresAt: {
            lt: new Date(),
          },
        },
      });

    for (const reservation of expiredReservations) {

      await prisma.$transaction(async (tx) => {

        const inventory =
          await tx.inventory.findFirst({
            where: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          });

        if (!inventory) {
          return;
        }

        await tx.inventory.update({
          where: {
            id: inventory.id,
          },
          data: {
            reservedUnits: {
              decrement: reservation.quantity,
            },
          },
        });

        await tx.reservation.update({
          where: {
            id: reservation.id,
          },
          data: {
            status: "RELEASED",
          },
        });
      });
    }

    return NextResponse.json({
      success: true,
      cleaned:
        expiredReservations.length,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to cleanup reservations",
      },
      {
        status: 500,
      }
    );
  }
}