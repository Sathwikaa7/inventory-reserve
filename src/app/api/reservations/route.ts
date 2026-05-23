import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      productId,
      warehouseId,
      quantity,
    } = body;

    const reservation = await prisma.$transaction(
      async (tx) => {

        const inventory =
          await tx.inventory.findFirst({
            where: {
              productId: productId,
              warehouseId: warehouseId,
            },
          });

        if (!inventory) {
          throw new Error("INVENTORY_NOT_FOUND");
        }

        const availableUnits =
          inventory.totalUnits -
          inventory.reservedUnits;

        if (availableUnits < quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        await tx.inventory.update({
          where: {
            id: inventory.id,
          },
          data: {
            reservedUnits: {
              increment: quantity,
            },
          },
        });

        const expiresAt =
          new Date(Date.now() + 10 * 60 * 1000);

        const createdReservation =
          await tx.reservation.create({
            data: {
              productId,
              warehouseId,
              quantity,
              expiresAt,
            },
          });

        return createdReservation;
      }
    );

    return NextResponse.json(reservation);

  } catch (error: any) {

    console.error(error);

    if (
      error.message === "INSUFFICIENT_STOCK"
    ) {
      return NextResponse.json(
        {
          error: "Not enough stock available",
        },
        {
          status: 409,
        }
      );
    }

    if (
      error.message === "INVENTORY_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error: "Inventory not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create reservation",
      },
      {
        status: 500,
      }
    );
  }
}