"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { Product } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function HomePage() {

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const router = useRouter();

  async function fetchProducts() {
    try {

      const response =
        await axios.get("/api/products");

      setProducts(response.data);

    } catch {

      toast.error(
        "Failed to fetch products"
      );

    } finally {
      setLoading(false);
    }
  }

 useEffect(() => {

  fetchProducts();

  const interval =
    setInterval(() => {
      fetchProducts();
    }, 5000);

  return () =>
    clearInterval(interval);

}, []);

  async function reserveProduct(
    productId: string,
    warehouseId: string
  ) {

    try {

      const response =
        await axios.post(
          "/api/reservations",
          {
            productId,
            warehouseId,
            quantity: 1,
          }
        );

      toast.success(
        "Reservation created"
      );

      router.push(
        `/reservation/${response.data.id}`
      );

    } catch (error: any) {

      if (
        error.response?.status === 409
      ) {
        toast.error(
          "Not enough stock"
        );
      } else {
        toast.error(
  error.response?.data?.error ||
  "Reservation failed"
);
      }
    }
  }

  if (loading) {
    return (
      <div className="p-10">
        <div className="text-xl font-semibold">
  Loading inventory...
</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-10">
      <h1 className="text-4xl font-bold mb-8">
        Inventory Reserve
      </h1>

      <div className="grid gap-6">

        {products.map((product) => (

          <div
            key={product.id}
            className="bg-white rounded-xl shadow p-6"
          >

            <h2 className="text-2xl font-semibold mb-4">
              {product.name}
            </h2>

            <div className="space-y-4">

              {product.inventories.map(
                (inventory) => (

                <div
                  key={inventory.inventoryId}
                  className="border rounded-lg p-4 flex justify-between items-center"
                >

                  <div>
                    <p className="font-medium">
                      {
                        inventory.warehouseName
                      }
                    </p>

                    <p>
                      Available:
                      {" "}
                      {
                        inventory.availableUnits
                      }
                    </p>

                    <p>
                      Reserved:
                      {" "}
                      {
                        inventory.reservedUnits
                      }
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      reserveProduct(
                        product.id,
                        inventory.warehouseId
                      )
                    }
                    disabled={
                      inventory.availableUnits <= 0
                    }
                    className="bg-black text-white px-4 py-2 rounded-lg disabled:bg-gray-400"
                  >
                    Reserve
                  </button>

                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}