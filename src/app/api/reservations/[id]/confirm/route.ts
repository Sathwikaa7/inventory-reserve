import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {

    const { id } = await context.params;

    const result =
      await prisma.$transaction(async (tx) => {

        const reservation =
          await tx.reservation.findUnique({
            where: {
              id,
            },
          });

        if (!reservation) {
          throw new Error("RESERVATION_NOT_FOUND");
        }

        if (
          reservation.status !== "PENDING"
        ) {
          throw new Error("INVALID_STATUS");
        }

        if (
          new Date() > reservation.expiresAt
        ) {
          throw new Error("RESERVATION_EXPIRED");
        }

        const inventory =
          await tx.inventory.findFirst({
            where: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          });

        if (!inventory) {
          throw new Error("INVENTORY_NOT_FOUND");
        }

        await tx.inventory.update({
          where: {
            id: inventory.id,
          },
          data: {
            totalUnits: {
              decrement: reservation.quantity,
            },

            reservedUnits: {
              decrement: reservation.quantity,
            },
          },
        });

        const updatedReservation =
          await tx.reservation.update({
            where: {
              id,
            },
            data: {
              status: "CONFIRMED",
            },
          });

        return updatedReservation;
      });

    return NextResponse.json(result);

  } catch (error: any) {

    console.error(error);

    if (
      error.message ===
      "RESERVATION_EXPIRED"
    ) {
      return NextResponse.json(
        {
          error: "Reservation expired",
        },
        {
          status: 410,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to confirm reservation",
      },
      {
        status: 500,
      }
    );
  }
}