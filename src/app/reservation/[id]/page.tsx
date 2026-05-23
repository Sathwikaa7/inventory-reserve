"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface Reservation {
  id: string;
  status: string;
  quantity: number;
  expiresAt: string;
  productId: string;
  warehouseId: string;
}

export default function ReservationPage() {

  const params = useParams();

  const router = useRouter();

  const [reservation, setReservation] =
    useState<Reservation | null>(null);

  const [timeLeft, setTimeLeft] =
    useState("");

  async function fetchReservation() {

    try {

      const response =
        await axios.get(
          `/api/reservations/${params.id}`
        );

      setReservation(response.data);

    } catch {

      toast.error(
        "Failed to fetch reservation"
      );
    }
  }

  useEffect(() => {
    fetchReservation();
  }, []);

  useEffect(() => {

    if (!reservation) return;

    const interval = setInterval(() => {

      const now = new Date().getTime();

      const expiry =
        new Date(
          reservation.expiresAt
        ).getTime();

      const distance =
        expiry - now;

      if (distance <= 0) {

        setTimeLeft("Expired");

        clearInterval(interval);

        return;
      }

      const minutes =
        Math.floor(
          distance / (1000 * 60)
        );

      const seconds =
        Math.floor(
          (distance % (1000 * 60))
          / 1000
        );

      setTimeLeft(
        `${minutes}m ${seconds}s`
      );

    }, 1000);

    return () =>
      clearInterval(interval);

  }, [reservation]);

  async function confirmReservation() {

    try {

      await axios.post(
        `/api/reservations/${params.id}/confirm`
      );

      toast.success(
        "Purchase confirmed"
      );

      router.push("/");
      router.refresh();

    } catch (error: any) {

      if (
        error.response?.status === 410
      ) {
        toast.error(
          "Reservation expired"
        );
      } else {
        toast.error(
          "Confirmation failed"
        );
      }
    }
  }

  async function releaseReservation() {

    try {

      await axios.post(
        `/api/reservations/${params.id}/release`
      );

      toast.success(
        "Reservation cancelled"
      );

      router.push("/");
      router.refresh();

    } catch {

      toast.error(
        "Cancellation failed"
      );
    }
  }

  if (!reservation) {
    return (
      <div className="p-10">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-10">

      <div className="max-w-xl mx-auto bg-white shadow rounded-2xl p-8">

        <h1 className="text-3xl font-bold mb-6">
          Reservation Checkout
        </h1>

        <div className="space-y-4">

          <p>
            <span className="font-semibold">
              Reservation ID:
            </span>
            {" "}
            {reservation.id}
          </p>

          <p>
            <span className="font-semibold">
              Status:
            </span>
            {" "}
            {reservation.status}
          </p>

          <p>
            <span className="font-semibold">
              Quantity:
            </span>
            {" "}
            {reservation.quantity}
          </p>

          <p className="text-red-600 text-xl font-bold">
            Expires in:
            {" "}
            {timeLeft}
          </p>
        </div>

        <div className="flex gap-4 mt-8">

          <button
            onClick={confirmReservation}
            disabled={
              reservation.status !==
              "PENDING"
            }
            className="bg-green-600 text-white px-5 py-3 rounded-lg disabled:bg-gray-400"
          >
            Confirm Purchase
          </button>

          <button
            onClick={releaseReservation}
            disabled={
              reservation.status !==
              "PENDING"
            }
            className="bg-red-600 text-white px-5 py-3 rounded-lg disabled:bg-gray-400"
          >
            Cancel
          </button>

        </div>
      </div>
    </main>
  );
}