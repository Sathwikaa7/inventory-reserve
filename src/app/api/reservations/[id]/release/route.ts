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
              status: "RELEASED",
            },
          });

        return updatedReservation;
      });

    return NextResponse.json(result);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to release reservation",
      },
      {
        status: 500,
      }
    );
  }
}