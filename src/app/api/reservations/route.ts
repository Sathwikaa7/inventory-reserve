import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest
) {
  try {

    const body = await request.json();

    const {
      productId,
      warehouseId,
      quantity,
    } = body;

    const inventory =
      await prisma.inventory.findFirst({
        where: {
          productId,
          warehouseId,
        },
      });

    if (!inventory) {

      return NextResponse.json(
        {
          error: "Inventory not found",
        },
        {
          status: 404,
        }
      );
    }

    const availableUnits =
      inventory.totalUnits -
      inventory.reservedUnits;

    if (availableUnits < quantity) {

      return NextResponse.json(
        {
          error: "Not enough stock",
        },
        {
          status: 409,
        }
      );
    }

    await prisma.inventory.update({
      where: {
        id: inventory.id,
      },
      data: {
        reservedUnits: {
          increment: quantity,
        },
      },
    });

    const reservation =
      await prisma.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          status: "PENDING",
          expiresAt: new Date(
            Date.now() +
            10 * 60 * 1000
          ),
        },
      });

    return NextResponse.json(
      reservation
    );

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to create reservation",
      },
      {
        status: 500,
      }
    );
  }
}